'use client';

import React, { useEffect, useState } from 'react';
import {
  apiApproveStaff,
  apiDownloadStaffDocument,
  apiGetPendingStaff,
  apiRejectStaff,
} from '@/lib/api';
import { User } from '@/lib/types';
import {
  Building2,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useSuperAdmin } from '../layout';

export default function SuperAdminStaffPage() {
  const { refreshCounts } = useSuperAdmin();

  const [staffList, setStaffList] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Document preview modal state
  const [activeDocument, setActiveDocument] = useState<{
    staffId: number;
    staffName: string;
    city: string;
    departmentName: string;
    url: string;
    isPdf: boolean;
  } | null>(null);
  const [viewingDocId, setViewingDocId] = useState<number | null>(null);

  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const data = await apiGetPendingStaff();
      setStaffList(data || []);
      refreshCounts();
    } catch (err: any) {
      toast.error('Failed to load pending municipal staff.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  // Revoke blob URL on unmount or modal close
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
      const isPdf =
        blob.type === 'application/pdf' ||
        (staff.verification_document_path
          ? staff.verification_document_path.toLowerCase().endsWith('.pdf')
          : false);

      const objectUrl = URL.createObjectURL(blob);
      setActiveDocument({
        staffId: staff.id,
        staffName: staff.name,
        city: staff.city || 'Karachi',
        departmentName: staff.department?.department_name || 'Municipal Department',
        url: objectUrl,
        isPdf,
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to download verification document.');
    } finally {
      setViewingDocId(null);
    }
  };

  const handleApproveStaff = async (staffId: number) => {
    setProcessingId(staffId);
    try {
      const res = await apiApproveStaff(staffId);
      toast.success(res.message || 'Municipal staff account approved & activated!');
      setStaffList((prev) => prev.filter((s) => s.id !== staffId));
      refreshCounts();
      if (activeDocument?.staffId === staffId) {
        setActiveDocument(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve staff account.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectStaff = async (staffId: number) => {
    setProcessingId(staffId);
    try {
      const res = await apiRejectStaff(staffId);
      toast.success(res.message || 'Staff registration request rejected.');
      setStaffList((prev) => prev.filter((s) => s.id !== staffId));
      refreshCounts();
      if (activeDocument?.staffId === staffId) {
        setActiveDocument(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject staff registration.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredStaff = staffList.filter((s) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchEmail = s.email.toLowerCase().includes(q);
      const matchCity = s.city?.toLowerCase().includes(q);
      const matchDept = s.department?.department_name.toLowerCase().includes(q);
      return matchName || matchEmail || matchCity || matchDept;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card border border-border rounded-xl p-5 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-1.5">
            <UserCheck className="w-3.5 h-3.5" />
            Identity Verification
          </div>
          <h2 className="text-lg font-extrabold text-foreground tracking-tight">
            Municipal Staff Verification Applications
          </h2>
          <p className="text-xs text-muted-foreground">
            Review employment appointment letters and official identity badges before activating authority staff accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={loadStaff}
          disabled={isLoading}
          className="px-3 py-2 border border-border rounded-lg text-xs font-semibold hover:bg-accent text-foreground flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Applications
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-muted-foreground">
          Showing {filteredStaff.length} pending applicant{filteredStaff.length === 1 ? '' : 's'}
        </p>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search officer name, email, city, dept..."
          className="px-3.5 py-1.5 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground w-full sm:w-72"
        />
      </div>

      {/* Staff Table */}
      <div className="bg-card border border-border rounded-xl shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-xs text-muted-foreground flex flex-col items-center">
            <Loader2 className="w-7 h-7 animate-spin text-primary mb-2" />
            Loading pending staff applications...
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-16 text-center text-xs text-muted-foreground space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="font-bold text-sm text-foreground">No Pending Staff Applications</p>
            <p>All municipal staff registration requests have been reviewed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Applicant Officer</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">City Jurisdiction</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Assigned Department</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Official Document</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Application Date</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-right">Verification Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStaff.map((staff) => {
                  const isProcessing = processingId === staff.id;
                  const isViewing = viewingDocId === staff.id;

                  return (
                    <tr key={staff.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-5 py-3.5 align-top">
                        <div className="font-bold text-foreground">{staff.name}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" />
                          {staff.email}
                        </div>
                        {staff.phone && (
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5" />
                            {staff.phone}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5 align-top whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                          <MapPin className="w-3 h-3" />
                          {staff.city || 'Karachi'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 align-top whitespace-nowrap">
                        <div className="font-semibold text-foreground">
                          {staff.department?.department_name || 'Municipal Department'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          SLA: {staff.department?.sla_hours || 24} hours
                        </div>
                      </td>

                      <td className="px-5 py-3.5 align-top whitespace-nowrap">
                        {staff.verification_document_path ? (
                          <button
                            type="button"
                            onClick={() => handleViewDocument(staff)}
                            disabled={isViewing}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:border-primary hover:bg-accent text-foreground font-semibold transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isViewing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                            ) : (
                              <FileCheck className="w-3.5 h-3.5 text-primary" />
                            )}
                            View Document
                          </button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">
                            No document uploaded
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 align-top whitespace-nowrap text-muted-foreground">
                        {staff.created_at
                          ? new Date(staff.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Recent'}
                      </td>

                      <td className="px-5 py-3.5 align-top whitespace-nowrap text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleApproveStaff(staff.id)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Approve Staff
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRejectStaff(staff.id)}
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

      {/* Authenticated Blob Document Preview Modal */}
      {activeDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Verification Document: {activeDocument.staffName}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {activeDocument.departmentName} &bull;{' '}
                  <span className="font-semibold text-primary">{activeDocument.city}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={activeDocument.url}
                  download={`verification_${activeDocument.staffName.replace(/\s+/g, '_')}`}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-accent flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>

                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(activeDocument.url);
                    setActiveDocument(null);
                  }}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto bg-muted/10 flex items-center justify-center min-h-[400px]">
              {activeDocument.isPdf ? (
                <iframe
                  src={activeDocument.url}
                  title="Staff Document PDF"
                  className="w-full h-[65vh] rounded-lg border border-border shadow-xs"
                />
              ) : (
                <img
                  src={activeDocument.url}
                  alt="Staff Document Proof"
                  className="max-h-[65vh] w-auto object-contain rounded-lg shadow-md"
                />
              )}
            </div>

            <div className="p-4 border-t border-border flex items-center justify-between bg-card">
              <span className="text-[11px] text-muted-foreground">
                Document fetched securely from private local storage via authenticated token.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApproveStaff(activeDocument.staffId)}
                  disabled={processingId === activeDocument.staffId}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  Approve Application
                </button>

                <button
                  type="button"
                  onClick={() => handleRejectStaff(activeDocument.staffId)}
                  disabled={processingId === activeDocument.staffId}
                  className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
