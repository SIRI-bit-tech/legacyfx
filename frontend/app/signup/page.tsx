'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await api.post(API_ENDPOINTS.AUTH.REGISTER, {
        email: formData.email,
        password: formData.password,
        username: formData.username,
        first_name: formData.firstName,
        last_name: formData.lastName,
      });
      
      setSuccess(true);
      setTimeout(() => {
        window.location.href = `/verify-email?email=${encodeURIComponent(formData.email)}`;
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="bg-bg-secondary border border-color-success rounded-lg p-8 text-center max-w-md">
          <h2 className="text-color-success text-2xl font-bold mb-2">Success!</h2>
          <p className="text-text-secondary mb-4">Check your email to verify your account</p>
          <p className="text-text-tertiary text-sm">Redirecting to verification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-bg-secondary border border-color-border rounded-lg p-8">
          <h1 className="font-display text-3xl font-bold text-text-primary mb-2">Create Account</h1>
          <p className="text-text-secondary mb-8">Join Legacy FX today</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-bg-tertiary border border-color-border-light rounded text-text-primary focus:border-color-primary focus:outline-none"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-bg-tertiary border border-color-border-light rounded text-text-primary focus:border-color-primary focus:outline-none"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-bg-tertiary border border-color-border-light rounded text-text-primary focus:border-color-primary focus:outline-none"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-bg-tertiary border border-color-border-light rounded text-text-primary focus:border-color-primary focus:outline-none"
                placeholder="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-bg-tertiary border border-color-border-light rounded text-text-primary focus:border-color-primary focus:outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
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
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 border-t border-color-border pt-6">
            <p className="text-text-secondary text-center text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-color-primary hover:text-color-primary-hover font-semibold">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
