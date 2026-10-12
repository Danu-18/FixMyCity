'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, KeyRound, Loader2, Lock, Mail, Shield, UserCheck } from 'lucide-react';
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
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-indigo-600/20">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
          Sign In to FixMyCity
        </h1>
        <p className="mt-1 text-xs text-zinc-500">
          Access your civic dashboard, submit reports, or manage department queues
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@fixmycity.org"
                className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log In to Portal'}
          </button>
        </form>

        {/* Demo Fast Login Switcher */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            One-Click Demo Evaluator Accounts:
          </p>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => handleQuickLogin('citizen@fixmycity.org')}
              className="w-full text-left px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between"
            >
              <span>👤 <b>Citizen:</b> Danial Arif</span>
              <span className="text-[10px] text-indigo-600">Autofill</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('roads@fixmycity.org')}
              className="w-full text-left px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between"
            >
              <span>🛣️ <b>Authority:</b> Roads Department</span>
              <span className="text-[10px] text-indigo-600">Autofill</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('water@fixmycity.org')}
              className="w-full text-left px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between"
            >
              <span>🚰 <b>Authority:</b> Water & Sanitation</span>
              <span className="text-[10px] text-indigo-600">Autofill</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@fixmycity.org')}
              className="w-full text-left px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between"
            >
              <span>👑 <b>Administrator:</b> City Hall DG</span>
              <span className="text-[10px] text-indigo-600">Autofill</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-indigo-600 font-semibold hover:underline">
            Register as a Citizen
          </Link>
        </p>
      </div>
    </div>
  );
}
