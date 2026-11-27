'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiGetComplaints, apiUpdateComplaintStatus } from '@/lib/api';
import { Complaint } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { SlaBadge } from '@/components/SlaBadge';
import {
  AlertTriangle,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck,
  FileText,
  Filter,
  ImageIcon,
  Inbox,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  UploadCloud,
  User,
  Wrench,
  X,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getComplaintImageUrl } from '@/lib/utils';
import { useAuthority } from '../layout';

export default function AuthorityActiveQueuePage() {
  const { user } = useAuth();
  const { refreshActiveCount } = useAuthority();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Photo preview modal
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // Status update modal state
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('In Progress');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [resolutionPhoto, setResolutionPhoto] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Read-only Details modal
  const [detailsComplaint, setDetailsComplaint] = useState<Complaint | null>(null);

  const loadQueue = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [pendingRes, inProgRes] = await Promise.all([
        apiGetComplaints({
          department_id: user.department_id || undefined,
          city: user.city || undefined,
          status: 'Pending',
          per_page: 50,
        }).catch(() => ({ data: [] })),
        apiGetComplaints({
          department_id: user.department_id || undefined,
          city: user.city || undefined,
          status: 'In Progress',
          per_page: 50,
        }).catch(() => ({ data: [] })),
      ]);

      const allActive = [...(pendingRes.data || []), ...(inProgRes.data || [])];
      setComplaints(allActive);
      refreshActiveCount();
    } catch {
      toast.error('Failed to load active departmental queue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [user?.department_id, user?.city]);

  const handleOpenUpdateModal = (c: Complaint) => {
    setSelectedComplaint(c);
    setTargetStatus(c.status === 'Pending' ? 'In Progress' : 'Resolved');
    setResolutionNotes('');
    setResolutionPhoto(null);
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    if (
      (targetStatus === 'Resolved' || targetStatus === 'Rejected') &&
      (!resolutionNotes || resolutionNotes.trim().length < 5)
    ) {
      toast.warn(`Please provide remarks/notes for ${targetStatus} status (minimum 5 characters).`);
      return;
    }

    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append('status', targetStatus);
      if (resolutionNotes.trim()) {
        formData.append('notes', resolutionNotes.trim());
      }
      if (resolutionPhoto) {
        formData.append('resolution_image', resolutionPhoto);
      }

      const res = await apiUpdateComplaintStatus(selectedComplaint.id, formData);
      toast.success(res.message || `Status updated to ${targetStatus}!`);

      setSelectedComplaint(null);
      setResolutionNotes('');
      setResolutionPhoto(null);
      // Reload queue
      await loadQueue();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update complaint status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const filtered = complaints.filter((c) => {
    if (filter === 'pending' && c.status !== 'Pending') return false;
    if (filter === 'in_progress' && c.status !== 'In Progress') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTrack = c.tracking_number.toLowerCase().includes(q);
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchAddress = c.address?.toLowerCase().includes(q);
      const matchCategory = c.category?.category_name.toLowerCase().includes(q);
      return matchTrack || matchTitle || matchAddress || matchCategory;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card border border-border rounded-xl p-5 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-1.5">
            <Inbox className="w-3.5 h-3.5" />
            Operational Dispatch
          </div>
          <h2 className="text-lg font-extrabold text-foreground tracking-tight">
            Active Complaint Queue &mdash; {user?.department?.department_name} ({user?.city || 'Karachi'})
          </h2>
          <p className="text-xs text-muted-foreground">
            Strict jurisdiction isolation: Only authorized officers assigned to this city and department can transition these tickets.
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
            All Active ({complaints.length})
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
            Pending Dispatch ({complaints.filter((c) => c.status === 'Pending').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('in_progress')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filter === 'in_progress'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            In Progress ({complaints.filter((c) => c.status === 'In Progress').length})
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search active tickets by title, #, location..."
          className="px-3.5 py-1.5 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground w-full sm:w-72"
        />
      </div>

      {/* Active Table */}
      <div className="bg-card border border-border rounded-xl shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-xs text-muted-foreground flex flex-col items-center">
            <Loader2 className="w-7 h-7 animate-spin text-primary mb-2" />
            Loading active operational tickets...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-xs text-muted-foreground space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="font-bold text-sm text-foreground">Zero Active Tickets in Filter</p>
            <p>Your team is all caught up with municipal requests!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Tracking #</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Title & Location</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Priority</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">SLA Deadline</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Evidence Photo</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => {
                  const imgUrl = getComplaintImageUrl(c);

                  return (
                    <tr key={c.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-primary whitespace-nowrap align-top">
                        #{c.tracking_number}
                      </td>

                      <td className="px-5 py-3.5 max-w-xs align-top">
                        <div className="font-semibold text-foreground truncate">{c.title}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{c.address || `${c.city || 'Karachi'}`}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground/80 mt-0.5">
                          Category: {c.category?.category_name}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap align-top">
                        <PriorityBadge priority={c.priority} size="sm" />
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap align-top">
                        <StatusBadge status={c.status} size="sm" />
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap align-top">
                        <SlaBadge
                          deadline={c.sla_deadline}
                          status={c.status}
                          isBreached={c.is_sla_breached}
                        />
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
                            className="group relative block w-10 h-10 rounded-lg overflow-hidden border border-border hover:border-primary transition-colors cursor-pointer"
                          >
                            <img
                              src={imgUrl}
                              alt={c.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye className="w-3.5 h-3.5 text-white" />
                            </div>
                          </button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            No photo
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-right space-x-2 align-top">
                        <button
                          type="button"
                          onClick={() => setDetailsComplaint(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-accent text-foreground font-semibold text-xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                          Details
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenUpdateModal(c)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          Update Status
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

      {/* Operational Status Update Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-primary">
                  #{selectedComplaint.tracking_number}
                </span>
                <h3 className="font-extrabold text-base text-foreground mt-0.5">
                  Update Operational Ticket Status
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-muted/40 rounded-xl text-xs space-y-1">
              <p className="font-semibold text-foreground truncate">
                {selectedComplaint.title}
              </p>
              <p className="text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {selectedComplaint.city || 'Karachi'} &bull; Current Status: <b>{selectedComplaint.status}</b>
              </p>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Select New Operational Status *
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground font-semibold"
                >
                  {selectedComplaint.status === 'Pending' && (
                    <option value="In Progress">In Progress (Dispatch Engineering Crew)</option>
                  )}
                  <option value="Resolved">Resolved (Resolution Complete)</option>
                  <option value="Rejected">Rejected (Out of Municipal Scope / Invalid)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Resolution Notes / Operational Remarks{' '}
                  {(targetStatus === 'Resolved' || targetStatus === 'Rejected') && '*'}
                </label>
                <textarea
                  rows={3}
                  required={targetStatus === 'Resolved' || targetStatus === 'Rejected'}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder={
                    targetStatus === 'Resolved'
                      ? 'Describe resolution actions taken, repair materials used, or completed inspection...'
                      : 'Provide explanation or internal department remarks...'
                  }
                  className="w-full px-3 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground resize-none"
                />
              </div>

              {/* Completion Photo Upload (for Resolved) */}
              {targetStatus === 'Resolved' && (
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Completion Proof Photo (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 border border-dashed border-input rounded-xl text-xs font-medium text-foreground hover:border-primary hover:bg-accent transition-colors">
                      <Camera className="w-4 h-4 text-primary" />
                      <span>{resolutionPhoto ? 'Change Photo' : 'Upload Completion Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setResolutionPhoto(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>

                    {resolutionPhoto && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold truncate max-w-[200px]">
                        {resolutionPhoto.name}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-3.5 py-2 border border-border rounded-xl text-xs font-medium text-foreground hover:bg-accent transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  Save & Apply Transition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Details Modal */}
      {detailsComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  #{detailsComplaint.tracking_number}
                </span>
                <h3 className="font-extrabold text-base text-foreground mt-1">
                  {detailsComplaint.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailsComplaint(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={detailsComplaint.status} />
                <PriorityBadge priority={detailsComplaint.priority} />
                <SlaBadge
                  deadline={detailsComplaint.sla_deadline}
                  status={detailsComplaint.status}
                  isBreached={detailsComplaint.is_sla_breached}
                />
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Description
                </h4>
                <p className="text-xs text-foreground bg-muted/30 p-3 rounded-xl leading-relaxed whitespace-pre-wrap">
                  {detailsComplaint.description}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Location & Address
                </h4>
                <p className="text-xs text-foreground flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    {detailsComplaint.address || `${detailsComplaint.latitude}, ${detailsComplaint.longitude}`}
                  </span>
                </p>
              </div>

              {getComplaintImageUrl(detailsComplaint) && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Citizen Photo Evidence
                  </h4>
                  <div className="rounded-xl overflow-hidden border border-border max-h-64 bg-muted/20 flex items-center justify-center">
                    <img
                      src={getComplaintImageUrl(detailsComplaint)!}
                      alt={detailsComplaint.title}
                      className="max-h-64 w-auto object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border flex items-center justify-between bg-card">
              <button
                type="button"
                onClick={() => setDetailsComplaint(null)}
                className="px-4 py-2 bg-muted hover:bg-accent text-foreground text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close Details
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = detailsComplaint;
                  setDetailsComplaint(null);
                  handleOpenUpdateModal(target);
                }}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5" />
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
