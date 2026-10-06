import React from 'react';
import { X, Bell, AlertTriangle, CheckCircle, ArrowRight, Clock } from 'lucide-react';
import { AlertNotification } from '../../types';

interface AlertsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: AlertNotification[];
  onDismissAlert: (id: string) => void;
  onOpenShoot?: (shootId: string) => void;
}

export const AlertsSheet: React.FC<AlertsSheetProps> = ({
  isOpen,
  onClose,
  alerts,
  onDismissAlert,
  onOpenShoot,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#FFFFFF] dark:bg-[#121212] rounded-t-[28px] sm:rounded-[28px] max-h-[85vh] flex flex-col border border-black/[0.08] dark:border-white/[0.08] animate-in slide-in-from-bottom duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Drag handle on mobile */}
        <div className="sm:hidden w-10 h-1 bg-black/20 dark:bg-white/20 rounded-full mx-auto mt-3 mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-black/[0.08] dark:border-white/[0.08] bg-[#F2F2F2]/60 dark:bg-[#1E1E1E]/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] text-[#FF2D20]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-normal text-black dark:text-white font-sans tracking-tight">
                Alerts & Reminders
              </h2>
              <p className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93]">
                {alerts.length === 1 ? '1 active alert' : `${alerts.length} active alerts`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-[#8E8E93] hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alerts List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 pb-safe scrollbar-none">
          {alerts.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] text-[#30D158] flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-medium text-black dark:text-white">
                All clear! No pending alerts
              </h3>
              <p className="text-xs text-[#6E6E73] dark:text-[#8E8E93] mt-1 max-w-xs mx-auto">
                All equipment is packed or no shoot alarms are currently triggered.
              </p>
            </div>
          ) : (
            alerts.map((alert) => {
              const isCritical = alert.priority === 'critical';

              return (
                <div
                  key={alert.id}
                  className="p-4 rounded-[20px] bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full shrink-0 mt-0.5 bg-black/5 dark:bg-white/5 text-[#FF2D20]">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="pulsar-badge-status text-[9px] py-0.5 px-2">
                            {isCritical ? 'CRITICAL' : 'REMINDER'}
                          </span>
                          <span className="text-[10px] text-[#8E8E93] font-mono">
                            {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h4 className="text-xs font-medium text-black dark:text-white mt-1">
                          {alert.title}
                        </h4>
                        <p className="text-xs text-[#6E6E73] dark:text-[#8E8E93] mt-0.5 leading-relaxed">
                          {alert.message}
                        </p>

                        {/* Missing items list */}
                        {alert.missingItems && alert.missingItems.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {alert.missingItems.map((item, idx) => (
                              <span
                                key={idx}
                                className="pulsar-tag text-[10px]"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onDismissAlert(alert.id)}
                      className="text-[#8E8E93] hover:text-[#FF2D20] text-xs font-medium shrink-0 cursor-pointer p-1"
                    >
                      Dismiss
                    </button>
                  </div>

                  {alert.shootId && onOpenShoot && (
                    <div className="mt-3 pt-2.5 border-t border-black/[0.08] dark:border-white/[0.08] flex justify-end">
                      <button
                        onClick={() => {
                          onOpenShoot(alert.shootId);
                          onClose();
                        }}
                        className="pulsar-bracket-btn"
                      >
                        <span>VIEW SHOOT & PACK GEAR</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
