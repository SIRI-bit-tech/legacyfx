'use client';

import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function DashboardLayout({ 
  children, 
  title, 
  subtitle 
}: Readonly<{ 
  children: ReactNode;
  title?: string;
  subtitle?: string;
}>) {
  const { isAuthenticated, loading, user } = useAuth();
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
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {/* KYC Notification Banner */}
          {isAuthenticated && user?.kyc_status !== 'VERIFIED' && (
            <div className="bg-color-primary/10 border-b border-color-primary/20 py-2.5 px-4 flex items-center justify-between group overflow-hidden relative">
              <div className="flex items-center gap-3 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-color-primary shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.5)]" />
                <p className="text-sm font-medium text-text-primary">
                  <span className="hidden sm:inline">Unverified Account:</span>{' '}
                  Upgrade to KYC to unlock full trading, deposits, and withdrawals.
                </p>
              </div>
              <button 
                onClick={() => router.push('/profile/verification')}
                className="text-xs font-bold bg-color-primary text-black px-3 py-1.5 rounded-lg hover:bg-color-primary-hover transition-all shrink-0 ml-4 shadow-sm active:scale-95"
              >
                Verify Now
              </button>
            </div>
          )}

          {title && (
            <div className="pt-8 px-8 sm:px-12">
              <h1 className="text-3xl font-black text-text-primary uppercase tracking-tighter italic">{title}</h1>
              {subtitle && <p className="text-text-tertiary text-sm mt-1 font-medium">{subtitle}</p>}
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}