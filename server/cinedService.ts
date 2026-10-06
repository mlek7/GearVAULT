import fs from 'fs';
import path from 'path';

export interface CineDGearItem {
  id: string; // "cined-cam-<id>" | "cined-lens-<id>"
  type: 'camera' | 'lens';
  brand: string;
  model: string;
  sensor?: string | null;
  sensorWidth?: string | null;
  sensorHeight?: string | null;
  mounts: string[];
  focalLength?: string | null;
  aperture?: string | null;
  weightG?: number | null;
  dimensions?: string | null;
  filterThread?: string | null;
  releaseDate?: string | null;
  imageUrl?: string | null;
  sourceUrl: string;
}

export interface CineDCacheFile {
  updatedAt: string;
  items: CineDGearItem[];
}

export const CAMERA_MANUFACTURERS = [
  'ARRI',
  'Apple',
  'Blackmagic Design',
  'Canon',
  'DJI',
  'FUJIFILM',
  'GoPro',
  'Insta360',
  'Leica',
  'Nikon',
  'Panasonic',
  'Panavision',
  'RED',
  'Sigma',
  'Sony',
  'Z Cam',
];

export const LENS_TYPES = [
  'photo-primes',
  'photo-zooms',
  'spherical-primes',
  'spherical-zooms',
  'anamorphic-primes',
  'anamorphic-zooms',
];

const DESKTOP_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const CACHE_DIR = path.join(process.cwd(), 'data');
const CACHE_FILE = path.join(CACHE_DIR, 'cined-cache.json');
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

class CineDService {
  private inMemoryItems: CineDGearItem[] | null = null;
  private lastUpdated: number = 0;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<CineDGearItem[]> | null = null;

  constructor() {
    this.loadFromDiskSync();
  }

  private loadFromDiskSync(): void {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as CineDCacheFile;
        if (parsed && Array.isArray(parsed.items)) {
          this.inMemoryItems = parsed.items;
          this.lastUpdated = parsed.updatedAt ? new Date(parsed.updatedAt).getTime() : 0;
        }
      }
    } catch (err) {
      console.warn('[CineD] Warning loading disk cache:', err);
    }
  }

  private saveToDisk(items: CineDGearItem[]): void {
    try {
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
      const data: CineDCacheFile = {
        updatedAt: new Date().toISOString(),
        items,
      };
      fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
      this.lastUpdated = Date.now();
      this.inMemoryItems = items;
    } catch (err) {
      console.warn('[CineD] Warning saving disk cache:', err);
    }
  }

  /**
   * Concurrency runner (max 4 concurrent requests)
   */
  private async runWithConcurrency<T, R>(
    items: T[],
    limit: number,
    fn: (item: T) => Promise<R>
  ): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let index = 0;

    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (index < items.length) {
        const i = index++;
        try {
          results[i] = await fn(items[i]);
        } catch (err) {
          console.warn(`[CineD] Task failed for index ${i}:`, err);
        }
      }
    });

    await Promise.all(workers);
    return results;
  }

  /**
   * Fetch cameras for a single manufacturer from WordPress AJAX
   */
  private async fetchCamerasForBrand(brand: string): Promise<CineDGearItem[]> {
    try {
      const res = await fetch('https://www.cined.com/app/wp-admin/admin-ajax.php', {
        method: 'POST',
        headers: {
          'User-Agent': DESKTOP_USER_AGENT,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `action=ajaxGetCameraByManufacturer&manufacturer=${encodeURIComponent(brand)}`,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();
      if (!json || json.error !== 0 || !Array.isArray(json.data)) {
        return [];
      }

      return json.data.map((c: any) => {
        const mounts = [c.lensmount1, c.lensmount2, c.lensmount3, c.lensmount4, c.lensmount5]
          .filter((m: any) => m && typeof m === 'string' && m.trim().length > 0)
          .map((m: string) => m.trim());

        const dimParts = [c.length, c.width, c.height].filter(Boolean);
        const dimensions = dimParts.length ? `${dimParts.join(' x ')} mm` : null;
        const weightG = c.weight
          ? parseInt(String(c.weight).replace(/\D/g, ''), 10) || null
          : null;
        const modelSlug = (c.model || '').replace(/\s+/g, '-');

        return {
          id: `cined-cam-${c.id}`,
          type: 'camera' as const,
          brand: c.manufacturer || brand,
          model: c.model || '',
          sensor: c.sensor || null,
          sensorWidth: c.sensor_width || null,
          sensorHeight: c.sensor_height || null,
          mounts,
          focalLength: null,
          aperture: null,
          weightG,
          dimensions,
          filterThread: null,
          releaseDate: c.releasedate || null,
          imageUrl:
            c.image ||
            (c.id ? `https://databases.cined.com/camera/product-images/${c.id}.jpg` : null),
          sourceUrl: `https://www.cined.com/camera-database/?camera=${encodeURIComponent(modelSlug)}`,
        };
      });
    } catch (err: any) {
      console.warn(`[CineD] Failed to fetch cameras for brand ${brand}:`, err.message);
      return [];
    }
  }

  /**
   * Fetch lenses for a single lens type by scraping the server-rendered HTML table
   */
  private async fetchLensesForType(type: string): Promise<CineDGearItem[]> {
    try {
      const res = await fetch(`https://www.cined.com/lens-database/?lens=${encodeURIComponent(type)}`, {
        headers: {
          'User-Agent': DESKTOP_USER_AGENT,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const html = await res.text();
      const tableMatch = html.match(/<table[^>]*id=["']lens-database-data["'][^>]*>([\s\S]*?)<\/table>/i);
      if (!tableMatch) return [];

      const tableHtml = tableMatch[1];
      const trRegex = /<tr[^>]*id=["']lens-(\d+)["'][^>]*>([\s\S]*?)<\/tr>/gi;
      let match: RegExpExecArray | null;
      const lenses: CineDGearItem[] = [];

      while ((match = trRegex.exec(tableHtml)) !== null) {
        const id = match[1];
        const rowHtml = match[2];
        const tdMatches = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
        const cols = tdMatches.map((m) =>
          m[1]
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .trim()
        );

        if (cols.length < 12) continue;

        const manufacturer = cols[0] || '';
        const series = cols[1] || '';
        const focalLength = cols[2] || '';
        const aperture = cols[3] || '';
        const special = cols[4] || '';
        const length = cols[8] || '';
        const weightStr = cols[9] || '';
        const filterThread = cols[10] || '';
        const mountsRaw = cols[11] || '';

        // Lens model: "<brand> <series> <focal> <aperture> <special>" cleaned of double spaces
        const modelParts = [manufacturer, series, focalLength, aperture, special].filter(Boolean);
        const model = modelParts.join(' ').replace(/\s+/g, ' ').trim();
        const mounts = mountsRaw ? mountsRaw.split(',').map((m) => m.trim()).filter(Boolean) : [];
        const weightG = weightStr
          ? parseInt(weightStr.replace(/\D/g, ''), 10) || null
          : null;

        lenses.push({
          id: `cined-lens-${id}`,
          type: 'lens' as const,
          brand: manufacturer,
          model,
          mounts,
          focalLength: focalLength || null,
          aperture: aperture || null,
          weightG,
          dimensions: length ? length : null,
          filterThread: filterThread || null,
          releaseDate: null,
          imageUrl: null,
          sourceUrl: `https://www.cined.com/lens-database/?lens=${encodeURIComponent(type)}`,
        });
      }

      return lenses;
    } catch (err: any) {
      console.warn(`[CineD] Failed to fetch lenses for type ${type}:`, err.message);
      return [];
    }
  }

  /**
   * Fetch full catalog across all camera brands & lens types with max 4 concurrency
   */
  public async buildFullCatalog(): Promise<CineDGearItem[]> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        console.log('[CineD] Starting catalog refresh...');
        const cameraTasks = CAMERA_MANUFACTURERS.map((b) => () => this.fetchCamerasForBrand(b));
        const lensTasks = LENS_TYPES.map((t) => () => this.fetchLensesForType(t));
        const allTasks = [...cameraTasks, ...lensTasks];

        const taskResults = await this.runWithConcurrency(allTasks, 4, (task) => task());
        const combined = taskResults.flat().filter(Boolean);

        if (combined.length > 0) {
          console.log(`[CineD] Catalog fetched successfully: ${combined.length} items`);
          this.saveToDisk(combined);
          return combined;
        } else if (this.inMemoryItems && this.inMemoryItems.length > 0) {
          console.warn('[CineD] Fetch returned 0 items, keeping existing cache');
          return this.inMemoryItems;
        }
        return [];
      } catch (err) {
        console.error('[CineD] Error refreshing catalog:', err);
        return this.inMemoryItems || [];
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Get catalog lazily on request. If cache is older than 7 days, refresh in background
   */
  public async getCatalog(): Promise<CineDGearItem[]> {
    const isStale = Date.now() - this.lastUpdated > CACHE_TTL_MS;

    if (this.inMemoryItems && this.inMemoryItems.length > 0) {
      if (isStale && !this.isRefreshing) {
        // Refresh lazily in background
        this.buildFullCatalog().catch((err) =>
          console.warn('[CineD] Background refresh failed:', err)
        );
      }
      return this.inMemoryItems;
    }

    // No in-memory cache yet, try loading from disk
    this.loadFromDiskSync();
    if (this.inMemoryItems && this.inMemoryItems.length > 0) {
      if (isStale && !this.isRefreshing) {
        this.buildFullCatalog().catch((err) =>
          console.warn('[CineD] Background refresh failed:', err)
        );
      }
      return this.inMemoryItems;
    }

    // No cache on disk either -> fetch now
    return await this.buildFullCatalog();
  }

  /**
   * Search catalog
   */
  public async search(
    query: string,
    type: 'camera' | 'lens' | 'all' = 'all',
    brand: string = '',
    limit: number = 20
  ): Promise<CineDGearItem[]> {
    const items = await this.getCatalog();
    let filtered = items;

    if (type === 'camera' || type === 'lens') {
      filtered = filtered.filter((i) => i.type === type);
    }

    if (brand && brand.trim()) {
      const bLower = brand.trim().toLowerCase();
      filtered = filtered.filter((i) => i.brand.toLowerCase() === bLower);
    }

    const cleanQ = (query || '').trim().toLowerCase();
    if (!cleanQ) {
      // Return top items respecting limit
      return filtered.slice(0, limit);
    }

    const tokens = cleanQ.split(/\s+/).filter(Boolean);
    const qCompact = cleanQ.replace(/[^a-z0-9]/g, '');

    const matched = filtered.filter((item) => {
      const brandLower = item.brand.toLowerCase();
      const modelLower = item.model.toLowerCase();
      const fullText = `${brandLower} ${modelLower} ${item.aperture || ''} ${item.focalLength || ''}`.toLowerCase();
      const compactText = fullText.replace(/[^a-z0-9]/g, '');

      return tokens.every((tok) => {
        const tokCompact = tok.replace(/[^a-z0-9]/g, '');
        if (fullText.includes(tok)) return true;
        if (tokCompact && compactText.includes(tokCompact)) return true;
        return false;
      });
    });

    matched.sort((a, b) => {
      // 1. Camera first when type === 'all'
      if (type === 'all' && a.type !== b.type) {
        return a.type === 'camera' ? -1 : 1;
      }

      const aModel = a.model.toLowerCase();
      const bModel = b.model.toLowerCase();
      const aCompact = aModel.replace(/[^a-z0-9]/g, '');
      const bCompact = bModel.replace(/[^a-z0-9]/g, '');

      // 2. Exact match on full query or model equals token
      const aExact = aModel === cleanQ || aCompact === qCompact;
      const bExact = bModel === cleanQ || bCompact === qCompact;
      if (aExact && !bExact) return -1;
      if (bExact && !aExact) return 1;

      const aTokenExact = tokens.some((t) => t === aModel || (t.length > 1 && t === aCompact));
      const bTokenExact = tokens.some((t) => t === bModel || (t.length > 1 && t === bCompact));
      if (aTokenExact && !bTokenExact) return -1;
      if (bTokenExact && !aTokenExact) return 1;

      // 3. Starts with query
      const aStarts = aModel.startsWith(cleanQ) || (qCompact.length > 1 && aCompact.startsWith(qCompact));
      const bStarts = bModel.startsWith(cleanQ) || (qCompact.length > 1 && bCompact.startsWith(qCompact));
      if (aStarts && !bStarts) return -1;
      if (bStarts && !aStarts) return 1;

      // 4. Newest release date first
      if (a.releaseDate && b.releaseDate) {
        const cmp = b.releaseDate.localeCompare(a.releaseDate);
        if (cmp !== 0) return cmp;
      } else if (a.releaseDate && !b.releaseDate) {
        return -1;
      } else if (!a.releaseDate && b.releaseDate) {
        return 1;
      }

      // 5. Alphabetical fallback
      return a.model.localeCompare(b.model);
    });

    return matched.slice(0, limit);
  }

  /**
   * Get unique brands per type
   */
  public async getBrands(): Promise<{ cameras: string[]; lenses: string[]; all: string[] }> {
    const items = await this.getCatalog();
    const cameraBrands = new Set<string>();
    const lensBrands = new Set<string>();
    const allBrands = new Set<string>();

    for (const item of items) {
      if (item.brand) {
        allBrands.add(item.brand);
        if (item.type === 'camera') cameraBrands.add(item.brand);
        if (item.type === 'lens') lensBrands.add(item.brand);
      }
    }

    const sortFn = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' });

    return {
      cameras: Array.from(cameraBrands).sort(sortFn),
      lenses: Array.from(lensBrands).sort(sortFn),
      all: Array.from(allBrands).sort(sortFn),
    };
  }
}

export const cinedService = new CineDService();
