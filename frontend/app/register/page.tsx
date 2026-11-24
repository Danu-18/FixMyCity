'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiGetDepartments } from '@/lib/api';
import { Department } from '@/lib/types';
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UploadCloud,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { PAKISTAN_CITIES } from '@/lib/constants';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'citizen' | 'authority'>('citizen');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [verificationDocument, setVerificationDocument] = useState<File | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isPendingReview, setIsPendingReview] = useState(false);
  const [submittedStaffData, setSubmittedStaffData] = useState<{
    name: string;
    email: string;
    city: string;
    departmentName: string;
    fileName: string;
  } | null>(null);

  useEffect(() => {
    async function loadDepts() {
      try {
        const depts = await apiGetDepartments();
        setDepartments(depts || []);
        if (depts && depts.length > 0) {
          setDepartmentId(String(depts[0].id));
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadDepts();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Verification document must be smaller than 5MB.');
        return;
      }
      setVerificationDocument(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim());
      formData.append('password', password);
      formData.append('role', role);
      if (phone.trim()) formData.append('phone', phone.trim());

      if (role === 'authority') {
        if (!city.trim()) {
          toast.error('Please select your assigned city jurisdiction.');
          setIsLoading(false);
          return;
        }
        if (!departmentId) {
          toast.error('Please select your municipal department.');
          setIsLoading(false);
          return;
        }
        if (!verificationDocument) {
          toast.error('Please upload your official identity or verification document.');
          setIsLoading(false);
          return;
        }
        formData.append('city', city.trim());
        formData.append('department_id', departmentId);
        formData.append('verification_document', verificationDocument);
      } else {
        if (city.trim()) {
          formData.append('city', city.trim());
        }
      }

      await register(formData);

      if (role === 'authority') {
        const selectedDept = departments.find((d) => String(d.id) === String(departmentId));
        setSubmittedStaffData({
          name: name.trim(),
          email: email.trim(),
          city: city.trim(),
          departmentName: selectedDept?.department_name || 'Municipal Department',
          fileName: verificationDocument?.name || 'Uploaded Document',
        });
        setIsPendingReview(true);
        toast.info('Staff application submitted for Super Admin verification.');
      } else {
        toast.success('Account created successfully! Welcome to FixMyCity.');
        router.push('/dashboard');
      }
    } catch (err: any) {
      const msg = err.message || 'Registration failed. Please check the provided info.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Confirmation view when municipal staff application is under review
  if (isPendingReview && submittedStaffData) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 w-full flex-1 flex flex-col justify-center">
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-md text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto ring-8 ring-amber-500/10">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Under Super Admin Review
            </div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Application Submitted Successfully
            </h1>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Your municipal authority account has been registered and is currently under Super Admin review.
              Our verification team will inspect your credentials and ID document before activating portal access.
            </p>
          </div>

          {/* Submission Details Card */}
          <div className="bg-muted/60 border border-border rounded-xl p-4 text-left space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-border/60">
              <span className="text-muted-foreground font-medium">Applicant Name</span>
              <span className="font-semibold text-foreground">{submittedStaffData.name}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/60">
              <span className="text-muted-foreground font-medium">Work Email</span>
              <span className="font-semibold text-foreground">{submittedStaffData.email}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/60">
              <span className="text-muted-foreground font-medium">City Jurisdiction</span>
              <span className="font-semibold text-foreground flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                {submittedStaffData.city}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/60">
              <span className="text-muted-foreground font-medium">Department</span>
              <span className="font-semibold text-primary">{submittedStaffData.departmentName}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground font-medium">ID Document</span>
              <span className="font-medium text-foreground flex items-center gap-1 truncate max-w-[200px]">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                {submittedStaffData.fileName}
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-lg shadow-xs transition-colors text-center"
            >
              Go to Sign In
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-2.5 bg-background hover:bg-accent border border-input text-foreground font-semibold text-xs rounded-lg transition-colors text-center"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 w-full flex-1 flex flex-col justify-center">
      <div className="text-center mb-8">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md mx-auto mb-3">
          <Building2 className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
          Create FixMyCity Account
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Join your civic resolution network and start reporting community issues
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Select Account Role
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setRole('citizen')}
                className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  role === 'citizen'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Resident Citizen
              </button>
              <button
                type="button"
                onClick={() => setRole('authority')}
                className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  role === 'authority'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Municipal Staff
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'authority' ? 'Officer Full Name' : 'Citizen Full Name'}
                className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              {role === 'authority' ? 'Official Work Email *' : 'Email Address *'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === 'authority' ? 'officer@fixmycity.org' : 'name@example.com'}
                className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Contact Phone (Optional)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground outline-none"
              />
            </div>
          </div>

          {/* Optional City Dropdown for Citizens */}
          {role === 'citizen' && (
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Your City (Optional)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground outline-none"
                >
                  <option value="">Select City (Optional)</option>
                  {PAKISTAN_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Conditional Municipal Staff Fields */}
          {role === 'authority' && (
            <>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  City Jurisdiction *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground outline-none"
                  >
                    <option value="" disabled>Select Municipal City</option>
                    {PAKISTAN_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Assigned Municipal Department *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.department_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Verification Document (PDF/JPG/PNG, max 5MB) *
                </label>
                <div className="mt-1 flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 border border-dashed border-input rounded-lg text-xs font-medium text-foreground hover:border-primary hover:bg-accent transition-colors">
                    <UploadCloud className="w-4 h-4 text-primary" />
                    <span>{verificationDocument ? 'Change Document' : 'Upload Badge / Appointment Letter'}</span>
                    <input
                      type="file"
                      required
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {verificationDocument && (
                    <span className="text-xs text-muted-foreground truncate max-w-[180px] flex items-center gap-1">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      {verificationDocument.name}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Official municipal employment proof required for Super Admin authorization.
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Password (min 8 characters) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : role === 'authority' ? (
              'Submit Staff Application for Review'
            ) : (
              'Create Account & Continue'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
