import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { cinedService } from './server/cinedService';
import { lightbagGearDb } from './server/lightbagGearDb';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // CORS for native Capacitor platforms (iOS: capacitor://localhost, Android: https://localhost or http://localhost)
  const allowedNativeOrigins = [
    'capacitor://localhost',
    'https://localhost',
    'http://localhost',
  ];

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedNativeOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Lightbag Gear & Shoot Platform',
      timestamp: new Date().toISOString(),
    });
  });

  // ==========================================
  // PINTEREST & WEB IMAGE EXTRACTION API (Requirement 5)
  // ==========================================
  const UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
  const PINTEREST_LOGO_HASH = 'd53b014d86a6b6761bf649a0ed813c2b';

  function isPinterestHost(h: string): boolean {
    return /(^|\.)pinterest\.[a-z.]+$/i.test(h) || /(^|\.)pin\.it$/i.test(h);
  }

  async function resolvePinUrl(inputUrl: string): Promise<URL> {
    let u = new URL(inputUrl);
    if (/pin\.it$/i.test(u.hostname)) {
      const r = await fetch(u.href, { redirect: 'follow', headers: { 'User-Agent': UA } });
      u = new URL(r.url);
    }
    return u;
  }

  function getPinId(u: URL): string | null {
    const m = u.pathname.match(/\/pin\/(?:[^/]*--)?(\d+)/);
    return m ? m[1] : null;
  }

  function upgradePinimg(url: string): string {
    // i.pinimg.com/236x|474x|564x|736x/aa/bb/cc/hash.jpg -> originals
    return url.replace(/i\.pinimg\.com\/(\d+x|\d+x\d+(_RS)?)\//, 'i.pinimg.com/originals/');
  }

  function metaContent(html: string, prop: string): string | null {
    const tags = html.match(/<meta\b[^>]*>/gi) || [];
    for (const t of tags) {
      const p = t.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i);
      if (p && p[1].toLowerCase() === prop) {
        const c = t.match(/\bcontent\s*=\s*["']([^"']+)["']/i);
        if (c) return c[1].replace(/&amp;/g, '&');
      }
    }
    return null;
  }

  async function fromPidgets(pinId: string) {
    const r = await fetch(`https://widgets.pinterest.com/v3/pidgets/pins/info/?pin_ids=${pinId}`, {
      headers: { 'User-Agent': UA },
    });
    if (!r.ok) return null;
    const j: any = await r.json();
    const pin = j?.data?.[0];
    if (!pin?.images) return null;
    const sizes: any[] = Object.values(pin.images).sort((a: any, b: any) => (b.width || 0) - (a.width || 0));
    if (!sizes[0]?.url) return null;
    return {
      candidates: [upgradePinimg(sizes[0].url), sizes[0].url],
      title: (pin.grid_title || pin.description || '').trim(),
    };
  }

  async function fromHtml(pageUrl: string) {
    const r = await fetch(pageUrl, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en' },
      redirect: 'follow',
    });
    const type = r.headers.get('content-type') || '';
    if (type.startsWith('image/')) {
      return { candidates: [r.url || pageUrl], title: 'Imported image' };
    }
    const html = await r.text();
    const og = metaContent(html, 'og:image') || metaContent(html, 'twitter:image') || metaContent(html, 'twitter:image:src');
    const title = metaContent(html, 'og:title') || (html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? '');
    const candidates: string[] = [];
    if (og && !og.includes(PINTEREST_LOGO_HASH)) {
      const abs = new URL(og, r.url).href;
      if (abs.includes('i.pinimg.com')) candidates.push(upgradePinimg(abs));
      candidates.push(abs);
    }
    return { candidates, title: title.trim() };
  }

  async function download(url: string): Promise<string | null> {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Referer: 'https://www.pinterest.com/' } });
    const type = r.headers.get('content-type') || '';
    if (!r.ok || !type.startsWith('image/')) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 2000) return null;
    return `data:${type.split(';')[0]};base64,${buf.toString('base64')}`;
  }

  async function extractImage(inputUrl: string) {
    const u = await resolvePinUrl(inputUrl.trim());
    // direct image link
    if (/\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(u.pathname)) {
      const d = await download(u.href);
      if (d) return { imageUrl: d, originalUrl: u.href, sourceUrl: inputUrl, title: 'Imported image' };
    }
    let result: { candidates: string[]; title: string } = { candidates: [], title: '' };
    const pinId = isPinterestHost(u.hostname) ? getPinId(u) : null;
    if (pinId) result = (await fromPidgets(pinId).catch(() => null)) || result;
    if (!result.candidates.length) {
      const pageUrl = pinId ? `https://www.pinterest.com/pin/${pinId}/` : u.href;
      result = await fromHtml(pageUrl);
    }
    for (const c of result.candidates) {
      if (c.includes(PINTEREST_LOGO_HASH)) continue;
      const d = await download(c).catch(() => null);
      if (d) return { imageUrl: d, originalUrl: c, sourceUrl: inputUrl, title: result.title || 'Imported Pin Reference' };
    }
    throw new Error('No image found at this link');
  }

  app.post('/api/extract-image', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ success: false, error: 'Please provide a valid URL' });
      }

      const cleanUrl = url.trim();
      if (!/^https?:\/\//i.test(cleanUrl)) {
        return res.status(400).json({ success: false, error: 'URL must start with http:// or https://' });
      }

      const extracted = await extractImage(cleanUrl);
      return res.json({
        success: true,
        imageUrl: extracted.imageUrl,
        originalUrl: extracted.originalUrl,
        sourceUrl: extracted.sourceUrl,
        title: extracted.title,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message || 'No image found at this link',
      });
    }
  });

  // ==========================================
  // UNIFIED GEAR DATABASE API (CineD + Lightbag DB)
  // ==========================================

  // Search cameras, lenses, lights, audio, monitors, tripods, gimbals, drones
  app.get('/api/gear-db/search', async (req, res) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      const rawCategory = typeof req.query.category === 'string' ? req.query.category.toLowerCase() : '';
      const rawType = typeof req.query.type === 'string' ? req.query.type.toLowerCase() : '';
      const filterKey = (rawCategory || rawType || 'all').replace(/s$/, ''); // e.g. 'camera', 'lens', 'light', 'audio', 'monitor', 'tripod', 'gimbal', 'drone', or 'all'
      const brand = typeof req.query.brand === 'string' ? req.query.brand : '';
      const limit = Math.min(Math.max(parseInt(String(req.query.limit || '20'), 10) || 20, 1), 100);

      const categoryMap: Record<string, string> = {
        camera: 'Camera Body',
        lens: 'Lens',
        light: 'Lighting',
        audio: 'Audio',
        monitor: 'Monitor',
        tripod: 'Tripod',
        gimbal: 'Gimbal',
        drone: 'Drone',
      };

      let results: any[] = [];

      if (filterKey === 'camera' || filterKey === 'lens') {
        // Search CineD exclusively
        const cinedItems = await cinedService.search(q, filterKey, brand, limit);
        results = cinedItems.map((item) => ({
          ...item,
          category: item.type === 'camera' ? 'Camera Body' : 'Lens',
          source: 'cined',
        }));
      } else if (['light', 'audio', 'monitor', 'tripod', 'gimbal', 'drone'].includes(filterKey)) {
        // Search Lightbag DB exclusively
        const lbItems = lightbagGearDb.search(q, filterKey, limit);
        results = lbItems.map((item) => ({
          ...item,
          type: item.category,
          category: categoryMap[item.category] || 'Accessories',
          sourceUrl: item.officialUrl,
          source: 'lightbag-db',
        }));
      } else {
        // 'all': Search both CineD and Lightbag DB
        const [cinedItems, lbItems] = await Promise.all([
          cinedService.search(q, 'all', brand, limit),
          Promise.resolve(lightbagGearDb.search(q, 'all', limit)),
        ]);

        const normalizedCined = cinedItems.map((item) => ({
          ...item,
          category: item.type === 'camera' ? 'Camera Body' : 'Lens',
          source: 'cined',
        }));

        const normalizedLb = lbItems.map((item) => ({
          ...item,
          type: item.category,
          category: categoryMap[item.category] || 'Accessories',
          sourceUrl: item.officialUrl,
          source: 'lightbag-db',
        }));

        const cleanQ = q.trim().toLowerCase();
        const combined = [...normalizedCined, ...normalizedLb];

        if (cleanQ) {
          combined.sort((a, b) => {
            const aModel = a.model.toLowerCase();
            const bModel = b.model.toLowerCase();
            const aFull = `${a.brand} ${a.model}`.toLowerCase();
            const bFull = `${b.brand} ${b.model}`.toLowerCase();
            const aExact = aModel === cleanQ || aFull === cleanQ;
            const bExact = bModel === cleanQ || bFull === cleanQ;
            if (aExact && !bExact) return -1;
            if (bExact && !aExact) return 1;
            const aContains = aModel.includes(cleanQ) || aFull.includes(cleanQ);
            const bContains = bModel.includes(cleanQ) || bFull.includes(cleanQ);
            if (aContains && !bContains) return -1;
            if (bContains && !aContains) return 1;
            return a.model.localeCompare(b.model);
          });
        }

        results = combined.slice(0, limit);
      }

      return res.json({ success: true, count: results.length, items: results });
    } catch (err: any) {
      console.error('Error in /api/gear-db/search:', err);
      return res.status(500).json({ success: false, error: err.message || 'Search failed', items: [] });
    }
  });

  // Get brands per type
  app.get('/api/gear-db/brands', async (req, res) => {
    try {
      const brands = await cinedService.getBrands();
      return res.json({ success: true, brands });
    } catch (err: any) {
      console.error('Error in /api/gear-db/brands:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to get brands' });
    }
  });

  // Proxy CineD images (only databases.cined.com or cined.com)
  app.get('/api/gear-db/image', async (req, res) => {
    try {
      const imageUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
      if (!imageUrl) {
        return res.status(400).send('Image URL required');
      }

      let parsed: URL;
      try {
        parsed = new URL(imageUrl);
      } catch {
        return res.status(400).send('Invalid URL format');
      }

      const allowedHosts = ['databases.cined.com', 'www.cined.com', 'cined.com'];
      if (!allowedHosts.includes(parsed.hostname.toLowerCase())) {
        return res.status(403).send('Forbidden: host not permitted');
      }

      const fetchRes = await fetch(imageUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
      });

      if (!fetchRes.ok) {
        return res.status(fetchRes.status).send('Failed to fetch image');
      }

      const contentType = fetchRes.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await fetchRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=604800');
      return res.send(buffer);
    } catch (err: any) {
      console.error('Error proxying CineD image:', err);
      return res.status(500).send('Image proxy error');
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lightbag Server listening on port ${PORT}`);
  });
}

startServer();
