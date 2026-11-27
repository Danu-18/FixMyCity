'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiGetComplaints } from '@/lib/api';
import { Complaint } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { SlaBadge } from '@/components/SlaBadge';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Inbox,
  Loader2,
  MapPin,
  RefreshCw,
  Wrench,
  Zap,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuthority } from './layout';

export default function AuthorityOverviewPage() {
  const { user } = useAuth();
  const { refreshActiveCount } = useAuthority();

  const [activeComplaints, setActiveComplaints] = useState<Complaint[]>([]);
  const [counts, setCounts] = useState({
    pending: 0,
    inProgress: 0,
    resolved: 0,
    breached: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Fetch department and city scoped complaints
      const [pendingRes, inProgRes, resolvedRes, breachedRes] = await Promise.all([
        apiGetComplaints({
          department_id: user.department_id || undefined,
          city: user.city || undefined,
          status: 'Pending',
          per_page: 50,
        }).catch(() => ({ total: 0, data: [] })),
        apiGetComplaints({
          department_id: user.department_id || undefined,
          city: user.city || undefined,
          status: 'In Progress',
          per_page: 50,
        }).catch(() => ({ total: 0, data: [] })),
        apiGetComplaints({
          department_id: user.department_id || undefined,
          city: user.city || undefined,
          status: 'Resolved',
          per_page: 1,
        }).catch(() => ({ total: 0, data: [] })),
        apiGetComplaints({
          department_id: user.department_id || undefined,
          city: user.city || undefined,
          is_sla_breached: true,
          per_page: 10,
        }).catch(() => ({ total: 0, data: [] })),
      ]);

      const activeList = [...(pendingRes.data || []), ...(inProgRes.data || [])];
      setActiveComplaints(activeList);

      setCounts({
        pending: pendingRes.total || 0,
        inProgress: inProgRes.total || 0,
        resolved: resolvedRes.total || 0,
        breached: breachedRes.total || 0,
      });

      refreshActiveCount();
    } catch {
      toast.error('Failed to load authority operational dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.department_id, user?.city]);

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Loading departmental command center...
        </p>
      </div>
    );
  }

  const deptName = user?.department?.department_name || 'Municipal Department';
  const cityName = user?.city || 'Karachi';

  // Urgent SLA alerts: breached or deadline within 6 hours
  const urgentTickets = activeComplaints.filter((c) => {
    if (c.is_sla_breached) return true;
    if (c.sla_deadline) {
      const remainingMs = new Date(c.sla_deadline).getTime() - Date.now();
      return remainingMs > 0 && remainingMs <= 6 * 3600 * 1000;
    }
    return false;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card border border-border rounded-xl p-5 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-1.5">
            <Building2 className="w-3.5 h-3.5" />
            Operations Command
          </div>
          <h2 className="text-lg font-extrabold text-foreground tracking-tight">
            {deptName} &bull; {cityName} Hub
          </h2>
          <p className="text-xs text-muted-foreground">
            Strict jurisdiction dispatch queue. Operational status updates applied here automatically reflect across the platform in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="px-3 py-2 border border-border rounded-lg text-xs font-semibold hover:bg-accent text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <Link
            href="/authority/queue"
            className="px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Inbox className="w-3.5 h-3.5" />
            Open Active Queue &rarr;
          </Link>
        </div>
      </div>

      {/* Urgent SLA Alert Banner */}
      {urgentTickets.length > 0 && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            <div>
              <p className="font-extrabold text-xs">
                Urgent Attention Required: {urgentTickets.length} ticket{urgentTickets.length === 1 ? '' : 's'} overdue or near SLA breach in {cityName}!
              </p>
              <p className="text-[11px] opacity-90">
                Department SLA targets are legally audited. Please review and transition these complaints immediately.
              </p>
            </div>
          </div>

          <Link
            href="/authority/queue"
            className="px-3 py-1.5 bg-destructive hover:bg-destructive/90 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors whitespace-nowrap self-end sm:self-auto"
          >
            Inspect Urgent Tickets
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Assigned Active (Pending) */}
        <Link
          href="/authority/queue?status=Pending"
          className="group block p-4 bg-card border border-border hover:border-amber-500/50 rounded-xl shadow-2xs transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Assigned Active (Pending)
            </span>
            <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {counts.pending}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
            <span>Awaiting field dispatch</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform">
              &rarr;
            </span>
          </p>
        </Link>

        {/* In Progress */}
        <Link
          href="/authority/queue?status=In Progress"
          className="group block p-4 bg-card border border-border hover:border-primary/50 rounded-xl shadow-2xs transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Under Field Repair
            </span>
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Wrench className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-foreground group-hover:text-primary transition-colors">
            {counts.inProgress}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
            <span>Engineering crews assigned</span>
            <span className="text-primary font-semibold group-hover:translate-x-0.5 transition-transform">
              &rarr;
            </span>
          </p>
        </Link>

        {/* Resolved */}
        <Link
          href="/authority/resolved"
          className="group block p-4 bg-card border border-border hover:border-emerald-500/50 rounded-xl shadow-2xs transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Resolved & Closed
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {counts.resolved}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
            <span>Successful resolutions</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">
              &rarr;
            </span>
          </p>
        </Link>

        {/* Overdue SLA */}
        <div className="p-4 bg-card border border-border rounded-xl shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Overdue SLA Breaches
            </span>
            <span className="p-1.5 rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-foreground text-destructive">
            {counts.breached}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Mandate breached tickets
          </p>
        </div>
      </div>

      {/* Quick Access to Active Queue Preview */}
      <div className="bg-card border border-border rounded-xl shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">
              Priority Dispatch Queue
            </h3>
          </div>

          <Link
            href="/authority/queue"
            className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
          >
            View Full Queue ({activeComplaints.length}) &rarr;
          </Link>
        </div>

        {activeComplaints.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground space-y-1">
            <p className="font-bold text-sm text-foreground">No Active Complaints in Queue</p>
            <p>Your department queue in {cityName} is completely clear!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Tracking #</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Title & Category</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">SLA Deadline</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeComplaints.slice(0, 5).map((c) => (
                  <tr key={c.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-primary whitespace-nowrap">
                      #{c.tracking_number}
                    </td>

                    <td className="px-5 py-3.5 max-w-sm">
                      <div className="font-semibold text-foreground truncate">{c.title}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {c.category?.category_name} &bull; {c.address || 'Geo-Location'}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <StatusBadge status={c.status} size="sm" />
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <SlaBadge
                        deadline={c.sla_deadline}
                        status={c.status}
                        isBreached={c.is_sla_breached}
                      />
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <Link
                        href={`/authority/queue?highlight=${c.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-xs transition-colors"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        Update Status
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
