'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiGetComplaints } from '@/lib/api';
import { Complaint } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Archive,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  FileCheck,
  FileText,
  Filter,
  ImageIcon,
  Lock,
  MapPin,
  RefreshCw,
  Search,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getComplaintImageUrl } from '@/lib/utils';

export default function AuthorityResolvedPage() {
  const { user } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filter, setFilter] = useState<'all' | 'resolved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Details modal
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(null);

  // Photo preview modal
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [resolvedRes, rejectedRes] = await Promise.all([
        apiGetComplaints({
          department_id: user.department_id || undefined,
          city: user.city || undefined,
          status: 'Resolved',
          per_page: 50,
        }).catch(() => ({ data: [] })),
        apiGetComplaints({
          department_id: user.department_id || undefined,
          city: user.city || undefined,
          status: 'Rejected',
          per_page: 50,
        }).catch(() => ({ data: [] })),
      ]);

      const merged = [...(resolvedRes.data || []), ...(rejectedRes.data || [])];
      setComplaints(merged);
    } catch {
      toast.error('Failed to load resolution archive.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.department_id, user?.city]);

  const filtered = complaints.filter((c) => {
    if (filter === 'resolved' && c.status !== 'Resolved') return false;
    if (filter === 'rejected' && c.status !== 'Rejected') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTrack = c.tracking_number.toLowerCase().includes(q);
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchAddress = c.address?.toLowerCase().includes(q);
      const matchNotes = c.resolution_notes?.toLowerCase().includes(q);
      return matchTrack || matchTitle || matchAddress || matchNotes;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card border border-border rounded-xl p-5 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
            <Archive className="w-3.5 h-3.5" />
            Terminal History Archive
          </div>
          <h2 className="text-lg font-extrabold text-foreground tracking-tight">
            Resolution & Terminal Archive &mdash; {user?.department?.department_name} ({user?.city || 'Karachi'})
          </h2>
          <p className="text-xs text-muted-foreground">
            Audit log of all resolved and closed tickets. Terminal-state lock is strictly enforced: completed records are immutable and cannot be re-opened.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={isLoading}
          className="px-3 py-2 border border-border rounded-lg text-xs font-semibold hover:bg-accent text-foreground flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Archive
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Terminal Records ({complaints.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filter === 'resolved'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Resolved ({complaints.filter((c) => c.status === 'Resolved').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filter === 'rejected'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Rejected ({complaints.filter((c) => c.status === 'Rejected').length})
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search resolved records by tracking #, remarks..."
          className="px-3.5 py-1.5 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-foreground w-full sm:w-72"
        />
      </div>

      {/* Terminal Archive Table */}
      <div className="bg-card border border-border rounded-xl shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-xs text-muted-foreground">
            Loading terminal records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-xs text-muted-foreground space-y-1">
            <p className="font-bold text-sm text-foreground">No Archived Records Found</p>
            <p>Resolved and rejected tickets will be permanently logged here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Tracking #</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Title & Location</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Terminal Status</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Resolution Notes</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Closed Date</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-foreground whitespace-nowrap align-top">
                      #{c.tracking_number}
                    </td>

                    <td className="px-5 py-3.5 max-w-xs align-top">
                      <div className="font-semibold text-foreground truncate">{c.title}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {c.address || `${c.city || 'Karachi'}`}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap align-top">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={c.status} size="sm" />
                        <span title="Terminal State Locked">
                          <Lock className="w-3 h-3 text-muted-foreground" />
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 max-w-sm align-top">
                      {c.resolution_notes ? (
                        <p className="text-[11px] text-foreground line-clamp-2 italic bg-muted/30 p-1.5 rounded-md">
                          &ldquo;{c.resolution_notes}&rdquo;
                        </p>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">
                          No notes recorded
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap align-top text-muted-foreground">
                      {c.resolved_at
                        ? new Date(c.resolved_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : new Date(c.updated_at).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-right align-top">
                      <button
                        type="button"
                        onClick={() => setActiveComplaint(c)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-accent text-foreground font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-primary" />
                        Inspect Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {activeComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  #{activeComplaint.tracking_number}
                </span>
                <h3 className="font-extrabold text-base text-foreground mt-1">
                  {activeComplaint.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setActiveComplaint(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={activeComplaint.status} />
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-muted-foreground text-xs font-semibold">
                  <Lock className="w-3 h-3" />
                  Terminal State Locked
                </span>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Original Issue Description
                </h4>
                <p className="text-xs text-foreground bg-muted/30 p-3 rounded-xl leading-relaxed whitespace-pre-wrap">
                  {activeComplaint.description}
                </p>
              </div>

              {/* Resolution Notes */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Resolution Notes & Field Remarks
                </h4>
                <p className="text-xs text-foreground bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl leading-relaxed whitespace-pre-wrap">
                  {activeComplaint.resolution_notes || 'No notes provided at resolution.'}
                </p>
              </div>

              {/* Photos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {getComplaintImageUrl(activeComplaint) && (
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground mb-1">
                      Reported Incident Photo
                    </h4>
                    <div className="rounded-xl overflow-hidden border border-border max-h-48 bg-muted/20 flex items-center justify-center">
                      <img
                        src={getComplaintImageUrl(activeComplaint)!}
                        alt="Incident"
                        className="max-h-48 w-auto object-contain"
                      />
                    </div>
                  </div>
                )}

                {activeComplaint.resolution_image_url && (
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground mb-1">
                      Completion Proof Photo
                    </h4>
                    <div className="rounded-xl overflow-hidden border border-border max-h-48 bg-muted/20 flex items-center justify-center">
                      <img
                        src={activeComplaint.resolution_image_url}
                        alt="Completion Proof"
                        className="max-h-48 w-auto object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-border flex justify-end bg-card">
              <button
                type="button"
                onClick={() => setActiveComplaint(null)}
                className="px-4 py-2 bg-muted hover:bg-accent text-foreground text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close Archive Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
