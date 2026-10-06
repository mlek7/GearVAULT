import React from 'react';
import { LayoutDashboard, Calendar, Camera, Sun, Palette } from 'lucide-react';
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
      label: 'Light',
      icon: Sun,
    },
    {
      id: 'gear_vault',
      label: 'Vault',
      icon: Camera,
    },
    {
      id: 'moodboards',
      label: 'Moodboards',
      icon: Palette,
    },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none"
      role="navigation"
      aria-label="Main Navigation"
    >
      <div className="max-w-xs sm:max-w-sm mx-auto bg-[#FFFFFF]/90 dark:bg-[#121212]/90 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] rounded-full px-2.5 py-1.5 shadow-2xl pointer-events-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className="relative flex flex-col items-center justify-center min-w-[52px] min-h-[44px] py-1 px-1.5 rounded-full transition-all duration-150 cursor-pointer active:scale-95 group"
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-[18px] h-[18px] transition-colors duration-150 ${
                    isActive
                      ? 'text-black dark:text-white'
                      : 'text-[#8E8E93] group-hover:text-black dark:group-hover:text-white'
                  }`}
                />
                {item.badge && item.badge > 0 && (
                  <span
                    id={`nav-badge-${item.id}`}
                    className="absolute -top-1 -right-2 flex h-3.5 min-w-3.5 px-1 items-center justify-center rounded-full bg-[#FF2D20] text-[9px] font-mono font-bold text-white shadow-xs"
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight font-medium transition-colors duration-150 ${
                  isActive
                    ? 'text-black dark:text-white font-medium'
                    : 'text-[#8E8E93]'
                }`}
              >
                {item.label}
              </span>
              {/* Pulsar active indicator: small red dot below */}
              {isActive ? (
                <span className="w-1 h-1 rounded-full bg-[#FF2D20] mt-0.5 block animate-in fade-in zoom-in duration-150" />
              ) : (
                <span className="w-1 h-1 rounded-full bg-transparent mt-0.5 block" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
