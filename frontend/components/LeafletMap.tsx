'use client';

import React, { useEffect, useRef, useState } from 'react';
import { HeatmapPoint } from '@/lib/types';
import { Crosshair, Layers, Locate, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';

interface LeafletMapProps {
  mode: 'heatmap' | 'markers' | 'picker' | 'preview';
  points?: HeatmapPoint[];
  selectedLocation?: { lat: number; lng: number } | null;
  onLocationSelect?: (lat: number, lng: number) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
  onMarkerClick?: (point: HeatmapPoint) => void;
}

export default function LeafletMap({
  mode,
  points = [],
  selectedLocation,
  onLocationSelect,
  center = [24.8607, 67.0011], // Default Karachi
  zoom = 12,
  height = '500px',
  onMarkerClick,
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const pickerMarkerRef = useRef<any>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [activeLayer, setActiveLayer] = useState<'heatmap' | 'markers'>(
    mode === 'heatmap' ? 'heatmap' : 'markers'
  );

  useEffect(() => {
    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;
      // Import leaflet css
      await import('leaflet/dist/leaflet.css');

      // Import leaflet.heat plugin if available
      try {
        await import('leaflet.heat');
      } catch (e) {
        console.warn('leaflet.heat load error', e);
      }

      // Fix default Leaflet icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const initialCenter = selectedLocation
          ? [selectedLocation.lat, selectedLocation.lng]
          : center;

        const map = L.map(mapContainerRef.current, {
          center: initialCenter as [number, number],
          zoom,
          scrollWheelZoom: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
        markersGroupRef.current = L.layerGroup().addTo(map);

        // Click to place marker in 'picker' mode
        if (mode === 'picker') {
          map.on('click', (e: any) => {
            const { lat, lng } = e.latlng;
            updatePickerMarker(lat, lng, L);
            if (onLocationSelect) {
              onLocationSelect(lat, lng);
            }
          });
        }
      }

      const map = mapInstanceRef.current;
      if (!map) return;

      // Render based on mode
      if (mode === 'picker' || mode === 'preview') {
        if (selectedLocation) {
          updatePickerMarker(selectedLocation.lat, selectedLocation.lng, L);
          map.setView([selectedLocation.lat, selectedLocation.lng], 14);
        }
      } else {
        renderPoints(L);
      }
    }

    initMap();

    return () => {
      // Clean up map on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update points when points or activeLayer change
  useEffect(() => {
    if (mapInstanceRef.current && (mode === 'heatmap' || mode === 'markers')) {
      import('leaflet').then((module) => {
        renderPoints(module.default);
      });
    }
  }, [points, activeLayer, mode]);

  // Update picker marker when selectedLocation changes from outside
  useEffect(() => {
    if (mapInstanceRef.current && (mode === 'picker' || mode === 'preview') && selectedLocation) {
      import('leaflet').then((module) => {
        updatePickerMarker(selectedLocation.lat, selectedLocation.lng, module.default);
      });
    }
  }, [selectedLocation]);

  const updatePickerMarker = (lat: number, lng: number, L: any) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (pickerMarkerRef.current) {
      pickerMarkerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], {
        draggable: mode === 'picker',
      }).addTo(map);

      if (mode === 'picker') {
        marker.on('dragend', (e: any) => {
          const pos = e.target.getLatLng();
          if (onLocationSelect) {
            onLocationSelect(pos.lat, pos.lng);
          }
        });
      }

      pickerMarkerRef.current = marker;
    }
  };

  const renderPoints = (L: any) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    if (markersGroupRef.current) {
      markersGroupRef.current.clearLayers();
    }

    // Remove old heat layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (!points || points.length === 0) return;

    if (activeLayer === 'heatmap') {
      // Use L.heatLayer if available
      const heatCoords = points.map((p) => [p.lat, p.lng, p.intensity || 0.6]);

      if (typeof (L as any).heatLayer === 'function') {
        const heat = (L as any).heatLayer(heatCoords, {
          radius: 28,
          blur: 18,
          maxZoom: 16,
          gradient: {
            0.2: '#3b82f6', // blue
            0.4: '#10b981', // green
            0.6: '#f59e0b', // yellow/amber
            0.8: '#f97316', // orange
            1.0: '#ef4444', // red
          },
        }).addTo(map);
        heatLayerRef.current = heat;
      } else {
        // Fallback: colored radial circles
        points.forEach((p) => {
          const color =
            p.priority === 'Urgent' ? '#ef4444' : p.priority === 'High' ? '#f97316' : '#3b82f6';
          const circle = L.circleMarker([p.lat, p.lng], {
            radius: 12 + (p.upvotes_count || 0) * 1.5,
            fillColor: color,
            fillOpacity: 0.6,
            stroke: false,
          }).addTo(markersGroupRef.current);

          circle.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
              <strong style="font-size: 13px;">${p.title}</strong><br/>
              <span style="color: #6366f1;">#${p.tracking_number}</span> &bull; <span>${p.category}</span><br/>
              <span>Status: <b>${p.status}</b></span> &bull; <span>Votes: ${p.upvotes_count || 0}</span>
            </div>
          `);
        });
      }
    } else {
      // Regular / Marker Pins mode
      points.forEach((p) => {
        const marker = L.marker([p.lat, p.lng]).addTo(markersGroupRef.current);

        marker.on('click', () => {
          if (onMarkerClick) {
            onMarkerClick(p);
          }
        });

        const statusColor =
          p.status === 'Resolved'
            ? '#10b981'
            : p.status === 'In Progress'
            ? '#3b82f6'
            : '#f59e0b';

        const popupContent = `
          <div style="font-family: sans-serif; min-width: 200px; padding: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 11px; font-weight: bold; color: #4f46e5;">#${p.tracking_number}</span>
              <span style="font-size: 11px; padding: 2px 6px; border-radius: 9999px; background: ${statusColor}22; color: ${statusColor}; font-weight: 600;">${p.status}</span>
            </div>
            <h4 style="margin: 4px 0 2px; font-size: 13px; font-weight: bold; color: #111;">${p.title}</h4>
            <div style="font-size: 11px; color: #555; margin-bottom: 6px;">
              <div>🏛️ ${p.department}</div>
              <div>🏷️ ${p.category}</div>
              ${p.address ? `<div>📍 ${p.address}</div>` : ''}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; padding-top: 6px; font-size: 11px;">
              <span>👍 ${p.upvotes_count || 0} Upvotes</span>
              <a href="/complaints/${p.id}" style="color: #4f46e5; font-weight: bold; text-decoration: none;">View Detail →</a>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
      });
    }

    // Adjust view to fit points if available
    if (points.length > 0) {
      const group = new L.LatLngBounds(points.map((p) => [p.lat, p.lng]));
      map.fitBounds(group, { padding: [50, 50], maxZoom: 15 });
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 15);
          import('leaflet').then((module) => {
            updatePickerMarker(latitude, longitude, module.default);
          });
        }
        if (onLocationSelect) {
          onLocationSelect(latitude, longitude);
        }
        toast.success('Current location detected successfully!');
      },
      (err) => {
        setIsLocating(false);
        toast.error(`Location detection failed: ${err.message}. Using default city coordinates.`);
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
      {/* Map Layer Switcher (if explore mode) */}
      {(mode === 'heatmap' || mode === 'markers') && (
        <div className="absolute top-3 right-3 z-10 flex bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-xl p-1 shadow-md border border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveLayer('heatmap')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
              activeLayer === 'heatmap'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Heatmap Density
          </button>
          <button
            onClick={() => setActiveLayer('markers')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
              activeLayer === 'markers'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Incident Pins
          </button>
        </div>
      )}

      {/* Geolocation Button (if picker mode) */}
      {mode === 'picker' && (
        <div className="absolute top-3 right-3 z-10">
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isLocating}
            className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 font-medium text-xs rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Locate className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            {isLocating ? 'Detecting...' : 'Detect My Location'}
          </button>
        </div>
      )}

      {mode === 'picker' && (
        <div className="absolute bottom-3 left-3 z-10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xs px-3 py-1.5 rounded-lg text-xs text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-1.5">
          <Crosshair className="w-3.5 h-3.5 text-indigo-600" />
          Click or drag anywhere on the map to place the incident pin
        </div>
      )}

      <div ref={mapContainerRef} style={{ height, width: '100%' }} />
    </div>
  );
}
