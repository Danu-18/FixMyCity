'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Shield, ArrowRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function TrackPage() {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [error, setError] = useState('');

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      setError('Please enter a valid tracking number.');
      return;
    }
    router.push(`/complaints/${trackingNumber.trim().toUpperCase()}`);
  };

  const sampleIds = [
    { id: 'FMC-2026-1001', category: 'Pothole (Roads)', status: 'Pending' },
    { id: 'FMC-2026-1002', category: 'Burst Water Pipe (Water)', status: 'In Progress' },
    { id: 'FMC-2026-1003', category: 'Open Manhole (Public Safety)', status: 'Resolved' },
    { id: 'FMC-2026-1005', category: 'Live Wire (Electricity)', status: 'Pending' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 flex-1 flex flex-col justify-center">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Track Your Civic Complaint
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Enter your unique tracking number to see real-time state machine progress, assigned municipal department, and SLA resolution deadline.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleTrack} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">
              Tracking Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => {
                  setTrackingNumber(e.target.value);
                  setError('');
                }}
                placeholder="e.g. FMC-2026-1001"
                className="w-full pl-4 pr-32 py-3.5 text-base font-mono bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white uppercase"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bottom-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5"
              >
                Track Now
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {error && <p className="mt-2 text-xs text-red-600 font-medium">{error}</p>}
          </div>
        </form>

        {/* Quick Sample Identifiers */}
        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Quick Test Identifiers:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {sampleIds.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => router.push(`/complaints/${item.id}`)}
                className="p-3 text-left rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-indigo-400 bg-zinc-50 dark:bg-zinc-800/60 transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {item.id}
                  </span>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{item.category}</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                  {item.status}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
