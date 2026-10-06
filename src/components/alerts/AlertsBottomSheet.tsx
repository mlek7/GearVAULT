import React from 'react';
import {
  X,
  Bell,
  Clock,
  AlertTriangle,
  CheckCircle,
  Package,
  Calendar,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { AlertNotification, Shoot, PackingItem, AppSettings } from '../../types';
import { formatShootTime, formatShootDate } from '../../utils/dateUtils';

interface AlertsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: AlertNotification[];
  shoots: Shoot[];
  packing: PackingItem[];
  settings?: AppSettings;
  onDismissAlert: (alertId: string) => void;
  onOpenShoot: (shootId: string) => void;
  onClearAll?: () => void;
}

export const AlertsBottomSheet: React.FC<AlertsBottomSheetProps> = ({
  isOpen,
  onClose,
  alerts,
  shoots,
  packing,
  settings,
  onDismissAlert,
  onOpenShoot,
  onClearAll,
}) => {
  if (!isOpen) return null;

  // Derive reminders for upcoming shoots
  const now = new Date();
  const upcomingShoots = shoots
    .filter((s) => new Date(s.dateTime).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
    .slice(0, 3);

  return (
    <div
      id="alerts-bottom-sheet-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-200"
    >
      <div
        id="alerts-bottom-sheet"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#FFFFFF] dark:bg-[#121212] rounded-t-[28px] border-t border-black/[0.08] dark:border-white/[0.08] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
      >
        {/* Grab handle */}
        <div className="w-10 h-1 bg-black/20 dark:bg-white/20 rounded-full mx-auto mb-4" />

        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] text-[#FF2D20] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-normal text-black dark:text-white font-sans tracking-tight">
                Alerts & Reminders
              </h2>
              <p className="text-xs text-[#6E6E73] dark:text-[#8E8E93]">
                Day-of-shoot triggers & packing warnings
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-[#8E8E93] hover:text-black dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active Notifications */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="pulsar-section-label">
              Active Alerts ({alerts.length})
            </span>
            {alerts.length > 0 && onClearAll && (
              <button
                onClick={onClearAll}
                className="pulsar-bracket-btn"
              >
                CLEAR ALL
              </button>
            )}
          </div>

          {alerts.length === 0 ? (
            <div className="p-4 rounded-[20px] bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] text-center">
              <CheckCircle className="w-6 h-6 text-[#30D158] mx-auto mb-1.5" />
              <p className="text-xs font-medium text-black dark:text-white">
                All clear — no active alarms
              </p>
              <p className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93] mt-0.5">
                Automations will trigger before scheduled shoots
              </p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => {
                  if (alert.shootId) {
                    onOpenShoot(alert.shootId);
                    onClose();
                  }
                }}
                className="p-3.5 rounded-[18px] bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-[#FF2D20]/40 flex items-start justify-between gap-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <AlertTriangle className="w-4 h-4 text-[#FF2D20] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="pulsar-badge-status text-[9px] py-0.5 px-2">
                        {alert.priority === 'critical' ? 'CRITICAL' : 'ALERT'}
                      </span>
                      <h4 className="text-xs font-medium text-black dark:text-white truncate">
                        {alert.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93] mt-1 leading-snug">
                      {alert.message}
                    </p>
                    <span className="text-[10px] text-[#8E8E93] font-mono mt-1 block">
                      Shoot: {alert.shootTitle}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismissAlert(alert.id);
                  }}
                  className="p-1 rounded-full text-[#8E8E93] hover:text-[#FF2D20] shrink-0"
                  title="Dismiss alert"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Scheduled Reminders & Checklists */}
        <div>
          <span className="pulsar-section-label block mb-2.5">
            Upcoming Shoot Automations
          </span>

          <div className="rounded-[20px] bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] divide-y divide-black/[0.08] dark:divide-white/[0.08] overflow-hidden">
            {upcomingShoots.map((shoot) => {
              const shootItems = packing.filter((p) => p.shootId === shoot.id);
              const packed = shootItems.filter((p) => p.status === 'Packed').length;
              const missing = shootItems.filter((p) => p.status === 'Missing').length;

              return (
                <div
                  key={shoot.id}
                  onClick={() => {
                    onOpenShoot(shoot.id);
                    onClose();
                  }}
                  className="p-3.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#8E8E93]" />
                      <span className="text-xs font-medium text-black dark:text-white truncate">
                        {shoot.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93] font-mono mt-0.5">
                      {formatShootDate(shoot.dateTime, settings?.dateFormat)} at{' '}
                      {formatShootTime(shoot.dateTime, settings?.timeFormat)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-[#8E8E93] font-mono flex items-center gap-1">
                        <Package className="w-3 h-3 text-[#8E8E93]" />
                        {shootItems.length === 0 ? 'No gear listed' : `${packed}/${shootItems.length} packed`}
                      </span>
                      {missing > 0 && (
                        <span className="pulsar-badge-status text-[9px] py-0.5 px-1.5">
                          {missing} MISSING
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[#8E8E93]">
                    <span className="pulsar-bracket-btn">REVIEW</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] text-[11px] text-[#6E6E73] dark:text-[#8E8E93] flex items-center gap-2 px-4">
            <Clock className="w-3.5 h-3.5 text-[#8E8E93] shrink-0" />
            <span className="font-mono">
              Morning alert: <strong className="text-black dark:text-white">{settings?.morningAlertTime || '06:00'}</strong> ({settings?.enableMorningAlerts ? 'ACTIVE' : 'DISABLED'})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
