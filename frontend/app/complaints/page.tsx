'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiGetCategories, apiGetComplaints, apiGetDepartments } from '@/lib/api';
import { Category, Complaint, Department, PaginatedResponse } from '@/lib/types';
import { ComplaintCard } from '@/components/ComplaintCard';
import {
  Building2,
  Filter,
  PlusCircle,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';

function ComplaintsContent() {
  const searchParams = useSearchParams();
  const initialDept = searchParams.get('department_id') || '';

  const [complaintsData, setComplaintsData] = useState<PaginatedResponse<Complaint> | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters State
  const [search, setSearch] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>(initialDept);
  const [categoryId, setCategoryId] = useState<string>('');
  const [status, setStatus] = useState<string>('All');
  const [slaStatus, setSlaStatus] = useState<string>('');
  const [sort, setSort] = useState<string>('newest');
  const [page, setPage] = useState<number>(1);

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const res = await apiGetComplaints({
        search: search.trim() || undefined,
        department_id: departmentId || undefined,
        category_id: categoryId || undefined,
        status: status !== 'All' ? status : undefined,
        sla_status: slaStatus || undefined,
        sort,
        page,
        per_page: 9,
      });
      setComplaintsData(res);
    } catch {
      toast.error('Unable to fetch complaints list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function loadMetadata() {
      try {
        const [depts, cats] = await Promise.all([
          apiGetDepartments(),
          apiGetCategories(),
        ]);
        setDepartments(depts || []);
        setCategories(cats || []);
      } catch {
        // Fallback for metadata
      }
    }
    loadMetadata();
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [departmentId, categoryId, status, slaStatus, sort, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchComplaints();
  };

  const handleResetFilters = () => {
    setSearch('');
    setDepartmentId('');
    setCategoryId('');
    setStatus('All');
    setSlaStatus('');
    setSort('newest');
    setPage(1);
    toast.info('Search filters reset to default.');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 w-full flex-1">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Civic Complaints Directory
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Browse, search, and upvote community-reported issues across municipal departments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/report"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 hover:shadow-md"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            File New Issue
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3.5 py-2 text-xs font-semibold text-foreground transition hover:bg-accent"
          >
            View on Map
          </Link>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 mb-8 shadow-xs space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by keywords, tracking ID (e.g. FMC-2026-1001), street address..."
            className="w-full pl-10 pr-24 py-2.5 text-xs bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            type="submit"
            className="absolute right-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-md transition-colors"
          >
            Search
          </button>
        </form>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-border">
          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs bg-background border border-input rounded-lg px-2.5 py-1.5 text-foreground outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Department
            </label>
            <select
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                setCategoryId('');
                setPage(1);
              }}
              className="w-full text-xs bg-background border border-input rounded-lg px-2.5 py-1.5 text-foreground outline-none"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.department_name}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs bg-background border border-input rounded-lg px-2.5 py-1.5 text-foreground outline-none"
            >
              <option value="">All Categories</option>
              {categories
                .filter((c) => !departmentId || String(c.department_id) === String(departmentId))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.category_name}
                  </option>
                ))}
            </select>
          </div>

          {/* SLA Filter */}
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              SLA Priority
            </label>
            <select
              value={slaStatus}
              onChange={(e) => {
                setSlaStatus(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs bg-background border border-input rounded-lg px-2.5 py-1.5 text-foreground outline-none"
            >
              <option value="">All Turnarounds</option>
              <option value="breached">Breached (Overdue)</option>
              <option value="warning">Urgent (&lt;12h remaining)</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Sort By
            </label>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs bg-background border border-input rounded-lg px-2.5 py-1.5 text-foreground outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="most_upvoted">Most Upvoted</option>
              <option value="urgent">Highest Priority</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {(search || departmentId || categoryId || status !== 'All' || slaStatus) && (
          <div className="flex items-center justify-between pt-2 text-xs">
            <span className="text-muted-foreground">Active filters applied</span>
            <button
              onClick={handleResetFilters}
              className="font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Complaints Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 rounded-xl bg-card border border-border animate-pulse"
            />
          ))}
        </div>
      ) : !complaintsData || complaintsData.data.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border p-8">
          <p className="text-base font-bold text-foreground">
            No complaints found matching your criteria.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search filters or clear all filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 text-xs font-semibold text-primary hover:underline"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {complaintsData.data.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} />
            ))}
          </div>

          {/* Pagination */}
          {complaintsData.last_page > 1 && (
            <div className="mt-10 flex items-center justify-between border-t border-border pt-5">
              <span className="text-xs text-muted-foreground">
                Showing <b>{complaintsData.from}</b> to <b>{complaintsData.to}</b> of{' '}
                <b>{complaintsData.total}</b> reports
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 text-xs font-semibold border border-input bg-card rounded-md hover:bg-accent disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs font-semibold px-2 text-foreground">
                  Page {page} of {complaintsData.last_page}
                </span>
                <button
                  disabled={page >= complaintsData.last_page}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 text-xs font-semibold border border-input bg-card rounded-md hover:bg-accent disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ComplaintsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-muted-foreground">
          Loading complaints directory...
        </div>
      }
    >
      <ComplaintsContent />
    </Suspense>
  );
}
