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
  Search,
  MapPin,
  Calendar,
  AlertTriangle,
  Camera,
  RefreshCw,
  Compass,
  Eye,
  Sliders,
} from 'lucide-react';
import { Shoot, WeatherForecastData, WeatherConditionCode } from '../../types';
import { getPhotographyWeather } from '../../services/weatherService';
import { formatShootDate, formatShootTime } from '../../utils/dateUtils';

interface WeatherForecastViewProps {
  shoots: Shoot[];
  onOpenShoot?: (shootId: string) => void;
}

export const WeatherForecastView: React.FC<WeatherForecastViewProps> = ({
  shoots,
  onOpenShoot,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<string>('Presidio Bluff Studio, San Francisco');
  const [searchQuery, setSearchQuery] = useState('');
  const [weatherData, setWeatherData] = useState<WeatherForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState<'F' | 'C'>('F');

  const POPULAR_LOCATIONS = [
    'Presidio Bluff, San Francisco',
    'Central Park, New York',
    'Joshua Tree, California',
    'Venice Beach, Los Angeles',
    'Studio 4, San Francisco',
  ];

  const fetchWeather = async (loc: string) => {
    setLoading(true);
    try {
      const data = await getPhotographyWeather(loc);
      setWeatherData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(selectedLocation);
  }, [selectedLocation]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSelectedLocation(searchQuery.trim());
      setSearchQuery('');
    }
  };

  const getWeatherIcon = (code: WeatherConditionCode) => {
    switch (code) {
      case 'sunny':
        return <Sun className="w-8 h-8 text-amber-500 animate-spin-slow" />;
      case 'partly-cloudy':
        return <CloudSun className="w-8 h-8 text-amber-500" />;
      case 'cloudy':
        return <Cloud className="w-8 h-8 text-slate-500" />;
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

  return (
    <div id="weather-forecast-view" className="pb-28 pt-3 max-w-lg mx-auto">
      {/* Header */}
      <div className="px-5 py-2 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#D45B5B] font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Photography Meteorology</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 font-display">
            Weather & Light Studio
          </h1>
        </div>

        {/* Temperature Unit Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200 shadow-inner">
          <button
            onClick={() => setUnit('F')}
            className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all ${
              unit === 'F'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            °F
          </button>
          <button
            onClick={() => setUnit('C')}
            className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all ${
              unit === 'C'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            °C
          </button>
        </div>
      </div>

      {/* Location Search Bar */}
      <div className="px-4 mt-2">
        <form onSubmit={handleSearch} className="relative">
          <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="weather-search-input"
            type="text"
            placeholder="Search shoot location, city, or park..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-20 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F29191] focus:ring-2 focus:ring-[#F29191]/20 shadow-sm"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white text-xs font-bold shadow-md shadow-[#F29191]/30 hover:brightness-105"
          >
            Search
          </button>
        </form>
      </div>

      {/* Quick Location Pills */}
      <div className="px-4 mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {POPULAR_LOCATIONS.map((loc) => (
          <button
            key={loc}
            onClick={() => setSelectedLocation(loc)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              selectedLocation === loc
                ? 'bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-xs'
            }`}
          >
            {loc.split(',')[0]}
          </button>
        ))}
      </div>

      {/* Shoots Link Dropdown / Quick Switch */}
      {shoots.length > 0 && (
        <div className="px-4 mt-3">
          <div className="p-2.5 bg-[#CCFBFA]/40 border border-[#B1E5E6] rounded-2xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-xl bg-[#FFF0F0] text-[#D45B5B] shrink-0 border border-[#F7ADAD]/60">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#0F4E50]">
                  Booked Photoshoot Forecast
                </p>
                <p className="text-xs text-slate-700 font-medium truncate">
                  Check conditions for upcoming scheduled shoots
                </p>
              </div>
            </div>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-white border border-[#B1E5E6] rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-none max-w-[150px] truncate shadow-xs"
            >
              {shoots.map((s) => (
                <option key={s.id} value={s.location}>
                  {s.title} ({s.location})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main Weather Card */}
      {loading ? (
        <div className="px-4 mt-4 py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[#D45B5B]" />
          <p className="text-xs font-medium">Calculating golden hours & solar elevation...</p>
        </div>
      ) : weatherData ? (
        <div className="px-4 mt-4 space-y-4">
          {/* Hero Photography Card */}
          <div className="bright-card-hero rounded-[28px] p-6 relative overflow-hidden">
            {/* Ambient sun glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#F7ADAD]/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#B1E5E6]/30 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              {/* Location & Refresh */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <MapPin className="w-4 h-4 text-[#D45B5B] shrink-0" />
                  <span className="text-sm font-bold text-slate-900 truncate">
                    {weatherData.locationName}
                  </span>
                </div>
                <button
                  onClick={() => fetchWeather(selectedLocation)}
                  className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 hover:bg-[#FFF0F0] transition-colors"
                  title="Refresh forecast"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Main Temp & Condition */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-slate-900 font-display tracking-tight">
                      {unit === 'F' ? weatherData.temperatureF : weatherData.temperatureC}°
                    </span>
                    <span className="text-sm font-bold text-[#D45B5B] font-mono">
                      {unit}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-800 mt-1">
                    {weatherData.conditionText}
                  </h3>
                </div>

                <div className="flex flex-col items-center gap-1 p-3 bg-white/80 rounded-2xl border border-[#F7ADAD]/60 shadow-sm backdrop-blur-xs">
                  {getWeatherIcon(weatherData.conditionCode)}
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D45B5B] font-mono">
                    {weatherData.lightingQuality}
                  </span>
                </div>
              </div>

              {/* Golden Hour & Blue Hour Ribbon */}
              <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-[#F7ADAD]/40">
                <div className="p-2.5 rounded-2xl bg-white/90 border border-[#F7ADAD]/70 shadow-xs">
                  <div className="flex items-center gap-1.5 text-[#D45B5B] text-xs font-bold mb-0.5">
                    <Sunset className="w-4 h-4 text-[#F29191]" />
                    <span>Evening Golden Hour</span>
                  </div>
                  <p className="text-xs font-black text-slate-900 font-mono">
                    {weatherData.goldenHourEvening}
                  </p>
                  <span className="text-[10px] text-slate-500">Warm directional rim-light</span>
                </div>

                <div className="p-2.5 rounded-2xl bg-white/90 border border-[#B1E5E6] shadow-xs">
                  <div className="flex items-center gap-1.5 text-[#0F4E50] text-xs font-bold mb-0.5">
                    <Sunrise className="w-4 h-4 text-[#167D80]" />
                    <span>Morning Golden Hour</span>
                  </div>
                  <p className="text-xs font-black text-slate-900 font-mono">
                    {weatherData.goldenHourMorning}
                  </p>
                  <span className="text-[10px] text-slate-500">Soft low-angle morning fill</span>
                </div>
              </div>

              {/* Blue Hour Badge */}
              <div className="mt-2.5 px-3 py-2 rounded-xl bg-[#CCFBFA]/70 border border-[#B1E5E6] text-xs flex items-center justify-between text-[#0F4E50]">
                <span className="font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#167D80] animate-pulse" />
                  Evening Blue Hour:
                </span>
                <span className="font-mono font-extrabold text-[#0F4E50]">
                  {weatherData.blueHourEvening}
                </span>
              </div>
            </div>
          </div>

          {/* Environmental Metrics Grid (Wind, Rain, UV, Humidity) */}
          <div className="grid grid-cols-4 gap-2">
            {/* Wind */}
            <div className="bright-card p-3 rounded-2xl flex flex-col items-center text-center">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-600 mb-1">
                <Wind className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Wind</span>
              <span className="text-xs font-black text-slate-900 mt-0.5 font-mono">
                {weatherData.windSpeedMph} mph
              </span>
              <span className="text-[9px] text-slate-400">
                {weatherData.windSpeedMph > 12 ? '⚠️ Sandbags' : 'Calm'}
              </span>
            </div>

            {/* Rain */}
            <div className="bright-card p-3 rounded-2xl flex flex-col items-center text-center">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-600 mb-1">
                <Droplets className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Rain Prob</span>
              <span className="text-xs font-black text-slate-900 mt-0.5 font-mono">
                {weatherData.precipitationProb}%
              </span>
              <span className="text-[9px] text-slate-400">
                {weatherData.precipitationProb > 20 ? 'Cover gear' : 'Dry'}
              </span>
            </div>

            {/* UV Index */}
            <div className="bright-card p-3 rounded-2xl flex flex-col items-center text-center">
              <div className="p-2 rounded-xl bg-[#FFF0F0] text-[#D45B5B] mb-1">
                <Sun className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">UV Index</span>
              <span className="text-xs font-black text-slate-900 mt-0.5 font-mono">
                {weatherData.uvIndex} / 10
              </span>
              <span className="text-[9px] text-slate-400">
                {weatherData.uvIndex >= 6 ? 'Use scrim' : 'Moderate'}
              </span>
            </div>

            {/* Humidity */}
            <div className="bright-card p-3 rounded-2xl flex flex-col items-center text-center">
              <div className="p-2 rounded-xl bg-[#CCFBFA]/60 text-[#0F4E50] mb-1">
                <Eye className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Humidity</span>
              <span className="text-xs font-black text-slate-900 mt-0.5 font-mono">
                {weatherData.humidity}%
              </span>
              <span className="text-[9px] text-slate-400">
                {weatherData.humidity > 75 ? 'Lens fog' : 'Clear'}
              </span>
            </div>
          </div>

          {/* Photography Gear & Lighting Advisories */}
          <div className="bright-card rounded-[24px] p-4.5 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-[#FFF0F0] text-[#D45B5B] border border-[#F7ADAD]/60">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Photographer Field Advisories
                </h3>
                <p className="text-[11px] text-slate-500">
                  Recommended equipment adjustments for current conditions
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {weatherData.gearRecommendations.map((tip, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed font-medium"
                >
                  <span className="text-[#D45B5B] shrink-0 font-bold">•</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hourly Photography Lighting Track */}
          <div className="bright-card rounded-[24px] p-4.5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-[#D45B5B]" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Hourly Solar & Light Track
                </h3>
              </div>
              <span className="text-[11px] font-bold text-[#D45B5B]">Golden Hours Highlighted</span>
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
              {weatherData.hourly.map((h, i) => (
                <div
                  key={i}
                  className={`shrink-0 w-24 p-3 rounded-2xl border text-center transition-all ${
                    h.isGoldenHour
                      ? 'bg-gradient-to-b from-[#FFF0F0] to-[#FFE5E5] border-[#F7ADAD] shadow-xs'
                      : h.isBlueHour
                      ? 'bg-gradient-to-b from-[#CCFBFA]/70 to-[#B1E5E6]/60 border-[#B1E5E6]'
                      : 'bg-slate-50/80 border-slate-200/80'
                  }`}
                >
                  <span className="text-[10px] font-bold text-slate-500 block">
                    {h.time}
                  </span>
                  <div className="my-1.5 flex justify-center">
                    {h.isGoldenHour ? (
                      <Sun className="w-5 h-5 text-[#D45B5B] animate-spin-slow" />
                    ) : h.isBlueHour ? (
                      <Sunrise className="w-5 h-5 text-[#167D80]" />
                    ) : (
                      <CloudSun className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <span className="text-xs font-black text-slate-900 block font-mono">
                    {unit === 'F' ? `${h.tempF}°` : `${Math.round(((h.tempF - 32) * 5) / 9)}°`}
                  </span>
                  <span
                    className={`text-[9px] font-extrabold uppercase mt-1 block truncate px-1 py-0.5 rounded-md ${
                      h.isGoldenHour
                        ? 'bg-[#F7ADAD]/40 text-[#8B2020] font-bold'
                        : h.isBlueHour
                        ? 'bg-[#CCFBFA] text-[#0F4E50] border border-[#B1E5E6]'
                        : 'text-slate-500'
                    }`}
                  >
                    {h.lightType}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 5-Day Photography Forecast */}
          <div className="bright-card rounded-[24px] p-4.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D45B5B]" />
              <span>5-Day Photography Forecast</span>
            </h3>

            <div className="space-y-2 divide-y divide-slate-100">
              {weatherData.daily.map((day, i) => (
                <div key={i} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                  <div className="w-20">
                    <span className="font-bold text-slate-900 block">{day.dayName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{day.dateStr.slice(5)}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-1 px-2">
                    {getWeatherIcon(day.conditionCode)}
                    <span className="text-slate-700 font-medium truncate">
                      {day.conditionText}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-slate-900">
                      {unit === 'F' ? `${day.tempHighF}°` : `${Math.round(((day.tempHighF - 32) * 5) / 9)}°`}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 ml-1">
                      {unit === 'F' ? `${day.tempLowF}°` : `${Math.round(((day.tempLowF - 32) * 5) / 9)}°`}
                    </span>
                    <div className="text-[10px] text-[#D45B5B] font-bold">
                      Sunset {day.goldenHour}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
