'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  apiApproveStaff,
  apiDownloadStaffDocument,
  apiGetPendingStaff,
  apiRejectStaff,
} from '@/lib/api';
import { User } from '@/lib/types';
import {
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function SuperAdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [pendingStaff, setPendingStaff] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [processingStaffId, setProcessingStaffId] = useState<number | null>(null);
  const [viewingDocId, setViewingDocId] = useState<number | null>(null);
  const [activeDocument, setActiveDocument] = useState<{
    staffId: number;
    staffName: string;
    employeeId: string;
    departmentName: string;
    url: string;
    isPdf: boolean;
  } | null>(null);

  const loadPendingStaff = async () => {
    try {
      setIsLoading(true);
      const staffList = await apiGetPendingStaff();
      setPendingStaff(staffList || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load pending staff requests.');
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
      loadPendingStaff();
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
        employeeId: staff.employee_id || 'N/A',
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
              Super Admin Verification Console
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Review municipal authority registrations, verify employment proof, and grant administrative access
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
            onClick={loadPendingStaff}
            disabled={isLoading}
            className="p-2 border border-input rounded-lg hover:bg-accent text-muted-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Staff Verification Requests Table Card */}
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
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Department</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Employee / Badge ID</th>
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
                      <span className="font-medium text-primary">
                        {staff.department?.department_name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold bg-muted px-2 py-0.5 rounded border border-border text-foreground">
                        {staff.employee_id || 'N/A'}
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
                  Badge ID: <span className="font-mono font-semibold">{activeDocument.employeeId}</span> &bull; {activeDocument.departmentName}
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
