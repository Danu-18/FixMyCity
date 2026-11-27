'use client';

import React, { useEffect, useState } from 'react';
import {
  apiApproveComplaint,
  apiGetModerationQueue,
  apiRejectComplaint,
} from '@/lib/api';
import { Complaint } from '@/lib/types';
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Flag,
  ImageIcon,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { getComplaintImageUrl } from '@/lib/utils';
import { useSuperAdmin } from '../layout';

export default function SuperAdminModerationPage() {
  const { refreshCounts } = useSuperAdmin();

  const [queue, setQueue] = useState<Complaint[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'flagged'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Photo modal state
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // Reject modal state
  const [rejectingComplaint, setRejectingComplaint] = useState<Complaint | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const loadQueue = async () => {
    setIsLoading(true);
    try {
      const data = await apiGetModerationQueue();
      setQueue(data || []);
      refreshCounts();
    } catch (err: any) {
      toast.error('Failed to load moderation queue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleApprove = async (complaintId: number) => {
    setProcessingId(complaintId);
    try {
      const res = await apiApproveComplaint(complaintId);
      toast.success(res.message || 'Complaint approved and published!');
      setQueue((prev) => prev.filter((c) => c.id !== complaintId));
      refreshCounts();
      if (previewImage) setPreviewImage(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve complaint.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingComplaint) return;
    if (!rejectionReason || rejectionReason.trim().length < 5) {
      toast.warn('Please provide a rejection reason (minimum 5 characters).');
      return;
    }

    setProcessingId(rejectingComplaint.id);
    try {
      const res = await apiRejectComplaint(
        rejectingComplaint.id,
        rejectionReason.trim()
      );
      toast.success(res.message || 'Complaint rejected.');
      setQueue((prev) => prev.filter((c) => c.id !== rejectingComplaint.id));
      refreshCounts();
      setRejectingComplaint(null);
      setRejectionReason('');
      if (previewImage) setPreviewImage(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject complaint.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredQueue = queue.filter((c) => {
    if (filter === 'pending' && c.is_flagged) return false;
    if (filter === 'flagged' && !c.is_flagged) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTrack = c.tracking_number.toLowerCase().includes(q);
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchCity = c.city?.toLowerCase().includes(q);
      const matchDept = c.department?.department_name.toLowerCase().includes(q);
      return matchTrack || matchTitle || matchCity || matchDept;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card border border-border rounded-xl p-5 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            Public Safety & Integrity
          </div>
          <h2 className="text-lg font-extrabold text-foreground tracking-tight">
            Citizen Complaint Moderation Queue
          </h2>
          <p className="text-xs text-muted-foreground">
            Audit citizen submissions and attached imagery before publishing to the civic directory and dispatching to municipal teams.
          </p>
        </div>

        <button
          type="button"
          onClick={loadQueue}
          disabled={isLoading}
          className="px-3 py-2 border border-border rounded-lg text-xs font-semibold hover:bg-accent text-foreground flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Queue
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
            All Submissions ({queue.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filter === 'pending'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            New Reports ({queue.filter((c) => !c.is_flagged).length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('flagged')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filter === 'flagged'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Community Flagged ({queue.filter((c) => c.is_flagged).length})
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tracking #, title, city..."
          className="px-3.5 py-1.5 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-foreground w-full sm:w-64"
        />
      </div>

      {/* Queue Table */}
      <div className="bg-card border border-border rounded-xl shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-xs text-muted-foreground flex flex-col items-center">
            <Loader2 className="w-7 h-7 animate-spin text-amber-500 mb-2" />
            Loading moderation queue...
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="p-16 text-center text-xs text-muted-foreground space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="font-bold text-sm text-foreground">Moderation Queue is Clean!</p>
            <p>All citizen complaints have been verified and processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Tracking #</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Complaint & Description</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">City & Dept</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Evidence Photo</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Submitter</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredQueue.map((c) => {
                  const imgUrl = getComplaintImageUrl(c);
                  const isProcessing = processingId === c.id;

                  return (
                    <tr key={c.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap align-top">
                        <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                          #{c.tracking_number}
                        </span>
                        {c.is_flagged && (
                          <span className="mt-1 block text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/20 w-fit">
                            Flagged
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 max-w-sm align-top">
                        <div className="font-bold text-foreground">{c.title}</div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          {c.description}
                        </p>
                        {c.is_flagged && c.flag_reason && (
                          <div className="mt-1.5 p-2 bg-destructive/10 border border-destructive/20 rounded-lg text-[10px] text-destructive">
                            <span className="font-bold">Flag Reason: </span>
                            {c.flag_reason}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap align-top">
                        <div className="font-semibold text-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          {c.city || 'Karachi'}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {c.department?.department_name}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap align-top">
                        {imgUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewImage({
                                url: imgUrl,
                                title: `#${c.tracking_number} - ${c.title}`,
                              })
                            }
                            className="group relative block w-14 h-14 rounded-lg overflow-hidden border border-border hover:border-amber-500 transition-colors cursor-pointer"
                          >
                            <img
                              src={imgUrl}
                              alt={c.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5" />
                            No photo
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap align-top">
                        <div className="text-foreground font-medium">
                          {c.user?.name || 'Anonymous Citizen'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-right space-x-2 align-top">
                        <button
                          type="button"
                          onClick={() => handleApprove(c.id)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Approve & Publish
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRejectingComplaint(c);
                            setRejectionReason('');
                          }}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-destructive hover:bg-destructive/90 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Photo Inspection Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground truncate pr-4">
                Inspection: {previewImage.title}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-muted/20 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={previewImage.url}
                alt="Complaint Inspection"
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-md"
              />
            </div>
            <div className="p-3 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="px-4 py-1.5 bg-muted hover:bg-accent text-foreground text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectingComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="w-5 h-5" />
                <h3 className="font-bold text-sm text-foreground">
                  Reject Complaint #{rejectingComplaint.tracking_number}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectingComplaint(null)}
                className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Please specify the policy violation or reason for rejecting this complaint. The citizen will be notified via email and in-app alert.
            </p>

            <form onSubmit={handleReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Rejection Reason (min 5 characters) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Duplicate report, photo does not show a civic infrastructure issue, or inappropriate content."
                  className="w-full px-3 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-destructive/30 text-foreground resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingComplaint(null)}
                  className="px-3.5 py-2 border border-border rounded-xl text-xs font-medium text-foreground hover:bg-accent transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId !== null || rejectionReason.trim().length < 5}
                  className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {processingId !== null ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
