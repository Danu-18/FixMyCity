'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  apiGetAnalytics,
  apiGetComplaints,
  apiGetDepartments,
  apiTriggerSlaCheck,
  apiUpdateComplaintStatus,
} from '@/lib/api';
import { AnalyticsOverview, Complaint, Department } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { SlaBadge } from '@/components/SlaBadge';
import {
  Building2,
  Clock,
  Eye,
  FileText,
  Loader2,
  PlusCircle,
  RefreshCw,
  Wrench,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
            per_page: 50,
          });
          setComplaints(deptComplaints.data || []);
        } else {
          const allComplaints = await apiGetComplaints({ per_page: 50 });
          setComplaints(allComplaints.data || []);
        }
      }
    } catch {
      // Dashboard fetch fallback
    } finally {
      setIsLoading(false);
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
        <p className="text-xs text-muted-foreground">Loading user role workspace...</p>
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
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
              {user.role}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {user.role === 'citizen' &&
              'Track your submitted community reports, monitor resolution timelines, and view community upvotes.'}
            {user.role === 'authority' &&
              `Assigned Department: ${user.department?.department_name || 'General Municipal Authority'} (SLA Target: ${user.department?.sla_hours || 48}h).`}
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

          {user.role === 'admin' && (
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
        <div className="bg-primary lift relative overflow-hidden rounded-xl p-4 text-left text-primary-foreground shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">
            {user.role === 'citizen' ? 'My Submissions' : 'Active Queue'}
          </span>
          <p className="mt-1 text-2xl font-bold">
            {complaints.length}
          </p>
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
      </div>

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
                  <tr
                    key={c.id}
                    className="hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono font-bold text-primary whitespace-nowrap">
                      #{c.tracking_number}
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <div className="font-semibold text-foreground truncate">
                        {c.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {c.category?.category_name} &bull; {c.address || 'Geo-Coordinates'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">
                      {c.department?.department_name}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <SlaBadge
                        deadline={c.sla_deadline}
                        status={c.status}
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

                      {(user.role === 'admin' || user.role === 'authority') && (
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
    </div>
  );
}
