'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiGetComplaints } from '@/lib/api';
import {
  Archive,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Inbox,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  ShieldCheck,
  Wrench,
  X,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';

interface AuthorityContextType {
  activeCount: number;
  refreshActiveCount: () => Promise<void>;
}

const AuthorityContext = createContext<AuthorityContextType>({
  activeCount: 0,
  refreshActiveCount: async () => {},
});

export const useAuthority = () => useContext(AuthorityContext);

export default function AuthorityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading: authLoading, logout } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeCount, setActiveCount] = useState(0);

  const refreshActiveCount = async () => {
    if (!user) return;
    try {
      const [pendingRes, inProgRes] = await Promise.all([
        apiGetComplaints({
          department_id: user.department_id || undefined,
          city: user.city || undefined,
          status: 'Pending',
          per_page: 1,
        }).catch(() => ({ total: 0 })),
        apiGetComplaints({
          department_id: user.department_id || undefined,
          city: user.city || undefined,
          status: 'In Progress',
          per_page: 1,
        }).catch(() => ({ total: 0 })),
      ]);

      setActiveCount((pendingRes.total || 0) + (inProgRes.total || 0));
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
      } else if (user.role === 'super_admin') {
        router.push('/super-admin');
      } else if (user.role === 'authority') {
        refreshActiveCount();
      }
    }
  }, [user, authLoading, router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (authLoading || !user || user.role !== 'authority') {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Verifying municipal authority jurisdiction...
        </p>
      </div>
    );
  }

  const deptName = user.department?.department_name || 'Municipal Department';
  const cityName = user.city || 'Karachi';
  const jurisdictionLabel = `${deptName} • ${cityName}`;

  const navItems = [
    {
      name: 'Overview',
      href: '/authority',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: 'Active Queue',
      href: '/authority/queue',
      icon: Inbox,
      badge: activeCount > 0 ? activeCount : null,
      badgeColor: 'bg-primary text-primary-foreground',
    },
    {
      name: 'Resolved & Archive',
      href: '/authority/resolved',
      icon: Archive,
      badge: null,
    },
    {
      name: 'City Heatmap',
      href: '/authority/heatmap',
      icon: Flame,
      badge: null,
    },
  ];

  const getPageTitle = () => {
    if (pathname === '/authority') return 'Municipal Command Center';
    if (pathname.startsWith('/authority/queue')) return 'Active Dispatch Queue';
    if (pathname.startsWith('/authority/resolved')) return 'Resolved & Terminal Archive';
    if (pathname.startsWith('/authority/heatmap')) return 'Jurisdiction Incident Heatmap';
    return 'Authority Portal';
  };

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full bg-card">
      {/* Brand Header */}
      <div className="h-14 px-4 border-b border-border flex items-center justify-between shrink-0">
        <Link
          href="/authority"
          onClick={() => isMobile && setIsMobileMenuOpen(false)}
          className="flex items-center gap-2.5 group"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <Building2 className="h-4.5 w-4.5" />
          </span>
          <div className="leading-none">
            <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
              FixMyCity
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Municipal
              </span>
            </span>
            <span className="block text-[10px] text-muted-foreground mt-0.5">
              Operations Console
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

      {/* Prominent Jurisdiction Pill */}
      <div className="p-3 mx-3 my-3 rounded-xl bg-primary/10 border border-primary/20 text-center shrink-0">
        <div className="text-[10px] uppercase font-bold text-primary tracking-wider flex items-center justify-center gap-1 mb-1">
          <MapPin className="w-3 h-3" />
          Locked Jurisdiction
        </div>
        <div className="font-extrabold text-xs text-foreground truncate" title={jurisdictionLabel}>
          {deptName}
        </div>
        <div className="text-[11px] font-semibold text-primary">
          City: {cityName}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Department Workflow
        </p>
        {navItems.map((item) => {
          const isActive =
            item.href === '/authority'
              ? pathname === '/authority'
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && setIsMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`}
                />
                <span>{item.name}</span>
              </div>

              {item.badge !== null && item.badge > 0 && (
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs ${
                    isActive
                      ? 'bg-background text-foreground'
                      : 'bg-primary text-primary-foreground'
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
    <AuthorityContext.Provider
      value={{
        activeCount,
        refreshActiveCount,
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
                  {deptName} &bull; {cityName} Operations
                </p>
              </div>
            </div>

            {/* Top Right Header Controls */}
            <div className="flex items-center gap-2">
              {/* Jurisdiction Pill in Header */}
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-bold text-primary">
                <MapPin className="w-3 h-3" />
                <span>{jurisdictionLabel}</span>
              </div>

              <ThemeToggle />
              <NotificationBell />

              <div className="h-5 w-px bg-border mx-1" />

              {/* Authority Officer Profile Badge */}
              <div className="flex items-center gap-2 pl-1">
                <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/30 text-primary font-bold text-xs flex items-center justify-center">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-foreground leading-none">
                    {user.name}
                  </p>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Municipal Staff
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
    </AuthorityContext.Provider>
  );
}
