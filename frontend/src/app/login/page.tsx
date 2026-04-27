'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response: any = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });
      
      if (response.access_token) {
        api.setToken(response.access_token);
        window.location.replace('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="w-full max-w-md">
        <div className="bg-bg-secondary border border-color-border rounded-lg p-8">
          <h1 className="font-display text-3xl font-bold text-text-primary mb-2">Legacy FX</h1>
          <p className="text-text-secondary mb-8">Professional Crypto Trading Platform</p>

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

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-bg-tertiary border border-color-border-light rounded text-text-primary focus:border-color-primary focus:outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-color-danger/10 border border-color-danger/30 rounded p-3 text-color-danger text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-color-primary hover:bg-color-primary-hover disabled:bg-color-primary-alt text-bg-primary font-semibold py-2.5 rounded transition-colors"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="mt-6 border-t border-color-border pt-6">
            <p className="text-text-secondary text-center text-sm">
              Don't have an account?{' '}
              <Link href="/signup" className="text-color-primary hover:text-color-primary-hover font-semibold">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
