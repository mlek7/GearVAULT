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
  sanitizeGearList,
  sanitizeShootsList,
  sanitizePackingList,
  sanitizeMoodboardsList,
  sanitizeNotificationsList,
  sanitizeSettings,
} from '../data/initialData';

const STORAGE_KEYS = {
  GEAR: 'shutterhub_gear',
  SHOOTS: 'shutterhub_shoots',
  PACKING: 'shutterhub_packing',
  MOODBOARDS: 'shutterhub_moodboards',
  SETTINGS: 'shutterhub_settings',
  NOTIFICATIONS: 'shutterhub_notifications',
  AUTH_USER: 'shutterhub_auth_user',
  CLEANUP_DONE: 'lightbag_permanent_seed_cleanup_v3',
};

// Complete cleanup that removes demo/seed data matching seed IDs or model names permanently
export function runSeedDataCleanup(): void {
  try {
    // Clean gear: remove all demo items, preserve user items like fujifil and X-T3
    const rawGear = localStorage.getItem(STORAGE_KEYS.GEAR);
    if (rawGear) {
      const parsed = JSON.parse(rawGear) as GearItem[];
      const cleaned = sanitizeGearList(parsed);
      localStorage.setItem(STORAGE_KEYS.GEAR, JSON.stringify(cleaned));
    }

    // Clean shoots: remove demo shoots
    const rawShoots = localStorage.getItem(STORAGE_KEYS.SHOOTS);
    if (rawShoots) {
      const parsed = JSON.parse(rawShoots) as Shoot[];
      const cleaned = sanitizeShootsList(parsed);
      localStorage.setItem(STORAGE_KEYS.SHOOTS, JSON.stringify(cleaned));
    }

    // Clean packing: filter out seed gear or seed shoots
    const rawPacking = localStorage.getItem(STORAGE_KEYS.PACKING);
    if (rawPacking) {
      const parsed = JSON.parse(rawPacking) as PackingItem[];
      const cleaned = sanitizePackingList(parsed);
      localStorage.setItem(STORAGE_KEYS.PACKING, JSON.stringify(cleaned));
    }

    // Clean moodboards: filter out seed moodboard items
    const rawMb = localStorage.getItem(STORAGE_KEYS.MOODBOARDS);
    if (rawMb) {
      const parsed = JSON.parse(rawMb) as MoodboardItem[];
      const cleaned = sanitizeMoodboardsList(parsed);
      localStorage.setItem(STORAGE_KEYS.MOODBOARDS, JSON.stringify(cleaned));
    }

    // Clean notifications: filter out demo notifications
    const rawNotifs = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (rawNotifs) {
      const parsed = JSON.parse(rawNotifs) as AlertNotification[];
      const cleaned = sanitizeNotificationsList(parsed);
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(cleaned));
    }

    // Clean settings: reset demo studio name or photographer name
    const rawSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (rawSettings) {
      const parsed = JSON.parse(rawSettings) as AppSettings;
      const cleaned = sanitizeSettings(parsed);
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(cleaned));
    }

    localStorage.setItem(STORAGE_KEYS.CLEANUP_DONE, 'true');
  } catch (err) {
    console.warn('Seed cleanup info:', err);
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

// Storage API - always enforces demo sanitization
export const StorageService = {
  getGear(): GearItem[] {
    const loaded = loadFromStorage<GearItem[]>(STORAGE_KEYS.GEAR, INITIAL_GEAR);
    return sanitizeGearList(loaded);
  },
  saveGear(items: GearItem[]): void {
    const cleaned = sanitizeGearList(items);
    saveToStorage(STORAGE_KEYS.GEAR, cleaned);
  },

  getShoots(): Shoot[] {
    const loaded = loadFromStorage<Shoot[]>(STORAGE_KEYS.SHOOTS, INITIAL_SHOOTS);
    return sanitizeShootsList(loaded);
  },
  saveShoots(shoots: Shoot[]): void {
    const cleaned = sanitizeShootsList(shoots);
    saveToStorage(STORAGE_KEYS.SHOOTS, cleaned);
  },

  getPacking(): PackingItem[] {
    const loaded = loadFromStorage<PackingItem[]>(STORAGE_KEYS.PACKING, INITIAL_PACKING);
    return sanitizePackingList(loaded);
  },
  savePacking(items: PackingItem[]): void {
    const cleaned = sanitizePackingList(items);
    saveToStorage(STORAGE_KEYS.PACKING, cleaned);
  },

  getMoodboards(): MoodboardItem[] {
    const loaded = loadFromStorage<MoodboardItem[]>(STORAGE_KEYS.MOODBOARDS, INITIAL_MOODBOARDS);
    return sanitizeMoodboardsList(loaded);
  },
  saveMoodboards(items: MoodboardItem[]): void {
    const cleaned = sanitizeMoodboardsList(items);
    saveToStorage(STORAGE_KEYS.MOODBOARDS, cleaned);
  },

  getSettings(): AppSettings {
    const saved = loadFromStorage<AppSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    const cleaned = sanitizeSettings(saved);
    return {
      ...INITIAL_SETTINGS,
      ...cleaned,
      tempUnit: cleaned.tempUnit || 'C',
      timeFormat: cleaned.timeFormat || '24h',
      dateFormat: cleaned.dateFormat || 'dd/mm/yyyy',
      theme: cleaned.theme || 'system',
    };
  },
  saveSettings(settings: AppSettings): void {
    const cleaned = sanitizeSettings(settings);
    saveToStorage(STORAGE_KEYS.SETTINGS, cleaned);
  },

  getNotifications(): AlertNotification[] {
    const loaded = loadFromStorage<AlertNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    return sanitizeNotificationsList(loaded);
  },
  saveNotifications(notifs: AlertNotification[]): void {
    const cleaned = sanitizeNotificationsList(notifs);
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, cleaned);
  },

  resetAll(): void {
    saveToStorage(STORAGE_KEYS.GEAR, []);
    saveToStorage(STORAGE_KEYS.SHOOTS, []);
    saveToStorage(STORAGE_KEYS.PACKING, []);
    saveToStorage(STORAGE_KEYS.MOODBOARDS, []);
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
