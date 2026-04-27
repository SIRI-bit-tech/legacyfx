"use client";

import { PoolCard } from "./PoolCard";

interface PoolsGridProps {
  pools: Array<{
    id: string;
    asset_symbol: string;
    staking_type: string;
    annual_percentage_yield: number;
    min_stake_amount: number;
    lock_period_days: number | null;
    payout_frequency: string;
    current_total_staked: number;
    pool_capacity_amount: number | null;
    available_capacity_pct: number | null;
    total_users_staking: number | null;
    is_active: boolean;
  }>;
  loading?: boolean;
  onStakePool?: (poolId: string) => void;
}

export const PoolsGrid: React.FC<PoolsGridProps> = ({
  pools,
  loading = false,
  onStakePool,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="h-64 bg-gray-800 rounded-lg animate-pulse"
            />
          ))}
      </div>
    );
  }

  if (!pools || pools.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No staking pools available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {pools.map((pool) => (
        <PoolCard
          key={pool.id}
          id={pool.id}
          assetSymbol={pool.asset_symbol}
          stakingType={pool.staking_type}
          apy={pool.annual_percentage_yield}
          minStake={pool.min_stake_amount}
          lockDays={pool.lock_period_days}
          payoutFrequency={pool.payout_frequency}
          totalStaked={pool.current_total_staked}
          capacity={pool.pool_capacity_amount}
          capacityPct={pool.available_capacity_pct}
          usersCount={pool.total_users_staking}
          isActive={pool.is_active}
          onStake={() => onStakePool?.(pool.id)}
        />
      ))}
    </div>
  );
};
