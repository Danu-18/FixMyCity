'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { apiGetCategories, apiGetDepartments, apiGetHeatmap } from '@/lib/api';
import { Category, Department, HeatmapPoint } from '@/lib/types';
import {
  Building2,
  MapPin,
  RefreshCw,
  X,
  PlusCircle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';

// Dynamically import LeafletMap with ssr: false
const LeafletMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full rounded-xl bg-card border border-border animate-pulse flex items-center justify-center text-muted-foreground text-xs">
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
    } catch {
      toast.error('Unable to refresh geospatial heatmap data.');
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
      } catch {
        // Fallback for metadata
      }
    }
    loadFilters();
  }, []);

  useEffect(() => {
    fetchHeatmapData();
  }, [selectedDept, selectedCat, selectedStatus]);

  const urgentHotspots = points.filter((p) => p.priority === 'Urgent').length;
  const resolvedCount = points.filter((p) => p.status === 'Resolved').length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 w-full flex-1 flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Civic Issue Heatmap & Geospatial Directory
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
              Live Density
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Visualizing reported infrastructure failures, density concentrations, and departmental responsibilities across the urban landscape.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/report"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-md shadow-xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Report In This Area
          </Link>
          <button
            onClick={fetchHeatmapData}
            disabled={isLoading}
            className="p-2 border border-input rounded-md hover:bg-accent text-muted-foreground transition-colors"
            title="Refresh map"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Department Filter */}
          <div className="min-w-[180px]">
            <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setSelectedCat('');
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

          {/* Category Filter */}
          <div className="min-w-[180px]">
            <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">
              Issue Category
            </label>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="w-full text-xs bg-background border border-input rounded-lg px-2.5 py-1.5 text-foreground outline-none"
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
            <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">
              Status
            </label>
            <div className="flex items-center rounded-lg border border-input p-0.5 bg-background text-xs">
              {['All', 'Pending', 'In Progress', 'Resolved'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    selectedStatus === st
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground border-t sm:border-t-0 pt-2 sm:pt-0 border-border">
          <div>
            <span className="font-bold text-foreground">{points.length}</span> Total Incidents
          </div>
          <div>
            <span className="font-bold text-destructive">{urgentHotspots}</span> Urgent
          </div>
          <div>
            <span className="font-bold text-brand-green">{resolvedCount}</span> Resolved
          </div>
        </div>
      </div>

      {/* Map Display & Selected Drawer */}
      <div className="relative flex-1 min-h-[550px] flex flex-col rounded-xl overflow-hidden border border-border">
        <LeafletMap
          mode="heatmap"
          points={points}
          height="600px"
          onMarkerClick={(p) => setSelectedPoint(p)}
        />

        {/* Selected Incident Drawer */}
        {selectedPoint && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-card rounded-xl shadow-2xl border border-border p-5 z-20 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                #{selectedPoint.tracking_number}
              </span>
              <button
                onClick={() => setSelectedPoint(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="font-bold text-foreground text-sm mt-2">{selectedPoint.title}</h3>

            <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{selectedPoint.department}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                <span>
                  {selectedPoint.lat.toFixed(4)}, {selectedPoint.lng.toFixed(4)}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground">
                Priority: <b className="text-foreground">{selectedPoint.priority}</b>
              </span>
              <Link
                href={`/complaints/${selectedPoint.id}`}
                className="text-xs font-semibold text-primary hover:underline"
              >
                View Full Details →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
