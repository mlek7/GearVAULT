import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  GearItem,
  Shoot,
  PackingItem,
  MoodboardItem,
  AppSettings,
  AlertNotification,
  NavigationTab,
  UserProfile,
  ThemeMode,
} from './types';
import { StorageService, playAlertChime } from './services/storage';
import {
  sanitizeGearList,
  sanitizeShootsList,
  sanitizePackingList,
  sanitizeMoodboardsList,
  sanitizeSettings,
} from './utils/demoCleanup';
import { AuthService } from './services/authService';
import { evaluateShootAlerts, formatShootTime } from './utils/dateUtils';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/dashboard/DashboardView';
import { ShootSchedulerView } from './components/shoots/ShootSchedulerView';
import { GearVaultView } from './components/gear/GearVaultView';
import { SettingsView } from './components/settings/SettingsView';
import { ShootHubView } from './components/shoots/ShootHubView';
import { WeatherForecastView } from './components/weather/WeatherForecastView';
import { MoodboardsView } from './components/moodboard/MoodboardsView';
import { AlertsBottomSheet } from './components/alerts/AlertsBottomSheet';
import { ShootModal } from './components/shoots/ShootModal';
import { GearModal } from './components/gear/GearModal';
import { LoginView } from './components/auth/LoginView';

export default function App() {
  // Authentication gate state
  const [user, setUser] = useState<UserProfile | null>(() =>
    AuthService.getCurrentUser()
  );

  // State initialization from persistent storage
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [activeShootId, setActiveShootId] = useState<string | null>(null);

  const [gear, setGear] = useState<GearItem[]>(() => StorageService.getGear());
  const [shoots, setShoots] = useState<Shoot[]>(() => StorageService.getShoots());
  const [packing, setPacking] = useState<PackingItem[]>(() => StorageService.getPacking());
  const [moodboards, setMoodboards] = useState<MoodboardItem[]>(() =>
    StorageService.getMoodboards()
  );
  const [settings, setSettings] = useState<AppSettings>(() =>
    StorageService.getSettings()
  );
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());
  const [simulatedAlerts, setSimulatedAlerts] = useState<AlertNotification[]>([]);
  const [isAlertsSheetOpen, setIsAlertsSheetOpen] = useState(false);

  // Global modals for dashboard shortcuts
  const [isGlobalShootModalOpen, setIsGlobalShootModalOpen] = useState(false);
  const [isGlobalGearModalOpen, setIsGlobalGearModalOpen] = useState(false);

  // Apply theme (Light / Dark / System)
  useEffect(() => {
    const root = document.documentElement;
    const theme = settings.theme || 'system';

    const applyDark = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
        document.body.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        document.body.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    if (theme === 'dark') {
      applyDark(true);
    } else if (theme === 'light') {
      applyDark(false);
    } else {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyDark(mediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => applyDark(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [settings.theme]);

  const handleToggleTheme = () => {
    setSettings((prev) => {
      const isCurrentlyDark = document.documentElement.classList.contains('dark');
      const nextTheme: ThemeMode = isCurrentlyDark ? 'light' : 'dark';
      const updated = { ...prev, theme: nextTheme };
      StorageService.saveSettings(updated);
      return updated;
    });
  };

  // Sync to local storage
  useEffect(() => {
    StorageService.saveGear(gear);
  }, [gear]);

  useEffect(() => {
    StorageService.saveShoots(shoots);
  }, [shoots]);

  useEffect(() => {
    StorageService.savePacking(packing);
  }, [packing]);

  useEffect(() => {
    StorageService.saveMoodboards(moodboards);
  }, [moodboards]);

  useEffect(() => {
    StorageService.saveSettings(settings);
  }, [settings]);

  // Sync any local accounts on this device to the central server
  useEffect(() => {
    AuthService.syncLocalAccountsToServer().catch(() => {});
  }, []);

  // Keep profile (name, studio, photo) in sync across devices:
  // refresh on login, when the app comes back to the foreground, and every 60s
  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;
    const refresh = async () => {
      const fresh = await AuthService.refreshFromServer();
      if (cancelled || !fresh) return;
      setUser(fresh);
      setSettings((prev) => ({
        ...prev,
        photographerName: fresh.name || prev.photographerName,
        studioName: fresh.studioName ?? prev.studioName,
      }));
    };
    refresh();
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    const interval = window.setInterval(refresh, 60000);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(interval);
    };
  }, [user?.email]);

  // Cross-device Server Vault Sync: Load saved vault from server on login
  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const fetchServerVault = async () => {
      try {
        const query = new URLSearchParams();
        if (user.id) query.set('userId', user.id);
        if (user.email) query.set('email', user.email);

        const res = await fetch(`/api/vault/load?${query.toString()}`);
        if (!res.ok) return;
        const json = await res.json();
        if (!isMounted || !json.vaultData) return;

        const data = json.vaultData;
        const cleanedGear = sanitizeGearList(data.gear || []);
        const cleanedShoots = sanitizeShootsList(data.shoots || []);
        const cleanedPacking = sanitizePackingList(data.packing || []);
        const cleanedMoodboards = sanitizeMoodboardsList(data.moodboards || []);
        const cleanedSettings = sanitizeSettings(data.settings);

        if (Array.isArray(data.gear)) {
          setGear(cleanedGear);
          StorageService.saveGear(cleanedGear);
        }
        if (Array.isArray(data.shoots)) {
          setShoots(cleanedShoots);
          StorageService.saveShoots(cleanedShoots);
        }
        if (Array.isArray(data.packing)) {
          setPacking(cleanedPacking);
          StorageService.savePacking(cleanedPacking);
        }
        if (Array.isArray(data.moodboards)) {
          setMoodboards(cleanedMoodboards);
          StorageService.saveMoodboards(cleanedMoodboards);
        }
        if (data.settings && typeof data.settings === 'object') {
          setSettings((prev) => ({ ...prev, ...cleanedSettings }));
        }
      } catch (err) {
        console.warn('Silent server vault load info:', err);
      }
    };
    fetchServerVault();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Automatic Background Server Vault Backup (Silent sync every 30 seconds when changed)
  const isDataDirtyRef = React.useRef(false);
  useEffect(() => {
    isDataDirtyRef.current = true;
  }, [gear, shoots, packing, moodboards, settings]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      if (!isDataDirtyRef.current) return;
      try {
        const payloadGear = sanitizeGearList(gear);
        const payloadShoots = sanitizeShootsList(shoots);
        const payloadPacking = sanitizePackingList(packing);
        const payloadMoodboards = sanitizeMoodboardsList(moodboards);
        const payloadSettings = sanitizeSettings(settings);

        await fetch('/api/vault/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            vaultData: {
              gear: payloadGear,
              shoots: payloadShoots,
              packing: payloadPacking,
              moodboards: payloadMoodboards,
              settings: payloadSettings,
            },
          }),
        });
        isDataDirtyRef.current = false;
      } catch (e) {
        // silent fail
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [user, gear, shoots, packing, moodboards, settings]);

  // Active alerts evaluation
  const activeAlerts = useMemo(() => {
    const evaluated = evaluateShootAlerts(shoots, packing, gear, settings);
    const combined = [...simulatedAlerts, ...evaluated];
    return combined.filter((a) => !dismissedAlertIds.has(a.id));
  }, [shoots, packing, gear, settings, simulatedAlerts, dismissedAlertIds]);

  // Alert dismiss
  const handleDismissAlert = useCallback((alertId: string) => {
    setDismissedAlertIds((prev) => new Set(prev).add(alertId));
  }, []);

  const handleClearAllAlerts = useCallback(() => {
    setDismissedAlertIds(new Set(activeAlerts.map((a) => a.id)));
  }, [activeAlerts]);

  // Shoot management
  const handleAddShoot = (newShoot: Shoot) => {
    setShoots((prev) => [newShoot, ...prev]);
  };

  const handleUpdateShoot = (updatedShoot: Shoot) => {
    setShoots((prev) =>
      prev.map((s) => (s.id === updatedShoot.id ? updatedShoot : s))
    );
  };

  const handleDeleteShoot = (shootId: string) => {
    setShoots((prev) => prev.filter((s) => s.id !== shootId));
    setPacking((prev) => prev.filter((p) => p.shootId !== shootId));
    setMoodboards((prev) => prev.filter((m) => m.shootId !== shootId));
    if (activeShootId === shootId) {
      setActiveShootId(null);
    }
  };

  // Gear management
  const handleAddGear = (newGear: GearItem) => {
    setGear((prev) => [newGear, ...prev]);
  };

  const handleUpdateGear = (updatedGear: GearItem) => {
    setGear((prev) =>
      prev.map((g) => (g.id === updatedGear.id ? updatedGear : g))
    );
  };

  const handleDeleteGear = (gearId: string) => {
    setGear((prev) => prev.filter((g) => g.id !== gearId));
    setPacking((prev) => prev.filter((p) => p.gearId !== gearId));
  };

  // Packing management
  const handleUpdatePackingItem = (updatedItem: PackingItem) => {
    setPacking((prev) =>
      prev.map((p) => (p.id === updatedItem.id ? updatedItem : p))
    );
  };

  const handleAddPackingItems = (newItems: PackingItem[]) => {
    setPacking((prev) => [...newItems, ...prev]);
  };

  const handleDeletePackingItem = (id: string) => {
    setPacking((prev) => prev.filter((p) => p.id !== id));
  };

  // Moodboard actions
  const handleAddMoodboardItem = (item: MoodboardItem) => {
    setMoodboards((prev) => [item, ...prev]);
  };

  const handleDeleteMoodboardItem = (id: string) => {
    setMoodboards((prev) => prev.filter((m) => m.id !== id));
  };

  // Reset all data (Requirement 4)
  const handleResetData = async () => {
    StorageService.resetAll();
    setGear([]);
    setShoots([]);
    setPacking([]);
    setMoodboards([]);
    const resetSettings = StorageService.getSettings();
    resetSettings.selectedCity = '';
    setSettings(resetSettings);
    setDismissedAlertIds(new Set());
    setSimulatedAlerts([]);
    setActiveShootId(null);

    // If logged in, also sync empty vault to server
    if (user) {
      try {
        await fetch('/api/vault/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            vaultData: {
              gear: [],
              shoots: [],
              packing: [],
              moodboards: [],
              settings: resetSettings,
            },
          }),
        });
      } catch (err) {
        console.warn('Silent server vault reset notice:', err);
      }
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    setUser(null);
  };

  const handleDeleteAccount = () => {
    StorageService.clearAll();
    AuthService.logout();
    setUser(null);
  };

  const handleLoginSuccess = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    setSettings((prev) => {
      const updated = {
        ...prev,
        photographerName: loggedInUser.name,
        studioName: loggedInUser.studioName || prev.studioName,
      };
      StorageService.saveSettings(updated);
      return updated;
    });
  };

  // Active Shoot for Shoot Hub
  const activeShoot = useMemo(
    () => shoots.find((s) => s.id === activeShootId),
    [shoots, activeShootId]
  );

  // Authentication Gate: if user is not authenticated, render LoginView
  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F2F2F2] dark:bg-[#000000] text-black dark:text-white flex flex-col selection:bg-[#FF2D20] selection:text-white transition-colors duration-200">
      {/* Main Content Area with safe area padding */}
      <main className="flex-1 w-full max-w-lg mx-auto pt-[env(safe-area-inset-top)] pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        {activeShoot ? (
          /* Dedicated Shoot Hub (Packing List, Moodboard & Details) */
          <ShootHubView
            shoot={activeShoot}
            gearList={gear}
            packingList={packing}
            moodboards={moodboards}
            settings={settings}
            onBack={() => setActiveShootId(null)}
            onUpdateShoot={handleUpdateShoot}
            onDeleteShoot={handleDeleteShoot}
            onUpdatePackingItem={handleUpdatePackingItem}
            onAddPackingItems={handleAddPackingItems}
            onDeletePackingItem={handleDeletePackingItem}
            onAddMoodboardItem={handleAddMoodboardItem}
            onDeleteMoodboardItem={handleDeleteMoodboardItem}
          />
        ) : (
          /* Tab Views */
          <>
            {currentTab === 'dashboard' && (
              <DashboardView
                shoots={shoots}
                gear={gear}
                packing={packing}
                settings={settings}
                alerts={activeAlerts}
                user={user}
                onOpenShoot={(id) => setActiveShootId(id)}
                onNavigateToTab={(tab) => setCurrentTab(tab)}
                onOpenScheduleModal={() => setIsGlobalShootModalOpen(true)}
                onOpenAddGearModal={() => setIsGlobalGearModalOpen(true)}
                onDismissAlert={handleDismissAlert}
                onOpenAlertsSheet={() => setIsAlertsSheetOpen(true)}
                onNavigateToSettings={() => setCurrentTab('settings')}
                onUpdateUser={(updated) => setUser(updated)}
              />
            )}

            {currentTab === 'calendar' && (
              <ShootSchedulerView
                shoots={shoots}
                packing={packing}
                settings={settings}
                onOpenShoot={(id) => setActiveShootId(id)}
                onAddShoot={handleAddShoot}
                onUpdateShoot={handleUpdateShoot}
                onDeleteShoot={handleDeleteShoot}
              />
            )}

            {currentTab === 'weather' && (
              <WeatherForecastView
                shoots={shoots}
                settings={settings}
                onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
              />
            )}

            {currentTab === 'gear_vault' && (
              <GearVaultView
                gear={gear}
                onAddGear={handleAddGear}
                onUpdateGear={handleUpdateGear}
                onDeleteGear={handleDeleteGear}
              />
            )}

            {currentTab === 'moodboards' && (
              <MoodboardsView
                shoots={shoots}
                moodboards={moodboards}
                onAddMoodboardItem={handleAddMoodboardItem}
                onDeleteMoodboardItem={handleDeleteMoodboardItem}
                onOpenShoot={(id) => setActiveShootId(id)}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView
                settings={settings}
                user={user}
                onLogout={handleLogout}
                onDeleteAccount={handleDeleteAccount}
                onUpdateSettings={(newSettings) => setSettings(newSettings)}
                onUpdateUser={(updated) => setUser(updated)}
                onResetData={handleResetData}
                onToggleTheme={handleToggleTheme}
              />
            )}
          </>
        )}
      </main>

      {/* Persistent Bottom Navigation Bar */}
      <Navigation
        currentTab={currentTab}
        onTabChange={(tab) => {
          setActiveShootId(null);
          setCurrentTab(tab);
        }}
        alertCount={activeAlerts.length}
      />

      {/* Alerts Bottom Sheet (Requirement 9) */}
      <AlertsBottomSheet
        isOpen={isAlertsSheetOpen}
        onClose={() => setIsAlertsSheetOpen(false)}
        alerts={activeAlerts}
        shoots={shoots}
        packing={packing}
        settings={settings}
        onDismissAlert={handleDismissAlert}
        onOpenShoot={(id) => {
          setIsAlertsSheetOpen(false);
          setActiveShootId(id);
        }}
        onClearAll={handleClearAllAlerts}
      />

      {/* Global Quick Modals */}
      <ShootModal
        isOpen={isGlobalShootModalOpen}
        onClose={() => setIsGlobalShootModalOpen(false)}
        onSave={handleAddShoot}
      />

      <GearModal
        isOpen={isGlobalGearModalOpen}
        onClose={() => setIsGlobalGearModalOpen(false)}
        onSave={handleAddGear}
      />
    </div>
  );
}
