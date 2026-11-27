'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  apiGetAnalytics,
  apiGetDepartments,
  apiGetModerationQueue,
  apiGetPendingStaff,
  apiTriggerSlaCheck,
} from '@/lib/api';
import { AnalyticsOverview, Department } from '@/lib/types';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  FileText,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Zap,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useSuperAdmin } from './layout';

export default function SuperAdminOverviewPage() {
  const { refreshCounts } = useSuperAdmin();

  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [pendingStaffCount, setPendingStaffCount] = useState<number>(0);
  const [pendingModCount, setPendingModCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // SLA Trigger state
  const [isTriggeringSla, setIsTriggeringSla] = useState<boolean>(false);
  const [slaAuditMessage, setSlaAuditMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [analyticsRes, deptsRes, staffRes, modRes] = await Promise.all([
        apiGetAnalytics().catch(() => null),
        apiGetDepartments().catch(() => []),
        apiGetPendingStaff().catch(() => []),
        apiGetModerationQueue().catch(() => []),
      ]);

      setAnalytics(analyticsRes);
      setDepartments(deptsRes || []);
      setPendingStaffCount(staffRes?.length || 0);
      setPendingModCount(modRes?.length || 0);
      refreshCounts();
    } catch (err: any) {
      toast.error('Failed to load Super Admin dashboard overview.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunSlaAudit = async () => {
    setIsTriggeringSla(true);
    setSlaAuditMessage(null);
    try {
      const res = await apiTriggerSlaCheck();
      const msg =
        res.message ||
        `SLA Audit Completed: Audited ${res.audited_count || 0} active complaints. ${res.breached_count || 0} breaches flagged.`;
      setSlaAuditMessage({ text: msg, type: 'success' });
      toast.success(msg);
      // Reload analytics to reflect potential breach updates
      await loadData();
    } catch (err: any) {
      const errorMsg = err.message || 'SLA audit run failed.';
      setSlaAuditMessage({ text: errorMsg, type: 'error' });
      toast.error(errorMsg);
    } finally {
      setIsTriggeringSla(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Loading platform governance metrics...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card border border-border rounded-xl p-5 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Executive Oversight
          </div>
          <h2 className="text-lg font-extrabold text-foreground tracking-tight">
            FixMyCity Administrative Governance
          </h2>
          <p className="text-xs text-muted-foreground">
            Platform-wide identity moderation, complaint publishing, and SLA compliance monitoring.
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

          <button
            type="button"
            onClick={handleRunSlaAudit}
            disabled={isTriggeringSla}
            className="px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isTriggeringSla ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 fill-current" />
            )}
            Run SLA Audit
          </button>
        </div>
      </div>

      {/* SLA Audit Result Notification */}
      {slaAuditMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 border animate-in fade-in duration-150 ${
            slaAuditMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-destructive/10 border-destructive/30 text-destructive'
          }`}
        >
          <div className="flex items-center gap-2">
            {slaAuditMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            )}
            <span className="font-semibold">{slaAuditMessage.text}</span>
          </div>

          <button
            onClick={() => setSlaAuditMessage(null)}
            className="text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Pending Moderation Card */}
        <Link
          href="/super-admin/moderation"
          className="group block p-4 bg-card border border-border hover:border-amber-500/50 rounded-xl shadow-2xs transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Pending Moderations
            </span>
            <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {pendingModCount}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
            <span>Requires review</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform">
              &rarr;
            </span>
          </p>
        </Link>

        {/* Pending Staff Card */}
        <Link
          href="/super-admin/staff"
          className="group block p-4 bg-card border border-border hover:border-primary/50 rounded-xl shadow-2xs transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Pending Staff
            </span>
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <UserCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-foreground group-hover:text-primary transition-colors">
            {pendingStaffCount}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
            <span>Identity verification</span>
            <span className="text-primary font-semibold group-hover:translate-x-0.5 transition-transform">
              &rarr;
            </span>
          </p>
        </Link>

        {/* Citywide Approved Complaints */}
        <Link
          href="/super-admin/registry"
          className="group block p-4 bg-card border border-border hover:border-blue-500/50 rounded-xl shadow-2xs transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Citywide Approved
            </span>
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-foreground">
            {analytics?.summary.total_complaints ?? 0}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Total active & resolved records
          </p>
        </Link>

        {/* Active Departments */}
        <div className="p-4 bg-card border border-border rounded-xl shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Active Departments
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-foreground">
            {departments.length}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Civic response sectors
          </p>
        </div>

        {/* SLA Compliance Rate */}
        <div className="p-4 bg-card border border-border rounded-xl shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground">
              SLA Compliance
            </span>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-foreground">
            {analytics?.summary.sla_compliance_rate ?? 100}%
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {analytics?.summary.active_breached ?? 0} active breaches
          </p>
        </div>
      </div>

      {/* Quick Action Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Moderation Queue Shortcut Banner */}
        <div className="p-5 sm:p-6 bg-card border border-border rounded-xl shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <span className="p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-sm text-foreground">
                    Citizen Complaints Moderation Queue
                  </h3>
                  {pendingModCount > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500 text-white shrink-0 whitespace-nowrap shadow-2xs">
                      {pendingModCount} Pending
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  Verify reports and photos before making them public and dispatching to departments.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-t border-border">
            <span className="text-muted-foreground text-[11px]">
              Protects against inappropriate or spam submissions.
            </span>
            <Link
              href="/super-admin/moderation"
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs transition-colors shrink-0 text-center"
            >
              Open Queue &rarr;
            </Link>
          </div>
        </div>

        {/* Staff Verification Shortcut Banner */}
        <div className="p-5 sm:p-6 bg-card border border-border rounded-xl shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <span className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                <UserCheck className="w-5 h-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-sm text-foreground">
                    Municipal Staff Authorization
                  </h3>
                  {pendingStaffCount > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-primary text-primary-foreground shrink-0 whitespace-nowrap shadow-2xs">
                      {pendingStaffCount} Pending
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  Inspect official appointment documents & badges to activate authority officer accounts.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-t border-border">
            <span className="text-muted-foreground text-[11px]">
              Enforces strict zero-trust municipal back-office access.
            </span>
            <Link
              href="/super-admin/staff"
              className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-xs transition-colors shrink-0 text-center"
            >
              Verify Staff &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Departments Performance Table */}
      <div className="bg-card border border-border rounded-xl shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">
              Department Performance & SLA Targets
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {departments.length} Municipal Units Registered
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-5 py-3 font-semibold uppercase tracking-wider">Department Name</th>
                <th className="px-5 py-3 font-semibold uppercase tracking-wider">Mandated SLA</th>
                <th className="px-5 py-3 font-semibold uppercase tracking-wider">Total Complaints</th>
                <th className="px-5 py-3 font-semibold uppercase tracking-wider">Resolved</th>
                <th className="px-5 py-3 font-semibold uppercase tracking-wider">Overdue Breaches</th>
                <th className="px-5 py-3 font-semibold uppercase tracking-wider text-right">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {departments.map((dept) => {
                const analyticsDept = analytics?.departments.find((d) => d.id === dept.id);
                const total = analyticsDept?.total ?? dept.total_complaints ?? 0;
                const resolved = analyticsDept?.resolved ?? dept.resolved_complaints ?? 0;
                const breached = analyticsDept?.breached ?? dept.breached_complaints ?? 0;

                return (
                  <tr key={dept.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-foreground">
                      {dept.department_name}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3" />
                        {dept.sla_hours} hours
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-foreground">
                      {total}
                    </td>
                    <td className="px-5 py-3.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                      {resolved}
                    </td>
                    <td className="px-5 py-3.5">
                      {breached > 0 ? (
                        <span className="inline-flex items-center gap-1 text-destructive font-bold bg-destructive/10 px-2 py-0.5 rounded-md">
                          <AlertTriangle className="w-3 h-3" />
                          {breached} breached
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0 breached</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right text-muted-foreground">
                      {dept.contact_email}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
