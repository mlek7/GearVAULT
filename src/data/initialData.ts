import { GearItem, Shoot, PackingItem, MoodboardItem, AppSettings } from '../types';

// Seed IDs to identify and clean up demo/sample data from existing browser sessions (Requirement 4)
export const SEED_GEAR_IDS = new Set([
  'gear-1',
  'gear-2',
  'gear-3',
  'gear-4',
  'gear-5',
  'gear-6',
  'gear-7',
  'gear-8',
  'gear-9',
  'gear-10',
  'gear-11',
  'gear-12',
  'gear-13',
]);

export const SEED_SHOOT_IDS = new Set([
  'shoot-1',
  'shoot-2',
  'shoot-3',
  'shoot-4',
  'shoot-5',
]);

export const SEED_PACKING_IDS = new Set([
  'pack-1-1', 'pack-1-2', 'pack-1-3', 'pack-1-4', 'pack-1-5', 'pack-1-6', 'pack-1-7', 'pack-1-8',
  'pack-2-1', 'pack-2-2', 'pack-2-3', 'pack-2-4', 'pack-2-5', 'pack-2-6', 'pack-2-7',
  'pack-3-1', 'pack-3-2', 'pack-3-3',
]);

export const SEED_MOODBOARD_IDS = new Set([
  'mb-1-1',
  'mb-1-2',
  'mb-1-3',
  'mb-1-4',
  'mb-2-1',
  'mb-2-2',
]);

// All initial data starts empty for fresh accounts (Requirement 4)
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
