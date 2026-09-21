import React, { useState } from 'react';
import {
  Bell,
  Clock,
  AlertTriangle,
  Volume2,
  VolumeX,
  Smartphone,
  RotateCcw,
  Download,
  ShieldAlert,
  Sparkles,
  Camera,
  Check,
  Zap,
  LogOut,
  User,
  Apple,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { AppSettings, Shoot, GearItem, PackingItem, UserProfile } from '../../types';
import { playAlertChime } from '../../services/storage';
import { IOSDownloadModal } from '../ios/IOSDownloadModal';

interface SettingsViewProps {
  settings: AppSettings;
  shoots: Shoot[];
  gear: GearItem[];
  packing: PackingItem[];
  user?: UserProfile | null;
  onLogout?: () => void;
  onSwitchAccount?: () => void;
  onUpdateSettings: (settings: AppSettings) => void;
  onResetData: () => void;
  onTriggerSimulatedAlert: (type: 'morning_review' | 'two_hour_critical') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  shoots,
  gear,
  packing,
  user,
  onLogout,
  onSwitchAccount,
  onUpdateSettings,
  onResetData,
  onTriggerSimulatedAlert,
}) => {
  const [morningTime, setMorningTime] = useState(settings.morningAlertTime || '06:00');
  const [photographerName, setPhotographerName] = useState(
    user?.name || settings.photographerName || ''
  );
  const [studioName, setStudioName] = useState(
    user?.studioName || settings.studioName || ''
  );
  const [browserPermState, setBrowserPermState] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [isIOSModalOpen, setIsIOSModalOpen] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      photographerName: photographerName.trim(),
      studioName: studioName.trim(),
      morningAlertTime: morningTime,
    });
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  const handleMorningTimeChange = (time: string) => {
    setMorningTime(time);
    onUpdateSettings({
      ...settings,
      morningAlertTime: time,
    });
  };

  const requestNotificationPermission = async () => {
    if (typeof Notification !== 'undefined') {
      try {
        const res = await Notification.requestPermission();
        setBrowserPermState(res);
        if (res === 'granted') {
          new Notification('Photo Gear Vault', {
            body: 'Push notifications activated. You will receive 6:00 AM packing alerts and 2-hour missing gear warnings.',
          });
        }
      } catch (err) {
        console.warn('Notification permission error:', err);
      }
    }
  };

  const handleExportJSON = () => {
    const data = {
      settings,
      gear,
      shoots,
      packing,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `photographer-vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="settings-view" className="pb-28 pt-3 px-4 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#D45B5B] font-mono">
          Preferences & Logic
        </span>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-0.5 font-display">
          Settings & Automations
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Configure day-of-shoot alerts, packing safeguards, and studio profile.
        </p>
      </div>

      {showSavedToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-xs">
          <Check className="w-4 h-4" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: DAY-OF-SHOOT ALERTS & AUTOMATIONS */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bright-card p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-[#FFF0F0] text-[#D45B5B] border border-[#F7ADAD]/60">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-display">
              Day-of-Shoot Alerts & Automations
            </h3>
            <p className="text-[11px] text-slate-500">
              Automated reminders to prevent forgotten equipment on set
            </p>
          </div>
        </div>

        {/* 1. Morning Review Alert Setting */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Clock className="w-3.5 h-3.5 text-[#D45B5B]" />
                <span>Morning-of-Shoot Packing Alert</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Automatically alerts the photographer on the morning of a booked shoot to inspect
                and finalize their packing list.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
              <input
                id="toggle-morning-alerts"
                type="checkbox"
                checked={settings.enableMorningAlerts}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, enableMorningAlerts: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#F29191] peer-checked:to-[#F7ADAD]" />
            </label>
          </div>

          {/* Time Picker & Presets */}
          <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500 font-medium">Trigger Time:</span>
            <div className="flex items-center gap-1.5">
              {['05:30', '06:00', '07:00'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleMorningTimeChange(preset)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold transition-all ${
                    morningTime === preset
                      ? 'bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {preset}
                </button>
              ))}
              <input
                id="input-morning-time"
                type="time"
                value={morningTime}
                onChange={(e) => handleMorningTimeChange(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-[#F29191] font-mono"
              />
            </div>
          </div>
        </div>

        {/* 2. Conditional 2-Hour Critical Alert Setting */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>2-Hour Missing Gear Critical Alarm</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                If a shoot begins in 2 hours and items on the packing list are still marked as
                &quot;Needed&quot; or &quot;Missing&quot; (not &quot;Packed&quot;), triggers a
                high-priority emergency alert.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
              <input
                id="toggle-two-hour-alert"
                type="checkbox"
                checked={settings.enableTwoHourCriticalAlert}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    enableTwoHourCriticalAlert: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-rose-500" />
            </label>
          </div>
        </div>

        {/* 3. Push Notification Permission & Sound */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            id="btn-request-notifications"
            onClick={requestNotificationPermission}
            className="p-3.5 rounded-2xl bg-white border border-slate-200 text-left hover:border-slate-300 transition-colors flex flex-col justify-between shadow-xs"
          >
            <div className="flex items-center gap-1.5 text-slate-900 text-xs font-bold">
              <Smartphone className="w-4 h-4 text-[#D45B5B]" />
              <span>Push Alerts</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-2">
              Status:{' '}
              <strong
                className={
                  browserPermState === 'granted'
                    ? 'text-emerald-600'
                    : browserPermState === 'denied'
                    ? 'text-rose-600'
                    : 'text-[#D45B5B]'
                }
              >
                {browserPermState}
              </strong>
            </span>
          </button>

          <button
            onClick={() => {
              const nextVal = !settings.soundEnabled;
              onUpdateSettings({ ...settings, soundEnabled: nextVal });
              if (nextVal) playAlertChime('shutter');
            }}
            className="p-3.5 rounded-2xl bg-white border border-slate-200 text-left hover:border-slate-300 transition-colors flex flex-col justify-between shadow-xs"
          >
            <div className="flex items-center gap-1.5 text-slate-900 text-xs font-bold">
              {settings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
              <span>Audio Chimes</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-2">
              {settings.soundEnabled ? 'Enabled (Shutter)' : 'Muted'}
            </span>
          </button>
        </div>

        {/* 4. Live Simulation Trigger Sandbox */}
        <div className="pt-3 border-t border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 font-mono">
            Automation Test Triggers (Instant Simulation)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              id="btn-simulate-morning-alert"
              onClick={() => {
                onTriggerSimulatedAlert('morning_review');
                if (settings.soundEnabled) playAlertChime('shutter');
              }}
              className="p-3 rounded-2xl bg-[#FFF0F0] hover:bg-[#FFE5E5] text-[#8B2020] border border-[#F7ADAD]/60 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Bell className="w-3.5 h-3.5 text-[#D45B5B]" />
              <span>Test 6:00 AM Alert</span>
            </button>

            <button
              id="btn-simulate-critical-alert"
              onClick={() => {
                onTriggerSimulatedAlert('two_hour_critical');
                if (settings.soundEnabled) playAlertChime('critical');
              }}
              className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Test 2-Hr Missing</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: AUTHENTICATED ACCOUNT & ACCESS */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bright-card p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#D45B5B]" />
            <h3 className="text-sm font-bold text-slate-900 font-display">
              Authenticated Account
            </h3>
          </div>
          {user?.provider === 'google' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              <svg className="w-3 h-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Google Account</span>
            </span>
          )}
          {user?.provider === 'apple' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-white border border-slate-700">
              <Apple className="w-3 h-3 fill-current" />
              <span>Apple ID</span>
            </span>
          )}
          {user?.provider === 'email' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              <Mail className="w-3 h-3" />
              <span>Email Verified</span>
            </span>
          )}
        </div>

        {user ? (
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F29191] to-[#F7ADAD] text-white flex items-center justify-center font-bold text-sm shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-extrabold text-slate-900 truncate">
                {user.name}
              </h4>
              <p className="text-[11px] text-slate-500 truncate">
                {user.email}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-slate-400">Role:</span>
                <span className="text-[10px] font-medium text-slate-700 truncate">
                  {user.role || 'Pro Photographer'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            Using guest vault profile. Sign in with Google or Apple to sync shoots across devices.
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          {onSwitchAccount && (
            <button
              id="btn-settings-switch-account"
              type="button"
              onClick={onSwitchAccount}
              className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Switch Account</span>
            </button>
          )}
          {onLogout && (
            <button
              id="btn-settings-sign-out"
              type="button"
              onClick={onLogout}
              className="py-2.5 px-3 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: PHOTOGRAPHER & STUDIO PROFILE */}
      {/* ========================================================================= */}
      <form
        onSubmit={handleSaveProfile}
        className="rounded-3xl bright-card p-5 space-y-4 shadow-xs"
      >
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
          <Camera className="w-4 h-4 text-[#D45B5B]" />
          <h3 className="text-sm font-bold text-slate-900 font-display">Photographer Profile</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Photographer Name
            </label>
            <input
              id="settings-input-photographer-name"
              type="text"
              value={photographerName}
              onChange={(e) => setPhotographerName(e.target.value)}
              placeholder="e.g., Alex Rivera"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F29191]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Studio / Brand Name
            </label>
            <input
              id="settings-input-studio-name"
              type="text"
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              placeholder="e.g., Lumina Studios"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F29191]"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-full bg-gradient-to-r from-[#F29191] to-[#F7ADAD] hover:brightness-105 text-white text-xs font-extrabold active:scale-95 transition-all shadow-md shadow-[#F29191]/30"
        >
          Save Profile Details
        </button>
      </form>

      {/* ========================================================================= */}
      {/* SECTION 3: IOS MOBILE APP INSTALLATION */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bright-card p-5 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#D45B5B]" />
            <h3 className="text-sm font-bold text-slate-900 font-display">
              Download for iOS
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#CCFBFA] text-[#0F4E50] border border-[#B1E5E6]">
            iPhone & iPad
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Install the full standalone version on your iPhone home screen with offline gear caching, full-screen viewport, and high-performance camera tools.
        </p>

        <button
          id="btn-settings-open-ios-modal"
          onClick={() => setIsIOSModalOpen(true)}
          className="w-full py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Smartphone className="w-4 h-4 text-[#F29191]" />
          <span>Open iOS Download & Installation Guide</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: DATA MANAGEMENT & BACKUP */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bright-card p-5 space-y-3.5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 pb-2.5 border-b border-slate-100 font-display">
          Data & Backup
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleExportJSON}
            className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 hover:bg-slate-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#D45B5B]" />
            <span>Export JSON Backup</span>
          </button>

          <button
            onClick={() => {
              if (
                confirm(
                  'Reset all gear, shoots, and moodboards back to initial demo data?'
                )
              ) {
                onResetData();
              }
            }}
            className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* iOS Download Modal */}
      <IOSDownloadModal
        isOpen={isIOSModalOpen}
        onClose={() => setIsIOSModalOpen(false)}
      />
    </div>
  );
};
