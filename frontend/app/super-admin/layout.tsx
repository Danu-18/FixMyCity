'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiGetModerationQueue, apiGetPendingStaff } from '@/lib/api';
import {
  Building2,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';

interface SuperAdminContextType {
  pendingStaffCount: number;
  pendingModerationCount: number;
  refreshCounts: () => Promise<void>;
}

const SuperAdminContext = createContext<SuperAdminContextType>({
  pendingStaffCount: 0,
  pendingModerationCount: 0,
  refreshCounts: async () => {},
});

export const useSuperAdmin = () => useContext(SuperAdminContext);

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading: authLoading, logout } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingStaffCount, setPendingStaffCount] = useState(0);
  const [pendingModerationCount, setPendingModerationCount] = useState(0);

  const refreshCounts = async () => {
    try {
      const [staffList, modQueue] = await Promise.all([
        apiGetPendingStaff().catch(() => []),
        apiGetModerationQueue().catch(() => []),
      ]);
      setPendingStaffCount(staffList?.length || 0);
      setPendingModerationCount(modQueue?.length || 0);
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'citizen') {
        router.push('/dashboard');
      } else if (user.role === 'authority') {
        router.push('/authority');
      } else if (user.role === 'super_admin') {
        refreshCounts();
      }
    }
  }, [user, authLoading, router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (authLoading || !user || user.role !== 'super_admin') {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Authenticating Super Admin Console...
        </p>
      </div>
    );
  }

  const navItems = [
    {
      name: 'Overview',
      href: '/super-admin',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: 'Complaint Moderation',
      href: '/super-admin/moderation',
      icon: ShieldAlert,
      badge: pendingModerationCount > 0 ? pendingModerationCount : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      name: 'Staff Verification',
      href: '/super-admin/staff',
      icon: UserCheck,
      badge: pendingStaffCount > 0 ? pendingStaffCount : null,
      badgeColor: 'bg-primary text-primary-foreground',
    },
    {
      name: 'All City Registry',
      href: '/super-admin/registry',
      icon: FileText,
      badge: null,
    },
  ];

  const getPageTitle = () => {
    if (pathname === '/super-admin') return 'Overview & Governance';
    if (pathname.startsWith('/super-admin/moderation')) return 'Complaint Moderation Queue';
    if (pathname.startsWith('/super-admin/staff')) return 'Municipal Staff Verification';
    if (pathname.startsWith('/super-admin/registry')) return 'All City Complaints Registry';
    return 'Super Admin Portal';
  };

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full bg-card">
      {/* Brand Header */}
      <div className="h-14 px-4 border-b border-border flex items-center justify-between shrink-0">
        <Link
          href="/super-admin"
          onClick={() => isMobile && setIsMobileMenuOpen(false)}
          className="flex items-center gap-2.5 group"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-600 dark:bg-amber-500 text-white shadow-xs">
            <ShieldCheck className="h-4.5 w-4.5" />
          </span>
          <div className="leading-none">
            <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
              FixMyCity
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                Admin
              </span>
            </span>
            <span className="block text-[10px] text-muted-foreground mt-0.5">
              Super Admin Console
            </span>
          </div>
        </Link>

        {isMobile && (
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent md:hidden cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Platform Administration
        </p>
        {navItems.map((item) => {
          const isActive =
            item.href === '/super-admin'
              ? pathname === '/super-admin'
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && setIsMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 shadow-2xs font-bold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-muted-foreground'
                  }`}
                />
                <span>{item.name}</span>
              </div>

              {item.badge !== null && item.badge > 0 && (
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs ${
                    item.badgeColor || 'bg-primary text-primary-foreground'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Sidebar Footer */}
      <div className="p-3 border-t border-border space-y-1 bg-muted/20 shrink-0">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <span className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5" />
            View Public Site
          </span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </Link>

        <button
          type="button"
          onClick={() => logout()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors text-left cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <SuperAdminContext.Provider
      value={{
        pendingStaffCount,
        pendingModerationCount,
        refreshCounts,
      }}
    >
      <div className="h-screen w-full flex overflow-hidden bg-background text-foreground antialiased">
        {/* Desktop Sidebar: naturally rendered on md and above */}
        <aside className="hidden md:flex w-64 flex-col shrink-0 border-r border-border bg-card z-20">
          {renderSidebarContent(false)}
        </aside>

        {/* Mobile Sidebar Drawer Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <aside className="relative w-64 bg-card border-r border-border flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200">
              {renderSidebarContent(true)}
            </aside>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Compact Top Header Bar - Fixed height, never cut off */}
          <header className="h-14 border-b border-border bg-card/90 backdrop-blur-md shrink-0 flex items-center justify-between px-4 sm:px-6 z-10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-1.5 -ml-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent md:hidden cursor-pointer"
                aria-label="Open sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-sm font-bold text-foreground leading-tight">
                  {getPageTitle()}
                </h1>
                <p className="hidden sm:block text-[10px] text-muted-foreground">
                  Governance & Compliance Controls
                </p>
              </div>
            </div>

            {/* Top Right Header Controls */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationBell />

              <div className="h-5 w-px bg-border mx-1" />

              {/* Super Admin Profile Badge */}
              <div className="flex items-center gap-2 pl-1">
                <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center justify-center">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-foreground leading-none">
                    {user.name}
                  </p>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                    Super Admin
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Page Body - Scrollable content with proper padding */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SuperAdminContext.Provider>
  );
}
