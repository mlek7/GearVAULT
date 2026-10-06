import React, { useState, useEffect } from 'react';
import {
  X,
  Github,
  Cloud,
  CloudUpload,
  CloudDownload,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Camera,
  Calendar,
  CheckSquare,
  Sparkles,
  ShieldCheck,
  Code,
  ChevronDown,
  ChevronUp,
  LogOut,
} from 'lucide-react';
import { UserProfile, VaultBackupPayload } from '../../types';
import { GitHubService, GitHubSyncResult } from '../../services/githubService';
import { AuthService } from '../../services/authService';
import { StorageService } from '../../services/storage';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserUpdate: (user: UserProfile) => void;
  onDataReload?: () => void;
  onOpenConnectModal?: () => void;
}

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate,
  onDataReload,
  onOpenConnectModal,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(GitHubService.getLastSyncTime());
  const [gistId, setGistId] = useState<string | null>(GitHubService.getStoredGistId());
  const [autoSync, setAutoSync] = useState<boolean>(() => {
    const s = StorageService.getSettings();
    return s.enableGitHubAutoSync ?? true;
  });

  const token = GitHubService.getToken() || currentUser?.githubToken;
  const isConnected = Boolean(token && (currentUser?.githubUsername || currentUser?.provider === 'github'));

  useEffect(() => {
    if (isOpen) {
      setLastSyncTime(GitHubService.getLastSyncTime());
      setGistId(GitHubService.getStoredGistId());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPayload: VaultBackupPayload = GitHubService.buildCurrentPayload(currentUser);

  const handleSyncToGitHub = async () => {
    if (!token) {
      setStatusMessage({ type: 'error', text: 'GitHub is not connected. Please connect first.' });
      return;
    }

    setIsSyncing(true);
    setStatusMessage(null);
    try {
      const res: GitHubSyncResult = await GitHubService.pushVaultToGitHub(token, currentUser);
      if (res.success) {
        setLastSyncTime(res.syncedAt);
        setGistId(res.gistId || null);
        setStatusMessage({
          type: 'success',
          text: `Vault successfully stored to GitHub! (${res.itemCounts?.gear} gear, ${res.itemCounts?.shoots} shoots saved to private Gist).`,
        });
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to sync to GitHub.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Sync failed.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromGitHub = async () => {
    if (!token) {
      setStatusMessage({ type: 'error', text: 'GitHub is not connected.' });
      return;
    }

    const confirmRestore = window.confirm(
      'Are you sure you want to restore your vault data from GitHub? This will hydrate your local gear, shoots, and checklists with the version from GitHub.'
    );
    if (!confirmRestore) return;

    setIsPulling(true);
    setStatusMessage(null);
    try {
      const res = await GitHubService.pullVaultFromGitHub(token);
      if (res.success && res.data) {
        setLastSyncTime(res.syncedAt);
        setStatusMessage({
          type: 'success',
          text: `Vault restored from GitHub! Loaded ${res.data.gear?.length || 0} gear items and ${res.data.shoots?.length || 0} scheduled shoots.`,
        });
        if (onDataReload) {
          onDataReload();
        }
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to restore from GitHub.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Restore failed.' });
    } finally {
      setIsPulling(false);
    }
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSync(enabled);
    const settings = StorageService.getSettings();
    const updated = { ...settings, enableGitHubAutoSync: enabled };
    StorageService.saveSettings(updated);
  };

  const handleDisconnect = () => {
    const confirm = window.confirm(
      'Disconnect GitHub account? Your data on GitHub will remain safe, but automatic cloud synchronization will stop.'
    );
    if (!confirm) return;

    GitHubService.clearGitHubSession();
    const updated = AuthService.unlinkGitHub();
    if (updated) onUserUpdate(updated);
    setStatusMessage({ type: 'success', text: 'GitHub account disconnected.' });
  };

  const gistUrl = gistId ? `https://gist.github.com/${gistId}` : null;

  return (
    <div
      id="github-sync-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSyncing && !isPulling) onClose();
      }}
    >
      <div
        id="github-sync-modal"
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
              <Github className="w-5 h-5 text-white fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-display">
                  GitHub Cloud Vault Sync
                </h3>
                {isConnected && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Connected
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300">
                Encrypted backup of gear inventory & shoots in private GitHub Gists
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSyncing || isPulling}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium">{statusMessage.text}</div>
            </div>
          )}

          {isConnected ? (
            <>
              {/* Connected GitHub Account Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
                    <img
                      src={currentUser?.avatarUrl || `https://github.com/${currentUser?.githubUsername}.png`}
                      alt="GitHub Avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.githubUsername || 'gh'}`;
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {currentUser?.name || currentUser?.githubUsername}
                      </span>
                      <a
                        href={`https://github.com/${currentUser?.githubUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-slate-700 inline-flex items-center"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-[11px] font-mono text-slate-500 truncate">
                      @{currentUser?.githubUsername || 'github-user'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-[11px] font-semibold text-slate-600 hover:text-rose-700 transition-colors flex items-center gap-1 shrink-0"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Disconnect</span>
                </button>
              </div>

              {/* Vault Contents Summary */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 uppercase tracking-wider font-mono">
                  <span>Vault Contents Ready for Sync</span>
                  <span className="text-[#FF2D20]">photo-gear-vault-data.json</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                    <Camera className="w-4 h-4 mx-auto text-[#FF2D20] mb-1" />
                    <span className="text-base font-extrabold text-slate-900 block font-display">
                      {currentPayload.gear.length}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Gear Items</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                    <Calendar className="w-4 h-4 mx-auto text-blue-600 mb-1" />
                    <span className="text-base font-extrabold text-slate-900 block font-display">
                      {currentPayload.shoots.length}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Shoots</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                    <CheckSquare className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                    <span className="text-base font-extrabold text-slate-900 block font-display">
                      {currentPayload.packing.length}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Checklist</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                    <Sparkles className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                    <span className="text-base font-extrabold text-slate-900 block font-display">
                      {currentPayload.moodboards.length}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Moodboards</span>
                  </div>
                </div>
              </div>

              {/* Sync Metadata & Gist Link */}
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/90 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Last Cloud Sync:</span>
                  <span className="font-semibold text-slate-900">
                    {lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Not synced yet'}
                  </span>
                </div>

                {gistUrl && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span>GitHub Gist Backup:</span>
                    <a
                      href={gistUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#FF2D20] hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
                    >
                      <span>View on gist.github.com</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Primary Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  id="btn-sync-to-github-modal"
                  type="button"
                  onClick={handleSyncToGitHub}
                  disabled={isSyncing || isPulling}
                  className="py-3 px-4 rounded-full bg-[#FF2D20] hover:bg-[#E02619] active:scale-[0.97] text-white text-xs font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <CloudUpload className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                  <span>{isSyncing ? 'Pushing to GitHub...' : 'Sync to GitHub Now'}</span>
                </button>

                <button
                  id="btn-pull-from-github-modal"
                  type="button"
                  onClick={handlePullFromGitHub}
                  disabled={isSyncing || isPulling}
                  className="py-3 px-4 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] hover:bg-[#262626] border border-black/[0.08] dark:border-white/[0.08] text-black dark:text-white text-xs font-medium transition-all shadow-xs flex items-center justify-center gap-2 active:scale-[0.97] disabled:opacity-60"
                >
                  <CloudDownload className={`w-4 h-4 ${isPulling ? 'animate-bounce' : ''}`} />
                  <span>{isPulling ? 'Restoring from GitHub...' : 'Restore from GitHub'}</span>
                </button>
              </div>

              {/* Auto-Sync Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-[20px] border border-black/[0.08] dark:border-white/[0.08] bg-[#FFFFFF] dark:bg-[#121212]">
                <div>
                  <span className="text-xs font-normal text-black dark:text-white block">
                    Automatic Cloud Synchronization
                  </span>
                  <span className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93]">
                    Automatically push changes to GitHub whenever gear or shoots are saved
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => handleToggleAutoSync(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-[#EBEBEB] dark:bg-[#1E1E1E] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-black/20 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF2D20]" />
                </label>
              </div>

              {/* JSON preview accordion */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowJsonPreview(!showJsonPreview)}
                  className="w-full p-3 bg-slate-50 text-left flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Code className="w-3.5 h-3.5 text-slate-500" />
                    <span>Inspect Raw Vault Backup JSON Payload</span>
                  </div>
                  {showJsonPreview ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>
                {showJsonPreview && (
                  <div className="p-3 bg-slate-900 text-slate-200 font-mono text-[10px] max-h-48 overflow-y-auto">
                    <pre>{JSON.stringify(currentPayload, null, 2)}</pre>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Not Connected State */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto text-slate-800">
                <Cloud className="w-8 h-8 text-slate-700" />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">
                  Store Vault Data Securely in GitHub
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Authenticate your real GitHub account to persist gear records, client shoots, serial numbers, and packing lists in your personal GitHub account.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2 max-w-sm mx-auto">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Why store data in GitHub?</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11px]">
                  <li>Stored in a private GitHub Gist owned strictly by you</li>
                  <li>Full Git commit revision history for equipment inventory</li>
                  <li>Sync across multiple laptops, tablets, and phones</li>
                  <li>No external lock-in: direct access to raw JSON anytime</li>
                </ul>
              </div>

              <div className="pt-2 max-w-xs mx-auto space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenConnectModal) onOpenConnectModal();
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Github className="w-4 h-4 fill-current" />
                  <span>Connect GitHub Account</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
