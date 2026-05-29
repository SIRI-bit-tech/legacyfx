// Hook for fetching referred users with pagination and filters
import { useState, useEffect } from 'react';
import { referralsApi } from '@/services/referrals/api';
import { useAbly } from '@/hooks/useAbly';

export const useReferredUsers = (userId: string, filters: { status?: string; page?: number; limit?: number }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await referralsApi.getReferredUsers({
        page: filters.page || 1,
        limit: filters.limit || 20,
        status: filters.status
      });
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.total_pages);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters.status, filters.page, filters.limit]);

  // Refetch on new referral or activation
  useAbly(`referrals:${userId}`, (message: any) => {
    if (message.name === 'new_signup' || message.name === 'activation') {
      fetchUsers();
    }
  });

  return { users, total, totalPages, loading, error, refetch: fetchUsers };
};
