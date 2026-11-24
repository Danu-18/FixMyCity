'use client';

import React, { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import {
  apiApproveComplaint,
  apiFlagComplaint,
  apiGetComplaint,
  apiRejectComplaint,
  apiToggleUpvote,
  apiUpdateComplaintStatus,
} from '@/lib/api';
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
  Check,
  CheckCircle,
  Clock,
  Flag,
  History,
  Image as ImageIcon,
  Loader2,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  ThumbsUp,
  User,
  Wrench,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { getComplaintImageUrl } from '@/lib/utils';

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

  // Flagging State
  const [isFlagModalOpen, setIsFlagModalOpen] = useState<boolean>(false);
  const [flagReason, setFlagReason] = useState<string>('');
  const [isSubmittingFlag, setIsSubmittingFlag] = useState<boolean>(false);

  const handleFlagComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    if (!flagReason || flagReason.trim().length < 5) {
      toast.warn('Please provide a specific reason for reporting (minimum 5 characters).');
      return;
    }

    setIsSubmittingFlag(true);
    try {
      const res = await apiFlagComplaint(complaint.id, flagReason.trim());
      setComplaint((prev) => prev ? { ...prev, is_flagged: true, flag_reason: flagReason.trim() } : null);
      toast.success('Complaint flagged for moderation review. Thank you for keeping our community safe.');
      setIsFlagModalOpen(false);
      setFlagReason('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit flag report.');
    } finally {
      setIsSubmittingFlag(false);
    }
  };

  // Super Admin Direct Moderation State
  const [isModerating, setIsModerating] = useState<boolean>(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const handleApproveModeration = async () => {
    if (!complaint) return;
    setIsModerating(true);
    try {
      const res = await apiApproveComplaint(complaint.id);
      setComplaint(res.complaint);
      toast.success(res.message || 'Complaint approved and published!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve complaint.');
    } finally {
      setIsModerating(false);
    }
  };

  const handleRejectModeration = async () => {
    if (!complaint) return;
    if (!rejectionReason || rejectionReason.trim().length < 5) {
      toast.warn('Please provide a rejection reason (minimum 5 characters).');
      return;
    }
    setIsModerating(true);
    try {
      const res = await apiRejectComplaint(complaint.id, rejectionReason.trim());
      setComplaint(res.complaint);
      toast.success(res.message || 'Complaint rejected by moderation.');
      setIsRejectModalOpen(false);
      setRejectionReason('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject complaint.');
    } finally {
      setIsModerating(false);
    }
  };

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
      toast.info('Please sign in to upvote this issue.');
      router.push('/login');
      return;
    }
    if (!complaint || isVoting) return;

    setIsVoting(true);
    try {
      const res = await apiToggleUpvote(complaint.id);
      setUpvotes(res.upvotes_count);
      setHasUpvoted(res.has_upvoted);
      if (res.has_upvoted) {
        toast.success('Upvoted! Thank you for supporting this issue.');
      } else {
        toast.info('Upvote removed.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update upvote.');
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
      const msg = `Complaint status successfully transitioned to '${newStatus}'.`;
      setStatusSuccessMsg(msg);
      toast.success(msg);
      setResolutionNotes('');
      setResolutionImage(null);
    } catch (err: any) {
      const msg = err.message || 'Failed to update status.';
      setStatusErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Determine if complaint is in a terminal status (Resolved or Rejected)
  const isTerminalStatus = complaint?.status === 'Resolved' || complaint?.status === 'Rejected';

  // Strict separation of duties: operational resolution restricted to authority role only
  const canUpdateStatus =
    user &&
    user.role === 'authority' &&
    user.department_id === complaint?.department_id &&
    (!user.city || user.city === complaint?.city) &&
    !isTerminalStatus;

  // Super Admin moderation controls (only rendered if pending_review or is_flagged)
  const canSuperAdminModerate =
    user &&
    user.role === 'super_admin' &&
    (complaint?.moderation_status === 'pending_review' || Boolean(complaint?.is_flagged));

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
              <div className="flex flex-wrap items-center gap-2">
                <PriorityBadge priority={complaint.priority} />
                <StatusBadge status={complaint.status} />
                {complaint.moderation_status === 'pending_review' && (
                  <span className="inline-flex items-center gap-1 font-semibold text-xs bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                    <Clock className="w-3.5 h-3.5" /> Pending Moderation
                  </span>
                )}
                {complaint.moderation_status === 'rejected' && (
                  <span className="inline-flex items-center gap-1 font-semibold text-xs bg-destructive/10 text-destructive border border-destructive/20 px-2.5 py-0.5 rounded-full">
                    <AlertTriangle className="w-3.5 h-3.5" /> Moderation Rejected
                  </span>
                )}
                {complaint.is_flagged && (
                  <span className="inline-flex items-center gap-1 font-semibold text-xs bg-destructive/10 text-destructive border border-destructive/20 px-2.5 py-0.5 rounded-full">
                    <Flag className="w-3.5 h-3.5" /> Flagged for Review
                  </span>
                )}
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

            {/* Moderation Warning Banners */}
            {complaint.moderation_status === 'pending_review' && (
              <div className="mt-3 p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2.5 text-amber-900 dark:text-amber-200 text-xs">
                <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <p>
                  <span className="font-semibold">Pending Pre-Moderation:</span> This civic report is currently under review by Super Admin. It will be published to the public feed and dispatched to city officers once approved.
                </p>
              </div>
            )}

            {complaint.moderation_status === 'rejected' && (
              <div className="mt-3 p-3.5 bg-destructive/10 border border-destructive/30 rounded-xl flex items-start gap-2.5 text-destructive text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Complaint Rejected by Content Moderation</p>
                  {complaint.moderation_reason && (
                    <p className="mt-0.5 leading-relaxed">
                      Reason: <span className="font-medium">{complaint.moderation_reason}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

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
                <div className="rounded-xl overflow-hidden border border-border max-h-96 bg-muted flex items-center justify-center">
                  <img
                    src={getComplaintImageUrl(complaint.image_url) || complaint.image_url}
                    alt={complaint.title}
                    className="w-full h-auto object-contain max-h-96"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes(':8000') && target.src.includes('localhost/storage/')) {
                        target.src = target.src.replace('localhost/storage/', 'localhost:8000/storage/');
                      }
                    }}
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
                    src={getComplaintImageUrl(complaint.resolution_image_url) || complaint.resolution_image_url}
                    alt="Resolution evidence"
                    className="rounded-lg max-h-48 object-cover border border-border"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes(':8000') && target.src.includes('localhost/storage/')) {
                        target.src = target.src.replace('localhost/storage/', 'localhost:8000/storage/');
                      }
                    }}
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

            {complaint.moderation_status === 'approved' && (
              <div className="mt-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      toast.info('Please sign in to report inappropriate content.');
                      router.push('/login');
                      return;
                    }
                    setIsFlagModalOpen(true);
                    setFlagReason('');
                  }}
                  disabled={complaint.is_flagged}
                  className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-60"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>
                    {complaint.is_flagged
                      ? 'Flagged for Moderation'
                      : 'Report / Flag Inappropriate'}
                  </span>
                </button>
              </div>
            )}
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

          {/* Super Admin Moderation Action Box (Strict Separation of Duties: Super Admin only moderates) */}
          {canSuperAdminModerate && (
            <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-xl p-6 shadow-md space-y-4">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                Super Admin Moderation Console
              </div>
              <p className="text-[11px] text-muted-foreground">
                As Super Administrator, verify report legitimacy before dispatching to the municipal department. Operational resolution is handled by the assigned department.
              </p>

              {complaint.is_flagged && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs">
                  <span className="font-semibold">Abuse Flag:</span> {complaint.flag_reason || 'Flagged by citizen'}
                </div>
              )}

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleApproveModeration}
                  disabled={isModerating}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isModerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Approve & Publish to Public Feed</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsRejectModalOpen(true);
                    setRejectionReason('');
                  }}
                  disabled={isModerating}
                  className="w-full py-2.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject Complaint</span>
                </button>
              </div>
            </div>
          )}

          {/* Authority Officer Status Update Box (Authorized for Authority Only) */}
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

      {/* Flag / Report Inappropriate Modal */}
      {isFlagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-border flex items-center justify-between bg-destructive/5">
              <div className="flex items-center gap-2 text-destructive">
                <Flag className="w-5 h-5" />
                <h3 className="font-bold text-sm text-foreground">
                  Report Inappropriate Content
                </h3>
              </div>
              <button
                onClick={() => setIsFlagModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFlagComplaint}>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1">
                    Why are you reporting this complaint? *
                  </p>
                  <p className="text-[11px] text-muted-foreground mb-2">
                    Help Super Admins maintain platform integrity. Specify why this post violates community guidelines (minimum 5 characters).
                  </p>
                  <textarea
                    rows={4}
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    placeholder="e.g. Inappropriate photo, spam submission, harassing or offensive language..."
                    className="w-full text-xs bg-background border border-input rounded-lg p-3 text-foreground outline-none focus:ring-2 focus:ring-destructive/40 focus:border-destructive resize-none"
                    required
                  />
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
                    <span>Minimum 5 characters</span>
                    <span>{flagReason.trim().length} chars</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-border flex items-center justify-end gap-2 bg-muted/20">
                <button
                  type="button"
                  onClick={() => setIsFlagModalOpen(false)}
                  disabled={isSubmittingFlag}
                  className="px-4 py-2 border border-input rounded-lg hover:bg-accent font-semibold text-xs text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={flagReason.trim().length < 5 || isSubmittingFlag}
                  className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingFlag ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Flag className="w-4 h-4" />
                  )}
                  <span>Submit Abuse Report</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Super Admin Rejection Reason Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-border flex items-center justify-between bg-destructive/5">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm text-foreground">
                  Reject Complaint #{complaint.tracking_number}
                </h3>
              </div>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-foreground mb-1">
                  Rejection Reason (Visible to Citizen) *
                </p>
                <p className="text-[11px] text-muted-foreground mb-2">
                  Explain clearly why this complaint cannot be published (minimum 5 characters).
                </p>
                <textarea
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Duplicate report, insufficient detail, unrelated photo, issues not within municipal jurisdiction..."
                  className="w-full text-xs bg-background border border-input rounded-lg p-3 text-foreground outline-none focus:ring-2 focus:ring-destructive/40 focus:border-destructive resize-none"
                />
                <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
                  <span>Minimum 5 characters</span>
                  <span>{rejectionReason.trim().length} chars</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border flex items-center justify-end gap-2 bg-muted/20">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                disabled={isModerating}
                className="px-4 py-2 border border-input rounded-lg hover:bg-accent font-semibold text-xs text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectModeration}
                disabled={rejectionReason.trim().length < 5 || isModerating}
                className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isModerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}
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
