import { useEffect, useState } from "react";
import api from "@/lib/api";

interface StakingPoolResponse {
    id: string;
    asset_symbol: string;
    staking_type: "FLEXIBLE" | "FIXED_30" | "FIXED_90" | "FIXED_180";
    annual_percentage_yield: number;
    min_stake_amount: number;
    lock_period_days: number | null;
    payout_frequency: "DAILY" | "MONTHLY" | "END_OF_TERM";
    pool_capacity_amount: number | null;
    current_total_staked: number;
    available_capacity_pct: number | null;
    total_users_staking: number | null;
    is_active: boolean;
    created_at: string;
}

interface UseStakingPoolsReturn {
    pools: StakingPoolResponse[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export const useStakingPools = (
    filterType?: "FLEXIBLE" | "FIXED_30" | "FIXED_90" | "FIXED_180"
): UseStakingPoolsReturn => {
    const [pools, setPools] = useState<StakingPoolResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPools = async () => {
        try {
            setLoading(true);
            setError(null);

            const url = filterType
                ? `/api/v1/staking/pools?staking_type=${filterType}`
                : "/api/v1/staking/pools";

            const response = await api.get<StakingPoolResponse[]>(url);
            setPools(Array.isArray(response) ? response : []);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to fetch staking pools";
            setError(message);
            setPools([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPools();
    }, [filterType]);

    return {
        pools,
        loading,
        error,
        refetch: fetchPools,
    };
};
