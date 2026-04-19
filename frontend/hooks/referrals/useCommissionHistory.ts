// Hook for fetching commission history with pagination
import { useState, useEffect } from 'react';
import { referralsApi } from '@/services/referrals/api';
import { useAbly } from '@/hooks/useAbly';

export const useCommissionHistory = (userId: string, filters: { status?: string; page?: number; limit?: number }) => {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const data = await referralsApi.getCommissions({
        page: filters.page || 1,
        limit: filters.limit || 20,
        status: filters.status
      });
      setCommissions(data.commissions);
      setTotal(data.total);
      setTotalPages(data.total_pages);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load commissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [filters.status, filters.page, filters.limit]);

  // Refetch on new commission
  useAbly(`referrals:${userId}`, (message: any) => {
    if (message.name === 'commission_earned') {
      fetchCommissions();
    }
  });

  return { commissions, total, totalPages, loading, error, refetch: fetchCommissions };
};
