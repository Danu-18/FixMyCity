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
import { PriorityBadge } from '@/components/PriorityBadge';
import { SlaBadge } from '@/components/SlaBadge';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Filter,
  Layers,
  Loader2,
  PlusCircle,
  RefreshCw,
  Shield,
  ThumbsUp,
  User,
  Wrench,
  X,
} from 'lucide-react';
import Link from 'next/link';

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
          // Fetch complaints submitted by current user
          const myComplaints = await apiGetComplaints({ mine: true, per_page: 50 });
          setComplaints(myComplaints.data || []);
        } else if (user.role === 'authority') {
          // Fetch complaints assigned to user's department
          const deptComplaints = await apiGetComplaints({
            department_id: user.department_id || undefined,
            per_page: 50,
          });
          setComplaints(deptComplaints.data || []);
        } else {
          // Admin sees all complaints
          const allComplaints = await apiGetComplaints({ per_page: 50 });
          setComplaints(allComplaints.data || []);
        }
      }
    } catch (err) {
      console.error(err);
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
      setActionSuccess(`Complaint #${selectedComplaint.tracking_number} moved to '${transitionStatus}'.`);
      setTransitionNotes('');
      // Reload complaints
      loadDashboardData();
      setTimeout(() => {
        setSelectedComplaint(null);
        setActionSuccess(null);
      }, 1500);
    } catch (err: any) {
      setActionError(err.message || 'Status transition failed.');
    } finally {
      setIsSubmittingTransition(false);
    }
  };

  const handleTriggerSlaAudit = async () => {
    setIsTriggeringSla(true);
    setSlaAuditMessage(null);
    try {
      const res = await apiTriggerSlaCheck();
      setSlaAuditMessage(
        `SLA Audit Complete: ${res.results.breached} breached, ${res.results.nearing_breach} nearing deadline.`
      );
      loadDashboardData();
    } catch (err: any) {
      setSlaAuditMessage('SLA audit failed: ' + (err.message || 'Error'));
    } finally {
      setIsTriggeringSla(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
        <p className="text-xs text-zinc-500">Loading user role workspace...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      {/* Top Banner */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 mb-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Welcome back, {user.name}
            </h1>
            <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {user.role}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
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
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              Report New Issue
            </Link>
          )}

          {user.role === 'admin' && (
            <button
              onClick={handleTriggerSlaAudit}
              disabled={isTriggeringSla}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Clock className="w-4 h-4" />
              {isTriggeringSla ? 'Auditing Deadlines...' : 'Run SLA Audit Now'}
            </button>
          )}

          <button
            onClick={loadDashboardData}
            className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {slaAuditMessage && (
        <div className="mb-6 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 text-xs font-medium">
          {slaAuditMessage}
        </div>
      )}

      {/* KPI Cards based on role */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            {user.role === 'citizen' ? 'My Submissions' : 'Active Queue'}
          </span>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {complaints.length}
          </p>
          <span className="text-[11px] text-zinc-400">
            {user.role === 'citizen' ? 'Total filed by you' : 'Under department responsibility'}
          </span>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            In Progress
          </span>
          <p className="mt-2 text-2xl font-bold text-blue-600">
            {complaints.filter((c) => c.status === 'In Progress').length}
          </p>
          <span className="text-[11px] text-zinc-400">Crew dispatched on site</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Resolved
          </span>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {complaints.filter((c) => c.status === 'Resolved').length}
          </p>
          <span className="text-[11px] text-zinc-400">Successfully closed</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            {user.role === 'citizen' ? 'Total Upvotes' : 'Overdue SLA'}
          </span>
          <p className="mt-2 text-2xl font-bold text-rose-600">
            {user.role === 'citizen'
              ? complaints.reduce((sum, c) => sum + (c.upvotes_count || 0), 0)
              : complaints.filter((c) => c.is_sla_breached).length}
          </p>
          <span className="text-[11px] text-zinc-400">
            {user.role === 'citizen' ? 'Received from community' : 'Action urgently required'}
          </span>
        </div>
      </div>

      {/* Main Table / Queue */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>
              {user.role === 'citizen'
                ? 'My Reported Complaints'
                : user.role === 'authority'
                ? `${user.department?.department_name || 'Department'} Action Queue`
                : 'All City Complaints Registry'}
            </span>
          </h2>

          <span className="text-xs text-zinc-500">{complaints.length} records</span>
        </div>

        {complaints.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-500">
            No complaints found in this queue.
            {user.role === 'citizen' && (
              <p className="mt-2">
                <Link href="/report" className="text-indigo-600 font-semibold hover:underline">
                  Submit your first civic issue now →
                </Link>
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Tracking #</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Title & Category</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Department</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">SLA Deadline</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {complaints.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      #{c.tracking_number}
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {c.title}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate">
                        {c.category?.category_name} &bull; {c.address || 'Geo-Coordinates'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
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
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 font-medium"
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
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium"
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
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-indigo-600" />
                Update Complaint #{selectedComplaint.tracking_number}
              </h3>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionSuccess && (
              <div className="my-3 p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold">
                {actionSuccess}
              </div>
            )}
            {actionError && (
              <div className="my-3 p-3 bg-red-100 text-red-800 rounded-xl text-xs font-semibold">
                {actionError}
              </div>
            )}

            <form onSubmit={handleUpdateStatusSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  New Status
                </label>
                <select
                  value={transitionStatus}
                  onChange={(e) => setTransitionStatus(e.target.value)}
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl p-2.5 text-zinc-900 dark:text-white"
                >
                  <option value="Pending">Pending (Triage)</option>
                  <option value="In Progress">In Progress (Field Unit Dispatched)</option>
                  <option value="Resolved">Resolved (Work Completed)</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Action / Resolution Notes
                </label>
                <textarea
                  rows={3}
                  value={transitionNotes}
                  onChange={(e) => setTransitionNotes(e.target.value)}
                  placeholder="Record crew action details, road patching verification, parts installed..."
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl p-2.5 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTransition}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
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
