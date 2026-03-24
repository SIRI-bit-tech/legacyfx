// Hook for managing deposits in the admin panel
'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminDepositsApi } from '@/lib/adminApi';

export function useAdminDeposits() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ asset: '', status: '' });

  const fetchDeposits = useCallback(async () => {
    setLoading(true);
    try {
      // In a real app, we'd pass filters to the API
      const res = await adminDepositsApi.list();
      setDeposits(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch deposits');
      // Mock data for demo if backend is missing
      setDeposits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  const approve = async (id: string) => {
    try {
      await adminDepositsApi.approve(id);
      await fetchDeposits();
      return true;
    } catch (err: any) {
      setError(err?.message || 'Failed to approve deposit');
      return false;
    }
  };

  const reject = async (id: string) => {
    try {
      await adminDepositsApi.reject(id);
      await fetchDeposits();
      return true;
    } catch (err: any) {
      setError(err?.message || 'Failed to reject deposit');
      return false;
    }
  };

  return { deposits, loading, error, filters, setFilters, approve, reject, refresh: fetchDeposits };
}
