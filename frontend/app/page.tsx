'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiGetAnalytics, apiGetComplaints, apiGetDepartments } from '@/lib/api';
import { AnalyticsOverview, Complaint, Department } from '@/lib/types';
import { ComplaintCard } from '@/components/ComplaintCard';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  PlusCircle,
  Search,
  ShieldAlert,
  ThumbsUp,
  Zap,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [trackingInput, setTrackingInput] = useState('');
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [complaintsRes, deptsRes, analyticsRes] = await Promise.all([
          apiGetComplaints({ per_page: 6, sort: 'newest' }),
          apiGetDepartments(),
          apiGetAnalytics(),
        ]);
        setRecentComplaints(complaintsRes.data || []);
        setDepartments(deptsRes || []);
        setAnalytics(analyticsRes);
      } catch (err) {
        console.error('Error loading initial data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;
    router.push(`/complaints/${trackingInput.trim().toUpperCase()}`);
  };

  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/70 via-white to-zinc-50 dark:from-zinc-900/50 dark:via-zinc-950 dark:to-zinc-950 pt-16 pb-20 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/80 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6">
              <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Smart Community Civic Resolution Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.15]">
              Empowering Citizens to <br />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Report, Track & Fix
              </span>{' '}
              Their City
            </h1>

            <p className="mt-5 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
              No more unresolved complaint black holes. FixMyCity classifies citizen reports with geo-coordinates, automatically routes them to municipal departments via our state-machine engine, and tracks SLA resolution deadlines in real-time.
            </p>

            {/* Quick Track Input Bar */}
            <div className="mt-8 max-w-xl mx-auto">
              <form onSubmit={handleTrackSubmit} className="relative flex items-center">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="Enter Tracking ID (e.g. FMC-2026-1001)..."
                    className="block w-full pl-11 pr-32 py-3.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-2xl shadow-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-zinc-900 dark:text-white placeholder-zinc-400"
                  />
                  <button
                    type="submit"
                    className="absolute inset-y-1.5 right-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-xs transition-colors"
                  >
                    Track Issue
                  </button>
                </div>
              </form>
              <div className="mt-2 text-xs text-zinc-500 flex items-center justify-center gap-2">
                <span>Quick test:</span>
                <button
                  type="button"
                  onClick={() => router.push('/complaints/FMC-2026-1001')}
                  className="font-mono text-indigo-600 hover:underline"
                >
                  FMC-2026-1001
                </button>
                <span>&bull;</span>
                <button
                  type="button"
                  onClick={() => router.push('/complaints/FMC-2026-1002')}
                  className="font-mono text-indigo-600 hover:underline"
                >
                  FMC-2026-1002
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/report"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
              >
                <PlusCircle className="w-4 h-4" />
                Report a Civic Issue Now
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-semibold text-sm shadow-xs transition-colors"
              >
                <Layers className="w-4 h-4 text-indigo-600" />
                Explore City Heatmap
              </Link>
            </div>
          </div>

          {/* Real-time KPI Counters */}
          <div className="mt-14 max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                <span className="text-xs font-medium uppercase tracking-wider">Total Reports</span>
                <BarChart3 className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {analytics?.summary.total_complaints ?? 8}
              </p>
              <span className="text-[11px] text-zinc-500">Across all municipal sectors</span>
            </div>

            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                <span className="text-xs font-medium uppercase tracking-wider">Resolved</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {analytics?.summary.resolved ?? 2}
              </p>
              <span className="text-[11px] text-zinc-500">Completed with evidence</span>
            </div>

            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                <span className="text-xs font-medium uppercase tracking-wider">SLA Compliance</span>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
                {analytics?.summary.sla_compliance_rate ?? 100}%
              </p>
              <span className="text-[11px] text-zinc-500">Turnaround target met</span>
            </div>

            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                <span className="text-xs font-medium uppercase tracking-wider">Departments</span>
                <Building2 className="w-4 h-4 text-amber-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {departments.length || 6}
              </p>
              <span className="text-[11px] text-zinc-500">Connected municipal agencies</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Workflow Features */}
      <section className="py-16 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Why FixMyCity Works
            </h2>
            <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Bridging the Gap Between Citizens and Municipal Action
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">
                State-Machine Routing
              </h3>
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Automatically matches complaints with the responsible department based on predefined category rules, eliminating manual bottlenecks.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">
                Real-Time SLA Tracking
              </h3>
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Strict Service Level Agreements hold authorities accountable. Citizens monitor countdown clocks and breach warnings publicly.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">
                Geospatial Heatmapping
              </h3>
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Visualizes incident density across city sectors. Authorities deploy road repair crews and sanitation teams where clusters are heaviest.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <ThumbsUp className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">
                Community Upvoting
              </h3>
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Neighbors upvote hazardous local issues to escalate priority, ensuring life-threatening problems like open manholes receive immediate triage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Recent Complaints Directory Preview */}
      <section className="py-16 bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Recent Civic Reports
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Real-time stream of complaints submitted across urban neighborhoods
              </p>
            </div>
            <Link
              href="/complaints"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors"
            >
              Browse All Complaints
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              ))}
            </div>
          ) : recentComplaints.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <p className="text-sm text-zinc-500">No complaints reported yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentComplaints.map((c) => (
                <ComplaintCard key={c.id} complaint={c} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Connected Departments Section */}
      <section className="py-16 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Integrated Municipal Authorities
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Direct routing and resolution tracking across all city departments
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between bg-zinc-50/40 dark:bg-zinc-900/40"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      SLA Target: {dept.sla_hours}h
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                    {dept.department_name}
                  </h3>
                  <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                    {dept.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                  <span>Active: {dept.pending_complaints || 0} pending</span>
                  <Link
                    href={`/complaints?department_id=${dept.id}`}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    View Issues →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
