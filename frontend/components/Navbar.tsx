'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Building2,
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  X,
} from 'lucide-react';
import { NotificationModal } from './NotificationModal';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, unreadCount } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { name: 'Explore & Heatmap', href: '/explore' },
    { name: 'Complaints', href: '/complaints' },
    { name: 'Track Status', href: '/track' },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          {/* Brand Logo */}
          <Link href="/" className="flex min-w-0 items-center gap-2 group">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-xs transition-transform group-hover:scale-105">
              <Building2 className="h-4 w-4" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="flex items-center gap-1.5 font-bold text-foreground">
                FixMyCity{' '}
               
              </span>
              <span className="block truncate text-[10px] text-muted-foreground">
                A Community Platform
              </span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-6 text-xs sm:text-sm font-semibold md:flex">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative py-1 transition-colors hover:text-primary after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:bg-primary after:transition-all ${
                    isActive
                      ? 'text-primary after:w-full font-bold'
                      : 'text-foreground/80 after:w-0 hover:after:w-full'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <Link
              href="/report"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 hover:shadow-md"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Submit Issue
            </Link>
          </nav>

          {/* Right Section: Notifications, Theme Toggle & User Profile / Login */}
          <div className="hidden md:flex items-center gap-2.5">
            <ThemeToggle />

            {user && (
              <button
                onClick={() => setNotificationsOpen(true)}
                className="relative p-2 rounded-lg text-foreground/70 hover:text-primary hover:bg-primary/5 transition-colors"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-2.5 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
                >
                  <div className="text-left">
                    <p className="text-xs font-semibold text-foreground leading-tight">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground capitalize">
                      {user.role} {user.department ? `(${user.department.department_name.split(' ')[0]})` : ''}
                    </p>
                  </div>
                  <div className="w-6 h-6 rounded-md bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                    {user.name.charAt(0)}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-xl bg-card border border-border shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-xs font-semibold text-foreground">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {user.email}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase bg-primary/10 text-primary">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-4 py-2.5 text-xs text-foreground hover:bg-accent transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-muted-foreground" />
                      Dashboard Portal
                    </Link>

                    <button
                      onClick={() => logout()}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-destructive hover:bg-destructive/10 transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Link
                  href="/login"
                  className="px-2.5 py-1 text-foreground/80 hover:text-primary transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="rounded-md border border-input bg-card px-3 py-1.5 text-foreground hover:bg-accent transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Section: Theme Toggle, Notifications & Menu Button */}
          <div className="flex items-center gap-1.5 md:hidden">
            <ThemeToggle className="p-1.5" />

            {user && (
              <button
                onClick={() => setNotificationsOpen(true)}
                className="relative p-1.5 text-foreground/70"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-destructive text-destructive-foreground text-[8px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-foreground hover:text-primary"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="flex flex-col gap-3 border-t border-border bg-background px-4 py-4 text-sm font-semibold md:hidden">
            {/* Theme Switcher inside Mobile Drawer */}
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs text-muted-foreground font-semibold">Theme Mode</span>
              <ThemeToggle showLabel />
            </div>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 text-foreground hover:text-primary"
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="/report"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md bg-primary px-3 py-2 text-center text-primary-foreground font-semibold"
            >
              Submit Issue
            </Link>
            {user ? (
              <div className="border-t border-border pt-3 space-y-2">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-primary font-semibold"
                >
                  Dashboard ({user.name})
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="block text-destructive text-xs"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="border-t border-border pt-3 flex gap-4">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-primary"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-muted-foreground"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Notifications Drawer */}
      <NotificationModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </>
  );
}
