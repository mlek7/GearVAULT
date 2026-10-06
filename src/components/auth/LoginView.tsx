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
  X,
  AlertCircle,
  UserPlus,
  Loader2,
  Shield,
  FileText,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { AuthService } from '../../services/authService';
import { LegalModal } from '../legal/LegalModal';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studioName, setStudioName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authenticatingProvider, setAuthenticatingProvider] = useState<'google' | 'apple' | null>(null);

  // Forgot password modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);

  // Legal Modals
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setAuthenticatingProvider('google');
    setIsLoading(true);
    try {
      const user = await AuthService.loginWithGoogle();
      onLoginSuccess(user);
    } catch (err: any) {
      console.error('Google auth error:', err);
      // Clean up Firebase error messages for user readability
      let msg = err.message || 'Google authentication could not be completed.';
      if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Sign in was cancelled.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        msg = 'Another sign-in window was open.';
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
      setAuthenticatingProvider(null);
    }
  };

  const handleAppleLogin = async () => {
    setErrorMsg(null);
    setAuthenticatingProvider('apple');
    setIsLoading(true);
    try {
      const user = await AuthService.loginWithApple();
      onLoginSuccess(user);
    } catch (err: any) {
      console.error('Apple auth error:', err);
      let msg = err.message || 'Sign in with Apple could not be completed.';
      if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Sign in was cancelled.';
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
      setAuthenticatingProvider(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'signin') {
        const user = await AuthService.loginWithEmail(cleanEmail, password);
        onLoginSuccess(user);
      } else {
        if (!fullName.trim()) {
          setErrorMsg('Please enter your full photographer name.');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Password must contain at least 6 characters.');
          setIsLoading(false);
          return;
        }
        const user = await AuthService.registerWithEmail(
          fullName.trim(),
          cleanEmail,
          password,
          studioName.trim()
        );
        onLoginSuccess(user);
      }
    } catch (err: any) {
      console.error('Email auth error:', err);
      let msg = err?.message || 'Authentication failed. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        msg = 'No account found with these credentials. Please check your email or create an account.';
      } else if (err.code === 'auth/wrong-password') {
        msg = 'Incorrect password. Please verify and try again.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email address already exists. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPasswordReset = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setResetError('Please enter a valid email address.');
      return;
    }
    setIsSendingReset(true);
    setResetError(null);
    try {
      await AuthService.sendPasswordReset(cleanEmail);
      setResetSent(true);
    } catch (err: any) {
      setResetError(err.message || 'Failed to send password reset email.');
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFDFD] dark:bg-[#000000] flex flex-col justify-center px-4 py-8 sm:px-6 transition-colors">
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[24px] bg-[#1E1E1E] text-[#FF2D20] border border-white/[0.08] p-1 mx-auto shadow-md">
            <div className="w-full h-full rounded-[20px] bg-black/40 flex items-center justify-center">
              <Camera className="w-8 h-8" />
            </div>
          </div>

          <div>
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#FF2D20]">
              Photographer Access Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display mt-0.5">
              Lightbag
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
              Authenticate with your verified credentials to access your gear inventory, photoshoot checklists &amp; weather forecast intelligence.
            </p>
          </div>
        </div>

        {/* Main Card Container */}
        <div className="bg-white dark:bg-[#121212] rounded-[32px] border border-slate-200/90 dark:border-white/[0.08] shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-7 space-y-5">
          {/* Social Sign In Actions (Firebase Auth) */}
          <div className="space-y-2.5">
            {/* Google Login Button */}
            <button
              id="btn-login-google"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-[#1E1E1E] hover:bg-slate-50 dark:hover:bg-[#252525] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-3 active:scale-98 disabled:opacity-70 cursor-pointer"
            >
              {authenticatingProvider === 'google' ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#FF2D20]" />
              ) : (
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
              )}
              <span>Continue with Google</span>
            </button>

            {/* Apple Login Button */}
            <button
              id="btn-login-apple"
              type="button"
              onClick={handleAppleLogin}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-2xl bg-black hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2.5 active:scale-98 disabled:opacity-70 cursor-pointer"
            >
              {authenticatingProvider === 'apple' ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Apple className="w-4 h-4 fill-current shrink-0" />
              )}
              <span>Sign in with Apple</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-100 dark:border-white/[0.08]" />
            <span className="absolute px-3 bg-white dark:bg-[#121212] text-[11px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              or with email credentials
            </span>
          </div>

          {/* Tab Switcher */}
          <div className="p-1 bg-slate-100/80 dark:bg-[#1E1E1E] rounded-2xl flex gap-1">
            <button
              id="tab-btn-signin"
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'signin'
                  ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
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
                  ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Message with Smart Switch to Signup */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-xs text-rose-700 dark:text-rose-400 space-y-1.5 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">{errorMsg}</div>
              </div>
              {mode === 'signin' && errorMsg.includes('create an account') && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 dark:text-rose-300 underline hover:text-rose-950"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Register with &quot;{email}&quot; now</span>
                </button>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 font-mono uppercase tracking-wider">
                    Photographer Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="input-signup-name"
                      type="text"
                      required
                      placeholder="e.g. Maya Lin"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/[0.08] rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-[#FF2D20] focus:bg-white dark:focus:bg-[#252525] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 font-mono uppercase tracking-wider">
                    Studio / Business Name (Optional)
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="input-signup-studio"
                      type="text"
                      placeholder="e.g. Lin Light Studios"
                      value={studioName}
                      onChange={(e) => setStudioName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/[0.08] rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-[#FF2D20] focus:bg-white dark:focus:bg-[#252525] transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 font-mono uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="input-auth-email"
                  type="email"
                  required
                  placeholder="photographer@studio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/[0.08] rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-[#FF2D20] focus:bg-white dark:focus:bg-[#252525] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono uppercase tracking-wider">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setResetSent(false);
                      setResetError(null);
                      setIsForgotModalOpen(true);
                    }}
                    className="text-[11px] text-[#FF2D20] hover:underline font-medium cursor-pointer"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="input-auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/[0.08] rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-[#FF2D20] focus:bg-white dark:focus:bg-[#252525] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
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
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-md border-slate-300 text-[#FF2D20] focus:ring-[#FF2D20]"
                />
                <span>Remember me on this browser</span>
              </label>
            </div>

            {/* Primary Submit */}
            <button
              id="btn-submit-auth"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-full bg-[#FF2D20] hover:bg-[#E02619] active:scale-[0.97] text-white text-xs font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isLoading && authenticatingProvider === null ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === 'signin' ? 'Sign In to Lightbag' : 'Create Photographer Account'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Prompt to switch modes */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/[0.08] text-center">
            {mode === 'signin' ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Don&apos;t have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                  }}
                  className="font-medium text-[#FF2D20] hover:underline cursor-pointer"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                  }}
                  className="font-medium text-[#FF2D20] hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Security & Privacy Badges */}
        <div className="flex items-center justify-center gap-6 text-[11px] text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Firebase Security</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#FF2D20]" />
            <span>EXIF Cloud Matcher</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>PWA Offline Cache</span>
          </div>
        </div>

        {/* Legal Links (Requirement 4) */}
        <div className="flex items-center justify-center gap-4 text-xs text-slate-400 dark:text-slate-500 pt-1">
          <button
            type="button"
            onClick={() => setLegalModalType('privacy')}
            className="hover:text-slate-700 dark:hover:text-slate-300 underline underline-offset-2 cursor-pointer transition-colors"
          >
            Privacy Policy
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => setLegalModalType('terms')}
            className="hover:text-slate-700 dark:hover:text-slate-300 underline underline-offset-2 cursor-pointer transition-colors"
          >
            Terms of Use
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#121212] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Reset Lightbag Password
              </h3>
              <button
                onClick={() => {
                  setIsForgotModalOpen(false);
                  setResetSent(false);
                  setResetError(null);
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetSent ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Password Reset Email Sent!
                </h4>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-relaxed">
                  We have dispatched a recovery link to <strong>{email || 'your email'}</strong> via Firebase Authentication. Check your inbox and spam folder.
                </p>
                <button
                  onClick={() => {
                    setIsForgotModalOpen(false);
                    setResetSent(false);
                  }}
                  className="mt-2 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Enter your registered photographer email to receive a password reset link.
                </p>
                {resetError && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-[11px] text-rose-700 dark:text-rose-400">
                    {resetError}
                  </div>
                )}
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="photographer@studio.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-[#FF2D20]"
                />
                <button
                  type="button"
                  disabled={isSendingReset}
                  onClick={handleSendPasswordReset}
                  className="w-full py-2.5 bg-[#FF2D20] hover:bg-[#E02619] text-white rounded-full text-xs font-medium active:scale-[0.97] transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {isSendingReset ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Email...</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legal Modal */}
      <LegalModal
        type={legalModalType || 'privacy'}
        isOpen={legalModalType !== null}
        onClose={() => setLegalModalType(null)}
      />
    </div>
  );
};
