'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiGetAnalytics, apiGetComplaints, apiGetDepartments } from '@/lib/api';
import { AnalyticsOverview, Complaint, Department } from '@/lib/types';
import { ComplaintCard } from '@/components/ComplaintCard';
import {
  Building2,
  Search,
  PlusCircle,
  PlayCircle,
  ChevronRight,
  FileText,
  CheckCircle2,
  Clock,
  Users,
  MapPin,
  Timer,
  ThumbsUp,
  Construction,
  Droplet,
  Zap,
  Trash2,
  ShieldCheck,
  Landmark,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'react-toastify';

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
      } catch {
        // Initial load fallback
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingInput.trim()) {
      toast.warn('Please enter a tracking ID (e.g. FMC-2026-1001)');
      return;
    }
    router.push(`/complaints/${trackingInput.trim().toUpperCase()}`);
  };

  const getDeptIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('road') || n.includes('infra')) return Construction;
    if (n.includes('water') || n.includes('sanitat')) return Droplet;
    if (n.includes('power') || n.includes('elect')) return Zap;
    if (n.includes('waste') || n.includes('garbage')) return Trash2;
    if (n.includes('safety') || n.includes('security')) return ShieldCheck;
    return Landmark;
  };

  const getDeptColor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('road')) return 'text-brand-green';
    if (n.includes('water')) return 'text-primary';
    if (n.includes('power')) return 'text-brand-orange';
    if (n.includes('waste')) return 'text-brand-green';
    if (n.includes('safety')) return 'text-brand-pink';
    return 'text-brand-violet';
  };

  const stats = [
    {
      label: 'Total Reports',
      value: analytics ? analytics.summary.total_complaints.toString() : '8',
      sub: 'Citizen submitted reports',
      icon: FileText,
      cls: 'bg-primary',
    },
    {
      label: 'Resolved',
      value: analytics ? analytics.summary.resolved.toString() : '2',
      sub: 'Issues already resolved',
      icon: CheckCircle2,
      cls: 'bg-brand-green',
    },
    {
      label: 'SLA Compliance',
      value: analytics ? `${analytics.summary.sla_compliance_rate}%` : '100%',
      sub: 'Deadlines met on time',
      icon: Clock,
      cls: 'bg-brand-orange',
    },
    {
      label: 'Departments',
      value: departments.length ? departments.length.toString() : '6',
      sub: 'Connected departments',
      icon: Users,
      cls: 'bg-brand-violet',
    },
  ];

  const features = [
    {
      t: 'State Machine Routing',
      d: 'Automatically routes each complaint to the right municipal department and keeps citizens informed.',
      icon: MapPin,
      card: 'bg-primary/10',
      ic: 'bg-primary/15 text-primary',
    },
    {
      t: 'Real-Time SLA Tracking',
      d: 'Every report carries a deadline. Track SLA timers and escalations as they happen.',
      icon: Timer,
      card: 'bg-brand-violet/10',
      ic: 'bg-brand-violet/15 text-brand-violet',
    },
    {
      t: 'Geospatial Heatmapping',
      d: 'Geospatial heatmaps reveal problem hotspots and track SLA resolution deadlines in real-time.',
      icon: MapPin,
      card: 'bg-brand-pink/10',
      ic: 'bg-brand-pink/15 text-brand-pink',
    },
    {
      t: 'Community Upvoting',
      d: 'Residents upvote issues that matter so departments prioritise what affects most people.',
      icon: ThumbsUp,
      card: 'bg-brand-amber/15',
      ic: 'bg-brand-amber/25 text-brand-orange',
    },
  ];

  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="bg-hero relative overflow-hidden px-4 pb-16 pt-10 text-center sm:pt-12 border-b border-border/80">
        {/* Animated Background Blobs */}
        <div className="blob left-[-80px] top-10 h-72 w-72 bg-primary/40" />
        <div className="blob right-[-60px] top-40 h-64 w-64 bg-brand-violet/30 [animation-delay:-4s]" />
        <div className="blob bottom-0 left-1/3 h-56 w-56 bg-brand-pink/20 [animation-delay:-8s]" />

        <div className="relative mx-auto max-w-6xl">
          <span className="animate-fade-up animate-ping-soft inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-primary sm:text-xs">
            <Building2 className="h-3 w-3" /> Smart Community Civic Resolution Platform
          </span>

          <h1
            style={{ animationDelay: '120ms' }}
            className="animate-fade-up mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl text-foreground"
          >
            Empowering Citizens to{' '}
            <span className="text-gradient">Report, Track &amp; Fix</span> Their City
          </h1>

          <p
            style={{ animationDelay: '240ms' }}
            className="animate-fade-up mx-auto mt-5 max-w-2xl text-sm text-foreground/80 sm:text-base leading-relaxed"
          >
            No more unresolved complaint black holes. FixMyCity classifies citizen reports with geo-coordinates, automatically routes them to municipal departments via our state-machine engine, and tracks SLA resolution deadlines in real-time.
          </p>

          {/* Search / Track Form */}
          <form
            style={{ animationDelay: '360ms' }}
            className="animate-fade-up transition-shadow focus-within:shadow-lg focus-within:ring-2 focus-within:ring-primary/30 mx-auto mt-7 flex max-w-sm items-center gap-2 rounded-lg border border-border bg-background p-1 pl-3 shadow-sm"
            onSubmit={handleTrackSubmit}
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              className="min-w-0 flex-1 bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground"
              placeholder="Enter Tracking ID (e.g. FMC-2026-1001...)"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
            />
            <button
              type="submit"
              className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition"
            >
              Track Issue
            </button>
          </form>

          <p className="mt-2 text-[10px] text-muted-foreground">
            Quick link:{' '}
            <button
              type="button"
              onClick={() => router.push('/complaints/FMC-2026-1001')}
              className="text-primary hover:underline font-mono"
            >
              FMC-2026-1001
            </button>{' '}
            •{' '}
            <button
              type="button"
              onClick={() => router.push('/complaints/FMC-2026-1004')}
              className="text-primary hover:underline font-mono"
            >
              FMC-2026-1004
            </button>
          </p>

          {/* Action Buttons */}
          <div
            style={{ animationDelay: '480ms' }}
            className="animate-fade-up mt-6 flex flex-col justify-center gap-3 sm:flex-row"
          >
            <Link
              href="/report"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <PlusCircle className="h-4 w-4" />
              Report a Civic Issue Now
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:bg-primary/5"
            >
              <PlayCircle className="h-4 w-4 text-primary" />
              Explore City Heatmap
            </Link>
          </div>

          {/* 4 Stat KPI Cards */}
          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                style={{ animationDelay: `${600 + i * 100}ms` }}
                className={`${s.cls} animate-fade-up lift relative overflow-hidden rounded-xl p-4 text-left text-primary-foreground shadow-md`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold uppercase sm:text-xs">
                  {s.label}
                  <ChevronRight className="h-4 w-4 rounded-full bg-background/30" />
                </div>
                <div className="mt-1 text-2xl font-bold">{s.value}</div>
                <div className="pr-10 text-[10px] opacity-85">{s.sub}</div>
                <s.icon className="absolute bottom-2 right-3 h-9 w-9 opacity-60 animate-bob" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-t border-border px-4 py-14 bg-background">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          How it works
        </p>
        <h2 className="mx-auto mt-2 max-w-xl text-center text-2xl font-bold sm:text-3xl text-foreground">
          Bridging the Gap Between Citizens and Municipal Action
        </h2>
        <div className="mx-auto mt-10 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <div
              key={f.t}
              style={{ ['--d' as string]: `${i * 100}ms` }}
              className={`${f.card} lift group rounded-xl p-5 border border-border/40`}
            >
              <span
                className={`${f.ic} grid h-8 w-8 place-items-center rounded-lg transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12`}
              >
                <f.icon className="h-4 w-4" />
              </span>
              <h3 className="mt-4 font-bold text-foreground text-sm">{f.t}</h3>
              <p className="mt-2 text-xs leading-relaxed text-foreground/75">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Civic Reports Feed */}
      <section className="bg-reports px-4 py-14 border-t border-border/80">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Recent Civic Reports</h2>
              <p className="text-xs text-muted-foreground">
                Latest civic reports and their treatment status by the community.
              </p>
            </div>
            <Link href="/complaints" className="text-xs font-semibold text-primary hover:underline">
              Browse All Complaints →
            </Link>
          </div>

          {isLoading ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="h-48 rounded-xl border border-border bg-card p-4 animate-pulse"
                />
              ))}
            </div>
          ) : recentComplaints.length === 0 ? (
            <div className="mt-6 rounded-xl border border-border bg-card p-12 text-center text-xs text-muted-foreground">
              No civic complaints reported yet. Be the first to report an issue!
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentComplaints.map((c) => (
                <ComplaintCard key={c.id} complaint={c} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Integrated Municipal Authorities Section */}
      <section className="bg-authorities px-4 py-14 border-t border-border">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold text-foreground">
            Integrated Municipal Authorities
          </h2>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Departments connected and resolving complaints on the platform.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {departments.map((dept) => {
              const Icon = getDeptIcon(dept.department_name);
              const colorCls = getDeptColor(dept.department_name);
              return (
                <div
                  key={dept.id}
                  className="lift group rounded-xl border border-border bg-card p-4 shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <Icon
                        className={`h-5 w-5 transition-transform group-hover:scale-125 ${colorCls}`}
                      />
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        SLA Target {dept.sla_hours}h
                      </span>
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-foreground">
                      {dept.department_name}
                    </h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                      {dept.description}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3 text-[11px]">
                    <span className="text-muted-foreground">
                      Active: {dept.pending_complaints || 0} pending
                    </span>
                    <Link
                      href={`/complaints?department_id=${dept.id}`}
                      className="flex items-center gap-1 font-semibold text-primary hover:underline"
                    >
                      View Issues{' '}
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
