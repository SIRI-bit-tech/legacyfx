// Admin register page — request admin access form (no auto-login, pending approval flow)
'use client';

import { useState } from 'react';
import Link from 'next/link';

import { adminAuthApi } from '@/lib/adminApi';

export default function AdminRegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', adminCode: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');

    setLoading(true);
    try {
      await adminAuthApi.register(form);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Check your admin code.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-elevated px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-bg-secondary border border-color-success/30 rounded-xl p-8 shadow-2xl text-center">
            <div className="text-3xl mb-4">✓</div>
            <h2 className="text-lg font-bold text-color-success mb-2">Request Submitted</h2>
            <p className="text-text-secondary text-sm">
              Your request has been submitted. You will be notified once approved.
            </p>
            <Link href="/admin/login" className="inline-block mt-6 text-color-primary hover:underline text-sm">
              Back to Admin Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-elevated px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl font-black text-color-primary tracking-tight">LegacyFX</span>
          <p className="text-text-tertiary text-xs uppercase tracking-widest mt-1 font-bold">Admin Portal</p>
        </div>

        <div className="bg-bg-secondary border border-color-border rounded-xl p-8 shadow-2xl">
          <h1 className="text-xl font-bold text-text-primary mb-1">Request Admin Access</h1>
          <p className="text-text-tertiary text-sm mb-6">Admin accounts require approval before activation.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full Name', field: 'name', type: 'text', placeholder: 'Your name', autoComplete: 'name' },
              { label: 'Email', field: 'email', type: 'email', placeholder: 'admin@example.com', autoComplete: 'email' },
              { label: 'Password', field: 'password', type: 'password', placeholder: '••••••••', autoComplete: 'new-password' },
              { label: 'Confirm Password', field: 'confirm', type: 'password', placeholder: '••••••••', autoComplete: 'new-password' },
              { label: 'Admin Code', field: 'adminCode', type: 'password', placeholder: 'Secret access code', autoComplete: 'one-time-code' },
            ].map(({ label, field, type, placeholder, autoComplete }) => (
              <div key={field}>
                <label className="block text-text-secondary text-xs font-bold uppercase tracking-wider mb-1.5">
                  {label}
                </label>
                <input
                  type={type}
                  value={(form as any)[field]}
                  onChange={set(field)}
                  autoComplete={autoComplete}
                  className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-4 py-3 focus:outline-none focus:border-color-primary transition"
                  placeholder={placeholder}
                  required
                />
              </div>
            ))}

            {error && (
              <div className="bg-color-danger/10 border border-color-danger/30 text-color-danger text-sm rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-color-primary text-bg-primary font-bold py-3 rounded-lg hover:bg-color-primary-hover transition disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/admin/login" className="text-text-tertiary hover:text-text-secondary text-xs transition">
              Back to Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
