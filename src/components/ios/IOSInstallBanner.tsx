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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1E1E1E] hover:bg-[#262626] text-white text-[11px] font-mono transition-all active:scale-[0.97] border border-white/[0.08]"
          title="Download or Install for iOS (iPhone & iPad)"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#FF2D20]" />
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
        className="mb-3.5 p-3.5 rounded-[20px] bg-[#FFFFFF] dark:bg-[#121212] text-black dark:text-white shadow-xs flex items-center justify-between gap-3 border border-black/[0.08] dark:border-white/[0.08]"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] text-[#FF2D20] flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-[#6E6E73] dark:text-[#8E8E93]">
                iOS App Available
              </span>
            </div>
            <p className="text-xs font-normal text-black dark:text-white truncate">
              Install Lightbag onto your iPhone or iPad
            </p>
          </div>
        </div>

        <button
          onClick={handleAction}
          className="shrink-0 px-3 py-1.5 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] hover:bg-[#262626] text-black dark:text-white text-[11px] font-mono transition-all border border-black/[0.08] dark:border-white/[0.08] inline-flex items-center gap-1 active:scale-[0.97]"
        >
          <Download className="w-3 h-3 text-[#FF2D20]" />
          <span>Get App</span>
        </button>
      </div>

      <IOSDownloadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
