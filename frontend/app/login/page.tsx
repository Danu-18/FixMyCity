'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  AlertTriangle,
  Building2,
  Clock,
  Loader2,
  Lock,
  Mail,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<{
    type: 'pending' | 'rejected' | 'rate_limit' | 'generic';
    message: string;
  } | null>(null);

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
      } else if (msg.toLowerCase().includes('pending') || err.status === 403 && msg.includes('pending')) {
        setAuthError({
          type: 'pending',
          message: 'Your municipal staff account is pending Super Admin approval. Please wait for administrative verification.',
        });
        toast.error(msg);
      } else if (msg.toLowerCase().includes('rejected') || err.status === 403 && msg.includes('rejected')) {
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

  const handleQuickLogin = async (demoEmail: string, demoPassword = 'password123') => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setAuthError(null);
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
            className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 border transition-all ${
              authError.type === 'pending' || authError.type === 'rate_limit'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                : 'bg-destructive/10 border-destructive/30 text-destructive'
            }`}
          >
            {authError.type === 'pending' || authError.type === 'rate_limit' ? (
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
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
                  : authError.type === 'rejected'
                  ? 'Application Rejected'
                  : 'Authentication Error'}
              </span>
              <span className="mt-0.5 block leading-relaxed">{authError.message}</span>
            </div>
          </div>
        )}

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
