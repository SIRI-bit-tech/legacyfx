// Admin auth hook — manages admin_token separately from user session
'use client';

import { useState, useCallback } from 'react';
import { adminAuthApi, setAdminToken, clearAdminToken, getAdminToken } from '@/lib/adminApi';

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  status: string;
};

export function useAdminAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminAuthApi.login(email, password);
      const token = res?.access_token;
      const admin = res?.admin;

      if (!token) throw new Error('No token returned');
      if (!admin) throw new Error('Admin access required.');

      setAdminToken(token);
      return true;
    } catch (err: any) {
      setError(err?.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAdminToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login';
    }
  }, []);

  const isAuthenticated = useCallback((): boolean => {
    return !!getAdminToken();
  }, []);

  return { login, logout, isAuthenticated, loading, error };
}
