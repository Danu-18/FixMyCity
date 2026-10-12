'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, GraduationCap } from 'lucide-react';

export function Footer() {
  const departments = [
    'Infrastructure & Road Maintenance (48h)',
    'Water & Sanitation (36h)',
    'Electricity & Power Utilities (24h)',
    'Municipal Waste Management (24h)',
    'Public Safety & Security (12h)',
  ];

  return (
    <footer className="border-t border-border bg-card/50 px-4 pb-6 pt-12 text-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {/* Column 1: Brand & Overview */}
        <div>
          <div className="flex items-center gap-2 font-bold text-foreground">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground shadow-xs">
              <Building2 className="h-4 w-4" />
            </span>
            FixMyCity
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            FixMyCity Community Documentation Board. Transparent, accountable civic reporting connecting citizens to municipal departments for faster resolutions.
          </p>
        </div>

        {/* Column 2: Platform Features */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Platform Features
          </h4>
          <ul className="mt-3 space-y-1.5 text-[11px] text-muted-foreground">
            <li>
              <Link href="/explore" className="hover:text-primary transition-colors">
                City Issue Density Heatmap
              </Link>
            </li>
            <li>
              <Link href="/complaints" className="hover:text-primary transition-colors">
                Public Complaints Directory
              </Link>
            </li>
            <li>
              <Link href="/report" className="hover:text-primary transition-colors">
                Submit Geo-Tagged Issue
              </Link>
            </li>
            <li>
              <Link href="/track" className="hover:text-primary transition-colors">
                Public Tracking Status
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Integrated Departments */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Integrated Departments
          </h4>
          <ul className="mt-3 space-y-1.5 text-[11px] text-muted-foreground">
            {departments.map((dept) => (
              <li key={dept}>{dept}</li>
            ))}
          </ul>
        </div>

        {/* Column 4: Academic Project Info */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Academic Project Info
          </h4>
          <ul className="mt-3 space-y-1.5 text-[11px] text-muted-foreground">
            <li>Final Year Project 2026</li>
            <li>Department of Computer Science</li>
            <li>Danial Arif (Student ID: 202539)</li>
            <li>Karachi, Pakistan</li>
          </ul>
      
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-6xl flex-col justify-between gap-2 border-t border-border/60 pt-4 text-[10px] text-muted-foreground sm:flex-row">
        <span>© 2026 FixMyCity. Built for community complaints. All rights reserved.</span>
        <div className="flex gap-6">
          <Link href="/explore" className="hover:text-primary transition-colors">Heatmap</Link>
          <Link href="/track" className="hover:text-primary transition-colors">Track Issue</Link>
          <Link href="/dashboard" className="hover:text-primary transition-colors">Officer Portal</Link>
        </div>
      </div>
    </footer>
  );
}
