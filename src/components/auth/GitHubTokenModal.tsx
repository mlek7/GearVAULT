import React, { useState } from 'react';
import {
  X,
  Github,
  Key,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Info,
} from 'lucide-react';
import { GitHubService } from '../../services/githubService';
import { AuthService } from '../../services/authService';
import { UserProfile } from '../../types';

interface GitHubTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  mode?: 'login' | 'link';
}

export const GitHubTokenModal: React.FC<GitHubTokenModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode = 'login',
}) => {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerifyAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanToken = token.trim();
    if (!cleanToken) {
      setErrorMsg('Please enter your GitHub Personal Access Token.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Verify token with official GitHub API
      const ghUser = await GitHubService.verifyTokenAndFetchUser(cleanToken);

      // 2. Either log in or link to existing profile
      if (mode === 'link') {
        const updated = AuthService.linkGitHubToken(cleanToken, ghUser.login);
        if (updated) {
          onSuccess(updated);
        } else {
          const user = await AuthService.loginWithGitHub(cleanToken, ghUser);
          onSuccess(user);
        }
      } else {
        const user = await AuthService.loginWithGitHub(cleanToken, ghUser);
        onSuccess(user);
      }

      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to authenticate with GitHub.');
    } finally {
      setIsLoading(false);
    }
  };

  const tokenCreationUrl =
    'https://github.com/settings/tokens/new?scopes=gist,read:user,user:email&description=Photo+Gear+Vault+Cloud+Sync';

  return (
    <div
      id="github-token-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div
        id="github-token-modal"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
              <Github className="w-5 h-5 text-white fill-current" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-display">
                {mode === 'link' ? 'Connect GitHub Account' : 'Authenticate with GitHub'}
              </h3>
              <p className="text-[11px] text-slate-300">
                Personal Access Token or Fine-Grained Token
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 leading-relaxed">
                Connect your real GitHub account to store gear lists, shoots, and checklists directly in private GitHub Gists with full version control.
              </div>
            </div>

            <a
              href={tokenCreationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#FF2D20] hover:underline pl-6 transition-colors"
            >
              <span>Generate pre-configured GitHub token</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleVerifyAndSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 font-mono uppercase tracking-wider">
                GitHub Token (<span className="text-slate-400 font-normal">ghp_... or github_pat_...</span>)
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="input-github-pat"
                  type="password"
                  required
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-900 focus:outline-hidden focus:border-slate-900 focus:bg-white transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Required scopes: <span className="font-mono text-slate-600 font-semibold">gist</span> and <span className="font-mono text-slate-600 font-semibold">read:user</span>
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                id="btn-confirm-github-token"
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying with GitHub...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Privacy badge */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
            <span>Encrypted directly to your private GitHub Gists</span>
          </div>
        </div>
      </div>
    </div>
  );
};
