import React from 'react';
import { LayoutDashboard, Calendar, Camera, Settings, CloudSun } from 'lucide-react';
import { NavigationTab } from '../types';

interface NavigationProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  alertCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  alertCount = 0,
}) => {
  const navItems: {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: LayoutDashboard,
      badge: alertCount > 0 ? alertCount : undefined,
    },
    {
      id: 'calendar',
      label: 'Shoots',
      icon: Calendar,
    },
    {
      id: 'weather',
      label: 'Weather',
      icon: CloudSun,
    },
    {
      id: 'gear_vault',
      label: 'Vault',
      icon: Camera,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-3 left-0 right-0 z-40 px-3 pointer-events-none"
      role="navigation"
      aria-label="Main Navigation"
    >
      <div className="max-w-sm mx-auto bg-white/95 backdrop-blur-2xl border border-[#B1E5E6]/70 rounded-full px-2 py-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.1)] pointer-events-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-2.5 rounded-full transition-all duration-200 ${
                isActive
                  ? 'text-white font-bold'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {isActive && (
                <span className="absolute inset-0 bg-gradient-to-r from-[#F29191] to-[#F7ADAD] rounded-full shadow-[0_4px_12px_rgba(242,145,145,0.45)] -z-0" />
              )}
              <div className="relative z-10 flex items-center justify-center">
                <Icon
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isActive ? 'scale-105 text-white' : 'text-slate-500'
                  }`}
                />
                {item.badge && item.badge > 0 && (
                  <span
                    id={`nav-badge-${item.id}`}
                    className="absolute -top-1.5 -right-2 flex h-3.5 min-w-3.5 px-1 items-center justify-center rounded-full bg-[#F29191] text-[9px] font-extrabold text-white shadow-md ring-2 ring-white"
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight font-medium relative z-10 ${
                  isActive ? 'text-white font-bold' : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
