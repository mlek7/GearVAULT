import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Clock,
  AlertTriangle,
  Volume2,
  VolumeX,
  Check,
  Zap,
  LogOut,
  User,
  Sun,
  Moon,
  Monitor,
  Thermometer,
  Calendar,
  Sliders,
  ChevronRight,
  Shield,
  Trash2,
  HelpCircle,
  FileText,
  X,
  ExternalLink,
  Camera,
  Upload,
  RotateCcw,
  Loader2,
  Mail,
} from 'lucide-react';
import {
  AppSettings,
  UserProfile,
  ThemeMode,
  TempUnit,
  TimeFormat,
  DateFormat,
} from '../../types';
import { StorageService, playAlertChime } from '../../services/storage';
import { processProfilePhoto } from '../../utils/imageUtils';
import { AuthService } from '../../services/authService';
import { LegalModal } from '../legal/LegalModal';

interface SettingsViewProps {
  settings: AppSettings;
  user: UserProfile | null;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onUpdateUser?: (updatedUser: UserProfile) => void;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
  onResetData: () => void;
  onToggleTheme?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  user,
  onUpdateSettings,
  onUpdateUser,
  onLogout,
  onDeleteAccount,
  onResetData,
}) => {
  const [morningTime, setMorningTime] = useState(settings.morningAlertTime || '06:00');
  const [photographerName, setPhotographerName] = useState(
    settings.photographerName || user?.name || ''
  );
  const [studioName, setStudioName] = useState(
    settings.studioName || user?.studioName || ''
  );
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Settings saved');

  // Photo upload states
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Dialogs
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showDeleteDataConfirm, setShowDeleteDataConfirm] = useState(false);
  const [showResetDataConfirm, setShowResetDataConfirm] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    setMorningTime(settings.morningAlertTime || '06:00');
    setPhotographerName(settings.photographerName || user?.name || '');
    setStudioName(settings.studioName || user?.studioName || '');
  }, [settings, user]);

  const triggerSavedToast = (msg: string = 'Settings saved') => {
    setToastMessage(msg);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingPhoto(true);
    setPhotoError(null);

    try {
      const croppedJpegDataUrl = await processProfilePhoto(file);
      const updatedUser = await AuthService.updateUserProfile({ avatarUrl: croppedJpegDataUrl });
      if (updatedUser && onUpdateUser) {
        onUpdateUser(updatedUser);
      }
      triggerSavedToast('Profile photo updated');
    } catch (err: any) {
      setPhotoError(err.message || 'Failed to process photo');
    } finally {
      setIsProcessingPhoto(false);
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async () => {
    setIsProcessingPhoto(true);
    setPhotoError(null);
    try {
      const updatedUser = await AuthService.updateUserProfile({ avatarUrl: undefined });
      if (updatedUser && onUpdateUser) {
        onUpdateUser(updatedUser);
      }
      triggerSavedToast('Profile photo removed');
    } catch (err: any) {
      setPhotoError(err.message || 'Failed to remove photo');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handlePerformResetData = () => {
    onResetData();
    setShowResetDataConfirm(false);
    triggerSavedToast('All data has been reset');
  };

  const handleThemeChange = (mode: ThemeMode) => {
    const updated = { ...settings, theme: mode };
    onUpdateSettings(updated);
    triggerSavedToast();
  };

  const handleTempUnitChange = (unit: TempUnit) => {
    const updated = { ...settings, tempUnit: unit };
    onUpdateSettings(updated);
    triggerSavedToast();
  };

  const handleTimeFormatChange = (fmt: TimeFormat) => {
    const updated = { ...settings, timeFormat: fmt };
    onUpdateSettings(updated);
    triggerSavedToast();
  };

  const handleDateFormatChange = (fmt: DateFormat) => {
    const updated = { ...settings, dateFormat: fmt };
    onUpdateSettings(updated);
    triggerSavedToast();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = photographerName.trim();
    const cleanStudio = studioName.trim();
    const updated = {
      ...settings,
      photographerName: cleanName,
      studioName: cleanStudio,
    };
    onUpdateSettings(updated);
    // Also save to the account so the header updates now and other devices get it
    const updatedUser = await AuthService.updateUserProfile({
      ...(cleanName ? { name: cleanName } : {}),
      studioName: cleanStudio,
    });
    if (updatedUser && onUpdateUser) {
      onUpdateUser(updatedUser);
    }
    triggerSavedToast('Profile saved');
  };

  const handleMorningTimeSelect = (time24: string) => {
    setMorningTime(time24);
    const updated = { ...settings, morningAlertTime: time24 };
    onUpdateSettings(updated);
    triggerSavedToast();
  };

  // Convert "HH:mm" 24h to display string according to timeFormat
  const formatTriggerTimeDisplay = (timeStr: string) => {
    if (!timeStr) return '06:00';
    const [hStr, mStr] = timeStr.split(':');
    const h = parseInt(hStr, 10);
    const m = mStr || '00';
    if (settings.timeFormat === '12h') {
      const period = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${m} ${period}`;
    }
    return `${String(h).padStart(2, '0')}:${m}`;
  };

  // Time preset options formatted according to timeFormat (Requirement 3)
  const timePresets = [
    { value: '05:30', label: settings.timeFormat === '12h' ? '5:30 AM' : '05:30' },
    { value: '06:00', label: settings.timeFormat === '12h' ? '6:00 AM' : '06:00' },
    { value: '07:00', label: settings.timeFormat === '12h' ? '7:00 AM' : '07:00' },
    { value: '08:00', label: settings.timeFormat === '12h' ? '8:00 AM' : '08:00' },
  ];

  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);

  const handlePerformDeleteAll = async () => {
    setIsDeletingAccount(true);
    try {
      if (onDeleteAccount) {
        await onDeleteAccount();
      } else {
        await AuthService.deleteAccountAndData();
        StorageService.clearAll();
        if (onLogout) onLogout();
      }
    } catch (err: any) {
      console.error('Failed to delete account:', err);
      alert(
        err?.message ||
          'Could not delete account. If you have been signed in for a long time, please sign out, sign back in, and try deleting again.'
      );
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteDataConfirm(false);
    }
  };

  return (
    <div id="settings-view" className="pb-28 pt-3 px-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-4">
        <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#6E6E73] dark:text-[#8E8E93]">
          Preferences & Account
        </span>
        <h1 className="text-2xl font-normal tracking-[-0.03em] text-black dark:text-white mt-0.5">
          Settings
        </h1>
      </div>

      {showSavedToast && (
        <div className="mb-4 p-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[#30D158] text-xs font-medium flex items-center gap-2 shadow-xs animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: DISPLAY (Pulsar Card) */}
      {/* ========================================================================= */}
      <div className="mb-6">
        <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#6E6E73] dark:text-[#8E8E93] px-3 block mb-2">
          Display & Regional
        </span>
        <div className="rounded-[28px] bg-[#FFFFFF] dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] divide-y divide-black/[0.06] dark:divide-white/[0.06] overflow-hidden text-xs">
          {/* 1. Appearance / Dark Mode */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] flex items-center justify-center text-black dark:text-white">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <div className="font-normal text-black dark:text-white">Appearance</div>
                <div className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93]">Theme mode</div>
              </div>
            </div>

            <div className="flex items-center bg-[#EBEBEB] dark:bg-[#1E1E1E] p-1 rounded-full">
              {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleThemeChange(mode)}
                  className={`px-3 py-1 min-h-[30px] rounded-full text-xs font-medium capitalize transition-all cursor-pointer ${
                    (settings.theme || 'system') === mode
                      ? 'bg-[#FFFFFF] dark:bg-[#3A3A3C] text-black dark:text-white shadow-xs'
                      : 'text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Temperature Unit */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] flex items-center justify-center text-black dark:text-white">
                <Thermometer className="w-4 h-4" />
              </div>
              <div>
                <div className="font-normal text-black dark:text-white">Temperature Unit</div>
                <div className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93]">Forecast units</div>
              </div>
            </div>

            <div className="flex items-center bg-[#EBEBEB] dark:bg-[#1E1E1E] p-1 rounded-full">
              <button
                type="button"
                onClick={() => handleTempUnitChange('C')}
                className={`px-3 py-1 min-h-[30px] rounded-full text-xs font-medium transition-all cursor-pointer ${
                  (settings.tempUnit || 'C') === 'C'
                    ? 'bg-[#FFFFFF] dark:bg-[#3A3A3C] text-black dark:text-white shadow-xs'
                    : 'text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white'
                }`}
              >
                °C
              </button>
              <button
                type="button"
                onClick={() => handleTempUnitChange('F')}
                className={`px-3 py-1 min-h-[30px] rounded-full text-xs font-medium transition-all cursor-pointer ${
                  settings.tempUnit === 'F'
                    ? 'bg-[#FFFFFF] dark:bg-[#3A3A3C] text-black dark:text-white shadow-xs'
                    : 'text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white'
                }`}
              >
                °F
              </button>
            </div>
          </div>

          {/* 3. Time Format (Requirement 3: strictly respects 24h / 12h) */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] flex items-center justify-center text-black dark:text-white">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-normal text-black dark:text-white">Time Format</div>
                <div className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93]">Golden hour & shoot time display</div>
              </div>
            </div>

            <div className="flex items-center bg-[#EBEBEB] dark:bg-[#1E1E1E] p-1 rounded-full">
              <button
                type="button"
                onClick={() => handleTimeFormatChange('24h')}
                className={`px-3 py-1 min-h-[30px] rounded-full text-xs font-medium transition-all cursor-pointer ${
                  (settings.timeFormat || '24h') === '24h'
                    ? 'bg-[#FFFFFF] dark:bg-[#3A3A3C] text-black dark:text-white shadow-xs'
                    : 'text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white'
                }`}
              >
                24h
              </button>
              <button
                type="button"
                onClick={() => handleTimeFormatChange('12h')}
                className={`px-3 py-1 min-h-[30px] rounded-full text-xs font-medium transition-all cursor-pointer ${
                  settings.timeFormat === '12h'
                    ? 'bg-[#FFFFFF] dark:bg-[#3A3A3C] text-black dark:text-white shadow-xs'
                    : 'text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white'
                }`}
              >
                12h
              </button>
            </div>
          </div>

          {/* 4. Date Format */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] flex items-center justify-center text-black dark:text-white">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="font-normal text-black dark:text-white">Date Format</div>
                <div className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93]">Booking schedule format</div>
              </div>
            </div>

            <div className="flex items-center bg-[#EBEBEB] dark:bg-[#1E1E1E] p-1 rounded-full">
              {(['dd/mm/yyyy', 'mm/dd/yyyy', 'yyyy-mm-dd'] as DateFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => handleDateFormatChange(fmt)}
                  className={`px-2.5 py-1 min-h-[30px] rounded-full text-[11px] font-mono transition-all cursor-pointer ${
                    (settings.dateFormat || 'dd/mm/yyyy') === fmt
                      ? 'bg-[#FFFFFF] dark:bg-[#3A3A3C] text-black dark:text-white shadow-xs'
                      : 'text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white'
                  }`}
                >
                  {fmt === 'dd/mm/yyyy' ? 'dd/mm' : fmt === 'mm/dd/yyyy' ? 'mm/dd' : 'yyyy'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: ALERTS (Pulsar Card) */}
      {/* ========================================================================= */}
      <div className="mb-6">
        <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#6E6E73] dark:text-[#8E8E93] px-3 block mb-2">
          Alerts & Reminders
        </span>
        <div className="rounded-[28px] bg-[#FFFFFF] dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] divide-y divide-black/[0.06] dark:divide-white/[0.06] overflow-hidden text-xs">
          {/* 1. Morning Packing Alert Toggle */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] flex items-center justify-center text-black dark:text-white">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="font-normal text-black dark:text-white">Morning-of-Shoot Alert</div>
                <div className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93]">Trigger gear check on shoot day</div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                id="toggle-morning-alerts"
                type="checkbox"
                checked={settings.enableMorningAlerts}
                onChange={(e) => {
                  onUpdateSettings({ ...settings, enableMorningAlerts: e.target.checked });
                  triggerSavedToast();
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#EBEBEB] dark:bg-[#1E1E1E] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-black/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF2D20]" />
            </label>
          </div>

          {/* 2. Trigger Time Selector (Requirement 3: strictly respects 24h / 12h format everywhere) */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] flex items-center justify-center text-black dark:text-white">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-normal text-black dark:text-white">Trigger Time</div>
                  <div className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93]">
                    Active: <strong className="font-mono text-black dark:text-white">{formatTriggerTimeDisplay(morningTime)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Presets formatted according to 12h/24h setting */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {timePresets.map(({ value, label }) => {
                const isSelected = morningTime === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleMorningTimeSelect(value)}
                    className={`py-2 px-1 min-h-[36px] rounded-full text-center font-mono text-xs transition-all cursor-pointer active:scale-[0.97] ${
                      isSelected
                        ? 'bg-[#FF2D20] text-white font-medium shadow-xs'
                        : 'bg-[#EBEBEB] dark:bg-[#1E1E1E] text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. 2-Hour Critical Alarm Toggle */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] flex items-center justify-center text-[#FF2D20]">
                <AlertTriangle className="w-4 h-4 text-[#FF2D20]" />
              </div>
              <div>
                <div className="font-normal text-black dark:text-white">2-Hour Missing Gear Alarm</div>
                <div className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93]">Urgent alarm if items remain unpacked</div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                id="toggle-two-hour-alert"
                type="checkbox"
                checked={settings.enableTwoHourCriticalAlert}
                onChange={(e) => {
                  onUpdateSettings({
                    ...settings,
                    enableTwoHourCriticalAlert: e.target.checked,
                  });
                  triggerSavedToast();
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#EBEBEB] dark:bg-[#1E1E1E] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-black/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF2D20]" />
            </label>
          </div>

          {/* 4. Alert Sound Effects */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] flex items-center justify-center text-black dark:text-white">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-black dark:text-white" />
                ) : (
                  <VolumeX className="w-4 h-4 text-[#8E8E93]" />
                )}
              </div>
              <div>
                <div className="font-normal text-black dark:text-white">Sound Effects</div>
                <div className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93]">Alert chimes & packing clicks</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => playAlertChime('morning')}
                className="text-[11px] font-mono text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white px-3 py-1 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] cursor-pointer"
              >
                Test
              </button>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  id="toggle-sound"
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => {
                    onUpdateSettings({ ...settings, soundEnabled: e.target.checked });
                    triggerSavedToast();
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#EBEBEB] dark:bg-[#1E1E1E] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-black/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF2D20]" />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: ACCOUNT & DATA (Pulsar Card) */}
      {/* ========================================================================= */}
      <div className="mb-6">
        <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#6E6E73] dark:text-[#8E8E93] px-3 block mb-2">
          Account & Studio
        </span>
        <div className="rounded-[28px] bg-[#FFFFFF] dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] divide-y divide-black/[0.06] dark:divide-white/[0.06] overflow-hidden text-xs">
          {/* Profile Photo (Requirement 7: avatar gets 20px radius, no borders) */}
          <div className="p-4 flex items-center justify-between">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-[20px] bg-[#EBEBEB] dark:bg-[#1E1E1E] text-black dark:text-white flex items-center justify-center font-mono font-medium text-sm shadow-xs overflow-hidden shrink-0">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={photographerName || 'Profile'}
                    className="w-full h-full object-cover rounded-[20px]"
                  />
                ) : (
                  <span>{(photographerName || user?.name || 'Photographer').slice(0, 2).toUpperCase()}</span>
                )}
                {isProcessingPhoto && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div>
                <div className="font-normal text-black dark:text-white">Profile Photo</div>
                <div className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93]">
                  {user?.avatarUrl ? 'Photo active' : 'Initial fallback active'}
                </div>
                {photoError && (
                  <div className="text-[10px] text-[#FF2D20] mt-0.5">{photoError}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={isProcessingPhoto}
                className="px-3.5 py-1.5 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] hover:bg-[#262626] text-black dark:text-white font-medium text-xs active:scale-[0.97] transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{user?.avatarUrl ? 'Change' : 'Upload'}</span>
              </button>
              {user?.avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={isProcessingPhoto}
                  className="px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-[#FF2D20] font-medium text-xs active:scale-[0.97] transition-all cursor-pointer"
                  title="Remove photo"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Profile Name & Studio Editor */}
          <form onSubmit={handleSaveProfile} className="p-4 space-y-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.08em] text-[#6E6E73] dark:text-[#8E8E93] mb-1">
                Photographer Name
              </label>
              <input
                id="input-photographer-name"
                type="text"
                value={photographerName}
                onChange={(e) => setPhotographerName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] rounded-full px-3.5 py-2 text-xs text-black dark:text-white focus:outline-none focus:border-[#FF2D20]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.08em] text-[#6E6E73] dark:text-[#8E8E93] mb-1">
                Studio Name
              </label>
              <input
                id="input-studio-name"
                type="text"
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                placeholder="Studio name"
                className="w-full bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] rounded-full px-3.5 py-2 text-xs text-black dark:text-white focus:outline-none focus:border-[#FF2D20]"
              />
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="submit"
                className="min-h-[36px] px-5 rounded-full bg-black dark:bg-[#3A3A3C] text-white text-xs font-medium active:scale-[0.97] transition-all cursor-pointer"
              >
                Save Profile
              </button>
            </div>
          </form>

          {/* User Identity info */}
          {user && (
            <div className="p-4 flex items-center justify-between">
              <div>
                <div className="font-normal text-black dark:text-white">{user.email}</div>
                <div className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93] capitalize">
                  Auth via {user.provider}
                </div>
              </div>
              <span className="text-[10px] font-mono bg-[#EBEBEB] dark:bg-[#1E1E1E] px-2.5 py-0.5 rounded-full text-[#6E6E73] dark:text-[#8E8E93]">
                Connected
              </span>
            </div>
          )}

          {/* Reset All Data Button (Requirement 4) */}
          <div className="p-3">
            <button
              type="button"
              id="btn-settings-reset-data"
              onClick={() => setShowResetDataConfirm(true)}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-full text-[#FFD60A] hover:bg-black/5 dark:hover:bg-white/5 font-medium text-xs flex items-center justify-center gap-2 active:scale-[0.97] transition-all cursor-pointer font-mono"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RESET ALL DATA</span>
            </button>
          </div>

          {/* Sign Out Button */}
          {onLogout && (
            <div className="p-3">
              <button
                type="button"
                id="btn-settings-signout"
                onClick={() => setShowSignOutConfirm(true)}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-full text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 font-medium text-xs flex items-center justify-center gap-2 active:scale-[0.97] transition-all cursor-pointer font-mono"
              >
                <LogOut className="w-4 h-4 text-[#8E8E93]" />
                <span>SIGN OUT</span>
              </button>
            </div>
          )}

          {/* Delete Account & Data Button */}
          <div className="p-3">
            <button
              type="button"
              id="btn-settings-delete-account"
              onClick={() => setShowDeleteDataConfirm(true)}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-full text-[#FF2D20] hover:bg-rose-500/10 font-medium text-xs flex items-center justify-center gap-2 active:scale-[0.97] transition-all cursor-pointer font-mono"
            >
              <Trash2 className="w-4 h-4" />
              <span>DELETE ACCOUNT & DATA</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: ABOUT (Pulsar Card) */}
      {/* ========================================================================= */}
      <div className="mb-6">
        <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#6E6E73] dark:text-[#8E8E93] px-3 block mb-2">
          About &amp; Legal
        </span>
        <div className="rounded-[28px] bg-[#FFFFFF] dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] divide-y divide-black/[0.06] dark:divide-white/[0.06] overflow-hidden text-xs">
          {/* App Version */}
          <div className="p-4 flex items-center justify-between">
            <div className="font-normal text-black dark:text-white">App Version</div>
            <span className="font-mono text-[#6E6E73] dark:text-[#8E8E93]">Lightbag 1.0.0 (Build 1)</span>
          </div>

          {/* Privacy Policy */}
          <button
            type="button"
            onClick={() => setLegalModalType('privacy')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-[#8E8E93]" />
              <span className="font-normal text-black dark:text-white">Privacy Policy</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8E8E93]" />
          </button>

          {/* Terms of Use */}
          <button
            type="button"
            onClick={() => setLegalModalType('terms')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-[#8E8E93]" />
              <span className="font-normal text-black dark:text-white">Terms of Use</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8E8E93]" />
          </button>

          {/* Contact Support Link (Requirement 4) */}
          <a
            href="mailto:melek.ben.moussa97@gmail.com"
            className="w-full p-4 flex items-center justify-between text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-[#8E8E93]" />
              <div>
                <span className="font-normal text-black dark:text-white block">Contact Support</span>
                <span className="text-[11px] font-mono text-[#6E6E73] dark:text-[#8E8E93]">melek.ben.moussa97@gmail.com</span>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-[#8E8E93]" />
          </a>
        </div>
      </div>

      {/* Confirmation Dialog: Sign Out */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#FFFFFF] dark:bg-[#121212] rounded-[28px] p-6 border border-black/[0.08] dark:border-white/[0.08] shadow-2xl text-center">
            <h3 className="text-base font-normal tracking-[-0.03em] text-black dark:text-white">
              Sign Out?
            </h3>
            <p className="text-xs text-[#6E6E73] dark:text-[#8E8E93] mt-1 mb-5">
              Are you sure you want to sign out of your account?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                className="min-h-[44px] py-2.5 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] text-black dark:text-white text-xs font-medium active:scale-[0.97] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSignOutConfirm(false);
                  if (onLogout) onLogout();
                }}
                className="min-h-[44px] py-2.5 rounded-full bg-black dark:bg-[#3A3A3C] text-white text-xs font-medium active:scale-[0.97] cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Reset All Data (Requirement 4) */}
      {showResetDataConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#FFFFFF] dark:bg-[#121212] rounded-[28px] p-6 border border-black/[0.08] dark:border-white/[0.08] shadow-2xl text-center">
            <div className="w-10 h-10 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] text-[#FFD60A] flex items-center justify-center mx-auto mb-3">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="text-base font-normal tracking-[-0.03em] text-black dark:text-white">
              Reset All Data?
            </h3>
            <p className="text-xs text-[#6E6E73] dark:text-[#8E8E93] mt-1 mb-5 leading-relaxed">
              This will clear all gear inventory, scheduled shoots, packing checklists, moodboards, and saved locations. Your account profile and login will be preserved.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowResetDataConfirm(false)}
                className="min-h-[44px] py-2.5 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] text-black dark:text-white text-xs font-medium active:scale-[0.97] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-reset-all"
                onClick={handlePerformResetData}
                className="min-h-[44px] py-2.5 rounded-full bg-[#FFD60A] hover:bg-[#E5C009] text-black text-xs font-medium active:scale-[0.97] cursor-pointer"
              >
                Reset All Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Delete Account & Data (Requirement 3) */}
      {showDeleteDataConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#FFFFFF] dark:bg-[#121212] rounded-[28px] p-6 border border-black/[0.08] dark:border-white/[0.08] shadow-2xl text-center">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-[#FF2D20] flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-normal tracking-[-0.03em] text-black dark:text-white">
              Delete Account &amp; All Data?
            </h3>
            <p className="text-xs text-[#6E6E73] dark:text-[#8E8E93] mt-1 mb-5 leading-relaxed">
              This will permanently delete your photographer profile, gear vault inventory, scheduled shoots, packing checklists, moodboard images, and Firebase account. This action is irreversible.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isDeletingAccount}
                onClick={() => setShowDeleteDataConfirm(false)}
                className="min-h-[44px] py-2.5 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] text-black dark:text-white text-xs font-medium active:scale-[0.97] cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-forever"
                disabled={isDeletingAccount}
                onClick={handlePerformDeleteAll}
                className="min-h-[44px] py-2.5 rounded-full bg-[#FF2D20] hover:bg-[#E02619] text-white text-xs font-medium active:scale-[0.97] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Forever</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legal Modal (Privacy & Terms) */}
      <LegalModal
        type={legalModalType || 'privacy'}
        isOpen={legalModalType !== null}
        onClose={() => setLegalModalType(null)}
      />
    </div>
  );
};
