import { useEffect, useState } from "react";
import api from "@/lib/api";

interface StakingStatsResponse {
  total_staked_usd: number;
  total_earned_usd: number;
  avg_apy: number;
  claimable_now: number;
  active_stakes_count: number;
  next_payout_date: string | null;
  annual_projected_earnings: number;
  earned_today: number;
  earned_this_month: number;
}

interface UseStakingStatsReturn {
  stats: StakingStatsResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useStakingStats = (): UseStakingStatsReturn => {
  const [stats, setStats] = useState<StakingStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get<StakingStatsResponse>(
        "/api/v1/staking/stats"
      );
      setStats(response || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch staking statistics";
      setError(message);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};
