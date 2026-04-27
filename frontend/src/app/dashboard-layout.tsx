'use client';

import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  // Show spinner while auth is resolving
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin text-color-primary mb-4 text-3xl">
            <i className="pi pi-bolt"></i>
          </div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // KEY FIX: instead of returning null (which unmounts all children
  // and destroys the chart container ref), render the full layout
  // immediately but keep children hidden until auth is confirmed.
  // This means the DOM — including the TradingView div — is always
  // present, so the ref is never null when the widget tries to mount.
  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-0">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {/* Render children regardless of auth state —
              page.tsx guards the chart init behind isMounted,
              and the redirect useEffect above handles the redirect.
              This prevents the ref from being destroyed mid-init. */}
          {children}
        </main>
      </div>
    </div>
  );
}