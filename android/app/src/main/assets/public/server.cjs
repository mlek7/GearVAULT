var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path3 = __toESM(require("path"), 1);
var import_vite = require("vite");

// server/cinedService.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var CAMERA_MANUFACTURERS = [
  "ARRI",
  "Apple",
  "Blackmagic Design",
  "Canon",
  "DJI",
  "FUJIFILM",
  "GoPro",
  "Insta360",
  "Leica",
  "Nikon",
  "Panasonic",
  "Panavision",
  "RED",
  "Sigma",
  "Sony",
  "Z Cam"
];
var LENS_TYPES = [
  "photo-primes",
  "photo-zooms",
  "spherical-primes",
  "spherical-zooms",
  "anamorphic-primes",
  "anamorphic-zooms"
];
var DESKTOP_USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
var CACHE_DIR = import_path.default.join(process.cwd(), "data");
var CACHE_FILE = import_path.default.join(CACHE_DIR, "cined-cache.json");
var CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1e3;
var CineDService = class {
  constructor() {
    this.inMemoryItems = null;
    this.lastUpdated = 0;
    this.isRefreshing = false;
    this.refreshPromise = null;
    this.loadFromDiskSync();
  }
  loadFromDiskSync() {
    try {
      if (import_fs.default.existsSync(CACHE_FILE)) {
        const raw = import_fs.default.readFileSync(CACHE_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.items)) {
          this.inMemoryItems = parsed.items;
          this.lastUpdated = parsed.updatedAt ? new Date(parsed.updatedAt).getTime() : 0;
        }
      }
    } catch (err) {
      console.warn("[CineD] Warning loading disk cache:", err);
    }
  }
  saveToDisk(items) {
    try {
      if (!import_fs.default.existsSync(CACHE_DIR)) {
        import_fs.default.mkdirSync(CACHE_DIR, { recursive: true });
      }
      const data = {
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        items
      };
      import_fs.default.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), "utf-8");
      this.lastUpdated = Date.now();
      this.inMemoryItems = items;
    } catch (err) {
      console.warn("[CineD] Warning saving disk cache:", err);
    }
  }
  /**
   * Concurrency runner (max 4 concurrent requests)
   */
  async runWithConcurrency(items, limit, fn) {
    const results = new Array(items.length);
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
  async fetchCamerasForBrand(brand) {
    try {
      const res = await fetch("https://www.cined.com/app/wp-admin/admin-ajax.php", {
        method: "POST",
        headers: {
          "User-Agent": DESKTOP_USER_AGENT,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `action=ajaxGetCameraByManufacturer&manufacturer=${encodeURIComponent(brand)}`
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      if (!json || json.error !== 0 || !Array.isArray(json.data)) {
        return [];
      }
      return json.data.map((c) => {
        const mounts = [c.lensmount1, c.lensmount2, c.lensmount3, c.lensmount4, c.lensmount5].filter((m) => m && typeof m === "string" && m.trim().length > 0).map((m) => m.trim());
        const dimParts = [c.length, c.width, c.height].filter(Boolean);
        const dimensions = dimParts.length ? `${dimParts.join(" x ")} mm` : null;
        const weightG = c.weight ? parseInt(String(c.weight).replace(/\D/g, ""), 10) || null : null;
        const modelSlug = (c.model || "").replace(/\s+/g, "-");
        return {
          id: `cined-cam-${c.id}`,
          type: "camera",
          brand: c.manufacturer || brand,
          model: c.model || "",
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
          imageUrl: c.image || (c.id ? `https://databases.cined.com/camera/product-images/${c.id}.jpg` : null),
          sourceUrl: `https://www.cined.com/camera-database/?camera=${encodeURIComponent(modelSlug)}`
        };
      });
    } catch (err) {
      console.warn(`[CineD] Failed to fetch cameras for brand ${brand}:`, err.message);
      return [];
    }
  }
  /**
   * Fetch lenses for a single lens type by scraping the server-rendered HTML table
   */
  async fetchLensesForType(type) {
    try {
      const res = await fetch(`https://www.cined.com/lens-database/?lens=${encodeURIComponent(type)}`, {
        headers: {
          "User-Agent": DESKTOP_USER_AGENT
        }
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const html = await res.text();
      const tableMatch = html.match(/<table[^>]*id=["']lens-database-data["'][^>]*>([\s\S]*?)<\/table>/i);
      if (!tableMatch) return [];
      const tableHtml = tableMatch[1];
      const trRegex = /<tr[^>]*id=["']lens-(\d+)["'][^>]*>([\s\S]*?)<\/tr>/gi;
      let match;
      const lenses = [];
      while ((match = trRegex.exec(tableHtml)) !== null) {
        const id = match[1];
        const rowHtml = match[2];
        const tdMatches = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
        const cols = tdMatches.map(
          (m) => m[1].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim()
        );
        if (cols.length < 12) continue;
        const manufacturer = cols[0] || "";
        const series = cols[1] || "";
        const focalLength = cols[2] || "";
        const aperture = cols[3] || "";
        const special = cols[4] || "";
        const length = cols[8] || "";
        const weightStr = cols[9] || "";
        const filterThread = cols[10] || "";
        const mountsRaw = cols[11] || "";
        const modelParts = [manufacturer, series, focalLength, aperture, special].filter(Boolean);
        const model = modelParts.join(" ").replace(/\s+/g, " ").trim();
        const mounts = mountsRaw ? mountsRaw.split(",").map((m) => m.trim()).filter(Boolean) : [];
        const weightG = weightStr ? parseInt(weightStr.replace(/\D/g, ""), 10) || null : null;
        lenses.push({
          id: `cined-lens-${id}`,
          type: "lens",
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
          sourceUrl: `https://www.cined.com/lens-database/?lens=${encodeURIComponent(type)}`
        });
      }
      return lenses;
    } catch (err) {
      console.warn(`[CineD] Failed to fetch lenses for type ${type}:`, err.message);
      return [];
    }
  }
  /**
   * Fetch full catalog across all camera brands & lens types with max 4 concurrency
   */
  async buildFullCatalog() {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        console.log("[CineD] Starting catalog refresh...");
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
          console.warn("[CineD] Fetch returned 0 items, keeping existing cache");
          return this.inMemoryItems;
        }
        return [];
      } catch (err) {
        console.error("[CineD] Error refreshing catalog:", err);
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
  async getCatalog() {
    const isStale = Date.now() - this.lastUpdated > CACHE_TTL_MS;
    if (this.inMemoryItems && this.inMemoryItems.length > 0) {
      if (isStale && !this.isRefreshing) {
        this.buildFullCatalog().catch(
          (err) => console.warn("[CineD] Background refresh failed:", err)
        );
      }
      return this.inMemoryItems;
    }
    this.loadFromDiskSync();
    if (this.inMemoryItems && this.inMemoryItems.length > 0) {
      if (isStale && !this.isRefreshing) {
        this.buildFullCatalog().catch(
          (err) => console.warn("[CineD] Background refresh failed:", err)
        );
      }
      return this.inMemoryItems;
    }
    return await this.buildFullCatalog();
  }
  /**
   * Search catalog
   */
  async search(query, type = "all", brand = "", limit = 20) {
    const items = await this.getCatalog();
    let filtered = items;
    if (type === "camera" || type === "lens") {
      filtered = filtered.filter((i) => i.type === type);
    }
    if (brand && brand.trim()) {
      const bLower = brand.trim().toLowerCase();
      filtered = filtered.filter((i) => i.brand.toLowerCase() === bLower);
    }
    const cleanQ = (query || "").trim().toLowerCase();
    if (!cleanQ) {
      return filtered.slice(0, limit);
    }
    const tokens = cleanQ.split(/\s+/).filter(Boolean);
    const qCompact = cleanQ.replace(/[^a-z0-9]/g, "");
    const matched = filtered.filter((item) => {
      const brandLower = item.brand.toLowerCase();
      const modelLower = item.model.toLowerCase();
      const fullText = `${brandLower} ${modelLower} ${item.aperture || ""} ${item.focalLength || ""}`.toLowerCase();
      const compactText = fullText.replace(/[^a-z0-9]/g, "");
      return tokens.every((tok) => {
        const tokCompact = tok.replace(/[^a-z0-9]/g, "");
        if (fullText.includes(tok)) return true;
        if (tokCompact && compactText.includes(tokCompact)) return true;
        return false;
      });
    });
    matched.sort((a, b) => {
      if (type === "all" && a.type !== b.type) {
        return a.type === "camera" ? -1 : 1;
      }
      const aModel = a.model.toLowerCase();
      const bModel = b.model.toLowerCase();
      const aCompact = aModel.replace(/[^a-z0-9]/g, "");
      const bCompact = bModel.replace(/[^a-z0-9]/g, "");
      const aExact = aModel === cleanQ || aCompact === qCompact;
      const bExact = bModel === cleanQ || bCompact === qCompact;
      if (aExact && !bExact) return -1;
      if (bExact && !aExact) return 1;
      const aTokenExact = tokens.some((t) => t === aModel || t.length > 1 && t === aCompact);
      const bTokenExact = tokens.some((t) => t === bModel || t.length > 1 && t === bCompact);
      if (aTokenExact && !bTokenExact) return -1;
      if (bTokenExact && !aTokenExact) return 1;
      const aStarts = aModel.startsWith(cleanQ) || qCompact.length > 1 && aCompact.startsWith(qCompact);
      const bStarts = bModel.startsWith(cleanQ) || qCompact.length > 1 && bCompact.startsWith(qCompact);
      if (aStarts && !bStarts) return -1;
      if (bStarts && !aStarts) return 1;
      if (a.releaseDate && b.releaseDate) {
        const cmp = b.releaseDate.localeCompare(a.releaseDate);
        if (cmp !== 0) return cmp;
      } else if (a.releaseDate && !b.releaseDate) {
        return -1;
      } else if (!a.releaseDate && b.releaseDate) {
        return 1;
      }
      return a.model.localeCompare(b.model);
    });
    return matched.slice(0, limit);
  }
  /**
   * Get unique brands per type
   */
  async getBrands() {
    const items = await this.getCatalog();
    const cameraBrands = /* @__PURE__ */ new Set();
    const lensBrands = /* @__PURE__ */ new Set();
    const allBrands = /* @__PURE__ */ new Set();
    for (const item of items) {
      if (item.brand) {
        allBrands.add(item.brand);
        if (item.type === "camera") cameraBrands.add(item.brand);
        if (item.type === "lens") lensBrands.add(item.brand);
      }
    }
    const sortFn = (a, b) => a.localeCompare(b, void 0, { sensitivity: "base" });
    return {
      cameras: Array.from(cameraBrands).sort(sortFn),
      lenses: Array.from(lensBrands).sort(sortFn),
      all: Array.from(allBrands).sort(sortFn)
    };
  }
};
var cinedService = new CineDService();

// server/lightbagGearDb.ts
var import_fs2 = __toESM(require("fs"), 1);
var import_path2 = __toESM(require("path"), 1);
var LightbagGearDb = class {
  constructor() {
    this.items = [];
    this.load();
  }
  load() {
    try {
      const dbPath = import_path2.default.join(process.cwd(), "data", "lightbag-gear-db.json");
      if (import_fs2.default.existsSync(dbPath)) {
        const raw = import_fs2.default.readFileSync(dbPath, "utf8");
        this.items = JSON.parse(raw);
        console.log(`[LightbagGearDb] Loaded ${this.items.length} gear items`);
      }
    } catch (err) {
      console.error("[LightbagGearDb] Error loading lightbag gear db:", err);
    }
  }
  getItems() {
    if (this.items.length === 0) {
      this.load();
    }
    return this.items;
  }
  search(query, category = "all", limit = 20) {
    let list = this.getItems();
    const normalizedCat = category.toLowerCase().replace(/s$/, "");
    if (normalizedCat !== "all" && normalizedCat !== "") {
      list = list.filter((i) => i.category === normalizedCat);
    }
    const cleanQ = (query || "").trim().toLowerCase();
    if (!cleanQ) {
      return list.slice(0, limit);
    }
    const tokens = cleanQ.split(/\s+/).filter(Boolean);
    const qCompact = cleanQ.replace(/[^a-z0-9]/g, "");
    const matched = list.filter((item) => {
      const brandLower = item.brand.toLowerCase();
      const modelLower = item.model.toLowerCase();
      const subcatLower = (item.subcategory || "").toLowerCase();
      const fullText = `${brandLower} ${modelLower} ${subcatLower}`.toLowerCase();
      const compactText = fullText.replace(/[^a-z0-9]/g, "");
      return tokens.every((tok) => {
        const tokCompact = tok.replace(/[^a-z0-9]/g, "");
        if (fullText.includes(tok)) return true;
        if (tokCompact && compactText.includes(tokCompact)) return true;
        return false;
      });
    });
    matched.sort((a, b) => {
      const aModel = a.model.toLowerCase();
      const bModel = b.model.toLowerCase();
      const aFull = `${a.brand} ${a.model}`.toLowerCase();
      const bFull = `${b.brand} ${b.model}`.toLowerCase();
      const aCompact = aModel.replace(/[^a-z0-9]/g, "");
      const bCompact = bModel.replace(/[^a-z0-9]/g, "");
      const aExact = aModel === cleanQ || aCompact === qCompact || aFull === cleanQ;
      const bExact = bModel === cleanQ || bCompact === qCompact || bFull === cleanQ;
      if (aExact && !bExact) return -1;
      if (bExact && !aExact) return 1;
      const aContainsQ = aModel.includes(cleanQ) || aFull.includes(cleanQ);
      const bContainsQ = bModel.includes(cleanQ) || bFull.includes(cleanQ);
      if (aContainsQ && !bContainsQ) return -1;
      if (bContainsQ && !aContainsQ) return 1;
      const aContainsCompact = qCompact.length > 1 && aCompact.includes(qCompact);
      const bContainsCompact = qCompact.length > 1 && bCompact.includes(qCompact);
      if (aContainsCompact && !bContainsCompact) return -1;
      if (bContainsCompact && !aContainsCompact) return 1;
      const aStarts = aModel.startsWith(cleanQ) || qCompact.length > 1 && aCompact.startsWith(qCompact);
      const bStarts = bModel.startsWith(cleanQ) || qCompact.length > 1 && bCompact.startsWith(qCompact);
      if (aStarts && !bStarts) return -1;
      if (bStarts && !aStarts) return 1;
      const aTokensInModel = tokens.filter((t) => aModel.includes(t)).length;
      const bTokensInModel = tokens.filter((t) => bModel.includes(t)).length;
      if (aTokensInModel !== bTokensInModel) return bTokensInModel - aTokensInModel;
      return a.model.localeCompare(b.model);
    });
    return matched.slice(0, limit);
  }
};
var lightbagGearDb = new LightbagGearDb();

// server.ts
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "15mb" }));
  const allowedNativeOrigins = [
    "capacitor://localhost",
    "https://localhost",
    "http://localhost"
  ];
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedNativeOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "Lightbag Gear & Shoot Platform",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  const UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
  const PINTEREST_LOGO_HASH = "d53b014d86a6b6761bf649a0ed813c2b";
  function isPinterestHost(h) {
    return /(^|\.)pinterest\.[a-z.]+$/i.test(h) || /(^|\.)pin\.it$/i.test(h);
  }
  async function resolvePinUrl(inputUrl) {
    let u = new URL(inputUrl);
    if (/pin\.it$/i.test(u.hostname)) {
      const r = await fetch(u.href, { redirect: "follow", headers: { "User-Agent": UA } });
      u = new URL(r.url);
    }
    return u;
  }
  function getPinId(u) {
    const m = u.pathname.match(/\/pin\/(?:[^/]*--)?(\d+)/);
    return m ? m[1] : null;
  }
  function upgradePinimg(url) {
    return url.replace(/i\.pinimg\.com\/(\d+x|\d+x\d+(_RS)?)\//, "i.pinimg.com/originals/");
  }
  function metaContent(html, prop) {
    const tags = html.match(/<meta\b[^>]*>/gi) || [];
    for (const t of tags) {
      const p = t.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i);
      if (p && p[1].toLowerCase() === prop) {
        const c = t.match(/\bcontent\s*=\s*["']([^"']+)["']/i);
        if (c) return c[1].replace(/&amp;/g, "&");
      }
    }
    return null;
  }
  async function fromPidgets(pinId) {
    const r = await fetch(`https://widgets.pinterest.com/v3/pidgets/pins/info/?pin_ids=${pinId}`, {
      headers: { "User-Agent": UA }
    });
    if (!r.ok) return null;
    const j = await r.json();
    const pin = j?.data?.[0];
    if (!pin?.images) return null;
    const sizes = Object.values(pin.images).sort((a, b) => (b.width || 0) - (a.width || 0));
    if (!sizes[0]?.url) return null;
    return {
      candidates: [upgradePinimg(sizes[0].url), sizes[0].url],
      title: (pin.grid_title || pin.description || "").trim()
    };
  }
  async function fromHtml(pageUrl) {
    const r = await fetch(pageUrl, {
      headers: { "User-Agent": UA, "Accept-Language": "en" },
      redirect: "follow"
    });
    const type = r.headers.get("content-type") || "";
    if (type.startsWith("image/")) {
      return { candidates: [r.url || pageUrl], title: "Imported image" };
    }
    const html = await r.text();
    const og = metaContent(html, "og:image") || metaContent(html, "twitter:image") || metaContent(html, "twitter:image:src");
    const title = metaContent(html, "og:title") || (html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "");
    const candidates = [];
    if (og && !og.includes(PINTEREST_LOGO_HASH)) {
      const abs = new URL(og, r.url).href;
      if (abs.includes("i.pinimg.com")) candidates.push(upgradePinimg(abs));
      candidates.push(abs);
    }
    return { candidates, title: title.trim() };
  }
  async function download(url) {
    const r = await fetch(url, { headers: { "User-Agent": UA, Referer: "https://www.pinterest.com/" } });
    const type = r.headers.get("content-type") || "";
    if (!r.ok || !type.startsWith("image/")) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 2e3) return null;
    return `data:${type.split(";")[0]};base64,${buf.toString("base64")}`;
  }
  async function extractImage(inputUrl) {
    const u = await resolvePinUrl(inputUrl.trim());
    if (/\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(u.pathname)) {
      const d = await download(u.href);
      if (d) return { imageUrl: d, originalUrl: u.href, sourceUrl: inputUrl, title: "Imported image" };
    }
    let result = { candidates: [], title: "" };
    const pinId = isPinterestHost(u.hostname) ? getPinId(u) : null;
    if (pinId) result = await fromPidgets(pinId).catch(() => null) || result;
    if (!result.candidates.length) {
      const pageUrl = pinId ? `https://www.pinterest.com/pin/${pinId}/` : u.href;
      result = await fromHtml(pageUrl);
    }
    for (const c of result.candidates) {
      if (c.includes(PINTEREST_LOGO_HASH)) continue;
      const d = await download(c).catch(() => null);
      if (d) return { imageUrl: d, originalUrl: c, sourceUrl: inputUrl, title: result.title || "Imported Pin Reference" };
    }
    throw new Error("No image found at this link");
  }
  app.post("/api/extract-image", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ success: false, error: "Please provide a valid URL" });
      }
      const cleanUrl = url.trim();
      if (!/^https?:\/\//i.test(cleanUrl)) {
        return res.status(400).json({ success: false, error: "URL must start with http:// or https://" });
      }
      const extracted = await extractImage(cleanUrl);
      return res.json({
        success: true,
        imageUrl: extracted.imageUrl,
        originalUrl: extracted.originalUrl,
        sourceUrl: extracted.sourceUrl,
        title: extracted.title
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: err.message || "No image found at this link"
      });
    }
  });
  app.get("/api/gear-db/search", async (req, res) => {
    try {
      const q = typeof req.query.q === "string" ? req.query.q : "";
      const rawCategory = typeof req.query.category === "string" ? req.query.category.toLowerCase() : "";
      const rawType = typeof req.query.type === "string" ? req.query.type.toLowerCase() : "";
      const filterKey = (rawCategory || rawType || "all").replace(/s$/, "");
      const brand = typeof req.query.brand === "string" ? req.query.brand : "";
      const limit = Math.min(Math.max(parseInt(String(req.query.limit || "20"), 10) || 20, 1), 100);
      const categoryMap = {
        camera: "Camera Body",
        lens: "Lens",
        light: "Lighting",
        audio: "Audio",
        monitor: "Monitor",
        tripod: "Tripod",
        gimbal: "Gimbal",
        drone: "Drone"
      };
      let results = [];
      if (filterKey === "camera" || filterKey === "lens") {
        const cinedItems = await cinedService.search(q, filterKey, brand, limit);
        results = cinedItems.map((item) => ({
          ...item,
          category: item.type === "camera" ? "Camera Body" : "Lens",
          source: "cined"
        }));
      } else if (["light", "audio", "monitor", "tripod", "gimbal", "drone"].includes(filterKey)) {
        const lbItems = lightbagGearDb.search(q, filterKey, limit);
        results = lbItems.map((item) => ({
          ...item,
          type: item.category,
          category: categoryMap[item.category] || "Accessories",
          sourceUrl: item.officialUrl,
          source: "lightbag-db"
        }));
      } else {
        const [cinedItems, lbItems] = await Promise.all([
          cinedService.search(q, "all", brand, limit),
          Promise.resolve(lightbagGearDb.search(q, "all", limit))
        ]);
        const normalizedCined = cinedItems.map((item) => ({
          ...item,
          category: item.type === "camera" ? "Camera Body" : "Lens",
          source: "cined"
        }));
        const normalizedLb = lbItems.map((item) => ({
          ...item,
          type: item.category,
          category: categoryMap[item.category] || "Accessories",
          sourceUrl: item.officialUrl,
          source: "lightbag-db"
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
    } catch (err) {
      console.error("Error in /api/gear-db/search:", err);
      return res.status(500).json({ success: false, error: err.message || "Search failed", items: [] });
    }
  });
  app.get("/api/gear-db/brands", async (req, res) => {
    try {
      const brands = await cinedService.getBrands();
      return res.json({ success: true, brands });
    } catch (err) {
      console.error("Error in /api/gear-db/brands:", err);
      return res.status(500).json({ success: false, error: err.message || "Failed to get brands" });
    }
  });
  app.get("/api/gear-db/image", async (req, res) => {
    try {
      const imageUrl = typeof req.query.url === "string" ? req.query.url.trim() : "";
      if (!imageUrl) {
        return res.status(400).send("Image URL required");
      }
      let parsed;
      try {
        parsed = new URL(imageUrl);
      } catch {
        return res.status(400).send("Invalid URL format");
      }
      const allowedHosts = ["databases.cined.com", "www.cined.com", "cined.com"];
      if (!allowedHosts.includes(parsed.hostname.toLowerCase())) {
        return res.status(403).send("Forbidden: host not permitted");
      }
      const fetchRes = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
      });
      if (!fetchRes.ok) {
        return res.status(fetchRes.status).send("Failed to fetch image");
      }
      const contentType = fetchRes.headers.get("content-type") || "image/jpeg";
      const arrayBuffer = await fetchRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=604800");
      return res.send(buffer);
    } catch (err) {
      console.error("Error proxying CineD image:", err);
      return res.status(500).send("Image proxy error");
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path3.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path3.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Lightbag Server listening on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
