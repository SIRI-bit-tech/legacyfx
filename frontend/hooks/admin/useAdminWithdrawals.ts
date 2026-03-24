// Hook for manageing withdrawals in the admin panel
'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminWithdrawalsApi } from '@/lib/adminApi';

export function useAdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ asset: '', status: '' });

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminWithdrawalsApi.list();
      setWithdrawals(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch withdrawals');
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const approve = async (id: string) => {
    try {
      await adminWithdrawalsApi.approve(id);
      await fetchWithdrawals();
      return true;
    } catch (err: any) {
      setError(err?.message || 'Failed to approve withdrawal');
      return false;
    }
  };

  const reject = async (id: string) => {
    try {
      await adminWithdrawalsApi.reject(id);
      await fetchWithdrawals();
      return true;
    } catch (err: any) {
      setError(err?.message || 'Failed to reject withdrawal');
      return false;
    }
  };

  return { withdrawals, loading, error, filters, setFilters, approve, reject, refresh: fetchWithdrawals };
}
