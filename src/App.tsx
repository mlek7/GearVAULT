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
import { FirebaseAuthService, FirestoreVaultService } from './services/firebase';
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
import { StandaloneLegalPage } from './components/legal/StandaloneLegalPage';
import { NativeApp } from './services/nativeApp';

export default function App() {
  // Public standalone legal URLs for store reviewers: /privacy and /terms
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

  // Initialize native platform capabilities on mount
  useEffect(() => {
    NativeApp.initialize();
  }, []);

  // Android hardware back button handler
  useEffect(() => {
    return NativeApp.onBackButton(() => {
      if (activeShootId) {
        setActiveShootId(null);
        return true;
      }
      if (isAlertsSheetOpen) {
        setIsAlertsSheetOpen(false);
        return true;
      }
      if (isGlobalGearModalOpen) {
        setIsGlobalGearModalOpen(false);
        return true;
      }
      if (isGlobalShootModalOpen) {
        setIsGlobalShootModalOpen(false);
        return true;
      }
      if (currentTab !== 'dashboard') {
        setCurrentTab('dashboard');
        return true;
      }
      return false;
    });
  }, [activeShootId, isAlertsSheetOpen, isGlobalGearModalOpen, isGlobalShootModalOpen, currentTab]);

  // 1. Firebase Auth listener for automatic session persistence
  useEffect(() => {
    const unsubscribe = FirebaseAuthService.onAuthChange((authUser) => {
      setUser(authUser);
      AuthService.setCurrentUser(authUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Cloud Firestore Real-Time Synchronization under users/{uid}
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = FirestoreVaultService.subscribeToVault(user.id, {
      onGear: (remoteGear) => {
        const cleaned = sanitizeGearList(remoteGear);
        setGear(cleaned);
        StorageService.saveGear(cleaned);
      },
      onShoots: (remoteShoots) => {
        const cleaned = sanitizeShootsList(remoteShoots);
        setShoots(cleaned);
        StorageService.saveShoots(cleaned);
      },
      onPacking: (remotePacking) => {
        const cleaned = sanitizePackingList(remotePacking);
        setPacking(cleaned);
        StorageService.savePacking(cleaned);
      },
      onMoodboards: (remoteMoodboards) => {
        const cleaned = sanitizeMoodboardsList(remoteMoodboards);
        setMoodboards(cleaned);
        StorageService.saveMoodboards(cleaned);
      },
      onSettings: (remoteSettings) => {
        const cleaned = sanitizeSettings(remoteSettings);
        setSettings((prev) => {
          const merged = { ...prev, ...cleaned };
          StorageService.saveSettings(merged);
          return merged;
        });
      },
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Apply theme (Light / Dark / System)
  useEffect(() => {
    const root = document.documentElement;
    const theme = settings.theme || 'system';

    const applyDark = (isDark: boolean) => {
      NativeApp.updateTheme(isDark);
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
      if (user?.id) {
        FirestoreVaultService.saveSettings(user.id, updated).catch(() => {});
      }
      return updated;
    });
  };

  // Sync to local storage for instant offline cache
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
    if (user?.id) {
      FirestoreVaultService.saveShoot(user.id, newShoot).catch(console.error);
    }
  };

  const handleUpdateShoot = (updatedShoot: Shoot) => {
    setShoots((prev) =>
      prev.map((s) => (s.id === updatedShoot.id ? updatedShoot : s))
    );
    if (user?.id) {
      FirestoreVaultService.saveShoot(user.id, updatedShoot).catch(console.error);
    }
  };

  const handleDeleteShoot = (shootId: string) => {
    setShoots((prev) => prev.filter((s) => s.id !== shootId));
    setPacking((prev) => prev.filter((p) => p.shootId !== shootId));
    setMoodboards((prev) => prev.filter((m) => m.shootId !== shootId));
    if (activeShootId === shootId) {
      setActiveShootId(null);
    }
    if (user?.id) {
      FirestoreVaultService.deleteShoot(user.id, shootId).catch(console.error);
    }
  };

  // Gear management
  const handleAddGear = (newGear: GearItem) => {
    setGear((prev) => [newGear, ...prev]);
    if (user?.id) {
      FirestoreVaultService.saveGear(user.id, newGear).catch(console.error);
    }
  };

  const handleUpdateGear = (updatedGear: GearItem) => {
    setGear((prev) =>
      prev.map((g) => (g.id === updatedGear.id ? updatedGear : g))
    );
    if (user?.id) {
      FirestoreVaultService.saveGear(user.id, updatedGear).catch(console.error);
    }
  };

  const handleDeleteGear = (gearId: string) => {
    setGear((prev) => prev.filter((g) => g.id !== gearId));
    setPacking((prev) => prev.filter((p) => p.gearId !== gearId));
    if (user?.id) {
      FirestoreVaultService.deleteGear(user.id, gearId).catch(console.error);
    }
  };

  // Packing management
  const handleUpdatePackingItem = (updatedItem: PackingItem) => {
    setPacking((prev) =>
      prev.map((p) => (p.id === updatedItem.id ? updatedItem : p))
    );
    if (user?.id) {
      FirestoreVaultService.savePackingItem(user.id, updatedItem).catch(console.error);
    }
  };

  const handleAddPackingItems = (newItems: PackingItem[]) => {
    setPacking((prev) => [...newItems, ...prev]);
    if (user?.id) {
      FirestoreVaultService.savePackingItems(user.id, newItems).catch(console.error);
    }
  };

  const handleDeletePackingItem = (id: string) => {
    setPacking((prev) => prev.filter((p) => p.id !== id));
    if (user?.id) {
      FirestoreVaultService.deletePackingItem(user.id, id).catch(console.error);
    }
  };

  // Moodboard actions
  const handleAddMoodboardItem = (item: MoodboardItem) => {
    setMoodboards((prev) => [item, ...prev]);
    if (user?.id) {
      FirestoreVaultService.saveMoodboardItem(user.id, item).catch(console.error);
    }
  };

  const handleDeleteMoodboardItem = (id: string) => {
    setMoodboards((prev) => prev.filter((m) => m.id !== id));
    if (user?.id) {
      FirestoreVaultService.deleteMoodboardItem(user.id, id).catch(console.error);
    }
  };

  // Reset all data (Keep account, clear inventory)
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

    if (user?.id) {
      await FirestoreVaultService.resetVaultData(user.id).catch(console.error);
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    StorageService.clearAll();
    setUser(null);
  };

  // Delete Account & Data (Apple guideline 5.1.1(v) & Google Play)
  const handleDeleteAccount = async () => {
    await AuthService.deleteAccountAndData();
    StorageService.clearAll();
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

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
    if (user?.id) {
      FirestoreVaultService.saveSettings(user.id, newSettings).catch(console.error);
    }
  };

  // Public standalone legal URLs (/privacy & /terms)
  if (currentPath === '/privacy') {
    return <StandaloneLegalPage type="privacy" onBack={() => { window.history.pushState({}, '', '/'); setCurrentPath('/'); }} />;
  }
  if (currentPath === '/terms') {
    return <StandaloneLegalPage type="terms" onBack={() => { window.history.pushState({}, '', '/'); setCurrentPath('/'); }} />;
  }

  // Authentication Gate: if user is not authenticated, render LoginView
  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Active Shoot for Shoot Hub
  const activeShoot = shoots.find((s) => s.id === activeShootId);

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
                onUpdateSettings={(newSettings) => handleUpdateSettings({ ...settings, ...newSettings })}
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
                onUpdateSettings={handleUpdateSettings}
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
          NativeApp.triggerHaptic('selection');
          setActiveShootId(null);
          setCurrentTab(tab);
        }}
        alertCount={activeAlerts.length}
      />

      {/* Alerts Bottom Sheet */}
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
