'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiResendVerification, apiVerifyEmail } from '@/lib/api';
import {
  AlertTriangle,
  Building2,
  Clock,
  Loader2,
  Lock,
  Mail,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const router = useRouter();
  const { login, setSession } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<{
    type: 'pending' | 'rejected' | 'rate_limit' | 'unverified' | 'generic';
    message: string;
    email?: string;
  } | null>(null);

  // OTP Verification states
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpTargetEmail, setOtpTargetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    try {
      await login(email.trim(), password);
      toast.success('Signed in successfully! Welcome back.');
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.message || 'Invalid email or password.';
      if (err.status === 429 || msg.toLowerCase().includes('too many') || msg.includes('429')) {
        const rateLimitMsg = 'Too many attempts, please try again in 1 minute';
        setAuthError({
          type: 'rate_limit',
          message: rateLimitMsg,
        });
        toast.error(rateLimitMsg);
      } else if (err.data?.requires_verification || (err.status === 403 && msg.toLowerCase().includes('verify your email'))) {
        const unverifiedEmail = err.data?.email || email.trim();
        setAuthError({
          type: 'unverified',
          message: err.data?.message || 'Please verify your email address before logging in.',
          email: unverifiedEmail,
        });
        setOtpTargetEmail(unverifiedEmail);
        toast.warning(err.data?.message || 'Please verify your email address before logging in.');
      } else if (msg.toLowerCase().includes('pending') || (err.status === 403 && msg.includes('pending'))) {
        setAuthError({
          type: 'pending',
          message: 'Your municipal staff account is pending Super Admin approval. Please wait for administrative verification.',
        });
        toast.error(msg);
      } else if (msg.toLowerCase().includes('rejected') || (err.status === 403 && msg.includes('rejected'))) {
        setAuthError({
          type: 'rejected',
          message: 'Your staff registration request was rejected by the Super Admin.',
        });
        toast.error(msg);
      } else {
        setAuthError({
          type: 'generic',
          message: msg,
        });
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = otpTargetEmail || email.trim();
    if (!targetEmail) {
      toast.error('Email address is missing.');
      return;
    }
    if (!otpCode || otpCode.trim().length !== 6) {
      toast.error('Please enter the 6-digit verification code.');
      return;
    }

    setIsOtpLoading(true);
    try {
      const res = await apiVerifyEmail(targetEmail, otpCode.trim());
      setSession(res.user, res.token);
      toast.success('Email verified successfully! Welcome to FixMyCity.');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const targetEmail = otpTargetEmail || email.trim();
    if (!targetEmail) {
      toast.error('Please enter your email address first.');
      return;
    }
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      const res = await apiResendVerification(targetEmail);
      toast.success(res.message || 'A fresh verification code has been sent to your email.');
      setResendCooldown(60);
      setShowOtpVerification(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPassword = 'password123') => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setAuthError(null);
    setShowOtpVerification(false);
    setIsLoading(true);

    try {
      await login(demoEmail, demoPassword);
      toast.success(`Signed in as ${demoEmail}`);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.message || 'Failed to sign in with demo credentials.';
      if (err.status === 429 || msg.toLowerCase().includes('too many') || msg.includes('429')) {
        const rateLimitMsg = 'Too many attempts, please try again in 1 minute';
        setAuthError({
          type: 'rate_limit',
          message: rateLimitMsg,
        });
        toast.error(rateLimitMsg);
      } else if (err.data?.requires_verification || (err.status === 403 && msg.toLowerCase().includes('verify your email'))) {
        const unverifiedEmail = err.data?.email || demoEmail;
        setAuthError({
          type: 'unverified',
          message: err.data?.message || 'Please verify your email address before logging in.',
          email: unverifiedEmail,
        });
        setOtpTargetEmail(unverifiedEmail);
        toast.warning('Please verify your email address before logging in.');
      } else if (msg.includes('pending')) {
        setAuthError({
          type: 'pending',
          message: 'Your municipal staff account is pending Super Admin approval.',
        });
        toast.error(msg);
      } else if (msg.includes('rejected')) {
        setAuthError({
          type: 'rejected',
          message: 'Your staff registration request was rejected.',
        });
        toast.error(msg);
      } else {
        setAuthError({
          type: 'generic',
          message: msg,
        });
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 w-full flex-1 flex flex-col justify-center">
      <div className="text-center mb-8">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md mx-auto mb-3">
          <Building2 className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
          Sign In to FixMyCity
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Access your civic dashboard, submit reports, or manage department queues
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Error Banners */}
        {authError && (
          <div
            className={`p-3.5 rounded-xl text-xs flex flex-col gap-2.5 border transition-all ${
              authError.type === 'pending' || authError.type === 'rate_limit' || authError.type === 'unverified'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                : 'bg-destructive/10 border-destructive/30 text-destructive'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {authError.type === 'pending' || authError.type === 'rate_limit' ? (
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              ) : authError.type === 'unverified' ? (
                <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              ) : authError.type === 'rejected' ? (
                <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-bold block">
                  {authError.type === 'pending'
                    ? 'Registration Pending Approval'
                    : authError.type === 'rate_limit'
                    ? 'Too Many Attempts'
                    : authError.type === 'unverified'
                    ? 'Email Verification Required'
                    : authError.type === 'rejected'
                    ? 'Application Rejected'
                    : 'Authentication Error'}
                </span>
                <span className="mt-0.5 block leading-relaxed">{authError.message}</span>
              </div>
            </div>

            {authError.type === 'unverified' && !showOtpVerification && (
              <div className="pt-2 border-t border-amber-500/20 flex flex-wrap gap-2 items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowOtpVerification(true)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Enter Verification Code
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isResending}
                  className="text-amber-700 dark:text-amber-400 hover:underline font-medium text-xs disabled:opacity-50 disabled:no-underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                  {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* In-place OTP Verification Panel if citizen needs verification */}
        {showOtpVerification ? (
          <div className="p-4 bg-muted/50 border border-border rounded-xl space-y-4 text-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider mb-1.5">
                <ShieldCheck className="w-3 h-3" />
                Citizen Email Verification
              </div>
              <h2 className="text-base font-bold text-foreground">
                Enter Verification Code
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Enter the 6-digit code sent to{' '}
                <span className="font-semibold text-foreground">{otpTargetEmail || email}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                required
                className="w-full text-center tracking-[0.4em] font-mono text-xl px-3 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground font-bold"
              />

              <button
                type="submit"
                disabled={isOtpLoading || otpCode.length !== 6}
                className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isOtpLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Sign In'
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || isResending}
                className="text-primary hover:underline font-medium disabled:opacity-50 disabled:no-underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}
              </button>

              <button
                type="button"
                onClick={() => setShowOtpVerification(false)}
                className="text-muted-foreground hover:text-foreground text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (authError) setAuthError(null);
                }}
                placeholder="name@fixmycity.org"
                className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (authError) setAuthError(null);
                }}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log In to Portal'}
          </button>
        </form>
        )}

        {/* 1-Click Demo Accounts Switcher */}
        <div className="pt-4 border-t border-border">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            1-Click Demo Accounts:
          </p>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => handleQuickLogin('superadmin@fixmycity.org')}
              className="w-full text-left px-3 py-2 text-xs rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 flex items-center justify-between transition-colors text-primary font-medium"
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <b>Super Admin:</b> Approver
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider">Demo Login</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@fixmycity.org')}
              className="w-full text-left px-3 py-2 text-xs rounded-lg bg-background hover:bg-accent border border-border flex items-center justify-between transition-colors"
            >
              <span>👑 <b>Administrator:</b> City Hall DG</span>
              <span className="text-[10px] font-semibold text-muted-foreground">Demo Login</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('roads@fixmycity.org')}
              className="w-full text-left px-3 py-2 text-xs rounded-lg bg-background hover:bg-accent border border-border flex items-center justify-between transition-colors"
            >
              <span>🛣️ <b>Authority:</b> Roads Department</span>
              <span className="text-[10px] font-semibold text-muted-foreground">Demo Login</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('citizen@fixmycity.org')}
              className="w-full text-left px-3 py-2 text-xs rounded-lg bg-background hover:bg-accent border border-border flex items-center justify-between transition-colors"
            >
              <span>👤 <b>Citizen:</b> Danial Arif</span>
              <span className="text-[10px] font-semibold text-muted-foreground">Demo Login</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Register Account
          </Link>
        </p>
      </div>
    </div>
  );
}
