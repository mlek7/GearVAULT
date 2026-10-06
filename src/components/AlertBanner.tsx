import React from 'react';
import { AlertTriangle, Bell, ArrowRight, X, PackageCheck } from 'lucide-react';
import { AlertNotification } from '../types';

interface AlertBannerProps {
  alerts: AlertNotification[];
  onDismiss: (alertId: string) => void;
  onOpenShoot: (shootId: string) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  alerts,
  onDismiss,
  onOpenShoot,
}) => {
  if (alerts.length === 0) return null;

  // Show top priority alert first
  const activeAlert = alerts[0];
  const isCritical = activeAlert.priority === 'critical';

  return (
    <div
      id="active-alert-banner"
      className="relative mx-4 mt-2 mb-4 rounded-[28px] border border-[#FF2D20]/40 p-4 transition-all duration-200 bg-[#FFFFFF] dark:bg-[#121212]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2.5 rounded-full shrink-0 bg-[#EBEBEB] dark:bg-[#1E1E1E] text-[#FF2D20]">
            {isCritical ? (
              <AlertTriangle className="w-5 h-5 text-[#FF2D20]" />
            ) : (
              <Bell className="w-5 h-5 text-[#FF2D20]" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="pulsar-badge-status">
                {isCritical ? '2-HOUR GEAR WARNING' : 'DAY-OF-SHOOT CALL'}
              </span>
              {alerts.length > 1 && (
                <span className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93] font-mono">
                  +{alerts.length - 1} MORE
                </span>
              )}
            </div>

            <h4 className="text-sm font-medium mt-1.5 text-black dark:text-white tracking-tight">
              {activeAlert.title}
            </h4>
            <p className="text-xs text-[#6E6E73] dark:text-[#8E8E93] mt-0.5 leading-relaxed">
              {activeAlert.message}
            </p>

            {activeAlert.missingItems && activeAlert.missingItems.length > 0 && (
              <div className="mt-2.5 bg-[#EBEBEB] dark:bg-[#1E1E1E] rounded-[18px] p-2.5 border border-black/[0.08] dark:border-white/[0.08]">
                <span className="pulsar-section-label block mb-1.5">
                  Unpacked / Missing Items ({activeAlert.missingItems.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeAlert.missingItems.map((item, idx) => (
                    <span
                      key={idx}
                      className="pulsar-tag text-[10px]"
                    >
                      <PackageCheck className="w-3 h-3 text-[#FF2D20]" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <button
                id="btn-alert-review-packing"
                onClick={() => onOpenShoot(activeAlert.shootId)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-[#FF2D20] hover:bg-[#E02619] text-white transition-all"
              >
                <span>Review Packing List</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-alert-dismiss"
                onClick={() => onDismiss(activeAlert.id)}
                className="pulsar-bracket-btn"
              >
                ACKNOWLEDGE
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => onDismiss(activeAlert.id)}
          className="p-1.5 rounded-full text-[#8E8E93] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 shrink-0 transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
