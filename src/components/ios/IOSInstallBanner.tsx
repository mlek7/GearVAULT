import React, { useState } from 'react';
import { Smartphone, Download, Sparkles, Apple } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { IOSDownloadModal } from './IOSDownloadModal';

interface IOSInstallBannerProps {
  variant?: 'pill' | 'banner';
}

export const IOSInstallBanner: React.FC<IOSInstallBannerProps> = ({ variant = 'pill' }) => {
  const { isInstalled, isIOS, isInstallable, install } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If already running in standalone mode, hide the prompt
  if (isInstalled) {
    return null;
  }

  const handleAction = async () => {
    // If browser supports beforeinstallprompt and it's not iOS, try native install
    if (isInstallable && !isIOS) {
      const installed = await install();
      if (!installed) {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  if (variant === 'pill') {
    return (
      <>
        <button
          id="btn-ios-download-pill"
          onClick={handleAction}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold shadow-xs transition-all active:scale-95 border border-slate-700/50"
          title="Download or Install for iOS (iPhone & iPad)"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#F29191]" />
          <span>iOS App</span>
        </button>

        <IOSDownloadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  return (
    <>
      <div
        id="ios-install-callout-banner"
        className="mb-3.5 p-3 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-xs flex items-center justify-between gap-3 border border-slate-700/40"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F29191] to-[#F7ADAD] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#CCFBFA]">
                iOS Download Available
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-200 truncate">
              Install Gear Vault onto your iPhone or iPad
            </p>
          </div>
        </div>

        <button
          onClick={handleAction}
          className="shrink-0 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#FAF3E1] text-[11px] font-bold transition-all border border-white/10 inline-flex items-center gap-1 active:scale-95"
        >
          <Download className="w-3 h-3 text-[#F29191]" />
          <span>Get App</span>
        </button>
      </div>

      <IOSDownloadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
