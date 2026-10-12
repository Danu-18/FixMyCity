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
  Camera,
  CheckCircle2,
  Clock,
  Loader2,
  Send,
} from 'lucide-react';
import Link from 'next/link';

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[350px] w-full rounded-xl bg-card border border-border animate-pulse flex items-center justify-center text-muted-foreground text-xs">
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
        <div className="w-16 h-16 rounded-full bg-brand-green/20 text-brand-green flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h1 className="text-3xl font-extrabold text-foreground">
          Complaint Successfully Registered!
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your issue has been processed by the FixMyCity automated state-machine engine and routed to the responsible municipal department.
        </p>

        {/* Tracking Card */}
        <div className="mt-8 p-6 bg-card border border-border rounded-xl shadow-sm text-left space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Assigned Tracking ID
            </span>
            <span className="font-mono text-base font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg">
              {createdComplaint.tracking_number}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-muted-foreground font-medium">Mapped Department</p>
              <p className="font-semibold text-foreground mt-0.5">
                {createdComplaint.department?.department_name || 'Assigned Municipal Authority'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium">Initial Status</p>
              <p className="font-semibold text-brand-orange mt-0.5">
                {createdComplaint.status}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium">SLA Resolution Target</p>
              <p className="font-semibold text-foreground mt-0.5">
                {createdComplaint.sla_deadline
                  ? new Date(createdComplaint.sla_deadline).toLocaleString()
                  : '48 Hours'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium">Issue Category</p>
              <p className="font-semibold text-foreground mt-0.5">
                {createdComplaint.category?.category_name}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={`/complaints/${createdComplaint.id}`}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl shadow-xs transition-colors"
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
            className="px-6 py-3 border border-border text-foreground hover:bg-accent font-semibold text-xs rounded-xl transition-colors"
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
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Report a Civic Issue
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Submit details, photo evidence, and geo-coordinates. The system will automatically route your complaint to the responsible municipal department.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Category & Routing Preview */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
            <span>1. Issue Classification</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
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
                className="w-full text-xs bg-background border border-input rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.category_name} ({c.department?.department_name || 'General'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Perceived Urgency / Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-xs bg-background border border-input rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground outline-none"
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
            <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                <span className="text-foreground">
                  Target Department:{' '}
                  <strong className="text-primary font-bold">
                    {selectedCategoryObj.department?.department_name}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Clock className="w-4 h-4 shrink-0" />
                <span>
                  Estimated SLA Target: <strong>{selectedCategoryObj.sla_hours} hours</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Issue Details */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-2">
            2. Problem Description
          </h2>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Incident Summary / Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep Pothole Cluster outside Main Market"
              className="w-full text-xs bg-background border border-input rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Comprehensive Description *
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the problem, dimensions, consequences (e.g. traffic blockage, contaminated water, broken wires), and any landmarks..."
              className="w-full text-xs bg-background border border-input rounded-lg p-3 focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground outline-none"
            />
          </div>

          {/* Photo Evidence Upload */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Photo Evidence (Recommended)
            </label>
            <div className="mt-1 flex flex-col sm:flex-row items-center gap-4">
              <label className="w-full sm:w-auto cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-input rounded-xl text-xs font-medium text-foreground hover:border-primary hover:bg-accent transition-colors">
                <Camera className="w-4 h-4 text-primary" />
                <span>Upload Incident Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              {imageFile && (
                <span className="text-xs text-muted-foreground">
                  {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
                </span>
              )}
            </div>

            {imagePreview && (
              <div className="mt-3 relative w-48 h-32 rounded-xl overflow-hidden border border-border">
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
        <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-2">
            3. Exact Geo-Location
          </h2>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Street Address or Landmark
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Block 7, Main Commercial Road, Near Al-Mustafa Center"
              className="w-full text-xs bg-background border border-input rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">
                Map Coordinates: {lat.toFixed(5)}, {lng.toFixed(5)}
              </span>
              <span className="text-[11px] text-muted-foreground">Click map to move pin</span>
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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-md transition-all hover:scale-[1.02] disabled:opacity-50"
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
