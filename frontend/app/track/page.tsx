'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ArrowRight } from 'lucide-react';

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
    <div className="max-w-2xl mx-auto px-4 py-16 flex-1 flex flex-col justify-center w-full">
      <div className="text-center mb-8">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md mx-auto mb-4">
          <Building2 className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
          Track Your Civic Complaint
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Enter your unique tracking number to see real-time state machine progress, assigned municipal department, and SLA resolution deadline.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleTrack} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-2 uppercase tracking-wider">
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
                className="w-full pl-4 pr-32 py-3 text-sm font-mono bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground placeholder:text-muted-foreground uppercase outline-none"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-md transition-colors flex items-center gap-1.5"
              >
                Track Now
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {error && <p className="mt-2 text-xs text-destructive font-medium">{error}</p>}
          </div>
        </form>

        {/* Quick Sample Identifiers */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Quick Test Identifiers:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {sampleIds.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => router.push(`/complaints/${item.id}`)}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background hover:bg-accent text-left transition-colors group"
              >
                <div>
                  <p className="font-mono text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    {item.id}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{item.category}</p>
                </div>
                <span className="text-[10px] font-semibold text-primary">
                  View →
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
