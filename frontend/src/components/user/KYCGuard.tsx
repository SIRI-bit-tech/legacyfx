'use client';

import { ReactNode, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ChevronRight, Lock } from 'lucide-react';

interface KYCGuardProps {
  children: ReactNode;
  allowSkip?: boolean;
}

export function KYCGuard({ children, allowSkip = false }: Readonly<KYCGuardProps>) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [hasSkipped, setHasSkipped] = useState(false);

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

  if (allowSkip) {
    return (
      <>
        {children}
        
        {!hasSkipped && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-bg-secondary border border-color-border rounded-3xl p-8 max-w-lg w-full text-center relative overflow-hidden shadow-2xl">
              {/* Subtle Background Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-color-primary/10 blur-[100px] pointer-events-none" />

              <div className="relative z-10">
                <div className="w-20 h-20 bg-color-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-color-primary">
                  <ShieldAlert className="w-10 h-10" />
                </div>

                <h2 className="text-2xl font-bold text-text-primary mb-3">Identity Verification Recommended</h2>
                <p className="text-text-tertiary mb-8 leading-relaxed">
                  While you can proceed with deposits, completing your <span className="text-text-secondary font-medium">KYC verification</span> is highly recommended to unlock all features and ensure maximum account security.
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => router.push('/profile/verification')}
                    className="w-full py-4 bg-color-primary text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-color-primary-hover transition-all shadow-lg shadow-color-primary/10 active:scale-[0.98]"
                  >
                    Verify Identity Now
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setHasSkipped(true)}
                    className="w-full py-4 bg-bg-primary text-text-secondary font-bold rounded-xl border border-color-border hover:bg-bg-tertiary transition-all"
                  >
                    Skip and Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // If not verified and skip is not allowed, show the "Lock" screen
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
