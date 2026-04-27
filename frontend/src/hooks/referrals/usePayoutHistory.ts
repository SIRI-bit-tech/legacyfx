// Hook for fetching payout history
import { useState, useEffect } from 'react';
import { referralsApi } from '@/services/referrals/api';
import { useAbly } from '@/hooks/useAbly';

export const usePayoutHistory = (userId: string, page: number = 1, limit: number = 20) => {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const data = await referralsApi.getPayouts({ page, limit });
      setPayouts(data.payouts);
      setTotal(data.total);
      setTotalPages(data.total_pages);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [page, limit]);

  // Refetch on payout completed
  useAbly(`referrals:${userId}`, (message: any) => {
    if (message.name === 'payout_completed') {
      fetchPayouts();
    }
  });

  return { payouts, total, totalPages, loading, error, refetch: fetchPayouts };
};
