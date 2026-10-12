'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { apiGetCategories, apiSubmitComplaint } from '@/lib/api';
import { Category, Complaint } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import {
  AlertCircle,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  MapPin,
  Send,
  Upload,
} from 'lucide-react';
import Link from 'next/link';

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[350px] w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse flex items-center justify-center text-zinc-400 text-xs">
      Loading coordinate selector...
    </div>
  ),
});

export default function ReportComplaintPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCats, setIsLoadingCats] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<string>('Medium');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number>(24.8607);
  const [lng, setLng] = useState<number>(67.0011);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Submission Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdComplaint, setCreatedComplaint] = useState<Complaint | null>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await apiGetCategories();
        setCategories(cats || []);
        if (cats && cats.length > 0) {
          setCategoryId(String(cats[0].id));
          setPriority(cats[0].default_priority || 'Medium');
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        setIsLoadingCats(false);
      }
    }
    loadCategories();
  }, []);

  const selectedCategoryObj = categories.find((c) => String(c.id) === String(categoryId));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleLocationSelect = (selectedLat: number, selectedLng: number) => {
    setLat(selectedLat);
    setLng(selectedLng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Please provide a title for the civic problem.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Please provide a detailed description of the issue.');
      return;
    }
    if (!categoryId) {
      setErrorMsg('Please select a complaint category.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category_id', categoryId);
      formData.append('priority', priority);
      formData.append('latitude', String(lat));
      formData.append('longitude', String(lng));
      if (address.trim()) {
        formData.append('address', address.trim());
      }
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await apiSubmitComplaint(formData);
      setCreatedComplaint(res.complaint);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success view with tracking confirmation
  if (createdComplaint) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
          Complaint Successfully Registered!
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Your issue has been processed by the FixMyCity automated state-machine engine and routed to the responsible municipal department.
        </p>

        {/* Tracking Card */}
        <div className="mt-8 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm text-left space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
              Assigned Tracking ID
            </span>
            <span className="font-mono text-base font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-lg">
              {createdComplaint.tracking_number}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-zinc-500 font-medium">Mapped Department</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {createdComplaint.department?.department_name || 'Assigned Municipal Authority'}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium">Initial Status</p>
              <p className="font-semibold text-amber-600 mt-0.5">
                {createdComplaint.status}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium">SLA Resolution Target</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {createdComplaint.sla_deadline
                  ? new Date(createdComplaint.sla_deadline).toLocaleString()
                  : '48 Hours'}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium">Issue Category</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {createdComplaint.category?.category_name}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={`/complaints/${createdComplaint.id}`}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            Track Status Timeline →
          </Link>
          <button
            onClick={() => {
              setCreatedComplaint(null);
              setTitle('');
              setDescription('');
              setImageFile(null);
              setImagePreview(null);
            }}
            className="px-6 py-3 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-semibold text-xs rounded-xl transition-colors"
          >
            Report Another Issue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
          Report a Civic Issue
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
          Submit details, photo evidence, and geo-coordinates. The system will automatically route your complaint to the responsible municipal department.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-700 dark:text-red-300 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Category & Routing Preview */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
          <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
            <span>1. Issue Classification</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Select Complaint Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  const found = categories.find((c) => String(c.id) === e.target.value);
                  if (found) {
                    setPriority(found.default_priority || 'Medium');
                  }
                }}
                disabled={isLoadingCats}
                className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.category_name} ({c.department?.department_name || 'General'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Perceived Urgency / Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white"
              >
                <option value="Urgent">Urgent (Immediate Hazard / Life Threat)</option>
                <option value="High">High (Major Disruption / Leak / Hole)</option>
                <option value="Medium">Medium (Standard Repair Needed)</option>
                <option value="Low">Low (Minor / Cosmetic)</option>
              </select>
            </div>
          </div>

          {/* Automated Routing Rule Preview Banner */}
          {selectedCategoryObj && (
            <div className="mt-4 p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-zinc-700 dark:text-zinc-300">
                  Target Department:{' '}
                  <strong className="text-indigo-900 dark:text-indigo-200">
                    {selectedCategoryObj.department?.department_name}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                <Clock className="w-4 h-4 shrink-0" />
                <span>
                  Estimated SLA Target: <strong>{selectedCategoryObj.sla_hours} hours</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Issue Details */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
            2. Problem Description
          </h2>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Incident Summary / Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep Pothole Cluster outside Main Market"
              className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Comprehensive Description *
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the problem, dimensions, consequences (e.g. traffic blockage, contaminated water, broken wires), and any landmarks..."
              className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white"
            />
          </div>

          {/* Photo Evidence Upload */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Photo Evidence (Recommended)
            </label>
            <div className="mt-1 flex flex-col sm:flex-row items-center gap-4">
              <label className="w-full sm:w-auto cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-indigo-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                <Camera className="w-4 h-4 text-indigo-600" />
                <span>Upload Incident Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              {imageFile && (
                <span className="text-xs text-zinc-500">
                  {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
                </span>
              )}
            </div>

            {imagePreview && (
              <div className="mt-3 relative w-48 h-32 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Location Coordinates & Leaflet Picker */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
            3. Exact Geo-Location
          </h2>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Street Address or Landmark
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Block 7, Main Commercial Road, Near Al-Mustafa Center"
              className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Map Coordinates: {lat.toFixed(5)}, {lng.toFixed(5)}
              </span>
              <span className="text-[11px] text-zinc-400">Click map to move pin</span>
            </div>

            <LeafletMap
              mode="picker"
              selectedLocation={{ lat, lng }}
              onLocationSelect={handleLocationSelect}
              center={[lat, lng]}
              zoom={13}
              height="350px"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Routing Complaint via State-Machine...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit & Generate Tracking Number</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
