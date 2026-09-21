import React, { useState } from 'react';
import {
  Camera,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Apple,
  User,
  Building2,
  HelpCircle,
  X,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { AuthService, DEMO_USERS } from '../../services/authService';
import { GoogleAuthModal } from './GoogleAuthModal';
import { AppleAuthModal } from './AppleAuthModal';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('alex.vance@shutterhub.photo');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('Alex Vance');
  const [studioName, setStudioName] = useState('Vance Visuals');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Modals for Google & Apple
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isAppleModalOpen, setIsAppleModalOpen] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'signin') {
        const user = await AuthService.loginWithEmail(email, password);
        onLoginSuccess(user);
      } else {
        if (!fullName) {
          setErrorMsg('Please enter your full name.');
          setIsLoading(false);
          return;
        }
        const user = await AuthService.registerWithEmail(fullName, email, password, studioName);
        onLoginSuccess(user);
      }
    } catch (err) {
      setErrorMsg('Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (key: 'alex' | 'elena') => {
    setIsLoading(true);
    try {
      const user = await AuthService.loginAsDemo(key);
      onLoginSuccess(user);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFDFD] flex flex-col justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[24px] bg-gradient-to-br from-[#F29191] to-[#F7ADAD] shadow-lg shadow-[#F29191]/30 p-1 mx-auto">
            <div className="w-full h-full rounded-[20px] bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <Camera className="w-8 h-8 drop-shadow-xs" />
            </div>
          </div>

          <div>
            <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-[#D45B5B]">
              Professional Photographer Workspace
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display mt-0.5">
              Photo Gear Vault
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
              Gear inventory, photoshoot checklists, EXIF metadata inspection & golden-hour weather intelligence.
            </p>
          </div>
        </div>

        {/* Main Card Container */}
        <div className="bg-white rounded-[32px] border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 sm:p-7 space-y-5">
          {/* Social Sign In Actions */}
          <div className="space-y-2.5">
            {/* Google Login Button */}
            <button
              id="btn-login-google"
              type="button"
              onClick={() => setIsGoogleModalOpen(true)}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-800 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-3 active:scale-98"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              <span>Continue with Google</span>
            </button>

            {/* Apple Login Button */}
            <button
              id="btn-login-apple"
              type="button"
              onClick={() => setIsAppleModalOpen(true)}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-2xl bg-black hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2.5 active:scale-98"
            >
              <Apple className="w-4 h-4 fill-current shrink-0" />
              <span>Sign in with Apple</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-100" />
            <span className="absolute px-3 bg-white text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              or with email
            </span>
          </div>

          {/* Tab Switcher */}
          <div className="p-1 bg-slate-100/80 rounded-2xl flex gap-1">
            <button
              id="tab-btn-signin"
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'signin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              id="tab-btn-signup"
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'signup'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 animate-in fade-in">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 font-mono uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Vance"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-hidden focus:border-[#F29191] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 font-mono uppercase tracking-wider">
                    Studio / Business Name (Optional)
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Vance Visuals Photography"
                      value={studioName}
                      onChange={(e) => setStudioName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-hidden focus:border-[#F29191] focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 font-mono uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="photographer@studio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-hidden focus:border-[#F29191] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700 font-mono uppercase tracking-wider">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-[11px] text-[#D45B5B] hover:underline font-medium"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-hidden focus:border-[#F29191] focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-md border-slate-300 text-[#F29191] focus:ring-[#F29191]"
                />
                <span>Remember me on this device</span>
              </label>
            </div>

            {/* Primary Submit */}
            <button
              id="btn-submit-auth"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#F29191] to-[#F7ADAD] hover:brightness-105 active:scale-98 text-white text-xs font-bold shadow-md shadow-[#F29191]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <span>Accessing Vault...</span>
              ) : (
                <>
                  <span>
                    {mode === 'signin' ? 'Sign In to Gear Vault' : 'Create Free Photographer Account'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Pro Logins */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
              Instant 1-Click Pro Demo Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-quick-demo-alex"
                type="button"
                onClick={() => handleDemoLogin('alex')}
                disabled={isLoading}
                className="p-2.5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 text-left transition-all group flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-[10px]">
                  G
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-800 truncate group-hover:text-blue-600">
                    Alex Vance
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">
                    Google • Wedding Pro
                  </div>
                </div>
              </button>

              <button
                id="btn-quick-demo-elena"
                type="button"
                onClick={() => handleDemoLogin('elena')}
                disabled={isLoading}
                className="p-2.5 rounded-2xl border border-slate-200 hover:border-slate-800 hover:bg-slate-50 text-left transition-all group flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Apple className="w-3.5 h-3.5 fill-current" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-800 truncate group-hover:text-slate-900">
                    Elena Rostova
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">
                    Apple ID • Fashion
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Security & Privacy Badges */}
        <div className="flex items-center justify-center gap-6 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted Session</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#F29191]" />
            <span>EXIF Cloud Matcher</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>PWA Offline Cache</span>
          </div>
        </div>
      </div>

      {/* Google OAuth Modal */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSuccess={onLoginSuccess}
      />

      {/* Apple OAuth Modal */}
      <AppleAuthModal
        isOpen={isAppleModalOpen}
        onClose={() => setIsAppleModalOpen(false)}
        onSuccess={onLoginSuccess}
      />

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Reset Gear Vault Password
              </h3>
              <button
                onClick={() => {
                  setIsForgotModalOpen(false);
                  setResetSent(false);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetSent ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-xs font-bold text-emerald-900">
                  Password Reset Email Sent!
                </h4>
                <p className="text-[11px] text-emerald-700">
                  We have dispatched a recovery link to <strong>{email}</strong>.
                </p>
                <button
                  onClick={() => {
                    setIsForgotModalOpen(false);
                    setResetSent(false);
                  }}
                  className="mt-2 w-full py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Enter your registered photographer email to receive a password reset link.
                </p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="photographer@studio.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
                <button
                  type="button"
                  onClick={() => setResetSent(true)}
                  className="w-full py-2.5 bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Send Reset Link
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
