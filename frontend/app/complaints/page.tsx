'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiGetCategories, apiGetComplaints, apiGetDepartments } from '@/lib/api';
import { Category, Complaint, Department, PaginatedResponse } from '@/lib/types';
import { ComplaintCard } from '@/components/ComplaintCard';
import {
  ArrowUpDown,
  Building2,
  Filter,
  Layers,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import Link from 'next/link';

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
    } catch (err) {
      console.error('Error fetching complaints', err);
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
      } catch (err) {
        console.error(err);
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
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Civic Complaints Directory
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Browse, search, and upvote community-reported issues across municipal departments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/report"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-xs transition-colors"
          >
            + File New Issue
          </Link>
          <Link
            href="/explore"
            className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium text-xs rounded-xl transition-colors"
          >
            View on Map
          </Link>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 mb-8 shadow-xs space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by keywords, tracking ID (FMC-2026-...), street address..."
            className="w-full pl-10 pr-24 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white"
          />
          <button
            type="submit"
            className="absolute right-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Search
          </button>
        </form>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          {/* Status Tabs */}
          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Department
            </label>
            <select
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                setCategoryId('');
                setPage(1);
              }}
              className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100"
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
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100"
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
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              SLA Compliance
            </label>
            <select
              value={slaStatus}
              onChange={(e) => {
                setSlaStatus(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100"
            >
              <option value="">All SLAs</option>
              <option value="on_track">On Track</option>
              <option value="nearing">Approaching (&lt;12h)</option>
              <option value="breached">Breached / Overdue</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Sort By
            </label>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100"
            >
              <option value="newest">Newest First</option>
              <option value="most_upvoted">Most Upvoted (Community Urgency)</option>
              <option value="urgent">Highest Priority</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Complaints Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-72 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse border border-zinc-200 dark:border-zinc-700"
            />
          ))}
        </div>
      ) : !complaintsData || complaintsData.data.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8">
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            No complaints found matching your criteria.
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Try adjusting your search filters or clear all filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 text-xs font-semibold text-indigo-600 hover:underline"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complaintsData.data.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} />
            ))}
          </div>

          {/* Pagination */}
          {complaintsData.last_page > 1 && (
            <div className="mt-10 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-5">
              <span className="text-xs text-zinc-500">
                Showing <b>{complaintsData.from}</b> to <b>{complaintsData.to}</b> of{' '}
                <b>{complaintsData.total}</b> reports
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs font-semibold px-2">
                  Page {page} of {complaintsData.last_page}
                </span>
                <button
                  disabled={page >= complaintsData.last_page}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40"
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
    <Suspense fallback={<div className="p-12 text-center text-xs text-zinc-400">Loading complaints directory...</div>}>
      <ComplaintsContent />
    </Suspense>
  );
}
