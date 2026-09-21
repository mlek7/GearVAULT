import React, { useState } from 'react';
import { X, Check, ArrowRight, ShieldCheck, Apple, ScanFace, Lock } from 'lucide-react';
import { UserProfile } from '../../types';
import { AuthService } from '../../services/authService';

interface AppleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AppleAuthModal: React.FC<AppleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState<string>('Elena Rostova');
  const [email, setEmail] = useState<string>('elena.rostova@icloud.com');
  const [hideMyEmail, setHideMyEmail] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const user = await AuthService.loginWithApple({
        name,
        email,
        hideMyEmail,
      });
      onSuccess(user);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="apple-auth-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div
        id="apple-auth-modal"
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Apple ID Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
              <Apple className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-display">
                Sign in with Apple
              </h3>
              <p className="text-[11px] text-slate-300">
                Photo Gear Vault & Shoot Manager
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

        {/* Apple Content */}
        <div className="p-6 space-y-4">
          <div className="text-center py-2 space-y-1">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-800 mb-2">
              <ScanFace className="w-6 h-6 text-slate-700" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Do you want to sign in with your Apple ID?
            </h4>
            <p className="text-xs text-slate-500">
              {email}
            </p>
          </div>

          {/* Privacy Choice: Share vs Hide */}
          <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block px-1">
              Email Privacy Options
            </span>

            <button
              type="button"
              onClick={() => setHideMyEmail(false)}
              className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                !hideMyEmail
                  ? 'border-slate-900 bg-white shadow-xs'
                  : 'border-transparent hover:bg-white/60'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                  !hideMyEmail
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300'
                }`}
              >
                {!hideMyEmail && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block">
                  Share My Email
                </span>
                <span className="text-[11px] text-slate-500 truncate block">
                  {email}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setHideMyEmail(true)}
              className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                hideMyEmail
                  ? 'border-slate-900 bg-white shadow-xs'
                  : 'border-transparent hover:bg-white/60'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                  hideMyEmail
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300'
                }`}
              >
                {hideMyEmail && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block">
                  Hide My Email
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Forward to your inbox via Apple Relay
                </span>
              </div>
            </button>
          </div>

          {/* Confirm Button */}
          <button
            id="btn-apple-confirm-signin"
            type="button"
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <span>Authenticating with Apple...</span>
            ) : (
              <>
                <Apple className="w-4 h-4 fill-current" />
                <span>Continue with Passkey / Face ID</span>
              </>
            )}
          </button>

          {/* Privacy Note */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 text-center">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Apple does not track your app usage or gear assets</span>
          </div>
        </div>
      </div>
    </div>
  );
};
