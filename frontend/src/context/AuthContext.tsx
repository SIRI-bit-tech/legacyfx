'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';
import { User } from '@/global';
import { SessionGuard } from '@/components/SessionGuard';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const response: any = await api.get(API_ENDPOINTS.AUTH.SESSION);

      const userData: User = {
        id: response.user_id,
        email: response.email,
        username: response.username,
        first_name: response.first_name,
        last_name: response.last_name,
        phone: response.phone,
        date_of_birth: response.date_of_birth,
        account_type: response.account_type,
        profile_picture_url: response.profile_picture_url,
        tier: response.tier || 'BASIC',
        kyc_status: response.kyc_status || 'UNVERIFIED',
        account_balance: response.account_balance || 0,
        two_fa_enabled: response.two_fa_enabled || false,
        tax_residency: response.tax_residency,
        data_sharing_enabled: response.data_sharing_enabled || false,
        default_order_type: response.default_order_type,
        default_lot_size: response.default_lot_size,
        default_leverage: response.default_leverage,
        confirmation_dialogs: response.confirmation_dialogs,
        one_click_trading: response.one_click_trading,
        slippage_tolerance: response.slippage_tolerance,
        created_at: response.created_at || new Date().toISOString(),
      };

      setUser(userData);
      setIsAuthenticated(true);
    } catch (err: any) {
      // Only log if it's an unexpected error, not a normal 401 (unauthenticated)
      if (process.env.NODE_ENV !== 'production' && err?.response?.status !== 401 && err?.message !== 'Request failed with status code 401') {
        console.error('Auth check error:', err);
      }
      api.setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Logout error:', err);
      }
    } finally {
      api.setToken(null);
      if (typeof document !== 'undefined') {
        document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
      }
      setUser(null);
      setIsAuthenticated(false);
      globalThis.location.href = '/login';
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response: any = await api.get(API_ENDPOINTS.AUTH.SESSION);

      const userData: User = {
        id: response.user_id,
        email: response.email,
        username: response.username,
        tier: response.tier || 'BASIC',
        kyc_status: response.kyc_status || 'UNVERIFIED',
        account_balance: response.account_balance || 0,
        two_fa_enabled: response.two_fa_enabled || false,
        tax_residency: response.tax_residency,
        data_sharing_enabled: response.data_sharing_enabled || false,
        default_order_type: response.default_order_type,
        default_lot_size: response.default_lot_size,
        default_leverage: response.default_leverage,
        confirmation_dialogs: response.confirmation_dialogs,
        one_click_trading: response.one_click_trading,
        slippage_tolerance: response.slippage_tolerance,
        created_at: response.created_at || new Date().toISOString(),
      };

      setUser(userData);
      setIsAuthenticated(true);
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        api.setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    }
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated,
    logout,
    refreshUser
  }), [user, loading, isAuthenticated, logout, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SessionGuard />
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
