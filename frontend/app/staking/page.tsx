"use client";

import { useState, useEffect } from "react";
import { COLORS } from "@/constants";
import { useStakingPools } from "@/hooks/useStakingPools";
import { useUserStakes } from "@/hooks/useUserStakes";
import { useStakingStats } from "@/hooks/useStakingStats";
import { StatsHeader } from "@/components/staking/StatsHeader";
import { PoolsGrid } from "@/components/staking/PoolsGrid";
import { RewardsSummaryCard } from "@/components/staking/RewardsSummaryCard";
import { ActiveStakesTable } from "@/components/staking/ActiveStakesTable";
import { RecentPayoutsTable } from "@/components/staking/RecentPayoutsTable";
import { StakeModal } from "@/components/staking/StakeModal";
import api from "@/lib/api";

type TabType = "overview" | "pools" | "my-stakes" | "rewards";

interface Reward {
  id: string;
  amount: number;
  earned_on_date: string;
  paid_on_date: string | null;
  status: string;
  reward_type: string;
}

export default function StakingPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [stakingTypeFilter, setStakingTypeFilter] = useState<
    "FLEXIBLE" | "FIXED_30" | "FIXED_90" | "FIXED_180" | undefined
  >(undefined);

  const [selectedPoolForStake, setSelectedPoolForStake] = useState<string | null>(null);
  const [selectedPoolDetails, setSelectedPoolDetails] = useState<any>(null);

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [rewardsLoading, setRewardsLoading] = useState(false);

  // Hooks
  const { pools, loading: poolsLoading, refetch: refetchPools } =
    useStakingPools(stakingTypeFilter);
  const { stakes, loading: stakesLoading, refetch: refetchStakes } =
    useUserStakes();
  const { stats, loading: statsLoading, refetch: refetchStats } =
    useStakingStats();

  // Fetch rewards history
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setRewardsLoading(true);
        const response = await api.get<Reward[]>("/api/v1/staking/rewards?limit=5");
        setRewards(Array.isArray(response) ? response : []);
      } catch (err) {
        console.error("Failed to fetch rewards:", err);
        setRewards([]);
      } finally {
        setRewardsLoading(false);
      }
    };

    fetchRewards();
  }, []);

  const handleStakePool = (poolId: string) => {
    const pool = pools.find((p) => p.id === poolId);
    if (pool) {
      setSelectedPoolDetails(pool);
      setSelectedPoolForStake(poolId);
    }
  };

  const handleUnstake = async (stakeId: string) => {
    try {
      const response = await api.delete(`/api/v1/staking/stakes/${stakeId}`);
      if (response.success) {
        refetchStakes();
        refetchStats();
      }
    } catch (err) {
      console.error("Failed to unstake:", err);
    }
  };

  const handleClaimRewards = async () => {
    try {
      const response = await api.post("/api/v1/staking/rewards/claim", {
        position_id: null, // Claim all
      });
      if (response.success) {
        refetchStats();
        setRewards([]);
      }
    } catch (err) {
      console.error("Failed to claim rewards:", err);
    }
  };

  const handleStakeSuccess = () => {
    refetchPools();
    refetchStakes();
    refetchStats();
  };

  const tabs: Array<{ id: TabType; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "pools", label: "Available Pools" },
    { id: "my-stakes", label: "My Stakes" },
    { id: "rewards", label: "Rewards" },
  ];


  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: COLORS.bgPrimary }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.textPrimary }}>
            Staking
          </h1>
          <p style={{ color: COLORS.textSecondary }}>
            Earn passive rewards by staking your assets
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded font-semibold transition-all whitespace-nowrap"
              style={{
                backgroundColor:
                  activeTab === tab.id ? COLORS.primary : "transparent",
                color:
                  activeTab === tab.id ? COLORS.bgSecondary : COLORS.textSecondary,
                borderBottom:
                  activeTab === tab.id
                    ? `2px solid ${COLORS.primary}`
                    : `2px solid ${COLORS.border}`,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <>
              <StatsHeader
                totalStaked={stats?.total_staked_usd ?? 0}
                totalEarned={stats?.total_earned_usd ?? 0}
                averageApy={stats?.avg_apy ?? 0}
                activeStakesCount={stats?.active_stakes_count ?? 0}
                nextPayoutDate={stats?.next_payout_date ?? null}
                annualProjectedEarnings={stats?.annual_projected_earnings ?? 0}
                loading={statsLoading}
              />

              <RewardsSummaryCard
                totalEarned={stats?.total_earned_usd ?? 0}
                claimableNow={stats?.claimable_now ?? 0}
                earnedToday={stats?.earned_today ?? 0}
                earnedThisMonth={stats?.earned_this_month ?? 0}
                onClaimRewards={handleClaimRewards}
                loading={statsLoading}
              />

              {/* Recent Payouts */}
              <div
                className="rounded-lg p-6"
                style={{
                  backgroundColor: COLORS.bgTertiary,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <h3 className="text-lg font-bold mb-4" style={{ color: COLORS.textPrimary }}>
                  Recent Payouts
                </h3>
                <RecentPayoutsTable
                  payouts={rewards}
                  loading={rewardsLoading}
                />
              </div>
            </>
          )}

          {/* Available Pools Tab */}
          {activeTab === "pools" && (
            <>
              {/* Filter Buttons */}
              <div className="flex gap-2 flex-wrap mb-6">
                <button
                  onClick={() => setStakingTypeFilter(undefined)}
                  className="px-4 py-2 rounded font-semibold transition-all"
                  style={{
                    backgroundColor:
                      stakingTypeFilter === undefined
                        ? COLORS.primary
                        : COLORS.border,
                    color:
                      stakingTypeFilter === undefined
                        ? COLORS.bgSecondary
                        : COLORS.textSecondary,
                  }}
                >
                  All Pools
                </button>
                {["FLEXIBLE", "FIXED_30", "FIXED_90", "FIXED_180"].map((type) => (
                  <button
                    key={type}
                    onClick={() =>
                      setStakingTypeFilter(
                        type as "FLEXIBLE" | "FIXED_30" | "FIXED_90" | "FIXED_180"
                      )
                    }
                    className="px-4 py-2 rounded font-semibold transition-all"
                    style={{
                      backgroundColor:
                        stakingTypeFilter === type ? COLORS.primary : COLORS.border,
                      color:
                        stakingTypeFilter === type
                          ? COLORS.bgSecondary
                          : COLORS.textSecondary,
                    }}
                  >
                    {type === "FLEXIBLE" ? "Flexible" : `${type.replace("FIXED_", "")}-Day`}
                  </button>
                ))}
              </div>

              <PoolsGrid
                pools={pools}
                loading={poolsLoading}
                onStakePool={handleStakePool}
              />
            </>
          )}

          {/* My Stakes Tab */}
          {activeTab === "my-stakes" && (
            <div
              className="rounded-lg p-6"
              style={{
                backgroundColor: COLORS.bgTertiary,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <h3 className="text-lg font-bold mb-4" style={{ color: COLORS.textPrimary }}>
                Active Positions
              </h3>
              <ActiveStakesTable
                stakes={stakes}
                loading={stakesLoading}
                onUnstake={handleUnstake}
              />
            </div>
          )}

          {/* Rewards Tab */}
          {activeTab === "rewards" && (
            <div
              className="rounded-lg p-6"
              style={{
                backgroundColor: COLORS.bgTertiary,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <h3 className="text-lg font-bold mb-4" style={{ color: COLORS.textPrimary }}>
                Reward History
              </h3>
              <RecentPayoutsTable
                payouts={rewards}
                loading={rewardsLoading}
              />
            </div>
          )}
        </div>
      </div>

      {/* Stake Modal */}
      {selectedPoolDetails && (
        <StakeModal
          isOpen={!!selectedPoolForStake}
          poolId={selectedPoolDetails.id}
          assetSymbol={selectedPoolDetails.asset_symbol}
          minStake={selectedPoolDetails.min_stake_amount}
          apy={selectedPoolDetails.annual_percentage_yield}
          capacityPct={selectedPoolDetails.available_capacity_pct}
          onClose={() => {
            setSelectedPoolForStake(null);
            setSelectedPoolDetails(null);
          }}
          onSuccess={handleStakeSuccess}
        />
      )}
    </div>
  );
}
