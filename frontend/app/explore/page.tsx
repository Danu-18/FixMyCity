'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { apiGetCategories, apiGetDepartments, apiGetHeatmap } from '@/lib/api';
import { Category, Department, HeatmapPoint } from '@/lib/types';
import {
  AlertTriangle,
  Building2,
  Filter,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import Link from 'next/link';

// Dynamically import LeafletMap with ssr: false
const LeafletMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse flex items-center justify-center text-zinc-400">
      Loading interactive map and geospatial heat engine...
    </div>
  ),
});

export default function ExploreMapPage() {
  const [points, setPoints] = useState<HeatmapPoint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPoint, setSelectedPoint] = useState<HeatmapPoint | null>(null);

  const fetchHeatmapData = async () => {
    setIsLoading(true);
    try {
      const res = await apiGetHeatmap({
        department_id: selectedDept || undefined,
        category_id: selectedCat || undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
      });
      setPoints(res.points || []);
    } catch (err) {
      console.error('Error fetching heatmap', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function loadFilters() {
      try {
        const [depts, cats] = await Promise.all([
          apiGetDepartments(),
          apiGetCategories(),
        ]);
        setDepartments(depts || []);
        setCategories(cats || []);
      } catch (e) {
        console.error(e);
      }
    }
    loadFilters();
  }, []);

  useEffect(() => {
    fetchHeatmapData();
  }, [selectedDept, selectedCat, selectedStatus]);

  const urgentHotspots = points.filter((p) => p.priority === 'Urgent').length;
  const pendingCount = points.filter((p) => p.status === 'Pending').length;
  const inProgressCount = points.filter((p) => p.status === 'In Progress').length;
  const resolvedCount = points.filter((p) => p.status === 'Resolved').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              Civic Issue Heatmap & Geospatial Directory
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Live Density
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            Visualizing reported infrastructure failures, density concentrations, and departmental responsibilities across the urban landscape.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/report"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            Report In This Area
          </Link>
          <button
            onClick={fetchHeatmapData}
            disabled={isLoading}
            className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
            title="Refresh map"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 mb-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Department Filter */}
          <div className="min-w-[180px]">
            <label className="block text-[11px] font-semibold text-zinc-500 mb-1 uppercase tracking-wider">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setSelectedCat('');
              }}
              className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.department_name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="min-w-[180px]">
            <label className="block text-[11px] font-semibold text-zinc-500 mb-1 uppercase tracking-wider">
              Issue Category
            </label>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
            >
              <option value="">All Categories</option>
              {categories
                .filter((c) => !selectedDept || String(c.department_id) === String(selectedDept))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.category_name}
                  </option>
                ))}
            </select>
          </div>

          {/* Status Tabs */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 mb-1 uppercase tracking-wider">
              Status
            </label>
            <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 p-0.5 bg-zinc-50 dark:bg-zinc-800 text-xs">
              {['All', 'Pending', 'In Progress', 'Resolved'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    selectedStatus === st
                      ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-4 text-xs text-zinc-500 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100 dark:border-zinc-800">
          <div>
            <span className="font-bold text-zinc-900 dark:text-white">{points.length}</span> Total Incidents
          </div>
          <div>
            <span className="font-bold text-red-600">{urgentHotspots}</span> Urgent
          </div>
          <div>
            <span className="font-bold text-emerald-600">{resolvedCount}</span> Resolved
          </div>
        </div>
      </div>

      {/* Map Display & Selected Drawer */}
      <div className="relative flex-1 min-h-[550px] flex flex-col">
        <LeafletMap
          mode="heatmap"
          points={points}
          height="600px"
          onMarkerClick={(p) => setSelectedPoint(p)}
        />

        {/* Selected Incident Drawer */}
        {selectedPoint && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-5 z-20 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                #{selectedPoint.tracking_number}
              </span>
              <button
                onClick={() => setSelectedPoint(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-2">
              {selectedPoint.title}
            </h3>

            <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
              <p>🏛️ <b>Dept:</b> {selectedPoint.department}</p>
              <p>🏷️ <b>Category:</b> {selectedPoint.category}</p>
              {selectedPoint.address && <p>📍 <b>Address:</b> {selectedPoint.address}</p>}
              <p>
                Status: <span className="font-semibold text-indigo-600">{selectedPoint.status}</span> &bull; Upvotes:{' '}
                <b>{selectedPoint.upvotes_count || 0}</b>
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3">
              <span className="text-[11px] text-zinc-400">
                {new Date(selectedPoint.created_at).toLocaleDateString()}
              </span>
              <Link
                href={`/complaints/${selectedPoint.id}`}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View Full Tracking Details →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
