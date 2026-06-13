'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (!token) {
      toast.error("Invalid or missing reset token");
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', { token, new_password: password });
      setSuccess(true);
      toast.success('Password has been successfully reset');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-color-danger mb-4">Invalid or missing password reset token.</p>
        <Link href="/login" className="text-color-primary hover:underline">
          Go to Login
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center mt-6">
        <p className="text-text-secondary mb-6">
          Your password has been successfully changed.
        </p>
        <Link href="/login" className="w-full inline-block bg-color-primary hover:bg-color-primary-hover text-bg-primary font-semibold py-2.5 rounded transition-colors">
          Log In Now
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="text-text-secondary mb-8">Enter your new password below.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            New Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-bg-tertiary border border-color-border-light rounded text-text-primary focus:border-color-primary focus:outline-none"
            placeholder="••••••••"
            required
            minLength={8}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 bg-bg-tertiary border border-color-border-light rounded text-text-primary focus:border-color-primary focus:outline-none"
            placeholder="••••••••"
            required
            minLength={8}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-color-primary hover:bg-color-primary-hover disabled:bg-color-primary-alt text-bg-primary font-semibold py-2.5 rounded transition-colors mt-4"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="w-full max-w-md">
        <div className="bg-bg-secondary border border-color-border rounded-lg p-8 shadow-xl">
          <h1 className="font-display text-3xl font-bold text-text-primary mb-2">Reset Password</h1>
          <Suspense fallback={<div className="text-center text-text-secondary">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
