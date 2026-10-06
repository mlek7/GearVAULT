import {
  GearItem,
  Shoot,
  PackingItem,
  MoodboardItem,
  AppSettings,
  AlertNotification,
} from '../types';
import {
  INITIAL_GEAR,
  INITIAL_SHOOTS,
  INITIAL_PACKING,
  INITIAL_MOODBOARDS,
  INITIAL_SETTINGS,
  SEED_GEAR_IDS,
  SEED_SHOOT_IDS,
  SEED_PACKING_IDS,
  SEED_MOODBOARD_IDS,
} from '../data/initialData';

const STORAGE_KEYS = {
  GEAR: 'shutterhub_gear',
  SHOOTS: 'shutterhub_shoots',
  PACKING: 'shutterhub_packing',
  MOODBOARDS: 'shutterhub_moodboards',
  SETTINGS: 'shutterhub_settings',
  NOTIFICATIONS: 'shutterhub_notifications',
  AUTH_USER: 'shutterhub_auth_user',
  CLEANUP_DONE: 'shutterhub_seed_cleanup_done_v2',
};

// One-time cleanup that removes demo/seed data matching seed IDs without touching user items (Requirement 4)
export function runSeedDataCleanup(): void {
  try {
    if (localStorage.getItem(STORAGE_KEYS.CLEANUP_DONE)) return;

    // Clean gear: keep only user items
    const rawGear = localStorage.getItem(STORAGE_KEYS.GEAR);
    if (rawGear) {
      const parsed = JSON.parse(rawGear) as GearItem[];
      const cleaned = parsed.filter((g) => !SEED_GEAR_IDS.has(g.id));
      localStorage.setItem(STORAGE_KEYS.GEAR, JSON.stringify(cleaned));
    }

    // Clean shoots: keep only user shoots
    const rawShoots = localStorage.getItem(STORAGE_KEYS.SHOOTS);
    if (rawShoots) {
      const parsed = JSON.parse(rawShoots) as Shoot[];
      const cleaned = parsed.filter((s) => !SEED_SHOOT_IDS.has(s.id));
      localStorage.setItem(STORAGE_KEYS.SHOOTS, JSON.stringify(cleaned));
    }

    // Clean packing: filter out seed gear or seed shoots
    const rawPacking = localStorage.getItem(STORAGE_KEYS.PACKING);
    if (rawPacking) {
      const parsed = JSON.parse(rawPacking) as PackingItem[];
      const cleaned = parsed.filter(
        (p) => !SEED_PACKING_IDS.has(p.id) && !SEED_SHOOT_IDS.has(p.shootId) && !SEED_GEAR_IDS.has(p.gearId)
      );
      localStorage.setItem(STORAGE_KEYS.PACKING, JSON.stringify(cleaned));
    }

    // Clean moodboards: filter out seed moodboard items
    const rawMb = localStorage.getItem(STORAGE_KEYS.MOODBOARDS);
    if (rawMb) {
      const parsed = JSON.parse(rawMb) as MoodboardItem[];
      const cleaned = parsed.filter((m) => !SEED_MOODBOARD_IDS.has(m.id));
      localStorage.setItem(STORAGE_KEYS.MOODBOARDS, JSON.stringify(cleaned));
    }

    // Clean settings: reset demo studio name or photographer name
    const rawSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (rawSettings) {
      const parsed = JSON.parse(rawSettings) as AppSettings;
      let changed = false;
      if (parsed.studioName === 'Lumina Studio SF' || parsed.studioName === 'Photo Studio Vault') {
        parsed.studioName = '';
        changed = true;
      }
      if (parsed.photographerName === 'Alex Rivera') {
        parsed.photographerName = '';
        changed = true;
      }
      if (changed) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
      }
    }

    localStorage.setItem(STORAGE_KEYS.CLEANUP_DONE, 'true');
  } catch (err) {
    console.warn('Silent seed cleanup error:', err);
  }
}

// Safe JSON loader
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`Error loading ${key} from storage:`, err);
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Error saving ${key} to storage:`, err);
  }
}

// Storage API
export const StorageService = {
  getGear(): GearItem[] {
    return loadFromStorage<GearItem[]>(STORAGE_KEYS.GEAR, INITIAL_GEAR);
  },
  saveGear(items: GearItem[]): void {
    saveToStorage(STORAGE_KEYS.GEAR, items);
  },

  getShoots(): Shoot[] {
    return loadFromStorage<Shoot[]>(STORAGE_KEYS.SHOOTS, INITIAL_SHOOTS);
  },
  saveShoots(shoots: Shoot[]): void {
    saveToStorage(STORAGE_KEYS.SHOOTS, shoots);
  },

  getPacking(): PackingItem[] {
    return loadFromStorage<PackingItem[]>(STORAGE_KEYS.PACKING, INITIAL_PACKING);
  },
  savePacking(items: PackingItem[]): void {
    saveToStorage(STORAGE_KEYS.PACKING, items);
  },

  getMoodboards(): MoodboardItem[] {
    return loadFromStorage<MoodboardItem[]>(STORAGE_KEYS.MOODBOARDS, INITIAL_MOODBOARDS);
  },
  saveMoodboards(items: MoodboardItem[]): void {
    saveToStorage(STORAGE_KEYS.MOODBOARDS, items);
  },

  getSettings(): AppSettings {
    const saved = loadFromStorage<AppSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    return {
      ...INITIAL_SETTINGS,
      ...saved,
      tempUnit: saved.tempUnit || 'C',
      timeFormat: saved.timeFormat || '24h',
      dateFormat: saved.dateFormat || 'dd/mm/yyyy',
      theme: saved.theme || 'system',
    };
  },
  saveSettings(settings: AppSettings): void {
    saveToStorage(STORAGE_KEYS.SETTINGS, settings);
  },

  getNotifications(): AlertNotification[] {
    return loadFromStorage<AlertNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  },
  saveNotifications(notifs: AlertNotification[]): void {
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifs);
  },

  resetAll(): void {
    saveToStorage(STORAGE_KEYS.GEAR, INITIAL_GEAR);
    saveToStorage(STORAGE_KEYS.SHOOTS, INITIAL_SHOOTS);
    saveToStorage(STORAGE_KEYS.PACKING, INITIAL_PACKING);
    saveToStorage(STORAGE_KEYS.MOODBOARDS, INITIAL_MOODBOARDS);
    saveToStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, []);
  },

  clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.GEAR);
      localStorage.removeItem(STORAGE_KEYS.SHOOTS);
      localStorage.removeItem(STORAGE_KEYS.PACKING);
      localStorage.removeItem(STORAGE_KEYS.MOODBOARDS);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    } catch {
      // ignore
    }
  },
};

// Subtle Web Audio Sound generator for notifications
export function playAlertChime(type: 'shutter' | 'critical' | 'success' | 'morning' = 'shutter'): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (type === 'shutter') {
      // Crisp mechanical click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } else if (type === 'critical') {
      // Dual high tone alert
      const now = ctx.currentTime;
      [0, 0.12].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now + offset);
        gain.gain.setValueAtTime(0.2, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.09);
      });
    } else {
      // Soft pleasant chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // Ignore audio permission or context issues
  }
}
