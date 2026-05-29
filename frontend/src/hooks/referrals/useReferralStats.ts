// Hook for fetching and managing referral stats with real-time updates
import { useState, useEffect } from 'react';
import { referralsApi } from '@/services/referrals/api';
import { useAbly } from '@/hooks/useAbly';

export const useReferralStats = (userId: string) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await referralsApi.getStats();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Subscribe to Ably for real-time updates
  useAbly(`referrals:${userId}`, (message: any) => {
    if (message.name === 'new_signup' || message.name === 'activation' || 
        message.name === 'commission_earned' || message.name === 'payout_completed' ||
        message.name === 'tier_upgraded') {
      fetchStats();
    }
  });

  return { stats, loading, error, refetch: fetchStats };
};
