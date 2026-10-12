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
  ExternalLink,
  History,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Share2,
  ThumbsUp,
  User,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse flex items-center justify-center text-zinc-400 text-xs">
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
      setNewStatus(data.status === 'Pending' ? 'In Progress' : 'Resolved');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Complaint not found.');
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
    if (!complaint) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (isVoting) return;
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
      if (resolutionNotes) {
        formData.append('notes', resolutionNotes);
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
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
        <p className="text-xs text-zinc-500">Retrieving complaint history and SLA logs...</p>
      </div>
    );
  }

  if (errorMsg || !complaint) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Complaint Not Found</h2>
        <p className="text-xs text-zinc-500 mt-1">
          {errorMsg || 'No record matched this tracking identifier.'}
        </p>
        <Link
          href="/complaints"
          className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:underline"
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
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg">
            #{complaint.tracking_number}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Left Column: Overview, Progress Stepper, Description, Evidence, Audit Trail */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
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

            <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 leading-snug">
              {complaint.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
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
            <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
                Resolution Workflow State
              </h3>

              <div className="relative flex items-center justify-between">
                {/* Stepper Line */}
                <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-zinc-200 dark:bg-zinc-800 -z-0" />

                {/* Step 1: Pending */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                      complaint.status === 'Pending' ||
                      complaint.status === 'In Progress' ||
                      complaint.status === 'Resolved'
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'bg-zinc-200 text-zinc-600'
                    }`}
                  >
                    1
                  </div>
                  <span className="mt-2 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    Pending
                  </span>
                  <span className="text-[10px] text-zinc-400">Auto-Routed</span>
                </div>

                {/* Step 2: In Progress */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                      complaint.status === 'In Progress' || complaint.status === 'Resolved'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    2
                  </div>
                  <span className="mt-2 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    In Progress
                  </span>
                  <span className="text-[10px] text-zinc-400">Crew Dispatched</span>
                </div>

                {/* Step 3: Resolved */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                      complaint.status === 'Resolved'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    3
                  </div>
                  <span className="mt-2 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    Resolved
                  </span>
                  <span className="text-[10px] text-zinc-400">Inspected & Closed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description & Photo Evidence */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
              Problem Description & Evidence
            </h2>

            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {complaint.description}
            </p>

            {complaint.image_url && (
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <h3 className="text-xs font-semibold text-zinc-500 mb-2 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                  Citizen Uploaded Photo Evidence:
                </h3>
                <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 max-h-96 bg-zinc-100 dark:bg-zinc-800">
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
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Resolution Outcome
              </div>

              {complaint.resolution_notes && (
                <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                  {complaint.resolution_notes}
                </p>
              )}

              {complaint.resolved_at && (
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-2">
                  Completed on: {new Date(complaint.resolved_at).toLocaleString()}
                </p>
              )}

              {complaint.resolution_image_url && (
                <div className="mt-4">
                  <p className="text-[11px] font-semibold text-emerald-800 mb-1">
                    Completion Verification Photo:
                  </p>
                  <img
                    src={complaint.resolution_image_url}
                    alt="Resolution evidence"
                    className="rounded-lg max-h-48 object-cover border border-emerald-300"
                  />
                </div>
              )}
            </div>
          )}

          {/* Complete Status History / Audit Trail Timeline */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <span>Status Transition Audit Trail</span>
            </h2>

            {!complaint.status_history || complaint.status_history.length === 0 ? (
              <p className="text-xs text-zinc-400">No status changes recorded yet.</p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
                {complaint.status_history.map((hist, idx) => (
                  <div key={hist.id || idx} className="relative">
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center ring-4 ring-white dark:ring-zinc-900">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {hist.new_status}
                        </span>
                        {hist.old_status && (
                          <span className="text-[11px] text-zinc-400">
                            (was {hist.old_status})
                          </span>
                        )}
                        <span className="text-[11px] text-zinc-400">
                          &bull; {new Date(hist.changed_at).toLocaleString()}
                        </span>
                      </div>

                      {hist.notes && (
                        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          {hist.notes}
                        </p>
                      )}

                      {hist.changer && (
                        <p className="mt-1 text-[11px] text-zinc-400">
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
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs text-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Community Prioritization
            </h3>
            <p className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
              {upvotes}
            </p>
            <p className="text-xs text-zinc-500 mb-4">Citizens confirmed this issue</p>

            <button
              onClick={handleUpvote}
              disabled={isVoting}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                hasUpvoted
                  ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200'
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${hasUpvoted ? 'fill-current' : ''}`} />
              <span>{hasUpvoted ? 'Upvoted by You' : 'Upvote This Issue'}</span>
            </button>
          </div>

          {/* Department & SLA Information */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Routing Assignment
            </h3>

            <div>
              <p className="text-[11px] text-zinc-500">Responsible Department</p>
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                {complaint.department?.department_name}
              </p>
            </div>

            <div>
              <p className="text-[11px] text-zinc-500">Department Contact Email</p>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-0.5 font-mono">
                {complaint.department?.contact_email}
              </p>
            </div>

            <div>
              <p className="text-[11px] text-zinc-500">Issue Category</p>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                {complaint.category?.category_name}
              </p>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-[11px] text-zinc-500">Target SLA Resolution Deadline</p>
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                {complaint.sla_deadline
                  ? new Date(complaint.sla_deadline).toLocaleString()
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Location Map Preview */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Location Preview
            </h3>

            {complaint.address && (
              <p className="text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-1.5">
                <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{complaint.address}</span>
              </p>
            )}

            <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
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
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-zinc-900 dark:to-indigo-950/30 border-2 border-indigo-200 dark:border-indigo-800 rounded-2xl p-6 shadow-md space-y-4">
              <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-sm">
                <Wrench className="w-4 h-4 text-indigo-600" />
                Department Officer Action Box
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                You are authenticated as <b>{user?.name}</b> with authority over this department.
              </p>

              {statusSuccessMsg && (
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-medium">
                  {statusSuccessMsg}
                </div>
              )}

              {statusErrorMsg && (
                <div className="p-3 bg-red-100 text-red-800 rounded-xl text-xs font-medium">
                  {statusErrorMsg}
                </div>
              )}

              <form onSubmit={handleStatusSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Transition Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2"
                  >
                    <option value="Pending">Pending (Triage)</option>
                    <option value="In Progress">In Progress (Crew Assigned)</option>
                    <option value="Resolved">Resolved (Complete & Verified)</option>
                    <option value="Rejected">Rejected (Out of Municipal Scope)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Resolution / Inspection Notes
                  </label>
                  <textarea
                    rows={3}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Enter crew details, work orders, actions taken..."
                    className="w-full text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
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
                    className="w-full text-xs text-zinc-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
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
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-20 text-center text-xs text-zinc-400">Loading complaint details...</div>}>
      <ComplaintDetailContent />
    </Suspense>
  );
}
