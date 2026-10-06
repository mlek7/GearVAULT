import { GearItem, Shoot, PackingItem, MoodboardItem, AppSettings } from '../types';
export {
  SEED_GEAR_IDS,
  SEED_SHOOT_IDS,
  SEED_PACKING_IDS,
  SEED_MOODBOARD_IDS,
  SEED_SERIAL_NUMBERS,
  DEMO_GEAR_NAMES,
  DEMO_SHOOT_TITLES,
  isDemoGear,
  isDemoShoot,
  isDemoPacking,
  isDemoMoodboard,
  isDemoNotification,
  sanitizeGearList,
  sanitizeShootsList,
  sanitizePackingList,
  sanitizeMoodboardsList,
  sanitizeNotificationsList,
  sanitizeSettings,
} from '../utils/demoCleanup';

// Fresh initial data starts completely empty (0 items)
export const INITIAL_GEAR: GearItem[] = [];

export const INITIAL_SHOOTS: Shoot[] = [];

export const INITIAL_PACKING: PackingItem[] = [];

export const INITIAL_MOODBOARDS: MoodboardItem[] = [];

export const INITIAL_SETTINGS: AppSettings = {
  theme: 'system',
  tempUnit: 'C',
  timeFormat: '24h',
  dateFormat: 'dd/mm/yyyy',
  morningAlertTime: '06:00',
  enableMorningAlerts: true,
  enableTwoHourCriticalAlert: true,
  photographerName: '',
  studioName: '',
  soundEnabled: true,
  selectedCity: '',
};
