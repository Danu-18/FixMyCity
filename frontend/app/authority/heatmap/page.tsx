'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { apiGetHeatmap } from '@/lib/api';
import { HeatmapPoint } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  Flame,
  Layers,
  Loader2,
  MapPin,
  RefreshCw,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import Link from 'next/link';

// Dynamically import LeafletMap with ssr: false
const LeafletMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[550px] w-full rounded-xl bg-card border border-border animate-pulse flex items-center justify-center text-muted-foreground text-xs">
      Loading geospatial heatmap engine...
    </div>
  ),
});

const CITY_COORDINATES: Record<string, [number, number]> = {
  Karachi: [24.8607, 67.0011],
  Lahore: [31.5204, 74.3587],
  Islamabad: [33.6844, 73.0479],
  Rawalpindi: [33.5651, 73.0169],
  Faisalabad: [31.4504, 73.135],
  Multan: [30.1575, 71.5249],
  Peshawar: [34.0151, 71.5249],
  Quetta: [30.1798, 66.975],
};

export default function AuthorityHeatmapPage() {
  const { user } = useAuth();

  const [points, setPoints] = useState<HeatmapPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPoint, setSelectedPoint] = useState<HeatmapPoint | null>(null);

  const cityName = user?.city || 'Karachi';
  const deptName = user?.department?.department_name || 'Municipal Department';
  const centerCoords = CITY_COORDINATES[cityName] || [24.8607, 67.0011];

  const loadHeatmap = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await apiGetHeatmap({
        city: user.city || undefined,
        department_id: user.department_id || undefined,
      });
      setPoints(res.points || []);
    } catch {
      toast.error('Failed to load local jurisdiction heatmap data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHeatmap();
  }, [user?.city, user?.department_id]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card border border-border rounded-xl p-5 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-1.5">
            <Flame className="w-3.5 h-3.5" />
            Geospatial Density
          </div>
          <h2 className="text-lg font-extrabold text-foreground tracking-tight">
            Jurisdiction Incident Hotspots &mdash; {deptName} ({cityName})
          </h2>
          <p className="text-xs text-muted-foreground">
            Visual density distribution of active and resolved issues pre-filtered to your department&apos;s assigned municipal jurisdiction.
          </p>
        </div>

        <button
          type="button"
          onClick={loadHeatmap}
          disabled={isLoading}
          className="px-3 py-2 border border-border rounded-lg text-xs font-semibold hover:bg-accent text-foreground flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Heatmap
        </button>
      </div>

      {/* Map Container */}
      <div className="relative bg-card border border-border rounded-xl shadow-2xs overflow-hidden">
        <LeafletMap
          mode="heatmap"
          points={points}
          center={centerCoords}
          zoom={12}
          height="550px"
          onMarkerClick={(pt) => setSelectedPoint(pt)}
        />

        {/* Selected Incident Inspector Overlay */}
        {selectedPoint && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 z-400 bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-primary">
                  #{selectedPoint.tracking_number}
                </span>
                <h4 className="font-bold text-xs text-foreground mt-0.5 line-clamp-1">
                  {selectedPoint.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPoint(null)}
                className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={selectedPoint.status} size="sm" />
              <span className="text-[10px] text-muted-foreground">
                Category: <b>{selectedPoint.category}</b>
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
              <span className="truncate">{selectedPoint.address || `${selectedPoint.lat.toFixed(4)}, ${selectedPoint.lng.toFixed(4)}`}</span>
            </p>

            <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
              <Link
                href={`/authority/queue?search=${selectedPoint.tracking_number}`}
                className="text-primary hover:underline font-semibold"
              >
                View in Dispatch Queue &rarr;
              </Link>

              <button
                type="button"
                onClick={() => setSelectedPoint(null)}
                className="text-muted-foreground hover:text-foreground text-[11px]"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Heatmap Legend & Guidance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-card border border-border rounded-xl text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            High Density Hotspots
          </div>
          <p className="text-[11px] text-muted-foreground">
            Clusters of multiple simultaneous citizen complaints in the same neighborhood.
          </p>
        </div>

        <div className="p-4 bg-card border border-border rounded-xl text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            Medium Density
          </div>
          <p className="text-[11px] text-muted-foreground">
            Recurring civic issues reported within the last 48-72 hours.
          </p>
        </div>

        <div className="p-4 bg-card border border-border rounded-xl text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            Isolated Issues
          </div>
          <p className="text-[11px] text-muted-foreground">
            Single incident reports undergoing standard SLA dispatch workflow.
          </p>
        </div>
      </div>
    </div>
  );
}
