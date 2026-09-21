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
      className={`relative mx-4 mt-2 mb-4 rounded-3xl border p-4 transition-all duration-200 shadow-sm ${
        isCritical
          ? 'bg-rose-50 border-rose-200 text-rose-950 shadow-rose-100 animate-pulse-subtle'
          : 'bg-gradient-to-r from-[#FFF5F5] to-[#F4FDFD] border-[#F7ADAD] text-slate-900 shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={`p-2.5 rounded-2xl shrink-0 ${
              isCritical
                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                : 'bg-[#FFF0F0] text-[#D45B5B] border border-[#F7ADAD]'
            }`}
          >
            {isCritical ? (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            ) : (
              <Bell className="w-5 h-5 text-[#D45B5B]" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                  isCritical
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white font-extrabold shadow-xs'
                }`}
              >
                {isCritical ? '2-Hour Gear Warning' : 'Day-of-Shoot Morning Call'}
              </span>
              {alerts.length > 1 && (
                <span className="text-[11px] text-slate-500 font-medium">
                  +{alerts.length - 1} more
                </span>
              )}
            </div>

            <h4 className="text-sm font-bold mt-1 text-slate-900 tracking-tight">
              {activeAlert.title}
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {activeAlert.message}
            </p>

            {activeAlert.missingItems && activeAlert.missingItems.length > 0 && (
              <div className="mt-2.5 bg-white rounded-2xl p-2.5 border border-rose-200/80 shadow-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-800 block mb-1.5 font-mono">
                  Unpacked / Missing Items ({activeAlert.missingItems.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeAlert.missingItems.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-xl"
                    >
                      <PackageCheck className="w-3 h-3 text-rose-600" />
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
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs transition-transform active:scale-95 ${
                  isCritical
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
                    : 'bg-gradient-to-r from-[#F29191] to-[#F7ADAD] hover:brightness-105 text-white shadow-md shadow-[#F29191]/30'
                }`}
              >
                <span>Review Packing List</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-alert-dismiss"
                onClick={() => onDismiss(activeAlert.id)}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-black/5 transition-colors"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => onDismiss(activeAlert.id)}
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-black/5 shrink-0 transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
