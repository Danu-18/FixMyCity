'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBackOffice = pathname.startsWith('/super-admin') || pathname.startsWith('/authority');

  if (isBackOffice) {
    return <>{children}</>;
  }

  return (
    <>
      <Suspense fallback={<header className="h-14 w-full border-b bg-background/90" />}>
        <Navbar />
      </Suspense>
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
    </>
  );
}
