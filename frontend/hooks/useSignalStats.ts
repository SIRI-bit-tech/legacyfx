import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface SignalStatsData {
  total_active: number;
  overall_accuracy: number;
  buy_count: number;
  buy_accuracy: number;
  sell_count: number;
  sell_accuracy: number;
  last_updated?: string;
}

export const useSignalStats = () => {
  const [stats, setStats] = useState<SignalStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const data: SignalStatsData = await api.get('/signals/stats');
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Refresh stats every 5 minutes if page is open
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, loading, error, refresh: fetchStats };
};
