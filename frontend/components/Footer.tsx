'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Mail, Phone, ExternalLink, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Brand & Overview */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-zinc-900 dark:text-white">
                FixMy<span className="text-indigo-600 dark:text-indigo-400">City</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              Smart Community Complaint and Civic Issue Resolution Platform. Connecting citizens directly with municipal departments through automated state-machine routing and SLA accountability.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Platform Features
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/explore" className="hover:text-indigo-600 transition-colors">
                  City Issue Density Heatmap
                </Link>
              </li>
              <li>
                <Link href="/complaints" className="hover:text-indigo-600 transition-colors">
                  Public Complaints Directory
                </Link>
              </li>
              <li>
                <Link href="/report" className="hover:text-indigo-600 transition-colors">
                  Submit Geo-Tagged Issue
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-indigo-600 transition-colors">
                  Track Resolution Timeline
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Municipal Departments */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Integrated Departments
            </h4>
            <ul className="space-y-2 text-xs">
              <li>Infrastructure & Road Maintenance (48h SLA)</li>
              <li>Water & Sanitation (36h SLA)</li>
              <li>Electricity & Power Utilities (24h SLA)</li>
              <li>Municipal Waste Management (24h SLA)</li>
              <li>Public Safety & Security (12h SLA)</li>
            </ul>
          </div>

          {/* Column 4: Contact & Project Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Academic Project Info
            </h4>
            <div className="space-y-2 text-xs text-zinc-500">
              <p>SWE6010 Undergraduate Project</p>
              <p>Danial Arif (ID: 2533971)</p>
              <p>Supervisor: Dr Nuwan</p>
              <div className="flex items-center gap-1.5 pt-1">
                <Mail className="w-3.5 h-3.5 text-indigo-500" />
                <span>daniyalarif2004@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>© 2026 FixMyCity. Built for urban transparency & responsive governance.</p>
          <div className="flex items-center gap-4">
            <Link href="/explore" className="hover:underline">Heatmap</Link>
            <Link href="/track" className="hover:underline">Quick Track</Link>
            <Link href="/dashboard" className="hover:underline">Officer Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
