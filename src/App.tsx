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
} from './types';
import { StorageService, playAlertChime } from './services/storage';
import { AuthService } from './services/authService';
import { evaluateShootAlerts, formatShootTime } from './utils/dateUtils';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/dashboard/DashboardView';
import { ShootSchedulerView } from './components/shoots/ShootSchedulerView';
import { GearVaultView } from './components/gear/GearVaultView';
import { SettingsView } from './components/settings/SettingsView';
import { ShootHubView } from './components/shoots/ShootHubView';
import { WeatherForecastView } from './components/weather/WeatherForecastView';
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

  // Global modals for dashboard shortcuts
  const [isGlobalShootModalOpen, setIsGlobalShootModalOpen] = useState(false);
  const [isGlobalGearModalOpen, setIsGlobalGearModalOpen] = useState(false);

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

  // Compute active alerts (Day-of-Shoot Morning Review & 2-Hour Critical Missing Gear)
  const computedAlerts = useMemo(() => {
    const raw = evaluateShootAlerts(shoots, packing, gear, settings);
    return raw.filter((a) => !dismissedAlertIds.has(a.id));
  }, [shoots, packing, gear, settings, dismissedAlertIds]);

  // Combine computed alerts with simulated alerts
  const activeAlerts = useMemo(() => {
    const combined = [...simulatedAlerts, ...computedAlerts];
    // Deduplicate by ID
    const seen = new Set<string>();
    return combined.filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return !dismissedAlertIds.has(a.id);
    });
  }, [simulatedAlerts, computedAlerts, dismissedAlertIds]);

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlertIds((prev) => new Set(prev).add(alertId));
    setSimulatedAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  // Trigger simulated alerts for immediate user demo
  const handleTriggerSimulatedAlert = (type: 'morning_review' | 'two_hour_critical') => {
    const targetShoot = shoots[0] || {
      id: 'demo-shoot',
      title: 'Commercial Fashion Editorial',
      clientName: 'Atelier Vogue',
      dateTime: new Date(Date.now() + 90 * 60000).toISOString(),
      location: 'Studio 4, San Francisco',
      shootType: 'Commercial',
      generalNotes: '3 model looks',
      createdAt: new Date().toISOString(),
    };

    if (type === 'two_hour_critical') {
      const alert: AlertNotification = {
        id: `sim-critical-${Date.now()}`,
        shootId: targetShoot.id,
        shootTitle: targetShoot.title,
        type: 'two_hour_critical',
        priority: 'critical',
        title: `HIGH-PRIORITY: Shoot starts in 1h 45m!`,
        message: `Crucial items for "${targetShoot.title}" are still marked as Needed or Missing. Check packing immediately!`,
        missingItems: [
          'Profoto B10X Plus 500Ws Strobe (Missing)',
          'Sony FE 24-70mm f/2.8 GM II (Needed)',
          'Peak Design Carbon Tripod (Needed)',
        ],
        timestamp: new Date().toISOString(),
        read: false,
      };
      setSimulatedAlerts((prev) => [alert, ...prev]);

      // If browser notifications allowed
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(alert.title, { body: alert.message });
      }
    } else {
      const alert: AlertNotification = {
        id: `sim-morning-${Date.now()}`,
        shootId: targetShoot.id,
        shootTitle: targetShoot.title,
        type: 'morning_review',
        priority: 'high',
        title: `Morning Call (${settings.morningAlertTime || '06:00'} AM): "${targetShoot.title}"`,
        message: `Good morning! You have a booked shoot today at ${formatShootTime(
          targetShoot.dateTime
        )}. Please verify and pack all camera bodies, lenses, and batteries.`,
        missingItems: ['Sony FE 24-70mm f/2.8 GM II', 'Profoto B10X Plus'],
        timestamp: new Date().toISOString(),
        read: false,
      };
      setSimulatedAlerts((prev) => [alert, ...prev]);

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(alert.title, { body: alert.message });
      }
    }
  };

  // Gear Vault actions
  const handleAddGear = (item: GearItem) => {
    setGear((prev) => [item, ...prev]);
    if (settings.soundEnabled) playAlertChime('shutter');
  };

  const handleUpdateGear = (updated: GearItem) => {
    setGear((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
  };

  const handleDeleteGear = (gearId: string) => {
    setGear((prev) => prev.filter((g) => g.id !== gearId));
    // Also remove from any packing lists
    setPacking((prev) => prev.filter((p) => p.gearId !== gearId));
  };

  // Shoot actions
  const handleAddShoot = (shoot: Shoot) => {
    setShoots((prev) => [shoot, ...prev]);
    if (settings.soundEnabled) playAlertChime('shutter');
  };

  const handleUpdateShoot = (updated: Shoot) => {
    setShoots((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleDeleteShoot = (shootId: string) => {
    setShoots((prev) => prev.filter((s) => s.id !== shootId));
    setPacking((prev) => prev.filter((p) => p.shootId !== shootId));
    setMoodboards((prev) => prev.filter((m) => m.shootId !== shootId));
    if (activeShootId === shootId) {
      setActiveShootId(null);
    }
  };

  // Packing actions
  const handleUpdatePackingItem = (updated: PackingItem) => {
    setPacking((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
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

  // Reset demo data
  const handleResetData = () => {
    StorageService.resetAll();
    setGear(StorageService.getGear());
    setShoots(StorageService.getShoots());
    setPacking(StorageService.getPacking());
    setMoodboards(StorageService.getMoodboards());
    setSettings(StorageService.getSettings());
    setDismissedAlertIds(new Set());
    setSimulatedAlerts([]);
    setActiveShootId(null);
  };

  const handleLogout = () => {
    AuthService.logout();
    setUser(null);
  };

  const handleSwitchAccount = () => {
    setUser(null);
  };

  // Active Shoot for Shoot Hub
  const activeShoot = useMemo(
    () => shoots.find((s) => s.id === activeShootId),
    [shoots, activeShootId]
  );

  // Authentication Gate: if user is not authenticated, render LoginView
  if (!user) {
    return <LoginView onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-[#FAFDFD] text-[#0F172A] flex flex-col selection:bg-[#CCFBFA] selection:text-[#0F4E50]">
      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-lg mx-auto">
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
                onLogout={handleLogout}
                onOpenShoot={(id) => setActiveShootId(id)}
                onNavigateToTab={(tab) => setCurrentTab(tab)}
                onOpenScheduleModal={() => setIsGlobalShootModalOpen(true)}
                onOpenAddGearModal={() => setIsGlobalGearModalOpen(true)}
                onDismissAlert={handleDismissAlert}
              />
            )}

            {currentTab === 'calendar' && (
              <ShootSchedulerView
                shoots={shoots}
                packing={packing}
                onOpenShoot={(id) => setActiveShootId(id)}
                onAddShoot={handleAddShoot}
                onUpdateShoot={handleUpdateShoot}
                onDeleteShoot={handleDeleteShoot}
              />
            )}

            {currentTab === 'weather' && (
              <WeatherForecastView
                shoots={shoots}
                onOpenShoot={(id) => setActiveShootId(id)}
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

            {currentTab === 'settings' && (
              <SettingsView
                settings={settings}
                shoots={shoots}
                gear={gear}
                packing={packing}
                user={user}
                onLogout={handleLogout}
                onSwitchAccount={handleSwitchAccount}
                onUpdateSettings={(newSettings) => setSettings(newSettings)}
                onResetData={handleResetData}
                onTriggerSimulatedAlert={handleTriggerSimulatedAlert}
              />
            )}
          </>
        )}
      </main>

      {/* Persistent Bottom Navigation Bar (hidden inside Shoot Hub if desired, or visible for fast switching) */}
      <Navigation
        currentTab={currentTab}
        onTabChange={(tab) => {
          setActiveShootId(null);
          setCurrentTab(tab);
        }}
        alertCount={activeAlerts.length}
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
