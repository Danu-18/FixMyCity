'use client';

import React, { useEffect, useState } from 'react';
import {
  apiGetComplaints,
  apiGetDepartments,
} from '@/lib/api';
import { Complaint, Department } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { SlaBadge } from '@/components/SlaBadge';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Filter,
  History,
  ImageIcon,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { PAKISTAN_CITIES } from '@/lib/constants';
import { getComplaintImageUrl } from '@/lib/utils';

export default function SuperAdminRegistryPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Details Modal
  const [activeDetailsComplaint, setActiveDetailsComplaint] = useState<Complaint | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [depts, complaintsRes] = await Promise.all([
        apiGetDepartments().catch(() => []),
        apiGetComplaints({
          per_page: 100,
          city: selectedCity || undefined,
          department_id: selectedDept || undefined,
          status: selectedStatus !== 'All' ? selectedStatus : undefined,
        }).catch(() => ({ data: [] })),
      ]);

      setDepartments(depts || []);
      setComplaints(complaintsRes.data || []);
    } catch {
      toast.error('Failed to load city complaints registry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCity, selectedDept, selectedStatus]);

  const filteredComplaints = complaints.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchTrack = c.tracking_number.toLowerCase().includes(q);
    const matchTitle = c.title.toLowerCase().includes(q);
    const matchAddress = c.address?.toLowerCase().includes(q);
    return matchTrack || matchTitle || matchAddress;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card border border-border rounded-xl p-5 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
            <FileText className="w-3.5 h-3.5" />
            Separation of Duties
          </div>
          <h2 className="text-lg font-extrabold text-foreground tracking-tight">
            City Complaints Master Registry
          </h2>
          <p className="text-xs text-muted-foreground">
            Complete, read-only audit log across all Pakistani municipal jurisdictions. Status transitions are strictly reserved for verified departmental personnel.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={isLoading}
          className="px-3 py-2 border border-border rounded-lg text-xs font-semibold hover:bg-accent text-foreground flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Registry
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tracking #, title, address..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
            />
          </div>

          {/* City Filter */}
          <div className="relative">
            <MapPin className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
            >
              <option value="">All Cities (Jurisdictions)</option>
              {PAKISTAN_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="relative">
            <Building2 className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
            >
              <option value="">All Municipal Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.department_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
            >
              <option value="All">All Operational Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span>
            Displaying <b className="text-foreground">{filteredComplaints.length}</b> records
          </span>
          {(selectedCity || selectedDept || selectedStatus !== 'All' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCity('');
                setSelectedDept('');
                setSelectedStatus('All');
                setSearchQuery('');
              }}
              className="text-primary hover:underline font-semibold cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-card border border-border rounded-xl shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-xs text-muted-foreground flex flex-col items-center">
            <Loader2 className="w-7 h-7 animate-spin text-primary mb-2" />
            Loading registry complaints...
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="p-16 text-center text-xs text-muted-foreground space-y-1">
            <p className="font-bold text-sm text-foreground">No Complaints Found</p>
            <p>Try adjusting your search criteria or jurisdiction filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Tracking #</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Title & Category</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Jurisdiction (City & Dept)</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">SLA Deadline</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredComplaints.map((c) => (
                  <tr key={c.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-primary whitespace-nowrap">
                      #{c.tracking_number}
                    </td>

                    <td className="px-5 py-3.5 max-w-xs">
                      <div className="font-semibold text-foreground truncate">{c.title}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {c.category?.category_name} &bull; {c.address || 'Geo-Location'}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        {c.city || 'Karachi'}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {c.department?.department_name}
                      </div>
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

                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={() => setActiveDetailsComplaint(c)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-accent text-foreground font-semibold transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-primary" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Drawer / Modal (Read-Only) */}
      {activeDetailsComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  #{activeDetailsComplaint.tracking_number}
                </span>
                <h3 className="font-extrabold text-base text-foreground mt-1">
                  {activeDetailsComplaint.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setActiveDetailsComplaint(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={activeDetailsComplaint.status} />
                <SlaBadge
                  deadline={activeDetailsComplaint.sla_deadline}
                  status={activeDetailsComplaint.status}
                  isBreached={activeDetailsComplaint.is_sla_breached}
                />
                <span className="px-2.5 py-1 rounded-md bg-muted text-muted-foreground text-xs font-semibold">
                  {activeDetailsComplaint.city || 'Karachi'}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-muted text-muted-foreground text-xs font-semibold">
                  {activeDetailsComplaint.department?.department_name}
                </span>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Description
                </h4>
                <p className="text-xs text-foreground bg-muted/30 p-3 rounded-xl leading-relaxed whitespace-pre-wrap">
                  {activeDetailsComplaint.description}
                </p>
              </div>

              {/* Location */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Geo-Tagged Location
                </h4>
                <p className="text-xs text-foreground flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    {activeDetailsComplaint.address ||
                      `${activeDetailsComplaint.latitude}, ${activeDetailsComplaint.longitude}`}
                  </span>
                </p>
              </div>

              {/* Photo Evidence */}
              {getComplaintImageUrl(activeDetailsComplaint) && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Incident Photo Evidence
                  </h4>
                  <div className="rounded-xl overflow-hidden border border-border max-h-64 bg-muted/20 flex items-center justify-center">
                    <img
                      src={getComplaintImageUrl(activeDetailsComplaint)!}
                      alt={activeDetailsComplaint.title}
                      className="max-h-64 w-auto object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Resolution Info if available */}
              {activeDetailsComplaint.status === 'Resolved' && activeDetailsComplaint.resolution_notes && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
                  <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Resolution Summary by Department
                  </h4>
                  <p className="text-xs text-foreground leading-relaxed">
                    {activeDetailsComplaint.resolution_notes}
                  </p>
                </div>
              )}

              {/* Notice on separation of duties */}
              <div className="p-3 bg-muted/40 border border-border rounded-xl text-[11px] text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span>
                  Super Admin role is governance-only. Status transitions can only be applied by verified municipal officers within their assigned department.
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-border flex justify-end bg-card">
              <button
                type="button"
                onClick={() => setActiveDetailsComplaint(null)}
                className="px-4 py-2 bg-muted hover:bg-accent text-foreground text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
