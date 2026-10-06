import React, { useState, useEffect } from 'react';
import {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  Wind,
  Droplets,
  Sunrise,
  Sunset,
  Sparkles,
  MapPin,
  Calendar,
  RefreshCw,
  Moon,
  Locate,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Shoot, AppSettings, TempUnit, WeatherConditionCode } from '../../types';
import { getPhotographyWeather, PhotographyWeatherResult } from '../../services/weatherService';

interface WeatherForecastViewProps {
  shoots: Shoot[];
  settings?: AppSettings;
  onUpdateSettings?: (settings: Partial<AppSettings>) => void;
}

export const WeatherForecastView: React.FC<WeatherForecastViewProps> = ({
  shoots,
  settings,
  onUpdateSettings,
}) => {
  const is24h = settings?.timeFormat !== '12h';
  const defaultUnit: TempUnit = settings?.tempUnit || 'C';

  // Persistent location: restore from stored settings, then nearest shoot, then fallback (Requirement 2)
  const initialLocation =
    settings?.selectedCity ||
    shoots[0]?.location ||
    'San Francisco, CA';

  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [selectedShootDate, setSelectedShootDate] = useState<string | undefined>(
    shoots[0]?.dateTime
  );
  const [weatherData, setWeatherData] = useState<PhotographyWeatherResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unit, setUnit] = useState<TempUnit>(defaultUnit);

  // Geolocation states (Requirement 2)
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    if (settings?.tempUnit) {
      setUnit(settings.tempUnit);
    }
  }, [settings?.tempUnit]);

  // Keep selectedLocation in sync if settings.selectedCity changes from another tab/device
  useEffect(() => {
    if (settings?.selectedCity && settings.selectedCity !== selectedLocation) {
      setSelectedLocation(settings.selectedCity);
    }
  }, [settings?.selectedCity]);

  const updateLocationAndPersist = (newLoc: string, dateStr?: string) => {
    setSelectedLocation(newLoc);
    setSelectedShootDate(dateStr);
    onUpdateSettings?.({ selectedCity: newLoc });
  };

  const fetchWeather = async (loc: string, dateStr?: string) => {
    setLoading(true);
    try {
      const data = await getPhotographyWeather(loc, dateStr, is24h);
      setWeatherData(data);
    } catch (e) {
      console.warn('Weather fetch notice:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(selectedLocation, selectedShootDate);
  }, [selectedLocation, selectedShootDate, is24h]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      updateLocationAndPersist(searchQuery.trim(), undefined);
      setSearchQuery('');
    }
  };

  // "Use my location" button logic (Requirement 2)
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoNotice({ message: 'Geolocation is not supported by your browser.', type: 'error' });
      return;
    }

    setIsGeolocating(true);
    setGeoNotice(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Free client reverse geocode via BigDataCloud client API (no API key needed)
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          if (!res.ok) throw new Error('Reverse geocode failed');
          const data = await res.json();
          const city = data.city || data.locality || data.principalSubdivision || 'Current Location';
          const region = data.principalSubdivision || data.countryCode || '';
          const resolvedLocation = region && region !== city ? `${city}, ${region}` : city;

          updateLocationAndPersist(resolvedLocation, undefined);
          setGeoNotice({ message: `Forecast loaded for ${resolvedLocation}`, type: 'success' });
          setTimeout(() => setGeoNotice(null), 3500);
        } catch {
          const coordsFallback = `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
          updateLocationAndPersist(coordsFallback, undefined);
          setGeoNotice({ message: `Forecast loaded for (${coordsFallback})`, type: 'success' });
          setTimeout(() => setGeoNotice(null), 3500);
        } finally {
          setIsGeolocating(false);
        }
      },
      (err) => {
        setIsGeolocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoNotice({
            message: 'Location access was denied. You can search by city name or enable location permissions.',
            type: 'error',
          });
        } else {
          setGeoNotice({
            message: 'Could not determine location. Please search for your city directly.',
            type: 'error',
          });
        }
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  const getWeatherIcon = (code: WeatherConditionCode) => {
    switch (code) {
      case 'sunny':
        return <Sun className="w-8 h-8 text-amber-500" />;
      case 'partly-cloudy':
        return <CloudSun className="w-8 h-8 text-amber-500" />;
      case 'cloudy':
        return <Cloud className="w-8 h-8 text-slate-400" />;
      case 'rain':
        return <CloudRain className="w-8 h-8 text-sky-500" />;
      case 'windy':
        return <Wind className="w-8 h-8 text-teal-600" />;
      case 'fog':
        return <Cloud className="w-8 h-8 text-slate-400" />;
      default:
        return <Sun className="w-8 h-8 text-amber-500" />;
    }
  };

  // User's own photoshoot locations (no sample/demo data, Requirement 4)
  const userShootLocations = Array.from(
    new Set(shoots.map((s) => s.location).filter(Boolean))
  );

  return (
    <div id="weather-forecast-view" className="pb-28 pt-3 max-w-lg mx-auto">
      {/* Header */}
      <div className="px-5 py-2 flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Solar & ambient light
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5 font-display">
            Light & Weather
          </h1>
        </div>

        {/* Temperature Unit Segmented Control */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setUnit('C')}
            className={`min-h-[32px] px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              unit === 'C'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            °C
          </button>
          <button
            onClick={() => setUnit('F')}
            className={`min-h-[32px] px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              unit === 'F'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            °F
          </button>
        </div>
      </div>

      {/* Location Search Bar + Use My Location Button (Requirement 2) */}
      <div className="px-4 mt-2">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1">
            <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="weather-search-input"
              type="text"
              placeholder="Search city, studio, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-20 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 shadow-xs"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 min-h-[32px] rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold active:scale-[0.97] transition-all cursor-pointer"
            >
              Search
            </button>
          </div>

          {/* Use My Location button (Requirement 2) */}
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={isGeolocating}
            title="Use my current GPS location"
            aria-label="Use my location"
            className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-[#FF2D20] hover:border-slate-300 dark:hover:border-slate-600 shadow-xs active:scale-[0.97] transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isGeolocating ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#FF2D20]" />
            ) : (
              <Locate className="w-4 h-4" />
            )}
          </button>
        </form>

        {/* Geolocation feedback banner */}
        {geoNotice && (
          <div
            className={`mt-2 p-2.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-150 ${
              geoNotice.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            {geoNotice.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span className="flex-1">{geoNotice.message}</span>
          </div>
        )}
      </div>

      {/* Shoot Location Pills (if any booked shoots exist) */}
      {userShootLocations.length > 0 && (
        <div className="px-4 mt-2.5 relative">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {userShootLocations.map((loc) => (
              <button
                key={loc}
                onClick={() => updateLocationAndPersist(loc, undefined)}
                className={`shrink-0 px-3.5 py-1.5 min-h-[36px] rounded-full text-xs font-medium transition-all cursor-pointer active:scale-[0.97] ${
                  selectedLocation === loc && !selectedShootDate
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {loc.split(',')[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Shoots Link Dropdown if user has booked shoots */}
      {shoots.length > 0 && (
        <div className="px-4 mt-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  Target Shoot
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Compute sun & forecast for booked shoots
                </p>
              </div>
            </div>
            <select
              value={selectedLocation}
              onChange={(e) => {
                const targetShoot = shoots.find((s) => s.location === e.target.value);
                updateLocationAndPersist(e.target.value, targetShoot?.dateTime);
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none max-w-[170px] truncate shadow-xs cursor-pointer"
            >
              {shoots.map((s) => (
                <option key={s.id} value={s.location}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !weatherData && (
        <div className="p-8 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#FF2D20] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading forecast & sun times...</p>
        </div>
      )}

      {weatherData && (
        <div className="px-4 mt-4 space-y-3">
          {/* Main Weather Card */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-[#FF2D20]" />
                  <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                    {weatherData.locationName}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
                    {unit === 'F' ? weatherData.temperatureF : weatherData.temperatureC}°
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {weatherData.conditionText}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-700/60 border border-slate-100 dark:border-slate-700">
                {getWeatherIcon(weatherData.conditionCode)}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-700 text-xs">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Wind</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {weatherData.windSpeedMph} mph
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Humidity</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {weatherData.humidity}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Cloud Cover</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {weatherData.cloudCover}%
                  </span>
                </div>
              </div>
            </div>

            {weatherData.notice && (
              <div className="mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-[11px] leading-snug">
                {weatherData.notice}
              </div>
            )}
          </div>

          {/* Golden Hour & Blue Hour Hero (Requirement 17) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Evening Golden Hour */}
            <div className="p-4 rounded-3xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 mb-1">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider font-mono">
                  Golden Hour
                </span>
              </div>
              <p className="text-lg font-bold text-amber-950 dark:text-amber-200 font-mono mt-1">
                {weatherData.goldenHourEvening}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-1">
                <Sunset className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Sunset: {weatherData.sunsetTime}</span>
              </div>
            </div>

            {/* Blue Hour */}
            <div className="p-4 rounded-3xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/60 relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400 mb-1">
                <Moon className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span className="text-xs font-bold uppercase tracking-wider font-mono">
                  Blue Hour
                </span>
              </div>
              <p className="text-lg font-bold text-sky-950 dark:text-sky-200 font-mono mt-1">
                {weatherData.blueHourEvening}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-sky-800/80 dark:text-sky-300/80 mt-1">
                <Sunrise className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Sunrise: {weatherData.sunriseTime}</span>
              </div>
            </div>
          </div>

          {/* Morning Solar Window */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
              Morning Solar Schedule
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block">Dawn / First Light</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {weatherData.dawnTime}
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block">Morning Golden Hour</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {weatherData.goldenHourMorning}
                </span>
              </div>
            </div>
          </div>

          {/* Photography Light Quality Score */}
          <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Lighting Condition: {weatherData.lightQualityScore}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Calculated from cloud opacity and direct sun angle.
              </p>
            </div>
            <button
              onClick={() => fetchWeather(selectedLocation, selectedShootDate)}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all shadow-xs cursor-pointer"
              title="Refresh forecast"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
