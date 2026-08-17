'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleInput = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Email not found. Please go back to Sign Up.');
      return;
    }

    setResendLoading(true);
    setError('');
    setResendSuccess(false);

    try {
      await api.post(API_ENDPOINTS.AUTH.RESEND_EMAIL, { email });
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const fullCode = code.join('');

    if (fullCode.length < 6) {
      setError('Please enter the full 6-digit code');
      return;
    }

    setLoading(true);

    try {
      await api.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, {
        email,
        code: fullCode,
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-bg-secondary border border-color-primary/30 rounded-xl p-8 text-center max-w-md w-full shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-full bg-color-primary/10 border border-color-primary/20 flex items-center justify-center mx-auto text-color-primary text-3xl">
          <i className="pi pi-clock" />
        </div>
        <div>
          <h2 className="text-text-primary text-2xl font-black mb-2">Email Confirmed</h2>
          <p className="text-text-secondary text-sm leading-relaxed mb-4">
            Your email address has been successfully verified.
          </p>
          <div className="bg-bg-tertiary/60 border border-color-border p-4 rounded-lg text-left text-xs space-y-2">
            <p className="text-color-primary font-bold flex items-center gap-1.5">
              <i className="pi pi-shield text-xs" /> Account Verification in Progress
            </p>
            <p className="text-text-secondary leading-relaxed">
              Your account registration is currently undergoing standard compliance verification (which takes 24–48 hours).
            </p>
            <p className="text-text-tertiary">
              An email notification will be sent to your inbox once your account has been approved and activated.
            </p>
          </div>
        </div>
        <Link
          href="/login"
          className="block w-full bg-color-primary hover:bg-color-primary-hover text-bg-primary font-bold py-3 rounded-lg text-sm transition-all"
        >
          Return to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-bg-secondary border border-color-border rounded-lg p-8">
        <h1 className="font-display text-3xl font-bold text-text-primary mb-2">Verify Email</h1>
        <p className="text-text-secondary mb-8">
          We've sent a 6-digit code to <span className="text-text-primary font-medium">{email || 'your email'}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInput(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold bg-bg-tertiary border border-color-border-light rounded text-color-primary focus:border-color-primary focus:outline-none"
                required
              />
            ))}
          </div>

          {error && (
            <div className="bg-color-danger/10 border border-color-danger/30 rounded p-3 text-color-danger text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-color-primary hover:bg-color-primary-hover disabled:bg-color-primary-alt text-bg-primary font-semibold py-3 rounded transition-colors"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-text-secondary text-sm">
            Didn't receive a code?{' '}
            <button 
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="text-color-primary hover:text-color-primary-hover font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendLoading ? 'Sending...' : 'Resend'}
            </button>
          </p>
          {resendSuccess && (
            <p className="text-color-success text-sm mt-2">Code sent successfully!</p>
          )}
          <div className="mt-4 pt-4 border-t border-color-border">
            <Link href="/signup" className="text-text-tertiary hover:text-text-secondary text-sm">
              Back to Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary py-12 px-4">
      <Suspense fallback={<div className="text-text-secondary">Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
