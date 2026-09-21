import React, { useMemo, useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Package,
  Plus,
  ArrowRight,
  Camera,
  Sparkles,
  Bell,
  ChevronRight,
  Sun,
  CloudSun,
  CloudRain,
  Wind,
} from 'lucide-react';
import { Shoot, GearItem, PackingItem, AppSettings, AlertNotification, NavigationTab, UserProfile } from '../../types';
import { formatShootDate, formatShootTime, formatRelativeTime } from '../../utils/dateUtils';
import { AlertBanner } from '../AlertBanner';
import { getPhotographyWeather } from '../../services/weatherService';
import { IOSInstallBanner } from '../ios/IOSInstallBanner';

interface DashboardViewProps {
  shoots: Shoot[];
  gear: GearItem[];
  packing: PackingItem[];
  settings: AppSettings;
  alerts: AlertNotification[];
  user?: UserProfile | null;
  onLogout?: () => void;
  onOpenShoot: (shootId: string) => void;
  onNavigateToTab: (tab: NavigationTab) => void;
  onOpenScheduleModal: () => void;
  onOpenAddGearModal: () => void;
  onDismissAlert: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  shoots,
  gear,
  packing,
  settings,
  alerts,
  user,
  onLogout,
  onOpenShoot,
  onNavigateToTab,
  onOpenScheduleModal,
  onOpenAddGearModal,
  onDismissAlert,
}) => {
  // Sort shoots chronologically
  const sortedShoots = useMemo(() => {
    return [...shoots].sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    );
  }, [shoots]);

  // Find next upcoming shoot
  const nextShoot = sortedShoots[0];

  // Helper for packing stats of next shoot
  const nextShootPacking = useMemo(() => {
    if (!nextShoot) return null;
    const items = packing.filter((p) => p.shootId === nextShoot.id);
    const total = items.length;
    const packed = items.filter((p) => p.status === 'Packed').length;
    const missing = items.filter((p) => p.status === 'Missing').length;
    const needed = items.filter((p) => p.status === 'Needed').length;
    const percent = total > 0 ? Math.round((packed / total) * 100) : 0;
    return { total, packed, missing, needed, percent };
  }, [nextShoot, packing]);

  // Total gear packing count across all shoots
  const totalPackedCount = useMemo(() => {
    return packing.filter((p) => p.status === 'Packed').length;
  }, [packing]);

  // Quick weather forecast for next shoot location
  const [nextShootWeather, setNextShootWeather] = useState<{
    temp: number;
    cond: string;
    goldenHour: string;
  } | null>(null);

  useEffect(() => {
    if (nextShoot) {
      getPhotographyWeather(nextShoot.location, nextShoot.dateTime).then((w) => {
        setNextShootWeather({
          temp: w.temperatureF,
          cond: w.conditionText,
          goldenHour: w.goldenHourEvening,
        });
      });
    }
  }, [nextShoot?.id, nextShoot?.location]);

  return (
    <div id="dashboard-view" className="pb-28 pt-3 max-w-lg mx-auto">
      {/* Studio Header (Bright Luminous Aesthetic with Color Hunt Palette) */}
      <div className="px-5 py-2 flex items-center justify-between">
        <div
          onClick={() => onNavigateToTab('settings')}
          className="flex items-center gap-3 cursor-pointer group"
          title="View Photographer Profile & Settings"
        >
          {user?.avatarUrl ? (
            <div className="relative">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-11 h-11 rounded-2xl object-cover border-2 border-white shadow-sm shadow-[#F29191]/25 group-hover:scale-105 transition-transform"
              />
              {user.provider === 'google' && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border border-slate-200 flex items-center justify-center p-0.5 shadow-xs">
                  <svg className="w-full h-full" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                </div>
              )}
              {user.provider === 'apple' && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-black text-white flex items-center justify-center p-0.5 shadow-xs">
                  <span className="text-[9px] font-bold"></span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#F29191] via-[#F7ADAD] to-[#B1E5E6] p-[2px] shadow-sm shadow-[#F29191]/25 group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center text-[#D45B5B] font-extrabold text-sm">
                {(user?.name || settings.photographerName || 'AV').slice(0, 2).toUpperCase()}
              </div>
            </div>
          )}
          <div>
            <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#D45B5B]">
              <Sparkles className="w-3 h-3" />
              <span>{user?.studioName || settings.studioName || 'Vance Visuals'}</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 mt-0.5 font-display group-hover:text-[#D45B5B] transition-colors">
              {user?.name || settings.photographerName || 'Alex Vance'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <IOSInstallBanner variant="pill" />
          <button
            onClick={() => onNavigateToTab('settings')}
            className="relative p-2.5 rounded-2xl bg-white border border-[#B1E5E6]/70 text-slate-600 hover:text-slate-900 hover:border-[#F7ADAD] transition-all hover:scale-105 active:scale-95 shadow-xs"
            aria-label="Settings & Alerts"
          >
            <Bell className="w-5 h-5" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#F29191] ring-2 ring-white animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* iOS App Download & Install Banner */}
      <div className="px-4 mt-2">
        <IOSInstallBanner variant="banner" />
      </div>

      {/* Active Day-of-Shoot Alert Banner (Morning review / 2-Hour Critical) */}
      <AlertBanner
        alerts={alerts}
        onDismiss={onDismissAlert}
        onOpenShoot={onOpenShoot}
      />

      {/* Hero: Next Shoot Up (Bright Card Hero with Coral/Mint Palette) */}
      {nextShoot && (
        <div className="px-4 mt-2 mb-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 font-mono">
              Next Scheduled Session
            </span>
            <span className="text-xs text-[#0F4E50] font-bold px-2.5 py-0.5 rounded-full bg-[#CCFBFA] border border-[#B1E5E6]">
              {formatRelativeTime(nextShoot.dateTime).text}
            </span>
          </div>

          <div
            id={`hero-shoot-${nextShoot.id}`}
            onClick={() => onOpenShoot(nextShoot.id)}
            className="group cursor-pointer rounded-[28px] p-5 transition-all duration-300 relative overflow-hidden bright-card-hero"
          >
            {/* Background ambient lighting */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#CCFBFA]/45 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-28 h-28 bg-[#F7ADAD]/30 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-block text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white shadow-xs">
                    {nextShoot.shootType}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mt-2 font-display group-hover:text-[#D45B5B] transition-colors leading-tight">
                    {nextShoot.title}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Client: <strong className="text-slate-900">{nextShoot.clientName}</strong>
                  </p>
                </div>

                <div className="p-2.5 rounded-2xl bg-white border border-[#F7ADAD]/70 text-slate-800 group-hover:bg-[#F29191] group-hover:text-white group-hover:border-transparent transition-all shadow-xs shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Date & Location Chips */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-[#F7ADAD]/40 text-xs">
                <div className="flex items-center gap-1.5 truncate text-slate-700">
                  <div className="p-1 rounded-lg bg-[#FFF0F0] text-[#D45B5B] shadow-xs">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate text-[11px] font-medium">
                    {formatShootDate(nextShoot.dateTime)} • {formatShootTime(nextShoot.dateTime)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 truncate text-slate-700">
                  <div className="p-1 rounded-lg bg-[#FFF0F0] text-[#D45B5B] shadow-xs">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate text-[11px] font-medium">{nextShoot.location}</span>
                </div>
              </div>

              {/* Weather Forecast Chip for Next Shoot */}
              {nextShootWeather && (
                <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-[#CCFBFA]/70 border border-[#B1E5E6] text-xs flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                    <Sun className="w-3.5 h-3.5 text-[#D45B5B]" />
                    <span>{nextShootWeather.temp}°F</span>
                    <span className="text-slate-400 font-normal">•</span>
                    <span className="text-slate-600 text-[11px] truncate max-w-[140px]">
                      {nextShootWeather.cond}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#B84545] font-bold">
                    Sunset: {nextShootWeather.goldenHour}
                  </span>
                </div>
              )}

              {/* Packing Health Bar */}
              {nextShootPacking && (
                <div className="mt-3.5 pt-3 border-t border-[#F7ADAD]/40">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Package className="w-3.5 h-3.5 text-[#D45B5B]" />
                      <span className="text-[11px] font-medium">Packing Status:</span>
                      <span className="font-bold text-slate-900">
                        {nextShootPacking.packed}/{nextShootPacking.total} Packed
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-extrabold ${
                        nextShootPacking.missing > 0
                          ? 'text-[#D45B5B]'
                          : nextShootPacking.percent === 100
                          ? 'text-teal-700'
                          : 'text-[#D45B5B]'
                      }`}
                    >
                      {nextShootPacking.percent}% Complete
                    </span>
                  </div>

                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-[#B1E5E6] to-[#167D80] rounded-full transition-all duration-300"
                      style={{ width: `${nextShootPacking.percent}%` }}
                    />
                    {nextShootPacking.missing > 0 && (
                      <div
                        className="h-full bg-[#F29191] rounded-full ml-0.5"
                        style={{
                          width: `${Math.round(
                            (nextShootPacking.missing / nextShootPacking.total) * 100
                          )}%`,
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bright Metric Bento Row (Featuring the 4 Palette Colors) */}
      <div className="px-4 grid grid-cols-4 gap-2 mb-4">
        {/* Metric 1: Coral (#F29191) */}
        <div
          onClick={() => onNavigateToTab('gear_vault')}
          className="p-3 rounded-2xl bright-card cursor-pointer hover:border-[#F29191] transition-all duration-200 group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <div className="p-1 rounded-lg bg-[#FFF0F0] text-[#D45B5B] border border-[#F7ADAD]/40">
              <Camera className="w-3 h-3" />
            </div>
            <span className="text-[8px] uppercase font-bold tracking-wider text-slate-400 font-mono">VAULT</span>
          </div>
          <div className="text-lg font-black text-slate-900 font-display leading-tight">{gear.length}</div>
          <p className="text-[9px] text-slate-500 truncate mt-0.5">Equipment</p>
        </div>

        {/* Metric 2: Blush Coral (#F7ADAD) */}
        <div
          onClick={() => onNavigateToTab('calendar')}
          className="p-3 rounded-2xl bright-card cursor-pointer hover:border-[#F7ADAD] transition-all duration-200 group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <div className="p-1 rounded-lg bg-[#FFF5F5] text-[#D45B5B] border border-[#F7ADAD]/40">
              <Calendar className="w-3 h-3" />
            </div>
            <span className="text-[8px] uppercase font-bold tracking-wider text-slate-400 font-mono">SHOOTS</span>
          </div>
          <div className="text-lg font-black text-slate-900 font-display leading-tight">{shoots.length}</div>
          <p className="text-[9px] text-slate-500 truncate mt-0.5">Sessions</p>
        </div>

        {/* Metric 3: Soft Aqua (#B1E5E6) */}
        <div
          onClick={() => onNavigateToTab('weather')}
          className="p-3 rounded-2xl bright-card cursor-pointer hover:border-[#B1E5E6] transition-all duration-200 group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <div className="p-1 rounded-lg bg-[#CCFBFA] text-[#167D80] border border-[#B1E5E6]">
              <Sun className="w-3 h-3 text-[#D45B5B]" />
            </div>
            <span className="text-[8px] uppercase font-bold tracking-wider text-slate-400 font-mono">LIGHT</span>
          </div>
          <div className="text-lg font-black text-slate-900 font-display leading-tight">6:45 PM</div>
          <p className="text-[9px] text-slate-500 truncate mt-0.5">Golden Hr</p>
        </div>

        {/* Metric 4: Ice Mint (#CCFBFA) */}
        <div className="p-3 rounded-2xl bright-card hover:border-[#CCFBFA] transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <div className="p-1 rounded-lg bg-[#EAFBFA] text-[#0F4E50] border border-[#B1E5E6]/60">
              <Package className="w-3 h-3" />
            </div>
            <span className="text-[8px] uppercase font-bold tracking-wider text-slate-400 font-mono">PACKED</span>
          </div>
          <div className="text-lg font-black text-slate-900 font-display leading-tight">{totalPackedCount}</div>
          <p className="text-[9px] text-slate-500 truncate mt-0.5">Stowed</p>
        </div>
      </div>

      {/* Quick Actions (Color Hunt Styled Buttons) */}
      <div className="px-4 grid grid-cols-2 gap-2.5 mb-5">
        <button
          id="quick-action-schedule"
          onClick={onOpenScheduleModal}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-gradient-to-r from-[#F29191] to-[#F7ADAD] hover:brightness-105 text-white font-extrabold text-xs shadow-md shadow-[#F29191]/30 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Schedule Shoot</span>
        </button>

        <button
          id="quick-action-add-gear"
          onClick={onOpenAddGearModal}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-white hover:bg-[#CCFBFA]/30 text-slate-800 font-bold text-xs border border-[#B1E5E6] active:scale-95 transition-all shadow-xs"
        >
          <Camera className="w-4 h-4 text-[#D45B5B]" />
          <span>Add Gear to Vault</span>
        </button>
      </div>

      {/* Upcoming Shoots Dashboard List */}
      <div className="px-4 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 font-mono">
            Upcoming Photoshoots ({sortedShoots.length})
          </span>
          <button
            onClick={() => onNavigateToTab('calendar')}
            className="text-xs text-[#D45B5B] hover:text-[#B84545] font-bold inline-flex items-center gap-1 transition-colors"
          >
            <span>Calendar View</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {sortedShoots.map((shoot) => {
            const items = packing.filter((p) => p.shootId === shoot.id);
            const packed = items.filter((p) => p.status === 'Packed').length;
            const missing = items.filter((p) => p.status === 'Missing').length;
            const percent = items.length > 0 ? Math.round((packed / items.length) * 100) : 0;
            const rel = formatRelativeTime(shoot.dateTime);

            return (
              <div
                key={shoot.id}
                id={`upcoming-shoot-row-${shoot.id}`}
                onClick={() => onOpenShoot(shoot.id)}
                className="group cursor-pointer rounded-2xl bright-card p-3.5 transition-all duration-200 hover:border-[#F7ADAD] flex items-center justify-between gap-3 shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Calendar Date Badge with Color Hunt Palette */}
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF0F0] border border-[#F7ADAD]/70 flex flex-col items-center justify-center shrink-0 shadow-xs">
                    <span className="text-[9px] font-bold text-[#D45B5B] uppercase tracking-wider">
                      {new Date(shoot.dateTime).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-sm font-black text-slate-900 font-display leading-none mt-0.5">
                      {new Date(shoot.dateTime).getDate()}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-[#D45B5B] transition-colors font-display">
                        {shoot.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {shoot.clientName} • <span className="text-slate-400">{rel.text}</span>
                    </p>
                  </div>
                </div>

                {/* Status Indicator & Arrow */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span
                      className={`text-[11px] font-bold block ${
                        missing > 0
                          ? 'text-[#D45B5B]'
                          : percent === 100
                          ? 'text-teal-700'
                          : 'text-[#D45B5B]'
                      }`}
                    >
                      {packed}/{items.length} packed
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatShootTime(shoot.dateTime)}
                    </span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-[#F29191] group-hover:text-white transition-all">
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
