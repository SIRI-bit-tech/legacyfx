import { useEffect, useState } from "react";
import api from "@/lib/api";

interface StakingPositionResponse {
  id: string;
  pool_id: string;
  asset_symbol: string;
  amount_staked: number;
  total_earned_amount: number;
  earned_so_far: number | null;
  next_payout_date: string | null;
  annual_earning_rate: number | null;
  status: string;
  is_active: boolean;
  is_locked: boolean | null;
  started_at: string;
  earned_until_date: string | null;
}

interface UseUserStakesReturn {
  stakes: StakingPositionResponse[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useUserStakes = (): UseUserStakesReturn => {
  const [stakes, setStakes] = useState<StakingPositionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStakes = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get<StakingPositionResponse[]>(
        "/api/v1/staking/stakes"
      );
      setStakes(Array.isArray(response) ? response : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch staking positions";
      setError(message);
      setStakes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStakes();
  }, []);

  return {
    stakes,
    loading,
    error,
    refetch: fetchStakes,
  };
};
