// Hook for fetching admin dashboard statistics and recent data
'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminStatsApi, adminUsersApi, adminWithdrawalsApi } from '@/lib/adminApi';

export function useAdminStats() {
  const [stats, setStats] = useState<any>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, usersRes, withRes] = await Promise.all([
        adminStatsApi.getStats(),
        adminUsersApi.list(),
        // adminWithdrawalsApi.list().catch(() => []) // Fallback if missing
        Promise.resolve([]) // Temporary fallback for missing endpoint
      ]);

      setStats(statsRes);
      setRecentUsers(usersRes.slice(0, 5));
      setPendingWithdrawals(Array.isArray(withRes) ? withRes.slice(0, 5) : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch admin stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { stats, recentUsers, pendingWithdrawals, loading, error, refresh: fetchAll };
}
