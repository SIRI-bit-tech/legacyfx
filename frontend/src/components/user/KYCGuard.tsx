'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ChevronRight, Lock } from 'lucide-react';

interface KYCGuardProps {
  children: ReactNode;
}

export function KYCGuard({ children }: Readonly<KYCGuardProps>) {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-color-primary"></div>
      </div>
    );
  }

  // If user is verified, show the content immediately
  if (user?.kyc_status === 'VERIFIED') {
    return <>{children}</>;
  }

  // If not verified, show the "Lock" screen
  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <div className="bg-bg-secondary border border-color-border rounded-3xl p-8 text-center relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-color-primary/5 blur-[100px] pointer-events-none" />

        <div className="relative z-10">
          <div className="w-20 h-20 bg-color-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-color-primary">
            <Lock className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-bold text-text-primary mb-3">Verification Required</h2>
          <p className="text-text-tertiary mb-8 leading-relaxed">
            To ensure the security of your funds and comply with financial regulations,{' '}
            <span className="text-text-secondary font-medium">KYC verification is required</span>{' '}
            before you can perform deposits or withdrawals.
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-4 bg-bg-primary/50 p-4 rounded-xl border border-color-border/50 text-left">
              <div className="w-10 h-10 rounded-full bg-color-primary/5 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-color-primary" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary">Identity Security</h4>
                <p className="text-xs text-text-tertiary">Protects your account from unauthorized access.</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push('/profile/verification')}
            className="w-full py-4 bg-color-primary text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-color-primary-hover transition-all group shadow-lg shadow-color-primary/10 active:scale-[0.98]"
          >
            Start Verification
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => router.back()}
            className="mt-4 text-sm text-text-tertiary hover:text-text-primary transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-text-tertiary px-10">
        Review usually takes less than 24 hours. Once approved, all features will be unlocked automatically.
      </p>
    </div>
  );
}
