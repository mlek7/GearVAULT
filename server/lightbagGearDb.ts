import fs from 'fs';
import path from 'path';

export type LightbagCategory = 'light' | 'audio' | 'monitor' | 'tripod' | 'gimbal' | 'drone';

export interface LightbagGearItem {
  id: string;
  category: LightbagCategory;
  subcategory: string;
  brand: string;
  model: string;
  keySpecs: Record<string, any>;
  weight?: string | number | null;
  officialUrl: string;
  imageUrl?: string | null;
  source: 'lightbag-db';
}

class LightbagGearDb {
  private items: LightbagGearItem[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const dbPath = path.join(process.cwd(), 'data', 'lightbag-gear-db.json');
      if (fs.existsSync(dbPath)) {
        const raw = fs.readFileSync(dbPath, 'utf8');
        this.items = JSON.parse(raw);
        console.log(`[LightbagGearDb] Loaded ${this.items.length} gear items`);
      }
    } catch (err) {
      console.error('[LightbagGearDb] Error loading lightbag gear db:', err);
    }
  }

  public getItems(): LightbagGearItem[] {
    if (this.items.length === 0) {
      this.load();
    }
    return this.items;
  }

  public search(query: string, category: string = 'all', limit: number = 20): LightbagGearItem[] {
    let list = this.getItems();

    const normalizedCat = category.toLowerCase().replace(/s$/, ''); // e.g. lights -> light, monitors -> monitor, tripods -> tripod
    if (normalizedCat !== 'all' && normalizedCat !== '') {
      list = list.filter((i) => i.category === normalizedCat);
    }

    const cleanQ = (query || '').trim().toLowerCase();
    if (!cleanQ) {
      return list.slice(0, limit);
    }

    const tokens = cleanQ.split(/\s+/).filter(Boolean);
    const qCompact = cleanQ.replace(/[^a-z0-9]/g, '');

    const matched = list.filter((item) => {
      const brandLower = item.brand.toLowerCase();
      const modelLower = item.model.toLowerCase();
      const subcatLower = (item.subcategory || '').toLowerCase();
      const fullText = `${brandLower} ${modelLower} ${subcatLower}`.toLowerCase();
      const compactText = fullText.replace(/[^a-z0-9]/g, '');

      return tokens.every((tok) => {
        const tokCompact = tok.replace(/[^a-z0-9]/g, '');
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
      const aCompact = aModel.replace(/[^a-z0-9]/g, '');
      const bCompact = bModel.replace(/[^a-z0-9]/g, '');

      // Exact match
      const aExact = aModel === cleanQ || aCompact === qCompact || aFull === cleanQ;
      const bExact = bModel === cleanQ || bCompact === qCompact || bFull === cleanQ;
      if (aExact && !bExact) return -1;
      if (bExact && !aExact) return 1;

      // Model contains entire clean query
      const aContainsQ = aModel.includes(cleanQ) || aFull.includes(cleanQ);
      const bContainsQ = bModel.includes(cleanQ) || bFull.includes(cleanQ);
      if (aContainsQ && !bContainsQ) return -1;
      if (bContainsQ && !aContainsQ) return 1;

      // Compact contains compact query
      const aContainsCompact = qCompact.length > 1 && aCompact.includes(qCompact);
      const bContainsCompact = qCompact.length > 1 && bCompact.includes(qCompact);
      if (aContainsCompact && !bContainsCompact) return -1;
      if (bContainsCompact && !aContainsCompact) return 1;

      // Starts with query
      const aStarts = aModel.startsWith(cleanQ) || (qCompact.length > 1 && aCompact.startsWith(qCompact));
      const bStarts = bModel.startsWith(cleanQ) || (qCompact.length > 1 && bCompact.startsWith(qCompact));
      if (aStarts && !bStarts) return -1;
      if (bStarts && !aStarts) return 1;

      // Number of tokens in model name
      const aTokensInModel = tokens.filter((t) => aModel.includes(t)).length;
      const bTokensInModel = tokens.filter((t) => bModel.includes(t)).length;
      if (aTokensInModel !== bTokensInModel) return bTokensInModel - aTokensInModel;

      return a.model.localeCompare(b.model);
    });

    return matched.slice(0, limit);
  }
}

export const lightbagGearDb = new LightbagGearDb();
