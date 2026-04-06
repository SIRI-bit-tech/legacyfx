'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

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
      const response: any = await api.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, {
        email,
        code: fullCode,
      });
      
      // Store token if returned and update API client state
      if (response.access_token) {
        (api as any).setToken(response.access_token);
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-bg-secondary border border-color-success rounded-lg p-8 text-center max-w-md w-full">
        <h2 className="text-color-success text-2xl font-bold mb-2">Verified!</h2>
        <p className="text-text-secondary mb-4">Your email has been confirmed. Welcome to Legacy FX.</p>
        <p className="text-text-tertiary text-sm">Redirecting to dashboard...</p>
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
