'use client';

import React, { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { apiGetComplaint, apiToggleUpvote, apiUpdateComplaintStatus } from '@/lib/api';
import { Complaint } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { SlaBadge } from '@/components/SlaBadge';
import { useAuth } from '@/context/AuthContext';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  History,
  Image as ImageIcon,
  Loader2,
  MapPin,
  ThumbsUp,
  User,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full rounded-xl bg-card border border-border animate-pulse flex items-center justify-center text-muted-foreground text-xs">
      Loading map preview...
    </div>
  ),
});

function ComplaintDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const idOrTracking = params.id as string;

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Upvote state
  const [upvotes, setUpvotes] = useState<number>(0);
  const [hasUpvoted, setHasUpvoted] = useState<boolean>(false);
  const [isVoting, setIsVoting] = useState<boolean>(false);

  // Authority Status Update Modal / State
  const [newStatus, setNewStatus] = useState<string>('In Progress');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [resolutionImage, setResolutionImage] = useState<File | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [statusSuccessMsg, setStatusSuccessMsg] = useState<string | null>(null);
  const [statusErrorMsg, setStatusErrorMsg] = useState<string | null>(null);

  const fetchComplaint = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await apiGetComplaint(idOrTracking);
      setComplaint(data);
      setUpvotes(data.upvotes_count || 0);
      setHasUpvoted(data.has_upvoted || false);
      if (data.status === 'Pending') setNewStatus('In Progress');
      else if (data.status === 'In Progress') setNewStatus('Resolved');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to retrieve complaint.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (idOrTracking) {
      fetchComplaint();
    }
  }, [idOrTracking]);

  const handleUpvote = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    if (!complaint || isVoting) return;

    setIsVoting(true);
    try {
      const res = await apiToggleUpvote(complaint.id);
      setUpvotes(res.upvotes_count);
      setHasUpvoted(res.has_upvoted);
    } catch (err) {
      console.error(err);
    } finally {
      setIsVoting(false);
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;

    setIsUpdatingStatus(true);
    setStatusSuccessMsg(null);
    setStatusErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('status', newStatus);
      if (resolutionNotes.trim()) {
        formData.append('notes', resolutionNotes.trim());
      }
      if (resolutionImage) {
        formData.append('resolution_image', resolutionImage);
      }

      const res = await apiUpdateComplaintStatus(complaint.id, formData);
      setComplaint(res.complaint);
      setStatusSuccessMsg(`Complaint status successfully transitioned to '${newStatus}'.`);
      setResolutionNotes('');
      setResolutionImage(null);
    } catch (err: any) {
      console.error(err);
      setStatusErrorMsg(err.message || 'Failed to update status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Determine if current user can update this complaint
  const canUpdateStatus =
    user &&
    (user.role === 'admin' ||
      (user.role === 'authority' && user.department_id === complaint?.department_id));

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-3" />
        <p className="text-xs text-muted-foreground">Retrieving complaint history and SLA logs...</p>
      </div>
    );
  }

  if (errorMsg || !complaint) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 rounded-full bg-destructive/15 text-destructive flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Complaint Not Found</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {errorMsg || 'No record matched this tracking identifier.'}
        </p>
        <Link
          href="/complaints"
          className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Complaints Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      {/* Navigation Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
            #{complaint.tracking_number}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Left Column: Overview, Progress Stepper, Description, Evidence, Audit Trail */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <PriorityBadge priority={complaint.priority} />
                <StatusBadge status={complaint.status} />
              </div>
              <SlaBadge
                deadline={complaint.sla_deadline}
                status={complaint.status}
                isBreached={complaint.is_sla_breached}
              />
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground leading-snug">
              {complaint.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Reported {new Date(complaint.created_at).toLocaleString()}
              </span>
              {complaint.user && (
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  By {complaint.user.name}
                </span>
              )}
            </div>

            {/* Visual Workflow Stepper */}
            <div className="mt-8 pt-6 border-t border-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                Resolution Workflow State
              </h3>

              <div className="relative flex items-center justify-between">
                {/* Stepper Line */}
                <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-border -z-0" />

                {/* Step 1: Pending */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                      complaint.status === 'Pending' ||
                      complaint.status === 'In Progress' ||
                      complaint.status === 'Resolved'
                        ? 'bg-brand-orange text-white shadow-md'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    1
                  </div>
                  <span className="mt-2 text-[11px] font-semibold text-foreground">
                    Pending
                  </span>
                  <span className="text-[10px] text-muted-foreground">Auto-Routed</span>
                </div>

                {/* Step 2: In Progress */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                      complaint.status === 'In Progress' || complaint.status === 'Resolved'
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    2
                  </div>
                  <span className="mt-2 text-[11px] font-semibold text-foreground">
                    In Progress
                  </span>
                  <span className="text-[10px] text-muted-foreground">Crew Dispatched</span>
                </div>

                {/* Step 3: Resolved */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                      complaint.status === 'Resolved'
                        ? 'bg-brand-green text-white shadow-md'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    3
                  </div>
                  <span className="mt-2 text-[11px] font-semibold text-foreground">
                    Resolved
                  </span>
                  <span className="text-[10px] text-muted-foreground">Inspected & Closed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description & Photo Evidence */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Problem Description & Evidence
            </h2>

            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {complaint.description}
            </p>

            {complaint.image_url && (
              <div className="pt-4 border-t border-border">
                <h3 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  Citizen Uploaded Photo Evidence:
                </h3>
                <div className="rounded-xl overflow-hidden border border-border max-h-96 bg-muted">
                  <img
                    src={complaint.image_url}
                    alt={complaint.title}
                    className="w-full h-auto object-contain max-h-96"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Resolution Outcome (if resolved) */}
          {complaint.status === 'Resolved' && (
            <div className="bg-brand-green/10 border border-brand-green/20 rounded-xl p-6 shadow-xs">
              <div className="flex items-center gap-2 text-brand-green font-bold text-sm mb-2">
                <CheckCircle className="w-5 h-5 text-brand-green" />
                Resolution Outcome
              </div>

              {complaint.resolution_notes && (
                <p className="text-xs text-foreground leading-relaxed">
                  {complaint.resolution_notes}
                </p>
              )}

              {complaint.resolved_at && (
                <p className="text-[11px] text-muted-foreground mt-2">
                  Completed on: {new Date(complaint.resolved_at).toLocaleString()}
                </p>
              )}

              {complaint.resolution_image_url && (
                <div className="mt-4">
                  <p className="text-[11px] font-semibold text-foreground mb-1">
                    Completion Verification Photo:
                  </p>
                  <img
                    src={complaint.resolution_image_url}
                    alt="Resolution evidence"
                    className="rounded-lg max-h-48 object-cover border border-border"
                  />
                </div>
              )}
            </div>
          )}

          {/* Complete Status History / Audit Trail Timeline */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <span>Status Transition Audit Trail</span>
            </h2>

            {!complaint.status_history || complaint.status_history.length === 0 ? (
              <p className="text-xs text-muted-foreground">No status changes recorded yet.</p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {complaint.status_history.map((hist, idx) => (
                  <div key={hist.id || idx} className="relative">
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center ring-4 ring-card">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {hist.new_status}
                        </span>
                        {hist.old_status && (
                          <span className="text-[11px] text-muted-foreground">
                            (was {hist.old_status})
                          </span>
                        )}
                        <span className="text-[11px] text-muted-foreground">
                          &bull; {new Date(hist.changed_at).toLocaleString()}
                        </span>
                      </div>

                      {hist.notes && (
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {hist.notes}
                        </p>
                      )}

                      {hist.changer && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Logged by: <b>{hist.changer.name}</b> ({hist.changer.role})
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Routing & Department metadata, Leaflet map, Upvote, Officer Action box */}
        <div className="space-y-6">
          {/* Community Upvote Card */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-xs text-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Community Prioritization
            </h3>
            <p className="text-3xl font-extrabold text-foreground">
              {upvotes}
            </p>
            <p className="text-xs text-muted-foreground mb-4">Citizens confirmed this issue</p>

            <button
              onClick={handleUpvote}
              disabled={isVoting}
              className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                hasUpvoted
                  ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90'
                  : 'bg-muted text-foreground hover:bg-accent'
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${hasUpvoted ? 'fill-current' : ''}`} />
              <span>{hasUpvoted ? 'Upvoted by You' : 'Upvote This Issue'}</span>
            </button>
          </div>

          {/* Department & SLA Information */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Routing Assignment
            </h3>

            <div>
              <p className="text-[11px] text-muted-foreground">Responsible Department</p>
              <p className="text-xs font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                {complaint.department?.department_name}
              </p>
            </div>

            <div>
              <p className="text-[11px] text-muted-foreground">Department Contact Email</p>
              <p className="text-xs text-foreground mt-0.5 font-mono">
                {complaint.department?.contact_email}
              </p>
            </div>

            <div>
              <p className="text-[11px] text-muted-foreground">Issue Category</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">
                {complaint.category?.category_name}
              </p>
            </div>

            <div className="pt-3 border-t border-border">
              <p className="text-[11px] text-muted-foreground">Target SLA Resolution Deadline</p>
              <p className="text-xs font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand-orange shrink-0" />
                {complaint.sla_deadline
                  ? new Date(complaint.sla_deadline).toLocaleString()
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Location Map Preview */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Location Preview
            </h3>

            {complaint.address && (
              <p className="text-xs text-foreground flex items-start gap-1.5">
                <MapPin className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <span>{complaint.address}</span>
              </p>
            )}

            <div className="rounded-lg overflow-hidden border border-border">
              <LeafletMap
                mode="preview"
                selectedLocation={{ lat: complaint.latitude, lng: complaint.longitude }}
                center={[complaint.latitude, complaint.longitude]}
                zoom={14}
                height="220px"
              />
            </div>
          </div>

          {/* Authority Officer Status Update Box (Authorized for Authority & Admin) */}
          {canUpdateStatus && (
            <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-6 shadow-md space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Wrench className="w-4 h-4" />
                Department Officer Action Box
              </div>
              <p className="text-[11px] text-muted-foreground">
                You are authenticated as <b>{user?.name}</b> with authority over this department.
              </p>

              {statusSuccessMsg && (
                <div className="p-3 bg-brand-green/20 text-brand-green rounded-lg text-xs font-semibold">
                  {statusSuccessMsg}
                </div>
              )}

              {statusErrorMsg && (
                <div className="p-3 bg-destructive/15 text-destructive rounded-lg text-xs font-semibold">
                  {statusErrorMsg}
                </div>
              )}

              <form onSubmit={handleStatusSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">
                    Transition Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full text-xs bg-background border border-input rounded-md p-2 text-foreground outline-none"
                  >
                    <option value="Pending">Pending (Triage)</option>
                    <option value="In Progress">In Progress (Crew Assigned)</option>
                    <option value="Resolved">Resolved (Complete & Verified)</option>
                    <option value="Rejected">Rejected (Out of Municipal Scope)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">
                    Resolution / Inspection Notes
                  </label>
                  <textarea
                    rows={3}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Enter crew details, work orders, actions taken..."
                    className="w-full text-xs bg-background border border-input rounded-md p-2 text-foreground outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">
                    Completion Proof Photo (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setResolutionImage(e.target.files[0]);
                      }
                    }}
                    className="w-full text-xs text-muted-foreground"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  {isUpdatingStatus ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Recording Transition...</span>
                    </>
                  ) : (
                    <span>Commit Status Transition</span>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ComplaintDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 py-20 text-center text-xs text-muted-foreground">
          Loading complaint details...
        </div>
      }
    >
      <ComplaintDetailContent />
    </Suspense>
  );
}
