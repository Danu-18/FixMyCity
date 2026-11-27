'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiGetComplaints } from '@/lib/api';
import { Complaint } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { SlaBadge } from '@/components/SlaBadge';
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  MapPin,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ThumbsUp,
  User,
  X,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function CitizenDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved' | 'rejected'>('all');

  // Rejection reason modal
  const [activeRejectionModal, setActiveRejectionModal] = useState<{
    tracking: string;
    title: string;
    reason: string;
  } | null>(null);

  // Role Guard: strictly Citizen
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'super_admin') {
        router.push('/super-admin');
      } else if (user.role === 'authority') {
        router.push('/authority');
      }
    }
  }, [user, authLoading, router]);

  const loadCitizenComplaints = async () => {
    if (!user || user.role !== 'citizen') return;
    setIsLoading(true);
    try {
      const res = await apiGetComplaints({ mine: true, per_page: 50 });
      setComplaints(res.data || []);
    } catch {
      toast.error('Failed to load your reported complaints.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'citizen') {
      loadCitizenComplaints();
    }
  }, [user]);

  if (authLoading || !user || user.role !== 'citizen') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Loading citizen dashboard...
        </p>
      </div>
    );
  }

  // Metrics
  const totalCount = complaints.length;
  const inProgressCount = complaints.filter((c) => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;
  const pendingReviewCount = complaints.filter(
    (c) => c.status === 'Pending' || c.moderation_status === 'pending_review'
  ).length;

  const filtered = complaints.filter((c) => {
    if (statusFilter === 'pending' && c.status !== 'Pending') return false;
    if (statusFilter === 'in_progress' && c.status !== 'In Progress') return false;
    if (statusFilter === 'resolved' && c.status !== 'Resolved') return false;
    if (statusFilter === 'rejected' && c.status !== 'Rejected' && c.moderation_status !== 'rejected') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTrack = c.tracking_number.toLowerCase().includes(q);
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchDept = c.department?.department_name.toLowerCase().includes(q);
      const matchCategory = c.category?.category_name.toLowerCase().includes(q);
      return matchTrack || matchTitle || matchDept || matchCategory;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 w-full space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <User className="w-3.5 h-3.5" />
            Resident Citizen Portal
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Welcome back, {user.name}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground max-w-xl">
            Track your submitted civic issues, inspect real-time departmental turnaround deadlines, and monitor municipal resolutions across {user.city || 'your city'}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={loadCitizenComplaints}
            disabled={isLoading}
            className="px-3.5 py-2.5 border border-border rounded-xl text-xs font-semibold hover:bg-accent text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <Link
            href="/report"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Report Civic Issue
          </Link>
        </div>
      </div>

      {/* Citizen KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-card border border-border rounded-xl shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Total Reported
            </span>
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-foreground">{totalCount}</div>
          <p className="text-[10px] text-muted-foreground mt-0.5">Issues logged by you</p>
        </div>

        <div className="p-4 bg-card border border-border rounded-xl shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Under Review
            </span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-foreground">{pendingReviewCount}</div>
          <p className="text-[10px] text-muted-foreground mt-0.5">Moderation or pending dispatch</p>
        </div>

        <div className="p-4 bg-card border border-border rounded-xl shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              In Progress
            </span>
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-foreground">{inProgressCount}</div>
          <p className="text-[10px] text-muted-foreground mt-0.5">Active field crew repairs</p>
        </div>

        <div className="p-4 bg-card border border-border rounded-xl shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Resolved
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-foreground text-emerald-600 dark:text-emerald-400">
            {resolvedCount}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">Completed civic resolutions</p>
        </div>
      </div>

      {/* Complaints Directory */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              My Reported Complaints
            </h2>
            <p className="text-xs text-muted-foreground">
              All complaints filed under your citizen account.
            </p>
          </div>

          {/* Search Box */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, #, department..."
            className="px-3.5 py-1.5 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground w-full sm:w-64"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({complaints.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Pending ({complaints.filter((c) => c.status === 'Pending').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              statusFilter === 'in_progress'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            In Progress ({complaints.filter((c) => c.status === 'In Progress').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('resolved')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              statusFilter === 'resolved'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Resolved ({complaints.filter((c) => c.status === 'Resolved').length})
          </button>
        </div>

        {/* Table of Complaints */}
        {isLoading ? (
          <div className="p-16 text-center text-xs text-muted-foreground flex flex-col items-center">
            <Loader2 className="w-7 h-7 animate-spin text-primary mb-2" />
            Loading your complaints...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-xs text-muted-foreground space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">No Complaints Found</p>
              <p className="mt-1">You haven&apos;t reported any issues matching this filter yet.</p>
            </div>
            <Link
              href="/report"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:bg-primary/90 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Report Your First Civic Issue
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 sm:mx-0">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Tracking #</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Title & Category</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Department</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">SLA Deadline</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => {
                  const isRejected = c.status === 'Rejected' || c.moderation_status === 'rejected';
                  const isPendingReview = !isRejected && c.moderation_status === 'pending_review';
                  const displayStatus = isRejected ? 'Rejected' : isPendingReview ? 'Pending Review' : c.status;

                  return (
                    <tr key={c.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-primary whitespace-nowrap align-top">
                        #{c.tracking_number}
                      </td>

                      <td className="px-5 py-3.5 max-w-xs align-top">
                        <div className="font-semibold text-foreground truncate">{c.title}</div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {c.category?.category_name} &bull; {c.city ? `${c.city} • ` : ''}
                          {c.address || 'Geo-Coordinates'}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-muted-foreground align-top">
                        {c.department?.department_name}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap align-top">
                        <div className="flex flex-col gap-1 items-start max-w-[180px]">
                          <StatusBadge status={displayStatus} size="sm" />

                          {isRejected && c.moderation_reason && (
                            <div className="mt-0.5 w-full">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveRejectionModal({
                                    tracking: c.tracking_number,
                                    title: c.title,
                                    reason: c.moderation_reason!,
                                  })
                                }
                                className="text-[10px] font-semibold text-destructive underline hover:text-destructive/80 transition-colors cursor-pointer text-left"
                              >
                                View Rejection Reason
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap align-top">
                        <SlaBadge
                          deadline={c.sla_deadline}
                          status={displayStatus}
                          isBreached={c.is_sla_breached}
                        />
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-right space-x-2 align-top">
                        <Link
                          href={`/complaints/${c.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-accent text-foreground font-semibold text-xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-primary" />
                          Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejection Details Modal */}
      {activeRejectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-sm text-foreground">Rejection Reason</h3>
                  <p className="text-[11px] font-mono text-muted-foreground">
                    #{activeRejectionModal.tracking}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveRejectionModal(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Complaint Title
                </span>
                <p className="text-xs font-semibold text-foreground mt-0.5">
                  {activeRejectionModal.title}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Moderator Notes & Explanation
                </span>
                <div className="mt-1 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive leading-relaxed whitespace-pre-wrap break-words">
                  {activeRejectionModal.reason}
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground">
                If you believe this was an error, you may file a revised complaint with complete details and appropriate civic imagery.
              </p>
            </div>

            <div className="pt-2 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setActiveRejectionModal(null)}
                className="px-4 py-2 rounded-xl bg-muted hover:bg-accent text-foreground text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
