export type GearCategory =
  | 'Camera Body'
  | 'Lens'
  | 'Lighting'
  | 'Audio'
  | 'Batteries/Memory Cards'
  | 'Accessories';

export const GEAR_CATEGORIES: GearCategory[] = [
  'Camera Body',
  'Lens',
  'Lighting',
  'Audio',
  'Batteries/Memory Cards',
  'Accessories',
];

export interface GearExifMetadata {
  cameraMake?: string;
  cameraModel?: string;
  lensModel?: string;
  lensSerialNumber?: string;
  bodySerialNumber?: string;
  shutterCount?: number;
  firmwareVersion?: string;
  focalLength?: string;
  maxAperture?: string;
  iso?: number;
  shutterSpeed?: string;
  verifiedAt?: string;
  rawTags?: Record<string, any>;
}

export interface GearItem {
  id: string;
  name: string;
  category: GearCategory;
  serialNumber: string;
  image: string;
  notes: string;
  brand?: string;
  createdAt: string;
  exifMetadata?: GearExifMetadata;
}

export type ShootType =
  | 'Wedding'
  | 'Portrait'
  | 'Commercial'
  | 'Fashion'
  | 'Event'
  | 'Editorial'
  | 'Landscape';

export const SHOOT_TYPES: ShootType[] = [
  'Wedding',
  'Portrait',
  'Commercial',
  'Fashion',
  'Event',
  'Editorial',
  'Landscape',
];

export interface Shoot {
  id: string;
  title: string;
  clientName: string;
  dateTime: string; // ISO format: YYYY-MM-DDTHH:mm
  location: string;
  shootType: ShootType | string;
  generalNotes: string;
  createdAt: string;
}

export type PackingStatus = 'Needed' | 'Packed' | 'Missing';

export interface PackingItem {
  id: string;
  shootId: string;
  gearId: string;
  status: PackingStatus;
  customNotes?: string;
}

export interface MoodboardItem {
  id: string;
  shootId: string;
  imageUrl: string;
  caption: string;
  externalLink?: string;
  colorPalette?: string[];
  category?: 'Posing' | 'Lighting' | 'Styling' | 'Color/Grade' | 'Location';
  createdAt: string;
}

export interface AlertNotification {
  id: string;
  shootId: string;
  shootTitle: string;
  type: 'morning_review' | 'two_hour_critical' | 'custom_check';
  title: string;
  message: string;
  timestamp: string;
  missingItems?: string[];
  read: boolean;
  priority: 'normal' | 'high' | 'critical';
}

export type AuthProvider = 'google' | 'apple' | 'email';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: AuthProvider;
  role?: string;
  studioName?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AppSettings {
  morningAlertTime: string; // e.g. "06:00"
  enableMorningAlerts: boolean;
  enableTwoHourCriticalAlert: boolean;
  photographerName: string;
  studioName: string;
  soundEnabled: boolean;
}

export type NavigationTab = 'dashboard' | 'calendar' | 'weather' | 'gear_vault' | 'settings';

export type WeatherConditionCode = 'sunny' | 'partly-cloudy' | 'cloudy' | 'rain' | 'windy' | 'fog';

export interface WeatherHourlyItem {
  time: string;
  tempF: number;
  conditionCode: WeatherConditionCode;
  conditionText: string;
  isGoldenHour?: boolean;
  isBlueHour?: boolean;
  rainProb: number;
  lightType: string;
}

export interface WeatherDailyItem {
  dayName: string;
  dateStr: string;
  tempHighF: number;
  tempLowF: number;
  conditionCode: WeatherConditionCode;
  conditionText: string;
  goldenHour: string;
  rainProb: number;
}

export interface WeatherForecastData {
  locationName: string;
  shootDate?: string;
  temperatureF: number;
  temperatureC: number;
  conditionText: string;
  conditionCode: WeatherConditionCode;
  precipitationProb: number;
  windSpeedMph: number;
  windGustMph: number;
  humidity: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
  goldenHourMorning: string;
  goldenHourEvening: string;
  blueHourEvening: string;
  lightingQuality: 'Peak Golden Hour' | 'Soft Diffused' | 'Direct Harsh Sun' | 'Moody Overcast' | 'Blue Hour Drama';
  gearRecommendations: string[];
  hourly: WeatherHourlyItem[];
  daily: WeatherDailyItem[];
}
