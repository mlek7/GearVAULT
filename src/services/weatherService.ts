import { WeatherForecastData, WeatherConditionCode, WeatherHourlyItem, WeatherDailyItem } from '../types';
import { resolveLocationGeoAsync, computeSunTimes } from '../utils/sunUtils';

export interface PhotographyWeatherResult extends WeatherForecastData {
  isBeyondForecast?: boolean;
  forecastNotice?: string;
  goldenHourRange: string;
  goldenHourLabel: string;
  sunsetLabel: string;
  sunsetString: string;
  blueHourEvening: string;
  blueHourLabel: string;
  goldenHourMorning: string;
  blueHourMorning: string;
  timezone?: string;
  cloudCover?: number;
  notice?: string;
  sunsetTime?: string;
  sunriseTime?: string;
  dawnTime?: string;
  lightQualityScore?: string;
}

export function generatePhotographyGearTips(
  conditionCode: WeatherConditionCode,
  rainProb: number,
  windSpeed: number,
  tempF: number,
  uvIndex: number
): string[] {
  const tips: string[] = [];

  if (rainProb > 25 || conditionCode === 'rain') {
    tips.push('Moisture alert: pack camera rain covers, waterproof lens sleeves & silica gel packs.');
    tips.push('Bring extra microfiber cloths to wipe front elements between takes.');
  }

  if (windSpeed >= 13) {
    tips.push(`High winds (${windSpeed} mph): secure light stands & C-stands with heavy shot bags.`);
    tips.push('Consider smaller parabolic softboxes over large shoot-through umbrellas.');
  }

  if (uvIndex >= 6 || (conditionCode === 'sunny' && tempF >= 70)) {
    tips.push('Direct sun: pack circular polarizing filters (CPL) and 3-stop to 6-stop ND filters.');
    tips.push('Bring a 5-in-1 reflector with translucent diffusion scrim to soften harsh facial shadows.');
  }

  if (tempF < 45) {
    tips.push('Low temperature: lithium camera batteries deplete 40% faster in cold. Keep spares in inner pockets.');
  }

  if (conditionCode === 'fog') {
    tips.push('Mist & fog: cinematic atmospheric depth. Clean front elements regularly for contrast.');
  }

  if (conditionCode === 'partly-cloudy' || conditionCode === 'cloudy') {
    tips.push('Giant diffuser: high cloud cover creates soft, even skin wrap.');
  }

  if (tips.length === 0) {
    tips.push('Prime shooting conditions: clear ambient light with balanced contrast.');
    tips.push('Pack standard prime 85mm / 50mm lenses for maximum background separation.');
  }

  return tips;
}

/**
 * Fetch photography weather and compute real sun position for a shoot location and date
 * in the location's local timezone (using Open-Meteo timezone=auto and utc_offset_seconds).
 */
export async function getPhotographyWeather(
  rawLocation: string,
  targetDateStr?: string,
  is24h: boolean = true
): Promise<PhotographyWeatherResult> {
  const locationClean = rawLocation?.trim() || 'San Francisco, CA';
  const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
  const validDate = isNaN(targetDate.getTime()) ? new Date() : targetDate;

  // Resolve coordinates & timezone
  const geo = await resolveLocationGeoAsync(locationClean);

  // Calculate day difference from now
  const now = new Date();
  const diffDays = Math.ceil((validDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isBeyondForecast = diffDays > 14;

  // Compute real SunCalc in the location's local timezone
  const initialSun = computeSunTimes(validDate, locationClean, is24h, geo.timezone);

  const baseResult: PhotographyWeatherResult = {
    locationName: locationClean,
    shootDate: targetDateStr,
    temperatureF: 68,
    temperatureC: 20,
    conditionText: isBeyondForecast ? 'Forecast available closer to date' : 'Clear & Golden Sunlight',
    conditionCode: 'sunny',
    precipitationProb: 0,
    windSpeedMph: 6,
    windGustMph: 9,
    humidity: 52,
    uvIndex: 4,
    sunrise: initialSun.sunriseTime,
    sunset: initialSun.sunsetTime,
    goldenHourMorning: initialSun.goldenHourMorning,
    goldenHourEvening: initialSun.goldenHourRange,
    blueHourEvening: initialSun.blueHourEvening,
    lightingQuality: 'Peak Golden Hour',
    gearRecommendations: [
      'Golden hour glow: prepare 85mm f/1.4 prime lens for backlight flares.',
      'Pack collapsible reflector for soft fill illumination.',
    ],
    hourly: [],
    daily: [],
    isBeyondForecast,
    forecastNotice: isBeyondForecast ? 'Forecast available closer to date' : undefined,
    goldenHourRange: initialSun.goldenHourRange,
    goldenHourLabel: initialSun.goldenHourLabel,
    sunsetLabel: initialSun.sunsetLabel,
    sunsetString: initialSun.sunsetTime,
    blueHourLabel: initialSun.blueHourLabel,
    blueHourMorning: initialSun.blueHourMorning,
    timezone: initialSun.timezone,
    cloudCover: 15,
    notice: isBeyondForecast ? 'Forecast available closer to date' : undefined,
    sunsetTime: initialSun.sunsetTime,
    sunriseTime: initialSun.sunriseTime,
    dawnTime: initialSun.dawnTime,
    lightQualityScore: 'Peak Golden Hour',
  };

  if (isBeyondForecast) {
    return baseResult;
  }

  // Fetch real Open-Meteo forecast (no API key required)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}&current=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,wind_gusts_10m,cloud_cover&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`;

    const weatherRes = await fetch(weatherUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!weatherRes.ok) {
      return baseResult;
    }

    const wData = await weatherRes.json();
    const current = wData.current || {};
    const daily = wData.daily || {};
    const resolvedTz = wData.timezone || geo.timezone || 'America/Los_Angeles';
    const utcOffsetSeconds = typeof wData.utc_offset_seconds === 'number' ? wData.utc_offset_seconds : undefined;

    // Recompute sun times with resolved timezone and exact utc_offset_seconds from Open-Meteo
    const refinedSun = computeSunTimes(validDate, locationClean, is24h, resolvedTz, utcOffsetSeconds);

    // Determine target day index in daily.time (e.g. "2026-10-05")
    const targetDateIsoStr = validDate.toISOString().slice(0, 10);
    const dailyTimes: string[] = daily.time || [];
    let dayIndex = dailyTimes.findIndex((t) => t === targetDateIsoStr);
    if (dayIndex === -1 && diffDays <= 0) {
      dayIndex = 0;
    }

    // Determine temperature from live forecast (not hardcoded!)
    let tempF: number;
    let condCode: WeatherConditionCode = 'sunny';
    let condText = 'Clear & Crisp Sunlight';
    let rainProb = 0;
    let windSpeed = 6;
    let windGust = 9;
    let humidity = 50;
    let uv = 4;

    if (dayIndex === 0 || diffDays <= 0) {
      // Current day live readings
      tempF = Math.round(current.temperature_2m ?? daily.temperature_2m_max?.[0] ?? 68);
      const wCode = current.weather_code ?? daily.weather_code?.[0] ?? 0;
      rainProb = Math.round(current.precipitation_probability ?? daily.precipitation_probability_max?.[0] ?? 0);
      windSpeed = Math.round(current.wind_speed_10m ?? 6);
      windGust = Math.round(current.wind_gusts_10m ?? windSpeed + 3);
      humidity = Math.round(current.relative_humidity_2m ?? 50);
      uv = Math.round(daily.uv_index_max?.[0] ?? 4);

      if (wCode === 0 || wCode === 1) {
        condCode = 'sunny';
        condText = 'Bright & Crisp Sunlight';
      } else if (wCode === 2) {
        condCode = 'partly-cloudy';
        condText = 'Partly Cloudy (Soft Ambient Light)';
      } else if (wCode === 3) {
        condCode = 'cloudy';
        condText = 'Overcast (Natural Softbox)';
      } else if (wCode >= 45 && wCode <= 48) {
        condCode = 'fog';
        condText = 'Atmospheric Mist & Fog';
      } else if (wCode >= 51) {
        condCode = 'rain';
        condText = 'Light Rain / Showers';
      }
    } else if (dayIndex > 0 && dayIndex < dailyTimes.length) {
      // Target shoot day in forecast window
      tempF = Math.round(daily.temperature_2m_max[dayIndex] ?? 70);
      const wCode = daily.weather_code[dayIndex] ?? 0;
      rainProb = Math.round(daily.precipitation_probability_max?.[dayIndex] ?? 0);
      uv = Math.round(daily.uv_index_max?.[dayIndex] ?? 4);

      if (wCode === 0 || wCode === 1) {
        condCode = 'sunny';
        condText = 'Clear Sunlight';
      } else if (wCode === 2) {
        condCode = 'partly-cloudy';
        condText = 'Partly Cloudy (Soft Fill)';
      } else if (wCode === 3) {
        condCode = 'cloudy';
        condText = 'Overcast Light';
      } else if (wCode >= 45 && wCode <= 48) {
        condCode = 'fog';
        condText = 'Mist & Fog';
      } else if (wCode >= 51) {
        condCode = 'rain';
        condText = 'Showers Expected';
      }
    } else {
      tempF = Math.round(current.temperature_2m ?? 68);
    }

    const tempC = Math.round(((tempF - 32) * 5) / 9);

    let lightingQuality: WeatherForecastData['lightingQuality'] = 'Peak Golden Hour';
    if (condCode === 'cloudy') lightingQuality = 'Soft Diffused';
    else if (condCode === 'rain') lightingQuality = 'Moody Overcast';
    else if (uv >= 7) lightingQuality = 'Direct Harsh Sun';

    const gearTips = generatePhotographyGearTips(condCode, rainProb, windSpeed, tempF, uv);

    // Build 5-day daily forecast from real Open-Meteo data
    const dailyItems: WeatherDailyItem[] = (daily.time || []).slice(0, 5).map((dStr: string, idx: number) => {
      const dObj = new Date(dStr);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : dayNames[dObj.getDay()] || 'Day';
      const hTemp = Math.round(daily.temperature_2m_max?.[idx] ?? 70);
      const lTemp = Math.round(daily.temperature_2m_min?.[idx] ?? 52);
      const dRain = Math.round(daily.precipitation_probability_max?.[idx] ?? 0);
      const dayCode = daily.weather_code?.[idx] ?? 0;

      let dCondCode: WeatherConditionCode = 'sunny';
      let dCondText = 'Golden Light';
      if (dayCode >= 51) {
        dCondCode = 'rain';
        dCondText = 'Rain Showers';
      } else if (dayCode === 3) {
        dCondCode = 'cloudy';
        dCondText = 'Overcast Light';
      } else if (dayCode === 2) {
        dCondCode = 'partly-cloudy';
        dCondText = 'Soft Clouds';
      }

      const daySun = computeSunTimes(dObj, locationClean, is24h, resolvedTz, utcOffsetSeconds);

      return {
        dayName,
        dateStr: dStr,
        tempHighF: hTemp,
        tempLowF: lTemp,
        conditionCode: dCondCode,
        conditionText: dCondText,
        goldenHour: daySun.goldenHourRange,
        rainProb: dRain,
      };
    });

    return {
      ...baseResult,
      temperatureF: tempF,
      temperatureC: tempC,
      conditionText: condText,
      conditionCode: condCode,
      precipitationProb: rainProb,
      windSpeedMph: windSpeed,
      windGustMph: windGust,
      humidity,
      uvIndex: uv,
      sunrise: refinedSun.sunriseTime,
      sunset: refinedSun.sunsetTime,
      goldenHourMorning: refinedSun.goldenHourMorning,
      goldenHourEvening: refinedSun.goldenHourRange,
      blueHourEvening: refinedSun.blueHourEvening,
      lightingQuality,
      gearRecommendations: gearTips,
      daily: dailyItems,
      isBeyondForecast: false,
      goldenHourRange: refinedSun.goldenHourRange,
      goldenHourLabel: refinedSun.goldenHourLabel,
      sunsetLabel: refinedSun.sunsetLabel,
      sunsetString: refinedSun.sunsetTime,
      sunsetTime: refinedSun.sunsetTime,
      sunriseTime: refinedSun.sunriseTime,
      dawnTime: refinedSun.dawnTime,
      cloudCover: typeof current.cloud_cover === 'number' ? Math.round(current.cloud_cover) : (condCode === 'cloudy' ? 85 : condCode === 'partly-cloudy' ? 45 : 15),
      notice: undefined,
      lightQualityScore: lightingQuality,
      blueHourLabel: refinedSun.blueHourLabel,
      blueHourMorning: refinedSun.blueHourMorning,
      timezone: resolvedTz,
    };
  } catch (err) {
    console.warn('Weather fetch fallback:', err);
    return baseResult;
  }
}
