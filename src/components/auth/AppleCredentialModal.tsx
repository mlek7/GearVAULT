import React, { useState } from 'react';
import { X, Lock, Mail, User, Eye, EyeOff, Loader2, AlertCircle, Apple, Shield } from 'lucide-react';
import { UserProfile } from '../../types';
import { AuthService } from '../../services/authService';

interface AppleCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  defaultEmail?: string;
}

export const AppleCredentialModal: React.FC<AppleCredentialModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultEmail = '',
}) => {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [hideMyEmail, setHideMyEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanName = fullName.trim() || cleanEmail.split('@')[0].replace(/[._-]/g, ' ');

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter your Apple ID email address.');
      return;
    }

    if (!cleanPassword) {
      setError('Please enter your Apple ID password.');
      return;
    }

    if (cleanPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await AuthService.loginWithApple({
        email: cleanEmail,
        name: cleanName,
        password: cleanPassword,
        hideMyEmail,
      });
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Apple ID authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xs">
              <Apple className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-display">
                Sign in with Apple ID
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                to continue to Lightbag
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Apple ID <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@icloud.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your Apple ID password"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Full Name <span className="text-slate-400 dark:text-slate-500 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Melek Ben Moussa"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-all"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Hide My Email</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Forward to personal address using Apple relay</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={hideMyEmail}
              onChange={(e) => setHideMyEmail(e.target.checked)}
              className="w-4 h-4 rounded text-black border-slate-300 dark:border-slate-600 focus:ring-black"
            />
          </div>

          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl bg-black dark:bg-white hover:bg-slate-900 dark:hover:bg-slate-100 text-white dark:text-black text-xs font-bold transition-all shadow-md shadow-black/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
