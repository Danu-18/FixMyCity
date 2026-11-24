'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  apiApproveComplaint,
  apiApproveStaff,
  apiDownloadStaffDocument,
  apiGetModerationQueue,
  apiGetPendingStaff,
  apiRejectComplaint,
  apiRejectStaff,
} from '@/lib/api';
import { Complaint, User } from '@/lib/types';
import {
  AlertTriangle,
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
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { getComplaintImageUrl } from '@/lib/utils';

export default function SuperAdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'moderation' | 'staff'>('moderation');
  const [pendingStaff, setPendingStaff] = useState<User[]>([]);
  const [moderationQueue, setModerationQueue] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [processingStaffId, setProcessingStaffId] = useState<number | null>(null);
  const [processingComplaintId, setProcessingComplaintId] = useState<number | null>(null);
  const [viewingDocId, setViewingDocId] = useState<number | null>(null);
  const [activeDocument, setActiveDocument] = useState<{
    staffId: number;
    staffName: string;
    city: string;
    departmentName: string;
    url: string;
    isPdf: boolean;
  } | null>(null);

  // Complaint moderation preview & reject modal states
  const [previewComplaintImage, setPreviewComplaintImage] = useState<{ url: string; title: string } | null>(null);
  const [rejectingComplaint, setRejectingComplaint] = useState<Complaint | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [staffList, modQueue] = await Promise.all([
        apiGetPendingStaff(),
        apiGetModerationQueue(),
      ]);
      setPendingStaff(staffList || []);
      setModerationQueue(modQueue || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load Super Admin dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'super_admin')) {
      toast.error('Access restricted to Super Administrators.');
      router.push('/dashboard');
      return;
    }

    if (user && user.role === 'super_admin') {
      loadData();
    }
  }, [user, authLoading]);

  // Clean up blob URL on unmount or modal close
  useEffect(() => {
    return () => {
      if (activeDocument?.url) {
        URL.revokeObjectURL(activeDocument.url);
      }
    };
  }, [activeDocument]);

  const handleViewDocument = async (staff: User) => {
    try {
      setViewingDocId(staff.id);
      const blob = await apiDownloadStaffDocument(staff.id);
      const url = URL.createObjectURL(blob);
      const isPdf =
        blob.type.includes('pdf') ||
        (staff.verification_document_path?.toLowerCase().endsWith('.pdf') ?? false);

      setActiveDocument({
        staffId: staff.id,
        staffName: staff.name,
        city: staff.city || 'Karachi (Default)',
        departmentName: staff.department?.department_name || 'Municipal Department',
        url,
        isPdf,
      });
    } catch (err: any) {
      toast.error(err.message || 'Could not load verification document.');
    } finally {
      setViewingDocId(null);
    }
  };

  const handleApproveStaff = async (staffId: number) => {
    try {
      setProcessingStaffId(staffId);
      const res = await apiApproveStaff(staffId);
      toast.success(res.message || 'Staff approved successfully!');
      setPendingStaff((prev) => prev.filter((s) => s.id !== staffId));
      if (activeDocument && activeDocument.staffId === staffId) {
        setActiveDocument(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve staff member.');
    } finally {
      setProcessingStaffId(null);
    }
  };

  const handleRejectStaff = async (staffId: number) => {
    try {
      setProcessingStaffId(staffId);
      const res = await apiRejectStaff(staffId);
      toast.success(res.message || 'Staff application rejected.');
      setPendingStaff((prev) => prev.filter((s) => s.id !== staffId));
      if (activeDocument && activeDocument.staffId === staffId) {
        setActiveDocument(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject staff member.');
    } finally {
      setProcessingStaffId(null);
    }
  };

  const handleApproveComplaint = async (complaintId: number) => {
    try {
      setProcessingComplaintId(complaintId);
      const res = await apiApproveComplaint(complaintId);
      toast.success(res.message || 'Complaint approved and published!');
      setModerationQueue((prev) => prev.filter((c) => c.id !== complaintId));
      if (previewComplaintImage) {
        setPreviewComplaintImage(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve complaint.');
    } finally {
      setProcessingComplaintId(null);
    }
  };

  const handleRejectComplaint = async (complaintId: number, reason: string) => {
    if (!reason || reason.trim().length < 5) {
      toast.warn('Please provide a descriptive rejection reason (minimum 5 characters).');
      return;
    }
    try {
      setProcessingComplaintId(complaintId);
      const res = await apiRejectComplaint(complaintId, reason.trim());
      toast.success(res.message || 'Complaint rejected.');
      setModerationQueue((prev) => prev.filter((c) => c.id !== complaintId));
      setRejectingComplaint(null);
      setRejectionReason('');
      if (previewComplaintImage) {
        setPreviewComplaintImage(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject complaint.');
    } finally {
      setProcessingComplaintId(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-3" />
        <p className="text-xs text-muted-foreground">Loading Super Admin verification console...</p>
      </div>
    );
  }

  if (!user || user.role !== 'super_admin') return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 w-full flex-1">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6 mb-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">
              Super Admin Console
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Review and moderate civic complaints, verify municipal authority credentials, and oversee platform integrity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="px-3.5 py-2 border border-input rounded-lg hover:bg-accent text-xs font-semibold text-foreground transition-colors"
          >
            ← Back to Dashboard
          </Link>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 border border-input rounded-lg hover:bg-accent text-muted-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('moderation')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'moderation'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Complaint Moderation</span>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              moderationQueue.length > 0
                ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {moderationQueue.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'staff'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Staff Verification Requests</span>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              pendingStaff.length > 0
                ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {pendingStaff.length}
          </span>
        </button>
      </div>

      {/* TAB 1: Complaint Moderation Queue */}
      {activeTab === 'moderation' && (
        <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden mb-8">
          <div className="p-5 border-b border-border flex items-center justify-between bg-amber-500/5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h2 className="text-base font-bold text-foreground">
                Complaint Pre-Moderation & Abuse Queue
              </h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300">
              {moderationQueue.length} Pending Moderation
            </span>
          </div>

          {moderationQueue.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-foreground">Moderation Queue is Clear</p>
              <p className="text-xs">There are no pending civic complaints or abuse flags waiting for moderation review.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-5 py-3 font-semibold uppercase tracking-wider">Complaint Details</th>
                    <th className="px-5 py-3 font-semibold uppercase tracking-wider">Category & Dept</th>
                    <th className="px-5 py-3 font-semibold uppercase tracking-wider">City</th>
                    <th className="px-5 py-3 font-semibold uppercase tracking-wider">Submitting Citizen</th>
                    <th className="px-5 py-3 font-semibold uppercase tracking-wider">Evidence Photo</th>
                    <th className="px-5 py-3 font-semibold uppercase tracking-wider text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {moderationQueue.map((complaint) => (
                    <tr key={complaint.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-5 py-3.5 max-w-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                            {complaint.tracking_number}
                          </span>
                          {complaint.is_flagged && (
                            <span className="inline-flex items-center gap-1 font-semibold text-[10px] bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 rounded-full">
                              <Flag className="w-3 h-3" /> Flagged for Abuse
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-foreground text-sm mt-1">{complaint.title}</div>
                        <p className="text-muted-foreground text-xs line-clamp-2 mt-0.5">
                          {complaint.description}
                        </p>
                        {complaint.flag_reason && (
                          <div className="mt-1.5 p-2 bg-destructive/5 border border-destructive/20 rounded text-[11px] text-destructive">
                            <span className="font-semibold">Abuse Report:</span> {complaint.flag_reason}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-medium text-foreground">
                          {complaint.category?.category_name || 'General'}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {complaint.department?.department_name || 'Municipal'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-medium text-foreground bg-muted px-2 py-0.5 rounded border border-border">
                          <MapPin className="w-3 h-3 text-primary" />
                          {complaint.city || 'Karachi'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-medium text-foreground">
                          {complaint.user?.name || 'Anonymous Citizen'}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {complaint.user?.email || 'No email provided'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {complaint.image_url ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewComplaintImage({
                                url: getComplaintImageUrl(complaint.image_url) || complaint.image_url!,
                                title: complaint.title,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs transition-colors"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Inspect Photo</span>
                          </button>
                        ) : (
                          <span className="text-muted-foreground text-[11px] italic">No image</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleApproveComplaint(complaint.id)}
                          disabled={processingComplaintId === complaint.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
                        >
                          {processingComplaintId === complaint.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Approve & Publish</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRejectingComplaint(complaint);
                            setRejectionReason('');
                          }}
                          disabled={processingComplaintId === complaint.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Staff Verification Requests Table Card */}
      {activeTab === 'staff' && (
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between bg-amber-500/5">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base font-bold text-foreground">
              Staff Verification Requests
            </h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300">
            {pendingStaff.length} Pending Review
          </span>
        </div>

        {pendingStaff.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-foreground">All Verification Requests Completed</p>
            <p className="text-xs">There are no pending municipal staff accounts waiting for identity approval.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Applicant Name</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">City Jurisdiction</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Department</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Applied Date</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Verification Proof</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-right">Review Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pendingStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-foreground">{staff.name}</div>
                      <div className="text-[11px] text-muted-foreground">{staff.email}</div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-medium text-foreground bg-muted px-2 py-0.5 rounded border border-border">
                        <MapPin className="w-3 h-3 text-primary" />
                        {staff.city || 'Karachi (Default)'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="font-medium text-primary">
                        {staff.department?.department_name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">
                      {staff.created_at ? new Date(staff.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleViewDocument(staff)}
                        disabled={viewingDocId === staff.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs transition-colors"
                      >
                        {viewingDocId === staff.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                        <span>View Document</span>
                      </button>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleApproveStaff(staff.id)}
                        disabled={processingStaffId === staff.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
                      >
                        {processingStaffId === staff.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Approve</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRejectStaff(staff.id)}
                        disabled={processingStaffId === staff.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
                      >
                        {processingStaffId === staff.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                        <span>Reject</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Complaint Photo Inspection Modal */}
      {previewComplaintImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  Photo Evidence Inspection
                </h3>
                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  {previewComplaintImage.title}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.open(previewComplaintImage.url, '_blank')}
                  className="px-2.5 py-1 rounded-md text-xs font-medium text-foreground hover:bg-accent border border-input flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Full View</span>
                </button>
                <button
                  onClick={() => setPreviewComplaintImage(null)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-black/10 dark:bg-black/30 min-h-[240px]">
              <img
                src={previewComplaintImage.url}
                alt={previewComplaintImage.title}
                className="max-h-[500px] max-w-full rounded-lg object-contain border border-border shadow-md"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes(':8000') && target.src.includes('localhost/storage/')) {
                    target.src = target.src.replace('localhost/storage/', 'localhost:8000/storage/');
                  }
                }}
              />
            </div>

            <div className="p-4 border-t border-border flex items-center justify-between bg-card text-xs text-muted-foreground">
              <span>Inspect image to ensure it is authentic and does not contain explicit, hateful, or unrelated content.</span>
              <button
                type="button"
                onClick={() => setPreviewComplaintImage(null)}
                className="px-4 py-2 border border-input rounded-lg hover:bg-accent font-semibold text-xs text-foreground transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Rejection Reason Modal */}
      {rejectingComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-border flex items-center justify-between bg-destructive/5">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm text-foreground">
                  Reject Complaint #{rejectingComplaint.tracking_number}
                </h3>
              </div>
              <button
                onClick={() => setRejectingComplaint(null)}
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
                  placeholder="e.g. Duplicate report, insufficient detail, unrelated or inappropriate image, issues not within municipal jurisdiction..."
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
                onClick={() => setRejectingComplaint(null)}
                disabled={processingComplaintId === rejectingComplaint.id}
                className="px-4 py-2 border border-input rounded-lg hover:bg-accent font-semibold text-xs text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRejectComplaint(rejectingComplaint.id, rejectionReason)}
                disabled={rejectionReason.trim().length < 5 || processingComplaintId === rejectingComplaint.id}
                className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {processingComplaintId === rejectingComplaint.id ? (
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

      {/* Document Inspection Modal */}
      {activeDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Verification Document: {activeDocument.staffName}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {activeDocument.departmentName} &bull; <span className="font-semibold text-primary">{activeDocument.city}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.open(activeDocument.url, '_blank')}
                  className="px-2.5 py-1 rounded-md text-xs font-medium text-foreground hover:bg-accent border border-input flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Full View</span>
                </button>
                <button
                  onClick={() => setActiveDocument(null)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-black/5 dark:bg-black/20">
              {activeDocument.isPdf ? (
                <iframe
                  src={activeDocument.url}
                  className="w-full h-[550px] rounded-lg border border-border"
                  title="PDF Document Preview"
                />
              ) : (
                <img
                  src={activeDocument.url}
                  alt="Staff Verification Document"
                  className="max-h-[550px] max-w-full rounded-lg object-contain border border-border shadow-md"
                />
              )}
            </div>

            <div className="p-4 border-t border-border flex items-center justify-between bg-card">
              <span className="text-xs text-muted-foreground">
                Inspect applicant credentials before authorizing municipal portal privileges.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRejectStaff(activeDocument.staffId)}
                  disabled={processingStaffId === activeDocument.staffId}
                  className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  <span>Reject Application</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApproveStaff(activeDocument.staffId)}
                  disabled={processingStaffId === activeDocument.staffId}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Grant Access</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
