import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';
import { User } from '@/global';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if token exists in localStorage
        const token = globalThis.window === undefined ? null : localStorage.getItem('access_token');

        if (!token) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        // If token exists, fetch session info
        const response: any = await api.get(API_ENDPOINTS.AUTH.SESSION);

        // Map the session response to User type
        const userData: User = {
          id: response.user_id,
          email: response.email,
          username: response.username,
          tier: response.tier || 'BASIC',
          kyc_status: response.status || 'PENDING',
          account_balance: response.account_balance || 0,
          created_at: response.created_at || new Date().toISOString(),
        };

        setUser(userData);
        setIsAuthenticated(true);
      } catch (err: any) {
        // Only log safe info; don't expose sensitive server responses
        if (process.env.NODE_ENV !== 'production') {
          console.error('Auth check error:', err);
          console.log('Session response status:', err.response?.status);
        }
        api.setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = async () => {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (err) {
      // Silently handle logout errors; always clear local auth state
      if (process.env.NODE_ENV !== 'production') {
        console.error('Logout error:', err);
      }
    } finally {
      api.setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      globalThis.location.href = '/login';
    }
  };

  const refreshUser = async () => {
    try {
      const token = globalThis.window === undefined ? null : localStorage.getItem('access_token');
      if (!token) {
        // Clear stale auth state when token is missing
        api.setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      const response: any = await api.get(API_ENDPOINTS.AUTH.SESSION);

      // Map the session response to User type
      const userData: User = {
        id: response.user_id,
        email: response.email,
        username: response.username,
        tier: response.tier || 'BASIC',
        kyc_status: response.status || 'PENDING',
        account_balance: response.account_balance || 0,
        created_at: response.created_at || new Date().toISOString(),
      };

      setUser(userData);
      setIsAuthenticated(true);
    } catch (err: any) {
      // Handle auth failures (401/403 or any non-2xx response)
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        // Clear stale auth state for unauthorized responses
        api.setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }

      // Only log safe, non-sensitive messages
      if (process.env.NODE_ENV !== 'production') {
        console.log('Auth refresh failed:', err?.response?.status || 'network error');
      }
    }
  };

  return { user, loading, isAuthenticated, logout, refreshUser };
}

