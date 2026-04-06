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
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

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
          kyc_status: response.status || 'PENDING',
          account_balance: response.account_balance || 0,
          created_at: response.created_at || new Date().toISOString(),
        };

        setUser(userData);
        setIsAuthenticated(true);
      } catch (err: any) {
        console.error('Auth check error:', err);
        console.log('Session response status:', err.response?.status);
        console.log('Session response data:', err.response?.data);
        (api as any).setToken(null);
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
      console.error('Logout error:', err);
    } finally {
      (api as any).setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      window.location.href = '/login';
    }
  };

  return { user, loading, isAuthenticated, logout };
}

