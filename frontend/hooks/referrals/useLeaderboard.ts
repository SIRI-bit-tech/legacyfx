// Hook for fetching leaderboard data
import { useState, useEffect } from 'react';
import { referralsApi } from '@/services/referrals/api';

export const useLeaderboard = () => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await referralsApi.getLeaderboard();
      setLeaders(data.leaders);
      setCurrentUserRank(data.current_user_rank);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return { leaders, currentUserRank, loading, error, refetch: fetchLeaderboard };
};
