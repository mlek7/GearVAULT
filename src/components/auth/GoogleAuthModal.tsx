import React, { useState } from 'react';
import { X, Check, ArrowRight, ShieldCheck, User } from 'lucide-react';
import { UserProfile } from '../../types';
import { AuthService } from '../../services/authService';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedEmail, setSelectedEmail] = useState<string>('alex.vance@shutterhub.photo');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [customEmail, setCustomEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSignIn = async (email: string, name?: string) => {
    setIsLoading(true);
    try {
      const user = await AuthService.loginWithGoogle(email, name);
      onSuccess(user);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="google-auth-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div
        id="google-auth-modal"
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Google Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display">
                Sign in with Google
              </h3>
              <p className="text-[11px] text-slate-500">
                to continue to <span className="font-semibold text-slate-800">Gear Vault</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Account Selector */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 font-medium">
            Choose a Google account to sign in:
          </p>

          <div className="space-y-2">
            {/* Account 1 */}
            <button
              id="google-account-alex"
              type="button"
              onClick={() => {
                setIsCustom(false);
                setSelectedEmail('alex.vance@shutterhub.photo');
                handleSignIn('alex.vance@shutterhub.photo', 'Alex Vance');
              }}
              disabled={isLoading}
              className="w-full p-3 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-left flex items-center gap-3 transition-all group"
            >
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                alt="Alex Vance"
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    Alex Vance
                  </h4>
                  <span className="text-[9px] px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-md font-medium">
                    Pro
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  alex.vance@shutterhub.photo
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Account 2 */}
            <button
              id="google-account-studio"
              type="button"
              onClick={() => {
                setIsCustom(false);
                setSelectedEmail('studio.creative@gmail.com');
                handleSignIn('studio.creative@gmail.com', 'Studio Creative');
              }}
              disabled={isLoading}
              className="w-full p-3 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-left flex items-center gap-3 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-xs">
                SC
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  Studio Creative Workspace
                </h4>
                <p className="text-[11px] text-slate-500 truncate">
                  studio.creative@gmail.com
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>

          {/* Option to use another Google Account */}
          {!isCustom ? (
            <button
              type="button"
              onClick={() => setIsCustom(true)}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 text-slate-600 hover:text-blue-600 text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Use another Google account</span>
            </button>
          ) : (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 animate-in fade-in">
              <span className="text-[11px] font-bold text-slate-700 block">
                Enter your Google Account:
              </span>
              <input
                type="text"
                placeholder="Full Name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-500"
              />
              <input
                type="email"
                placeholder="photographer@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-500"
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCustom(false)}
                  className="flex-1 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!customEmail) return;
                    handleSignIn(customEmail, customName || customEmail.split('@')[0]);
                  }}
                  disabled={!customEmail || isLoading}
                  className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            </div>
          )}

          {/* Trust footer */}
          <div className="pt-2 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted OAuth token exchange via Google Identity</span>
          </div>
        </div>
      </div>
    </div>
  );
};
