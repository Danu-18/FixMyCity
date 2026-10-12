'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, Building2, Loader2, Lock, Mail } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      await login(email.trim(), password);
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
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
        {errorMsg && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
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
                onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
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

        {/* Demo Fast Login Switcher */}
        {/* <div className="pt-4 border-t border-border">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            One-Click Demo Evaluator Accounts:
          </p>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => handleQuickLogin('citizen@fixmycity.org')}
              className="w-full text-left px-3 py-2 text-xs rounded-lg bg-background hover:bg-accent border border-border flex items-center justify-between transition-colors"
            >
              <span>👤 <b>Citizen:</b> Danial Arif</span>
              <span className="text-[10px] font-semibold text-primary">Autofill</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('roads@fixmycity.org')}
              className="w-full text-left px-3 py-2 text-xs rounded-lg bg-background hover:bg-accent border border-border flex items-center justify-between transition-colors"
            >
              <span>🛣️ <b>Authority:</b> Roads Department</span>
              <span className="text-[10px] font-semibold text-primary">Autofill</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('water@fixmycity.org')}
              className="w-full text-left px-3 py-2 text-xs rounded-lg bg-background hover:bg-accent border border-border flex items-center justify-between transition-colors"
            >
              <span>🚰 <b>Authority:</b> Water & Sanitation</span>
              <span className="text-[10px] font-semibold text-primary">Autofill</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@fixmycity.org')}
              className="w-full text-left px-3 py-2 text-xs rounded-lg bg-background hover:bg-accent border border-border flex items-center justify-between transition-colors"
            >
              <span>👑 <b>Administrator:</b> City Hall DG</span>
              <span className="text-[10px] font-semibold text-primary">Autofill</span>
            </button>
          </div>
        </div> */}

        <p className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Register as a Citizen
          </Link>
        </p>
      </div>
    </div>
  );
}
