import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Package,
  Plus,
  ArrowRight,
  Camera,
  Bell,
  ChevronRight,
  Sun,
  Sunset,
  Settings as SettingsIcon,
  Loader2,
  Trash2,
  X,
} from 'lucide-react';
import {
  GearItem,
  Shoot,
  PackingItem,
  AlertNotification,
  NavigationTab,
  UserProfile,
  AppSettings,
} from '../../types';
import {
  formatShootDate,
  formatShootTime,
  formatRelativeDateLabel,
  getUpcomingShoots,
} from '../../utils/dateUtils';
import { computeSunTimes, ShootSunDetails } from '../../utils/sunUtils';
import { processProfilePhoto } from '../../utils/imageUtils';
import { AuthService } from '../../services/authService';

interface DashboardViewProps {
  user: UserProfile | null;
  gear: GearItem[];
  shoots: Shoot[];
  packing: PackingItem[];
  alerts: AlertNotification[];
  settings: AppSettings;
  onNavigateToTab: (tab: NavigationTab) => void;
  onOpenShoot: (shootId: string) => void;
  onOpenScheduleModal: () => void;
  onOpenAddGearModal: () => void;
  onDismissAlert: (alertId: string) => void;
  onOpenAlertsSheet: () => void;
  onNavigateToSettings: () => void;
  onUpdateUser?: (updated: UserProfile) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  gear,
  shoots,
  packing,
  alerts,
  settings,
  onNavigateToTab,
  onOpenShoot,
  onOpenScheduleModal,
  onOpenAddGearModal,
  onDismissAlert,
  onOpenAlertsSheet,
  onNavigateToSettings,
  onUpdateUser,
}) => {
  const is24h = settings.timeFormat !== '12h';

  // Profile photo interaction (Requirement 3)
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

  const handleAvatarFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    setShowAvatarMenu(false);
    try {
      const croppedJpegDataUrl = await processProfilePhoto(file);
      const updatedUser = await AuthService.updateUserProfile({ avatarUrl: croppedJpegDataUrl });
      if (updatedUser && onUpdateUser) {
        onUpdateUser(updatedUser);
      }
    } catch (err) {
      console.warn('Avatar processing error:', err);
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);
    setShowAvatarMenu(false);
    try {
      const updatedUser = await AuthService.updateUserProfile({ avatarUrl: undefined });
      if (updatedUser && onUpdateUser) {
        onUpdateUser(updatedUser);
      }
    } catch (err) {
      console.warn('Avatar removal error:', err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarClick = () => {
    if (user?.avatarUrl) {
      setShowAvatarMenu(true);
    } else {
      avatarInputRef.current?.click();
    }
  };

  // Upcoming shoots: strictly future shoots (date >= now) sorted ascending
  const upcomingShoots = useMemo(() => {
    return getUpcomingShoots(shoots);
  }, [shoots]);

  // Nearest future shoot
  const nextShoot = upcomingShoots[0] || null;

  // Fallback location for sun calculation when there is no upcoming shoot
  const lastLocation = useMemo(() => {
    return nextShoot?.location || shoots[0]?.location || 'San Francisco, CA';
  }, [nextShoot, shoots]);

  // Compute real SunCalc for the shoot or today for the last-used location (Requirement 4)
  const [sunDetails, setSunDetails] = useState<ShootSunDetails | null>(() => {
    const targetDate = nextShoot ? nextShoot.dateTime : new Date();
    return computeSunTimes(targetDate, lastLocation, is24h);
  });

  useEffect(() => {
    const targetDate = nextShoot ? nextShoot.dateTime : new Date();
    setSunDetails(computeSunTimes(targetDate, lastLocation, is24h));
  }, [nextShoot, lastLocation, is24h]);

  // Packing stats for nearest future shoot
  const nextShootPacking = useMemo(() => {
    if (!nextShoot) return null;
    const items = packing.filter((p) => p.shootId === nextShoot.id);
    const total = items.length;
    const packed = items.filter((p) => p.status === 'Packed').length;
    const missing = items.filter((p) => p.status === 'Missing').length;
    const percent = total > 0 ? Math.round((packed / total) * 100) : 0;
    return { total, packed, missing, percent };
  }, [nextShoot, packing]);

  // Dynamic greeting based on current local hour (Requirement 10)
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const displayName = user?.name || settings.photographerName || 'Photographer';
  const studioName = user?.studioName || settings.studioName || 'Studio Vault';

  return (
    <div id="dashboard-view" className="pb-28 pt-2 max-w-lg mx-auto">
      {/* Header: greeting + name, studio name smaller below */}
      <div className="px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar with Photo Upload/Change/Remove (Requirement 3 & 7: 20px radius) */}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarFileSelected}
          />

          <button
            id="btn-header-avatar"
            type="button"
            onClick={handleAvatarClick}
            disabled={isUploadingAvatar}
            className="relative w-11 h-11 rounded-[20px] bg-[#1E1E1E] text-white flex items-center justify-center font-medium text-xs shrink-0 overflow-hidden active:scale-95 transition-all cursor-pointer border border-white/[0.08]"
            title="Profile photo"
            aria-label="Profile photo"
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-mono">{displayName.slice(0, 2).toUpperCase()}</span>
            )}
            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
            )}
          </button>

          <div className="min-w-0">
            <h1 className="text-xl font-normal tracking-[-0.03em] text-black dark:text-white truncate">
              {greeting}, {displayName}
            </h1>
            <p className="text-xs text-[#8E8E93] font-normal truncate">
              {studioName}
            </p>
          </div>
        </div>

        {/* Header Action Icons: Bell (Alerts Sheet) & Gear (Settings) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Bell Icon: opens Alerts Sheet */}
          <button
            id="btn-header-alerts"
            onClick={onOpenAlertsSheet}
            className="relative w-10 h-10 rounded-full bg-black/5 dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center text-[#8E8E93] hover:text-black dark:hover:text-white transition-colors active:scale-95 cursor-pointer"
            aria-label="Alerts & Reminders"
            title="Alerts & Reminders"
          >
            <Bell className="w-4 h-4" />
            {alerts.length > 0 && (
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-[#FF2D20]" />
            )}
          </button>

          {/* Settings Gear Icon */}
          <button
            id="btn-header-settings"
            onClick={onNavigateToSettings}
            className="w-10 h-10 rounded-full bg-black/5 dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center text-[#8E8E93] hover:text-black dark:hover:text-white transition-colors active:scale-95 cursor-pointer"
            aria-label="Settings"
            title="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Hero Card or Empty State */}
      <div className="px-4 mt-2 mb-4">
        {nextShoot ? (
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="pulsar-section-label">
                Next Session
              </span>
              <span className="pulsar-badge-status">
                {formatRelativeDateLabel(nextShoot.dateTime).text.toUpperCase()}
              </span>
            </div>

            <div
              id={`hero-shoot-${nextShoot.id}`}
              onClick={() => onOpenShoot(nextShoot.id)}
              className="rounded-[28px] p-5 bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20 transition-all cursor-pointer active:scale-[0.99] group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="pulsar-tag mb-1.5">
                    {nextShoot.shootType}
                  </span>
                  <h3 className="text-xl font-normal text-black dark:text-white tracking-[-0.03em] font-display truncate">
                    {nextShoot.title}
                  </h3>
                  <p className="text-xs text-[#8E8E93] mt-0.5 truncate font-normal">
                    Client: {nextShoot.clientName}
                  </p>
                </div>

                <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-[#1E1E1E] flex items-center justify-center text-[#8E8E93] group-hover:text-black dark:group-hover:text-white transition-colors shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Date & Location Chips */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-black/[0.06] dark:border-white/[0.06] text-xs">
                <div className="flex items-center gap-1.5 text-[#8E8E93] min-w-0">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-mono text-[11px] truncate">
                    {formatShootDate(nextShoot.dateTime, settings.dateFormat)} • {formatShootTime(nextShoot.dateTime, settings.timeFormat)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[#8E8E93] min-w-0">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate text-[11px] font-mono">{nextShoot.location}</span>
                </div>
              </div>

              {/* Solar light preview for next shoot */}
              {sunDetails && (
                <div className="mt-2.5 pt-2.5 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[#8E8E93]">
                    <Sunset className="w-3.5 h-3.5 text-[#FFD60A]" />
                    <span className="text-[11px]">
                      Golden hour: <span className="font-mono text-black dark:text-white">{sunDetails.goldenHourRange}</span>
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#8E8E93]">
                    Sunset {sunDetails.sunsetTime}
                  </span>
                </div>
              )}

              {/* Packing Health Bar */}
              {nextShootPacking && (
                <div className="mt-2.5 pt-2.5 border-t border-black/[0.06] dark:border-white/[0.06]">
                  {nextShootPacking.total === 0 ? (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-[#8E8E93]">
                        <Package className="w-3.5 h-3.5" />
                        <span>No gear checklist yet</span>
                      </div>
                      <span className="pulsar-bracket-btn" onClick={(e) => { e.stopPropagation(); onOpenShoot(nextShoot.id); }}>
                        ADD GEAR
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <div className="flex items-center gap-1.5 text-[#8E8E93]">
                          <Package className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Packing:</span>
                          <span className="font-mono text-black dark:text-white">
                            {nextShootPacking.packed}/{nextShootPacking.total}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-[#8E8E93]">
                          {nextShootPacking.percent}%
                        </span>
                      </div>

                      {/* Thin red progress line */}
                      <div className="h-1 w-full bg-black/10 dark:bg-[#1E1E1E] rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-[#FF2D20] rounded-full transition-all duration-300"
                          style={{ width: `${nextShootPacking.percent}%` }}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty State if No Upcoming Shoots */
          <div className="rounded-[28px] p-7 text-center bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08]">
            <Calendar className="w-10 h-10 text-[#8E8E93] mx-auto mb-2.5 stroke-[1.5]" />
            <h3 className="text-base font-normal text-black dark:text-white tracking-[-0.02em] font-display">
              No upcoming shoots
            </h3>
            <p className="text-xs text-[#8E8E93] mt-1 mb-5 max-w-xs mx-auto leading-relaxed">
              You have no future sessions booked. Schedule a photoshoot or add equipment to your vault.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                id="btn-empty-schedule-shoot"
                onClick={onOpenScheduleModal}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] py-2.5 px-6 rounded-full bg-[#FF2D20] hover:bg-[#E02619] text-white font-medium text-xs active:scale-[0.97] transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule Shoot</span>
              </button>

              <button
                id="btn-empty-add-gear"
                onClick={onOpenAddGearModal}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] py-2.5 px-5 rounded-full bg-black/5 dark:bg-[#1E1E1E] text-black dark:text-white hover:bg-black/10 dark:hover:bg-[#262626] border border-black/[0.08] dark:border-white/[0.08] text-xs font-normal active:scale-[0.97] transition-all cursor-pointer font-mono"
              >
                <Camera className="w-4 h-4 text-[#8E8E93]" />
                <span>Add Gear</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Metric Bento Row */}
      <div className="px-4 grid grid-cols-4 gap-2 mb-4">
        {/* Metric 1: Equipment Vault */}
        <div
          onClick={() => onNavigateToTab('gear_vault')}
          className="p-3.5 rounded-[22px] bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] cursor-pointer hover:border-black/20 dark:hover:border-white/20 transition-all active:scale-[0.97]"
        >
          <div className="flex items-center justify-between text-[#8E8E93] mb-1">
            <Camera className="w-3.5 h-3.5" />
            <span className="pulsar-section-label text-[9px]">VAULT</span>
          </div>
          <div className="pulsar-hero-num text-2xl sm:text-3xl text-black dark:text-white">
            {gear.length}
          </div>
          <p className="text-[10px] text-[#8E8E93] truncate mt-0.5 font-mono">items</p>
        </div>

        {/* Metric 2: Upcoming Shoots */}
        <div
          onClick={() => onNavigateToTab('calendar')}
          className="p-3.5 rounded-[22px] bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] cursor-pointer hover:border-black/20 dark:hover:border-white/20 transition-all active:scale-[0.97]"
        >
          <div className="flex items-center justify-between text-[#8E8E93] mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span className="pulsar-section-label text-[9px]">SHOOTS</span>
          </div>
          <div className="pulsar-hero-num text-2xl sm:text-3xl text-black dark:text-white">
            {upcomingShoots.length}
          </div>
          <p className="text-[10px] text-[#8E8E93] truncate mt-0.5 font-mono">upcoming</p>
        </div>

        {/* Metric 3: LIGHT */}
        <div
          onClick={() => onNavigateToTab('weather')}
          className="p-3.5 rounded-[22px] bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] cursor-pointer hover:border-black/20 dark:hover:border-white/20 transition-all active:scale-[0.97]"
        >
          <div className="flex items-center justify-between text-[#8E8E93] mb-1">
            <Sun className="w-3.5 h-3.5 text-[#FFD60A]" />
            <span className="pulsar-section-label text-[9px]">LIGHT</span>
          </div>
          <div className="text-sm font-light font-mono text-black dark:text-white leading-tight truncate mt-1">
            {sunDetails ? sunDetails.sunsetTime : '18:46'}
          </div>
          <p className="text-[9.5px] font-mono text-[#8E8E93] truncate mt-1">
            {sunDetails ? `GH ${sunDetails.goldenHourRange}` : 'Golden Hr'}
          </p>
        </div>

        {/* Metric 4: Packed */}
        <div
          onClick={() => {
            if (nextShoot) onOpenShoot(nextShoot.id);
          }}
          className="p-3.5 rounded-[22px] bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] cursor-pointer hover:border-black/20 dark:hover:border-white/20 transition-all active:scale-[0.97]"
        >
          <div className="flex items-center justify-between text-[#8E8E93] mb-1">
            <Package className="w-3.5 h-3.5" />
            <span className="pulsar-section-label text-[9px]">PACKED</span>
          </div>
          <div className="text-sm font-light font-mono text-black dark:text-white leading-tight truncate mt-1">
            {nextShootPacking && nextShootPacking.total > 0
              ? `${nextShootPacking.packed}/${nextShootPacking.total}`
              : '0'}
          </div>
          <p className="text-[9.5px] font-mono text-[#8E8E93] truncate mt-1">
            {nextShootPacking && nextShootPacking.total > 0
              ? `${nextShootPacking.percent}%`
              : 'empty'}
          </p>
        </div>
      </div>

      {/* Quick Action Buttons */}
      {upcomingShoots.length > 0 && (
        <div className="px-4 grid grid-cols-2 gap-2.5 mb-5">
          <button
            id="quick-action-schedule"
            onClick={onOpenScheduleModal}
            className="flex items-center justify-center gap-2 min-h-[44px] py-2.5 px-4 rounded-full bg-[#FF2D20] hover:bg-[#E02619] text-white font-medium text-xs active:scale-[0.97] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Shoot</span>
          </button>

          <button
            id="quick-action-add-gear"
            onClick={onOpenAddGearModal}
            className="flex items-center justify-center gap-2 min-h-[44px] py-2.5 px-4 rounded-full bg-black/5 dark:bg-[#1E1E1E] hover:bg-black/10 dark:hover:bg-[#262626] border border-black/[0.08] dark:border-white/[0.08] text-black dark:text-white font-normal text-xs active:scale-[0.97] transition-all cursor-pointer font-mono"
          >
            <Camera className="w-4 h-4 text-[#8E8E93]" />
            <span>Add Gear</span>
          </button>
        </div>
      )}

      {/* Upcoming Shoots Dashboard List */}
      {upcomingShoots.length > 0 && (
        <div className="px-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="pulsar-section-label">
              Upcoming Photoshoots ({upcomingShoots.length})
            </span>
            <button
              onClick={() => onNavigateToTab('calendar')}
              className="pulsar-bracket-btn"
            >
              VIEW ALL
            </button>
          </div>

          <div className="space-y-2">
            {upcomingShoots.map((shoot) => {
              const items = packing.filter((p) => p.shootId === shoot.id);
              const packed = items.filter((p) => p.status === 'Packed').length;
              const rel = formatRelativeDateLabel(shoot.dateTime);

              return (
                <div
                  key={shoot.id}
                  id={`upcoming-shoot-row-${shoot.id}`}
                  onClick={() => onOpenShoot(shoot.id)}
                  className="rounded-[20px] bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] p-3.5 transition-all hover:border-black/20 dark:hover:border-white/20 flex items-center justify-between gap-3 active:scale-[0.99] cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Calendar Date Badge */}
                    <div className="w-11 h-11 rounded-[14px] bg-[#EBEBEB] dark:bg-[#1E1E1E] flex flex-col items-center justify-center shrink-0">
                      <span className="text-[9px] font-mono text-[#8E8E93] uppercase">
                        {new Date(shoot.dateTime).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-sm font-light font-mono text-black dark:text-white leading-none mt-0.5">
                        {new Date(shoot.dateTime).getDate()}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm font-medium text-black dark:text-white truncate">
                        {shoot.title}
                      </h4>
                      <p className="text-xs text-[#8E8E93] truncate mt-0.5 font-normal">
                        {shoot.clientName} • <span className="font-mono text-black dark:text-white">{rel.text}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status Indicator & Arrow */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      {items.length === 0 ? (
                        <span className="text-[10px] font-mono text-[#8E8E93] block">
                          No gear
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-black dark:text-white block">
                          {packed}/{items.length}
                        </span>
                      )}
                      <span className="text-[10px] text-[#8E8E93] font-mono">
                        {formatShootTime(shoot.dateTime, settings.timeFormat)}
                      </span>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-black/5 dark:bg-[#1E1E1E] flex items-center justify-center text-[#8E8E93] group-hover:text-black dark:group-hover:text-white transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Avatar Action Modal */}
      {showAvatarMenu && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xs bg-white dark:bg-[#121212] rounded-[28px] p-6 border border-black/[0.08] dark:border-white/[0.08] shadow-2xl text-center">
            <div className="w-16 h-16 rounded-[20px] mx-auto mb-3 overflow-hidden border border-black/[0.08] dark:border-white/[0.08]">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#1E1E1E] text-white flex items-center justify-center font-mono font-medium text-base">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <h3 className="text-base font-medium text-black dark:text-white font-display">
              Profile Photo
            </h3>
            <p className="text-[11px] text-[#8E8E93] font-mono mt-0.5 mb-4">
              Square cropped • Max 512px
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setShowAvatarMenu(false);
                  avatarInputRef.current?.click();
                }}
                className="w-full py-2.5 px-4 rounded-full bg-[#FF2D20] hover:bg-[#E02619] text-white text-xs font-medium active:scale-[0.97] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Upload New Photo</span>
              </button>

              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="w-full py-2.5 px-4 rounded-full bg-black/5 dark:bg-[#1E1E1E] hover:bg-black/10 dark:hover:bg-[#262626] text-[#FF2D20] text-xs font-medium active:scale-[0.97] transition-all flex items-center justify-center gap-2 cursor-pointer border border-black/[0.08] dark:border-white/[0.08]"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove Photo</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAvatarMenu(false)}
                className="w-full py-2 px-4 rounded-full bg-black/5 dark:bg-[#1E1E1E] text-[#8E8E93] hover:text-black dark:hover:text-white text-xs font-mono active:scale-[0.97] transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
