'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

function ConfirmWithdrawalContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      handleConfirm(token);
    } else {
      setError('Invalid confirmation link. Token is missing.');
    }
  }, [searchParams]);

  const handleConfirm = async (token: string) => {
    setLoading(true);
    setError('');

    try {
      // The prompt suggests issuing a POST
      await api.post(`/withdrawals/confirm?token=${token}`, {});
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Confirmation failed. The token may be expired or invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-bg-secondary border border-color-border rounded-lg p-8 text-center">
        <h1 className="font-display text-3xl font-bold text-text-primary mb-4">
          Withdrawal Confirmation
        </h1>

        {loading && (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-color-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-text-secondary text-lg">Confirming your withdrawal...</p>
          </div>
        )}

        {success && (
          <div className="space-y-6">
            <div className="bg-color-success/10 border border-color-success/30 rounded-lg p-6">
              <h2 className="text-color-success text-2xl font-bold mb-2">Success!</h2>
              <p className="text-text-secondary">
                Your withdrawal has been confirmed and is now pending approval.
              </p>
            </div>
            <Link 
              href="/dashboard"
              className="inline-block w-full bg-color-primary hover:bg-color-primary-hover text-bg-primary font-semibold py-3 rounded transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {error && (
          <div className="space-y-6">
            <div className="bg-color-danger/10 border border-color-danger/30 rounded-lg p-6">
              <h2 className="text-color-danger text-xl font-bold mb-2">Failed</h2>
              <p className="text-text-secondary">{error}</p>
            </div>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => {
                  const token = searchParams.get('token');
                  if (token) handleConfirm(token);
                }}
                className="w-full bg-bg-tertiary hover:bg-bg-tertiary-hover text-text-primary border border-color-border font-semibold py-3 rounded transition-colors"
              >
                Try Again
              </button>
              <Link 
                href="/dashboard"
                className="text-text-tertiary hover:text-text-secondary text-sm font-medium"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        )}

        {!loading && !success && !error && (
          <p className="text-text-tertiary">Processing link...</p>
        )}
      </div>
    </div>
  );
}

export default function ConfirmWithdrawalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary py-12 px-4 font-sans">
      <Suspense fallback={<div className="text-text-secondary">Loading...</div>}>
        <ConfirmWithdrawalContent />
      </Suspense>
    </div>
  );
}
