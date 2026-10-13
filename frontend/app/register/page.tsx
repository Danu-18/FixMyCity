'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiGetDepartments } from '@/lib/api';
import { Department } from '@/lib/types';
import { Building2, Loader2, Lock, Mail, Phone, User } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'citizen' | 'authority'>('citizen');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [departments, setDepartments] = useState<Department[]>([]);

  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        role,
        department_id: role === 'authority' ? Number(departmentId) : undefined,
      });
      toast.success('Account created successfully! Welcome to FixMyCity.');
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.message || 'Registration failed. Please check the provided info.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

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
                placeholder="Name"
                className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
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

          {/* If Authority, Department Selector */}
          {role === 'authority' && (
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Assigned Municipal Department *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
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
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account & Continue'}
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
