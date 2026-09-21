import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Share,
  PlusSquare,
  Check,
  Copy,
  ExternalLink,
  Download,
  Terminal,
  Layers,
  Sparkles,
  QrCode,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface IOSDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IOSDownloadModal: React.FC<IOSDownloadModalProps> = ({ isOpen, onClose }) => {
  const { isIOS, isInstalled } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'pwa' | 'native'>('pwa');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://ais-pre-5qhwribwkreqd7xwtu4oob-88259389157.europe-west2.run.app';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    currentUrl
  )}&bgcolor=FAFDFD&color=0F172A&margin=1`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCmd = (cmd: string, key: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(key);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div
      id="ios-download-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="ios-download-modal"
        className="w-full max-w-lg bg-white border border-slate-200 rounded-t-[36px] sm:rounded-[36px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F29191] to-[#F7ADAD] p-0.5 shadow-md shadow-[#F29191]/30 flex items-center justify-center overflow-hidden">
              <img
                src="/apple-touch-icon.png"
                alt="App Icon"
                className="w-full h-full rounded-[14px] object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-slate-900 font-display">
                  Download for iOS
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#CCFBFA] text-[#0F4E50] border border-[#B1E5E6]">
                  iPhone & iPad
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Photo Gear Vault & Shoot Manager
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-3 pb-2 bg-slate-50/40 border-b border-slate-100 flex gap-2">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 py-2 px-3 rounded-2xl text-xs font-bold transition-all text-center ${
              activeTab === 'pwa'
                ? 'bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            Instant iPhone Install (PWA)
          </button>
          <button
            onClick={() => setActiveTab('native')}
            className={`flex-1 py-2 px-3 rounded-2xl text-xs font-bold transition-all text-center ${
              activeTab === 'native'
                ? 'bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            Native Xcode & IPA Build
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 scrollbar-none">
          {activeTab === 'pwa' ? (
            <>
              {/* Status Banner */}
              {isInstalled ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900">
                      Already Installed on iOS
                    </h4>
                    <p className="text-[11px] text-emerald-700">
                      You are currently running the standalone version of Gear Vault!
                    </p>
                  </div>
                </div>
              ) : isIOS ? (
                <div className="p-3.5 bg-[#CCFBFA]/40 border border-[#B1E5E6] rounded-2xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0F4E50] text-[#CCFBFA] flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F4E50]">
                      iOS Device Detected
                    </h4>
                    <p className="text-[11px] text-[#0F4E50]/80">
                      Follow the 2 simple steps below in Safari to add the app directly to your home screen.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Scanning from Mac / PC?
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Scan the QR code below with your iPhone Camera to open this app.
                    </p>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors shrink-0 shadow-xs"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* QR Code Section (Visible especially when on desktop) */}
              {!isIOS && (
                <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="w-32 h-32 rounded-2xl bg-white p-2 border border-slate-200 shadow-sm shrink-0 flex items-center justify-center">
                    <img
                      src={qrCodeUrl}
                      alt="iPhone Install QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D45B5B]">
                      Instant Camera Scan
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 font-display">
                      Scan with your iPhone Camera
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Point your iPhone camera at this code to launch the web app directly in Safari, then follow the instructions below.
                    </p>
                  </div>
                </div>
              )}

              {/* Step-by-Step Instructions */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Installation Steps in Safari
                </h3>

                {/* Step 1 */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                    <Share className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 font-mono block">
                      Step 1
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">
                      Tap the Share button in Safari
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Located in the bottom toolbar on iPhone (or top bar on iPad). It looks like a square with an arrow pointing upwards.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 font-mono block">
                      Step 2
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">
                      Select &quot;Add to Home Screen&quot;
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Scroll down through the share sheet options and tap <strong>Add to Home Screen</strong>.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-8 h-8 rounded-xl bg-[#FFF0F0] text-[#D45B5B] border border-[#F7ADAD] flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D45B5B] font-mono block">
                      Step 3
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">
                      Tap &quot;Add&quot; in Top Right
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Confirm the app title <strong>Gear Vault</strong>. The app icon will be pinned directly onto your iPhone home screen!
                    </p>
                  </div>
                </div>
              </div>

              {/* Native Capabilities List */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  iOS Standalone Experience Highlights
                </span>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-700 font-medium">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>No App Store needed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Full-screen standalone</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Offline gear inventory</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Instant 120Hz gestures</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Native Xcode & IPA Build tab */
            <div className="space-y-4">
              <div className="p-4 rounded-3xl bg-slate-900 text-white shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#CCFBFA]">
                    Capacitor iOS Bundle
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    capacitor.config.ts
                  </span>
                </div>
                <h3 className="text-base font-bold font-display text-white">
                  Compile into an .IPA or Xcode Project
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  This project includes a turnkey Capacitor iOS configuration with bundle identifier <code className="text-[#CCFBFA] font-mono">com.photogearvault.app</code>. You can build a native iOS IPA for TestFlight or the App Store.
                </p>
              </div>

              {/* Command 1 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    1. Install Capacitor iOS Packages
                  </span>
                  <button
                    onClick={() =>
                      handleCopyCmd('npm i @capacitor/core @capacitor/cli @capacitor/ios', 'cmd1')
                    }
                    className="text-[11px] text-[#D45B5B] hover:underline font-bold inline-flex items-center gap-1"
                  >
                    {copiedCmd === 'cmd1' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto">
                  npm i @capacitor/core @capacitor/cli @capacitor/ios
                </pre>
              </div>

              {/* Command 2 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    2. Build Web Assets & Initialize iOS Platform
                  </span>
                  <button
                    onClick={() =>
                      handleCopyCmd('npm run build && npx cap add ios && npx cap sync ios', 'cmd2')
                    }
                    className="text-[11px] text-[#D45B5B] hover:underline font-bold inline-flex items-center gap-1"
                  >
                    {copiedCmd === 'cmd2' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto">
                  npm run build && npx cap add ios && npx cap sync ios
                </pre>
              </div>

              {/* Command 3 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    3. Launch in Xcode & Archive to IPA / App Store
                  </span>
                  <button
                    onClick={() => handleCopyCmd('npx cap open ios', 'cmd3')}
                    className="text-[11px] text-[#D45B5B] hover:underline font-bold inline-flex items-center gap-1"
                  >
                    {copiedCmd === 'cmd3' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto">
                  npx cap open ios
                </pre>
              </div>

              <div className="p-4 bg-[#CCFBFA]/30 border border-[#B1E5E6] rounded-2xl text-xs text-[#0F4E50] space-y-1 leading-relaxed">
                <span className="font-bold block">💡 Sideloading without Apple Developer Account:</span>
                <p>
                  You can also export an unsigned IPA or run on your personal iPhone using a free Apple ID in Xcode, or sideload with tools like AltStore, SideStore, or Sideloadly.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">URL Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy App URL</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white text-xs font-bold shadow-md shadow-[#F29191]/30 hover:brightness-105 active:scale-95 transition-all"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
