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
} from '../data/initialData';

const STORAGE_KEYS = {
  GEAR: 'shutterhub_gear',
  SHOOTS: 'shutterhub_shoots',
  PACKING: 'shutterhub_packing',
  MOODBOARDS: 'shutterhub_moodboards',
  SETTINGS: 'shutterhub_settings',
  NOTIFICATIONS: 'shutterhub_notifications',
};

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
    return loadFromStorage<AppSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
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
};

// Subtle Web Audio Sound generator for notifications
export function playAlertChime(type: 'shutter' | 'critical' | 'success' = 'shutter'): void {
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
