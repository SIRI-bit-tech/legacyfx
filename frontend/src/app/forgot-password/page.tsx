'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      toast.success('Reset link sent if account exists');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="w-full max-w-md">
        <div className="bg-bg-secondary border border-color-border rounded-lg p-8 shadow-xl">
          <h1 className="font-display text-3xl font-bold text-text-primary mb-2">Forgot Password</h1>
          
          {submitted ? (
            <div className="text-center mt-6">
              <p className="text-text-secondary mb-6">
                If an account exists with that email, we have sent a password reset link. Please check your inbox.
              </p>
              <Link href="/login" className="w-full inline-block bg-color-primary hover:bg-color-primary-hover text-bg-primary font-semibold py-2.5 rounded transition-colors">
                Return to Login
              </Link>
            </div>
          ) : (
            <>
              <p className="text-text-secondary mb-8">Enter your email address and we'll send you a link to reset your password.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-bg-tertiary border border-color-border-light rounded text-text-primary focus:border-color-primary focus:outline-none"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-color-primary hover:bg-color-primary-hover disabled:bg-color-primary-alt text-bg-primary font-semibold py-2.5 rounded transition-colors mt-4"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <div className="mt-6 border-t border-color-border pt-6">
                <p className="text-text-secondary text-center text-sm">
                  Remember your password?{' '}
                  <Link href="/login" className="text-color-primary hover:text-color-primary-hover font-semibold">
                    Log In
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
