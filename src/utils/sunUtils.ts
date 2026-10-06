import { getTimes } from 'suncalc';

export interface LocationGeoInfo {
  lat: number;
  lon: number;
  timezone: string;
  utcOffsetSeconds?: number;
}

// Coordinates & Timezone cache
const LOCATION_GEO_CACHE = new Map<string, LocationGeoInfo>();

// Presets for popular photoshoot locations with their real IANA timezones
const PRESET_LOCATIONS: Record<string, LocationGeoInfo> = {
  'san francisco': { lat: 37.7749, lon: -122.4194, timezone: 'America/Los_Angeles' },
  'presidio': { lat: 37.7989, lon: -122.4662, timezone: 'America/Los_Angeles' },
  'point bonita': { lat: 37.8156, lon: -122.5295, timezone: 'America/Los_Angeles' },
  'bonita': { lat: 37.8156, lon: -122.5295, timezone: 'America/Los_Angeles' },
  'napa': { lat: 38.5053, lon: -122.4682, timezone: 'America/Los_Angeles' },
  'meadowood': { lat: 38.5053, lon: -122.4682, timezone: 'America/Los_Angeles' },
  'st. helena': { lat: 38.5053, lon: -122.4682, timezone: 'America/Los_Angeles' },
  'oakland': { lat: 37.7214, lon: -122.2208, timezone: 'America/Los_Angeles' },
  'airport': { lat: 37.7214, lon: -122.2208, timezone: 'America/Los_Angeles' },
  'hangar': { lat: 37.7214, lon: -122.2208, timezone: 'America/Los_Angeles' },
  'dogpatch': { lat: 37.7587, lon: -122.3881, timezone: 'America/Los_Angeles' },
  'studio 4': { lat: 37.7749, lon: -122.4194, timezone: 'America/Los_Angeles' },
  'los angeles': { lat: 34.0522, lon: -118.2437, timezone: 'America/Los_Angeles' },
  'venice beach': { lat: 33.985, lon: -118.4695, timezone: 'America/Los_Angeles' },
  'joshua tree': { lat: 34.1347, lon: -116.3131, timezone: 'America/Los_Angeles' },
  'new york': { lat: 40.7128, lon: -74.006, timezone: 'America/New_York' },
  'central park': { lat: 40.7851, lon: -73.9683, timezone: 'America/New_York' },
  'chicago': { lat: 41.8781, lon: -87.6298, timezone: 'America/Chicago' },
  'seattle': { lat: 47.6062, lon: -122.3321, timezone: 'America/Los_Angeles' },
  'london': { lat: 51.5074, lon: -0.1278, timezone: 'Europe/London' },
  'paris': { lat: 48.8566, lon: 2.3522, timezone: 'Europe/Paris' },
  'tokyo': { lat: 35.6762, lon: 139.6503, timezone: 'Asia/Tokyo' },
};

export function resolveLocationGeoSync(location: string): LocationGeoInfo {
  const clean = (location || '').toLowerCase().trim();
  if (LOCATION_GEO_CACHE.has(clean)) {
    return LOCATION_GEO_CACHE.get(clean)!;
  }
  for (const [key, geo] of Object.entries(PRESET_LOCATIONS)) {
    if (clean.includes(key)) {
      LOCATION_GEO_CACHE.set(clean, geo);
      return geo;
    }
  }
  // Default to San Francisco
  const fallback: LocationGeoInfo = { lat: 37.7749, lon: -122.4194, timezone: 'America/Los_Angeles' };
  LOCATION_GEO_CACHE.set(clean, fallback);
  return fallback;
}

export async function resolveLocationGeoAsync(location: string): Promise<LocationGeoInfo> {
  const clean = (location || '').trim();
  const lower = clean.toLowerCase();
  if (LOCATION_GEO_CACHE.has(lower) && LOCATION_GEO_CACHE.get(lower)?.timezone !== 'America/Los_Angeles') {
    return LOCATION_GEO_CACHE.get(lower)!;
  }

  for (const [key, geo] of Object.entries(PRESET_LOCATIONS)) {
    if (lower.includes(key)) {
      LOCATION_GEO_CACHE.set(lower, geo);
      return geo;
    }
  }

  try {
    const searchName = clean.split(',')[0].trim();
    if (searchName.length > 2) {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          searchName
        )}&count=1&language=en&format=json`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const item = data.results[0];
          const geo: LocationGeoInfo = {
            lat: item.latitude,
            lon: item.longitude,
            timezone: item.timezone || 'America/Los_Angeles',
          };
          LOCATION_GEO_CACHE.set(lower, geo);
          return geo;
        }
      }
    }
  } catch {
    // Fall back to sync
  }

  return resolveLocationGeoSync(location);
}

/**
 * Get timezone offset in minutes for a given date in an IANA timezone.
 */
function getTimezoneOffsetMinutes(date: Date, timeZone: string): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
    }).formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value;
    if (tzPart) {
      if (tzPart === 'GMT' || tzPart === 'UTC') return 0;
      const match = tzPart.match(/GMT([+-])(\d+)(?::(\d+))?/);
      if (match) {
        const sign = match[1] === '+' ? 1 : -1;
        const hours = parseInt(match[2], 10);
        const mins = match[3] ? parseInt(match[3], 10) : 0;
        return sign * (hours * 60 + mins);
      }
    }
  } catch {
    // ignore
  }
  return 0;
}

/**
 * Format a Date in the target location's IANA timezone and user's 12h/24h setting.
 */
export function formatTimeInLocationTimezone(
  date: Date | null | undefined,
  timeZone: string = 'America/Los_Angeles',
  is24h: boolean = true
): string {
  if (!date || isNaN(date.getTime())) return '--:--';
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || 'America/Los_Angeles',
      hour: is24h ? '2-digit' : 'numeric',
      minute: '2-digit',
      hour12: !is24h,
      hourCycle: is24h ? 'h23' : 'h12',
    });
    return formatter.format(date);
  } catch {
    return date.toLocaleTimeString('en-US', {
      hour: is24h ? '2-digit' : 'numeric',
      minute: '2-digit',
      hour12: !is24h,
    });
  }
}

export interface ShootSunDetails {
  goldenHourRange: string;      // e.g. "18:11–18:46" (Evening golden hour ending at sunset)
  goldenHourLabel: string;      // "Golden hour: 18:11–18:46"
  sunsetLabel: string;          // "Sunset: 18:46"
  sunsetTime: string;           // "18:46"
  blueHourEvening: string;      // "18:46–19:12" (Evening blue hour from sunset to dusk)
  blueHourLabel: string;        // "Blue hour: 18:46–19:12"
  goldenHourMorning: string;    // "07:09–07:43" (Morning golden hour sunrise to goldenHourEnd)
  blueHourMorning: string;      // "06:42–07:09" (Morning blue hour dawn to sunrise)
  sunriseTime: string;          // "07:09"
  dawnTime: string;             // "06:42"
  timezone: string;
}

/**
 * Compute real Sunset, Golden Hour, and Blue Hour in the shoot location's local timezone.
 * Evening golden hour starts at suncalc.goldenHour and ends at sunset.
 * Evening blue hour starts at sunset and ends at dusk.
 */
export function computeSunTimes(
  dateInput: string | Date,
  location: string,
  is24h: boolean = true,
  providedTimezone?: string,
  providedUtcOffsetSeconds?: number
): ShootSunDetails {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const validDate = isNaN(d?.getTime()) ? new Date() : d;
  const geo = resolveLocationGeoSync(location);
  const tz = providedTimezone || geo.timezone || 'America/Los_Angeles';

  try {
    const offsetMin = providedUtcOffsetSeconds !== undefined
      ? Math.round(providedUtcOffsetSeconds / 60)
      : getTimezoneOffsetMinutes(validDate, tz);

    // Calculate local solar noon UTC for the target calendar date at that location
    const year = validDate.getFullYear();
    const month = validDate.getMonth();
    const day = validDate.getDate();
    const localNoonUtc = new Date(Date.UTC(year, month, day, 12, 0, 0) - offsetMin * 60 * 1000);

    const times = getTimes(localNoonUtc, geo.lat, geo.lon);

    const sunrise = times.sunrise;
    const sunset = times.sunset;
    const goldenHourEveningStart = times.goldenHour;
    const goldenHourMorningEnd = times.goldenHourEnd;
    const dawn = times.dawn;
    const dusk = times.dusk;

    // Evening Golden Hour: Starts at goldenHourEveningStart, ends at sunset
    const formattedSunset = formatTimeInLocationTimezone(sunset, tz, is24h);
    const formattedGHEveStart = formatTimeInLocationTimezone(goldenHourEveningStart, tz, is24h);
    const goldenHourRange = `${formattedGHEveStart}–${formattedSunset}`;

    // Evening Blue Hour: Starts at sunset, ends at dusk
    const formattedDusk = formatTimeInLocationTimezone(dusk, tz, is24h);
    const blueHourEvening = `${formattedSunset}–${formattedDusk}`;

    // Morning Golden Hour: Starts at sunrise, ends at goldenHourMorningEnd
    const formattedSunrise = formatTimeInLocationTimezone(sunrise, tz, is24h);
    const formattedGHMornEnd = formatTimeInLocationTimezone(goldenHourMorningEnd, tz, is24h);
    const goldenHourMorning = `${formattedSunrise}–${formattedGHMornEnd}`;

    // Morning Blue Hour: Starts at dawn, ends at sunrise
    const formattedDawn = formatTimeInLocationTimezone(dawn, tz, is24h);
    const blueHourMorning = `${formattedDawn}–${formattedSunrise}`;

    return {
      goldenHourRange,
      goldenHourLabel: `Golden hour: ${goldenHourRange}`,
      sunsetLabel: `Sunset: ${formattedSunset}`,
      sunsetTime: formattedSunset,
      blueHourEvening,
      blueHourLabel: `Blue hour: ${blueHourEvening}`,
      goldenHourMorning,
      blueHourMorning,
      sunriseTime: formattedSunrise,
      dawnTime: formattedDawn,
      timezone: tz,
    };
  } catch (err) {
    console.warn('SunCalc computation fallback:', err);
    return {
      goldenHourRange: is24h ? '18:11–18:46' : '6:11 PM–6:46 PM',
      goldenHourLabel: is24h ? 'Golden hour: 18:11–18:46' : 'Golden hour: 6:11 PM–6:46 PM',
      sunsetLabel: is24h ? 'Sunset: 18:46' : 'Sunset: 6:46 PM',
      sunsetTime: is24h ? '18:46' : '6:46 PM',
      blueHourEvening: is24h ? '18:46–19:12' : '6:46 PM–7:12 PM',
      blueHourLabel: is24h ? 'Blue hour: 18:46–19:12' : 'Blue hour: 6:46 PM–7:12 PM',
      goldenHourMorning: is24h ? '07:09–07:43' : '7:09 AM–7:43 AM',
      blueHourMorning: is24h ? '06:42–07:09' : '6:42 AM–7:09 AM',
      sunriseTime: is24h ? '07:09' : '7:09 AM',
      dawnTime: is24h ? '06:42' : '6:42 AM',
      timezone: tz,
    };
  }
}
