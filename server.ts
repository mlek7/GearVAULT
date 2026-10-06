import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { AccountDb } from './server/accountDb';
import { cinedService } from './server/cinedService';
import { lightbagGearDb } from './server/lightbagGearDb';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      totalAccounts: AccountDb.getAccounts().length,
    });
  });

  // ==========================================
  // CROSS-DEVICE AUTHENTICATION API
  // ==========================================

  // Register an account (available across all devices)
  app.post('/api/auth/register', (req, res) => {
    try {
      const { email, name, password, studioName, role, provider, avatarUrl } = req.body;
      const user = AccountDb.registerAccount({
        email,
        name,
        password,
        studioName,
        role,
        provider,
        avatarUrl,
      });
      return res.status(201).json({ success: true, user });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Registration failed' });
    }
  });

  // Login with email & password across devices
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      const user = AccountDb.loginAccount(email, password);
      return res.json({ success: true, user });
    } catch (err: any) {
      return res.status(401).json({ error: err.message || 'Authentication failed' });
    }
  });

  // Google credential login / registration across devices
  app.post('/api/auth/google', (req, res) => {
    try {
      const { email, name, password, avatarUrl } = req.body;
      const user = AccountDb.upsertSocialAccount({
        email,
        name,
        password,
        provider: 'google',
        avatarUrl,
      });
      return res.json({ success: true, user });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Google authentication failed' });
    }
  });

  // Apple ID credential login / registration across devices
  app.post('/api/auth/apple', (req, res) => {
    try {
      const { email, name, password, hideMyEmail } = req.body;
      const finalEmail = hideMyEmail
        ? `relay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}@privaterelay.appleid.com`
        : email;

      const user = AccountDb.upsertSocialAccount({
        email: finalEmail,
        name,
        password,
        provider: 'apple',
      });
      return res.json({ success: true, user });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Apple authentication failed' });
    }
  });

  // Update user profile (name, studioName, avatarUrl)
  app.post('/api/auth/profile', (req, res) => {
    try {
      const { id, email, name, studioName, avatarUrl, profileUpdatedAt, user: fullUser } = req.body;
      const accounts = AccountDb.getAccounts();
      let target: any = accounts.find(
        (a) => (id && a.user.id === id) || (email && a.user.email.toLowerCase() === String(email).toLowerCase())
      );
      if (!target && email) {
        // Server lost this account (e.g. after a restart/redeploy): recreate it from the client copy
        target = {
          user: { ...(fullUser || {}), id: id || fullUser?.id, email, name: name || fullUser?.name || '' },
          updatedAt: new Date().toISOString(),
        };
        accounts.push(target);
      }
      if (target) {
        if (name) target.user.name = name;
        if (studioName !== undefined) target.user.studioName = studioName;
        if (avatarUrl !== undefined) target.user.avatarUrl = avatarUrl || undefined;
        target.profileUpdatedAt = profileUpdatedAt || target.profileUpdatedAt || new Date().toISOString();
        target.updatedAt = new Date().toISOString();
        AccountDb.saveAccounts(accounts);
        return res.json({ success: true, user: target.user, profileUpdatedAt: target.profileUpdatedAt });
      }
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to update profile' });
    }
  });

  // Get the latest saved profile for an account (used to sync name/studio/photo across devices)
  app.get('/api/auth/me', (req, res) => {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const account: any = AccountDb.getAccounts().find((a) => a.user.email.toLowerCase() === email);
    if (!account) return res.status(404).json({ error: 'Not found' });
    const { githubToken, ...safeUser } = account.user as any;
    return res.json({ success: true, user: safeUser, profileUpdatedAt: account.profileUpdatedAt || null });
  });

  // Sync client-local accounts to server
  app.post('/api/auth/sync-local', (req, res) => {
    try {
      const { accounts } = req.body;
      const merged = AccountDb.mergeLocalAccounts(accounts || []);
      return res.json({
        success: true,
        merged,
        total: AccountDb.getAccounts().length,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to sync local accounts' });
    }
  });

  // Check if an email exists on the server
  app.get('/api/auth/check', (req, res) => {
    const email = (req.query.email as string) || '';
    if (!email) return res.json({ exists: false });
    const account = AccountDb.findAccountByEmail(email);
    if (!account) return res.json({ exists: false });
    return res.json({
      exists: true,
      provider: account.user.provider,
      name: account.user.name,
      hasPassword: Boolean(account.passwordHash),
    });
  });

  // ==========================================
  // CROSS-DEVICE VAULT DATA SYNC API
  // ==========================================

  const handleVaultSave = (req: express.Request, res: express.Response) => {
    try {
      const { userId, email, vaultData } = req.body;
      if (!vaultData) return res.status(400).json({ error: 'Missing vaultData' });

      if (userId) AccountDb.saveVault(userId, vaultData);
      if (email) AccountDb.saveVault(email, vaultData);

      return res.json({ success: true, savedAt: new Date().toISOString() });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to save vault' });
    }
  };

  // Support both /api/vault/save and /api/vault/sync
  app.post('/api/vault/save', handleVaultSave);
  app.post('/api/vault/sync', handleVaultSave);

  // Load vault data across devices
  app.get('/api/vault/load', (req, res) => {
    try {
      const userId = (req.query.userId as string) || '';
      const email = (req.query.email as string) || '';

      let data = userId ? AccountDb.getVault(userId) : null;
      if (!data && email) {
        data = AccountDb.getVault(email);
      }

      return res.json({ success: true, vaultData: data });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to load vault' });
    }
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
