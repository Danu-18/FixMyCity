'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  apiApproveComplaint,
  apiApproveStaff,
  apiDownloadStaffDocument,
  apiGetAnalytics,
  apiGetComplaints,
  apiGetDepartments,
  apiGetModerationQueue,
  apiGetPendingStaff,
  apiRejectComplaint,
  apiRejectStaff,
  apiTriggerSlaCheck,
  apiUpdateComplaintStatus,
} from '@/lib/api';
import { AnalyticsOverview, Complaint, Department, User } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { SlaBadge } from '@/components/SlaBadge';
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Flag,
  IdCard,
  ImageIcon,
  Loader2,
  MapPin,
  PlusCircle,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  Wrench,
  X,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { getComplaintImageUrl } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Super Admin Staff Verification & Moderation State
  const [adminTab, setAdminTab] = useState<'moderation' | 'staff'>('moderation');
  const [moderationQueue, setModerationQueue] = useState<Complaint[]>([]);
  const [isLoadingModeration, setIsLoadingModeration] = useState<boolean>(false);
  const [processingComplaintId, setProcessingComplaintId] = useState<number | null>(null);
  const [previewComplaintImage, setPreviewComplaintImage] = useState<{ url: string; title: string } | null>(null);
  const [rejectingComplaint, setRejectingComplaint] = useState<Complaint | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [activeRejectionModal, setActiveRejectionModal] = useState<{
    tracking: string;
    title: string;
    reason: string;
  } | null>(null);

  const [pendingStaff, setPendingStaff] = useState<User[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState<boolean>(false);
  const [processingStaffId, setProcessingStaffId] = useState<number | null>(null);
  const [viewingDocId, setViewingDocId] = useState<number | null>(null);
  const [activeDocument, setActiveDocument] = useState<{
    staffId: number;
    staffName: string;
    city: string;
    departmentName: string;
    url: string;
    isPdf: boolean;
  } | null>(null);

  // Status Update Modal State for Authorities
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [transitionStatus, setTransitionStatus] = useState<string>('In Progress');
  const [transitionNotes, setTransitionNotes] = useState<string>('');
  const [isSubmittingTransition, setIsSubmittingTransition] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Admin SLA Trigger State
  const [isTriggeringSla, setIsTriggeringSla] = useState<boolean>(false);
  const [slaAuditMessage, setSlaAuditMessage] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [analyticsRes, deptsRes] = await Promise.all([
        apiGetAnalytics(),
        apiGetDepartments(),
      ]);
      setAnalytics(analyticsRes);
      setDepartments(deptsRes || []);

      if (user) {
        if (user.role === 'citizen') {
          const myComplaints = await apiGetComplaints({ mine: true, per_page: 50 });
          setComplaints(myComplaints.data || []);
        } else if (user.role === 'authority') {
          const deptComplaints = await apiGetComplaints({
            department_id: user.department_id || undefined,
            city: user.city || undefined,
            per_page: 50,
          });
          setComplaints(deptComplaints.data || []);
        } else {
          // Admin & Super Admin see all complaints
          const allComplaints = await apiGetComplaints({ per_page: 50 });
          setComplaints(allComplaints.data || []);
        }

        // Load pending staff and moderation queue if Super Admin
        if (user.role === 'super_admin') {
          loadPendingStaff();
          loadModerationQueue();
        }
      }
    } catch {
      // Dashboard fetch fallback
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingStaff = async () => {
    try {
      setIsLoadingStaff(true);
      const staffList = await apiGetPendingStaff();
      setPendingStaff(staffList || []);
    } catch (err: any) {
      console.error('Failed to load pending staff:', err);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const loadModerationQueue = async () => {
    try {
      setIsLoadingModeration(true);
      const queue = await apiGetModerationQueue();
      setModerationQueue(queue || []);
    } catch (err: any) {
      console.error('Failed to load moderation queue:', err);
    } finally {
      setIsLoadingModeration(false);
    }
  };

  const handleApproveComplaint = async (complaintId: number) => {
    try {
      setProcessingComplaintId(complaintId);
      const res = await apiApproveComplaint(complaintId);
      toast.success(res.message || 'Complaint approved and published!');
      // Immediately refresh moderation queue, city complaints registry, and analytics
      await Promise.all([
        loadModerationQueue(),
        loadDashboardData(),
      ]);
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
      toast.warn('Please provide a rejection reason (minimum 5 characters).');
      return;
    }
    try {
      setProcessingComplaintId(complaintId);
      const res = await apiRejectComplaint(complaintId, reason.trim());
      toast.success(res.message || 'Complaint rejected by moderation.');
      setRejectingComplaint(null);
      setRejectionReason('');
      if (previewComplaintImage) {
        setPreviewComplaintImage(null);
      }
      // Immediately refresh moderation queue, city complaints registry, and analytics
      await Promise.all([
        loadModerationQueue(),
        loadDashboardData(),
      ]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject complaint.');
    } finally {
      setProcessingComplaintId(null);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      loadDashboardData();
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

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setIsSubmittingTransition(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      await apiUpdateComplaintStatus(selectedComplaint.id, {
        status: transitionStatus,
        notes: transitionNotes,
      });
      const msg = `Complaint #${selectedComplaint.tracking_number} moved to '${transitionStatus}'.`;
      setActionSuccess(msg);
      toast.success(msg);
      setTransitionNotes('');
      loadDashboardData();
      setTimeout(() => {
        setSelectedComplaint(null);
        setActionSuccess(null);
      }, 1500);
    } catch (err: any) {
      const msg = err.message || 'Status transition failed.';
      setActionError(msg);
      toast.error(msg);
    } finally {
      setIsSubmittingTransition(false);
    }
  };

  const handleTriggerSlaAudit = async () => {
    setIsTriggeringSla(true);
    setSlaAuditMessage(null);
    try {
      const res = await apiTriggerSlaCheck();
      const msg = `SLA Audit Complete: ${res.results.breached} breached, ${res.results.nearing_breach} nearing deadline.`;
      setSlaAuditMessage(msg);
      toast.success(msg);
      loadDashboardData();
    } catch (err: any) {
      const msg = 'SLA audit failed: ' + (err.message || 'Error');
      setSlaAuditMessage(msg);
      toast.error(msg);
    } finally {
      setIsTriggeringSla(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-3" />
        <p className="text-xs text-muted-foreground">Loading workspace...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 w-full flex-1">
      {/* Top Banner */}
      <div className="bg-card border border-border rounded-xl p-6 mb-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-foreground">
              Welcome back, {user.name}
            </h1>
            <span
              className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                user.role === 'super_admin'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              {user.role === 'super_admin' ? 'Super Admin' : user.role}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {user.role === 'super_admin' &&
              'Central Super Administration: Manage municipal staff identity verification, department authority onboarding, and system security.'}
            {user.role === 'citizen' &&
              'Track your submitted community reports, monitor resolution timelines, and view community upvotes.'}
            {user.role === 'authority' &&
              `Assigned Jurisdiction: ${user.department?.department_name || 'General Municipal Authority'} • ${user.city || 'Karachi'} (SLA Target: ${user.department?.sla_hours || 48}h).`}
            {user.role === 'admin' &&
              'System-wide municipal control room: Oversee department SLA compliance and platform routing.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user.role === 'citizen' && (
            <Link
              href="/report"
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              Report New Issue
            </Link>
          )}

          {(user.role === 'admin' || user.role === 'super_admin') && (
            <button
              onClick={handleTriggerSlaAudit}
              disabled={isTriggeringSla}
              className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Clock className="w-4 h-4" />
              {isTriggeringSla ? 'Auditing Deadlines...' : 'Run SLA Audit Now'}
            </button>
          )}

          <button
            onClick={loadDashboardData}
            className="p-2 border border-input rounded-lg hover:bg-accent text-muted-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {slaAuditMessage && (
        <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
          {slaAuditMessage}
        </div>
      )}

      {/* KPI Cards based on role */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {user.role === 'super_admin' ? (
          <>
            <div className="bg-amber-600 dark:bg-amber-700 lift relative overflow-hidden rounded-xl p-4 text-left text-white shadow-md">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">
                Pending Staff Verifications
              </span>
              <p className="mt-1 text-2xl font-bold">{pendingStaff.length}</p>
              <span className="text-[10px] opacity-80">Requires identity approval</span>
            </div>

            <div className="bg-destructive/90 dark:bg-destructive lift relative overflow-hidden rounded-xl p-4 text-left text-white shadow-md">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">
                Pending Moderation Review
              </span>
              <p className="mt-1 text-2xl font-bold">{moderationQueue.length}</p>
              <span className="text-[10px] opacity-80">Awaiting pre-moderation / abuse flags</span>
            </div>

            <div className="bg-primary lift relative overflow-hidden rounded-xl p-4 text-left text-primary-foreground shadow-md">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">
                Citywide Approved Records
              </span>
              <p className="mt-1 text-2xl font-bold">{complaints.length}</p>
              <span className="text-[10px] opacity-80">Published civic issues</span>
            </div>

            <div className="bg-brand-green lift relative overflow-hidden rounded-xl p-4 text-left text-primary-foreground shadow-md">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">
                SLA Compliance Rate
              </span>
              <p className="mt-1 text-2xl font-bold">
                {analytics?.summary?.sla_compliance_rate ?? 100}%
              </p>
              <span className="text-[10px] opacity-80">Within SLA deadline target</span>
            </div>
          </>
        ) : (
          <>
            <div className="bg-primary lift relative overflow-hidden rounded-xl p-4 text-left text-primary-foreground shadow-md">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">
                {user.role === 'citizen' ? 'My Submissions' : 'Active Queue'}
              </span>
              <p className="mt-1 text-2xl font-bold">{complaints.length}</p>
              <span className="text-[10px] opacity-80">
                {user.role === 'citizen' ? 'Total filed by you' : 'Under department responsibility'}
              </span>
            </div>

            <div className="bg-brand-violet lift relative overflow-hidden rounded-xl p-4 text-left text-primary-foreground shadow-md">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">
                In Progress
              </span>
              <p className="mt-1 text-2xl font-bold">
                {complaints.filter((c) => c.status === 'In Progress').length}
              </p>
              <span className="text-[10px] opacity-80">Crew dispatched on site</span>
            </div>

            <div className="bg-brand-green lift relative overflow-hidden rounded-xl p-4 text-left text-primary-foreground shadow-md">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">
                Resolved
              </span>
              <p className="mt-1 text-2xl font-bold">
                {complaints.filter((c) => c.status === 'Resolved').length}
              </p>
              <span className="text-[10px] opacity-80">Successfully closed</span>
            </div>

            <div className="bg-brand-orange lift relative overflow-hidden rounded-xl p-4 text-left text-primary-foreground shadow-md">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">
                {user.role === 'citizen' ? 'Total Upvotes' : 'Overdue SLA'}
              </span>
              <p className="mt-1 text-2xl font-bold">
                {user.role === 'citizen'
                  ? complaints.reduce((sum, c) => sum + (c.upvotes_count || 0), 0)
                  : complaints.filter((c) => c.is_sla_breached).length}
              </p>
              <span className="text-[10px] opacity-80">
                {user.role === 'citizen' ? 'Received from community' : 'Action urgently required'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* SUPER ADMIN CONSOLE: Moderation Queue & Staff Verification */}
      {user.role === 'super_admin' && (
        <div className="mb-8 space-y-4">
          {/* Tab Navigation */}
          <div className="flex border-b border-border gap-2">
            <button
              type="button"
              onClick={() => setAdminTab('moderation')}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
                adminTab === 'moderation'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Complaint Moderation Queue</span>
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
              onClick={() => setAdminTab('staff')}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
                adminTab === 'staff'
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
          {adminTab === 'moderation' && (
            <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
              <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-500/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      Complaint Moderation Queue
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      Review civic reports awaiting Super Admin pre-moderation or citizen abuse flags
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300">
                    {moderationQueue.length} Pending Review
                  </span>
                  <button
                    onClick={loadModerationQueue}
                    disabled={isLoadingModeration}
                    className="p-1.5 border border-input rounded-lg hover:bg-accent text-muted-foreground transition-colors"
                    title="Refresh Moderation Queue"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingModeration ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {isLoadingModeration ? (
                <div className="p-12 text-center text-xs text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                  Loading moderation queue...
                </div>
              ) : moderationQueue.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-foreground">Moderation Queue is Clear</p>
                  <p className="text-[11px]">There are no pending civic complaints or abuse flags waiting for review.</p>
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
                        <th className="px-5 py-3 font-semibold uppercase tracking-wider">Photo Evidence</th>
                        <th className="px-5 py-3 font-semibold uppercase tracking-wider text-right">Moderation Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {moderationQueue.map((c) => (
                        <tr key={c.id} className="hover:bg-accent/30 transition-colors">
                          <td className="px-5 py-3.5 max-w-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                                {c.tracking_number}
                              </span>
                              {c.is_flagged && (
                                <span className="inline-flex items-center gap-1 font-semibold text-[10px] bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 rounded-full">
                                  <Flag className="w-3 h-3" /> Flagged for Abuse
                                </span>
                              )}
                            </div>
                            <div className="font-semibold text-foreground text-sm mt-1">{c.title}</div>
                            <p className="text-muted-foreground text-xs line-clamp-2 mt-0.5">
                              {c.description}
                            </p>
                            {c.flag_reason && (
                              <div className="mt-1.5 p-2 bg-destructive/5 border border-destructive/20 rounded text-[11px] text-destructive">
                                <span className="font-semibold">Abuse Report:</span> {c.flag_reason}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="font-medium text-foreground">
                              {c.category?.category_name || 'General'}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {c.department?.department_name || 'Municipal'}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 font-medium text-foreground bg-muted px-2 py-0.5 rounded border border-border">
                              <MapPin className="w-3 h-3 text-primary" />
                              {c.city || 'Karachi'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="font-medium text-foreground">
                              {c.user?.name || 'Anonymous Citizen'}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {c.user?.email || 'No email provided'}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            {c.image_url ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewComplaintImage({
                                    url: getComplaintImageUrl(c.image_url) || c.image_url!,
                                    title: c.title,
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
                              onClick={() => handleApproveComplaint(c.id)}
                              disabled={processingComplaintId === c.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
                            >
                              {processingComplaintId === c.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>Approve & Publish</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setRejectingComplaint(c);
                                setRejectionReason('');
                              }}
                              disabled={processingComplaintId === c.id}
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

          {/* TAB 2: Staff Verification Requests */}
          {adminTab === 'staff' && (
            <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
              <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-500/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      Staff Verification Requests
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      Verify municipal employment credentials before granting authority portal access
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300">
                    {pendingStaff.length} Pending Approval
                  </span>
                  <button
                    onClick={loadPendingStaff}
                    disabled={isLoadingStaff}
                    className="p-1.5 border border-input rounded-lg hover:bg-accent text-muted-foreground transition-colors"
                    title="Refresh Pending Staff"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStaff ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {isLoadingStaff ? (
                <div className="p-12 text-center text-xs text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                  Loading pending staff requests...
                </div>
              ) : pendingStaff.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-foreground">All Staff Requests Reviewed</p>
                  <p className="text-[11px]">There are no pending municipal staff registrations awaiting identity verification.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                      <tr>
                        <th className="px-5 py-3 font-semibold uppercase tracking-wider">Applicant Name</th>
                        <th className="px-5 py-3 font-semibold uppercase tracking-wider">City Jurisdiction</th>
                        <th className="px-5 py-3 font-semibold uppercase tracking-wider">Requested Department</th>
                        <th className="px-5 py-3 font-semibold uppercase tracking-wider">Applied Date</th>
                        <th className="px-5 py-3 font-semibold uppercase tracking-wider">ID Document</th>
                        <th className="px-5 py-3 font-semibold uppercase tracking-wider text-right">Approval Actions</th>
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
        </div>
      )}

      {/* Main Table / Queue */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span>
              {user.role === 'citizen'
                ? 'My Reported Complaints'
                : user.role === 'authority'
                ? `${user.department?.department_name || 'Department'} Action Queue`
                : 'All City Complaints Registry'}
            </span>
          </h2>

          <span className="text-xs text-muted-foreground">{complaints.length} records</span>
        </div>

        {complaints.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            No complaints found in this queue.
            {user.role === 'citizen' && (
              <p className="mt-2">
                <Link href="/report" className="text-primary font-semibold hover:underline">
                  Submit your first civic issue now →
                </Link>
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Tracking #</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Title & Category</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Department</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">SLA Deadline</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-primary whitespace-nowrap">
                      #{c.tracking_number}
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <div className="font-semibold text-foreground truncate">{c.title}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {c.category?.category_name} &bull; {c.city ? `${c.city} • ` : ''}{c.address || 'Geo-Coordinates'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">
                      {c.department?.department_name}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {(() => {
                        const isRejected = c.status === 'Rejected' || c.moderation_status === 'rejected';
                        const isPendingReview = !isRejected && c.moderation_status === 'pending_review';
                        const displayStatus = isRejected ? 'Rejected' : isPendingReview ? 'Pending Review' : c.status;

                        return (
                          <div className="flex flex-col gap-1 items-start max-w-[180px]">
                            <StatusBadge status={displayStatus} size="sm" />

                            {isRejected && c.moderation_reason && (
                              <div className="mt-0.5 w-full">
                                {c.moderation_reason.length > 35 ? (
                                  <div className="text-[10px] leading-tight text-destructive">
                                    <span className="line-clamp-1 break-words italic">
                                      {c.moderation_reason.slice(0, 32)}...
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setActiveRejectionModal({
                                          tracking: c.tracking_number,
                                          title: c.title,
                                          reason: c.moderation_reason!,
                                        })
                                      }
                                      className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-destructive underline hover:text-destructive/80 transition-colors cursor-pointer"
                                    >
                                      Read more
                                    </button>
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-destructive italic leading-tight">
                                    {c.moderation_reason}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <SlaBadge
                        deadline={c.sla_deadline}
                        status={c.status === 'Rejected' || c.moderation_status === 'rejected' ? 'Rejected' : c.status}
                        isBreached={c.is_sla_breached}
                      />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right space-x-2">
                      <Link
                        href={`/complaints/${c.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted hover:bg-accent text-foreground font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </Link>

                      {user.role === 'authority' && c.status !== 'Resolved' && c.status !== 'Rejected' && (
                        <button
                          onClick={() => {
                            setSelectedComplaint(c);
                            setTransitionStatus(c.status === 'Pending' ? 'In Progress' : 'Resolved');
                            setTransitionNotes('');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary font-semibold transition-colors"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          Update
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Super Admin Document Preview Modal */}
      {activeDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Verification Proof: {activeDocument.staffName}
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
                  title="Open in Full Tab"
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
                Review badge or official appointment letter before approving access.
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
              <span>Inspect image to verify civic authenticity before approving public listing.</span>
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

      {/* Authority Quick Transition Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-card border border-border rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primary" />
                Update Complaint #{selectedComplaint.tracking_number}
              </h3>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionSuccess && (
              <div className="my-3 p-3 bg-brand-green/20 text-brand-green rounded-lg text-xs font-semibold">
                {actionSuccess}
              </div>
            )}
            {actionError && (
              <div className="my-3 p-3 bg-destructive/15 text-destructive rounded-lg text-xs font-semibold">
                {actionError}
              </div>
            )}

            <form onSubmit={handleUpdateStatusSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  New Status
                </label>
                <select
                  value={transitionStatus}
                  onChange={(e) => setTransitionStatus(e.target.value)}
                  className="w-full text-xs bg-background border border-input rounded-lg p-2.5 text-foreground outline-none"
                >
                  <option value="Pending">Pending (Triage)</option>
                  <option value="In Progress">In Progress (Field Unit Dispatched)</option>
                  <option value="Resolved">Resolved (Work Completed)</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Action / Resolution Notes
                </label>
                <textarea
                  rows={3}
                  value={transitionNotes}
                  onChange={(e) => setTransitionNotes(e.target.value)}
                  placeholder="Record crew action details, road patching verification, parts installed..."
                  className="w-full text-xs bg-background border border-input rounded-lg p-2.5 text-foreground outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTransition}
                  className="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {isSubmittingTransition ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Transition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complaint Rejection Reason Inspection Modal */}
      {activeRejectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-border flex items-center justify-between bg-destructive/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Rejection Reason</h3>
                  <p className="text-[11px] font-mono text-muted-foreground">#{activeRejectionModal.tracking}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveRejectionModal(null)}
                className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Complaint Title
                </span>
                <p className="text-sm font-semibold text-foreground mt-0.5">{activeRejectionModal.title}</p>
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Moderator Notes & Reason
                </span>
                <div className="mt-1.5 p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive leading-relaxed whitespace-pre-wrap break-words">
                  {activeRejectionModal.reason}
                </div>
              </div>
            </div>

            <div className="p-3.5 border-t border-border bg-muted/20 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveRejectionModal(null)}
                className="px-4 py-1.5 rounded-lg bg-muted hover:bg-accent text-foreground text-xs font-semibold transition-colors"
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
