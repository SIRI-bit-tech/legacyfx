// Admin login page — separate from user login, stores admin_token independently
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, loading, error } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) router.replace('/admin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-elevated px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl font-black text-color-primary tracking-tight">LegacyFX</span>
          <p className="text-text-tertiary text-xs uppercase tracking-widest mt-1 font-bold">Admin Portal</p>
        </div>

        <div className="bg-bg-secondary border border-color-border rounded-xl p-8 shadow-2xl">
          <h1 className="text-xl font-bold text-text-primary mb-6">Sign in to Admin Portal</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-text-secondary text-xs font-bold uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-4 py-3 focus:outline-none focus:border-color-primary transition"
                placeholder="admin@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-text-secondary text-xs font-bold uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-4 py-3 focus:outline-none focus:border-color-primary transition"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-color-danger/10 border border-color-danger/30 text-color-danger text-sm rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-color-primary text-bg-primary font-bold py-3 rounded-lg hover:bg-color-primary-hover transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Signing in...' : 'Sign in to Admin Portal'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-color-border text-center">
            <Link
              href="/admin/register"
              className="text-text-tertiary hover:text-text-secondary text-xs transition"
            >
              Request admin access
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
