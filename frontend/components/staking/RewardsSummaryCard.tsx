"use client";

import { COLORS } from "@/constants";

interface RewardsSummaryCardProps {
  totalEarned: number;
  claimableNow: number;
  earnedToday: number;
  earnedThisMonth: number;
  onClaimRewards?: () => void;
  loading?: boolean;
}

export const RewardsSummaryCard: React.FC<RewardsSummaryCardProps> = ({
  totalEarned,
  claimableNow,
  earnedToday,
  earnedThisMonth,
  onClaimRewards,
  loading = false,
}) => {
  return (
    <div
      className="rounded-lg p-6"
      style={{
        backgroundColor: COLORS.bgTertiary,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      {/* Title */}
      <h3 className="text-lg font-bold mb-6" style={{ color: COLORS.textPrimary }}>
        Rewards Summary
      </h3>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total Earned */}
        <div>
          <p className="text-xs mb-1" style={{ color: COLORS.textSecondary }}>
            Total Earned
          </p>
          <p className="text-2xl font-bold" style={{ color: COLORS.success }}>
            {loading ? "..." : totalEarned.toLocaleString()}
          </p>
          <p className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>
            USDT
          </p>
        </div>

        {/* Earned Today */}
        <div>
          <p className="text-xs mb-1" style={{ color: COLORS.textSecondary }}>
            Today
          </p>
          <p className="text-2xl font-bold" style={{ color: COLORS.primary }}>
            {loading ? "..." : earnedToday.toLocaleString()}
          </p>
          <p className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>
            USDT
          </p>
        </div>

        {/* Earned This Month */}
        <div>
          <p className="text-xs mb-1" style={{ color: COLORS.textSecondary }}>
            This Month
          </p>
          <p className="text-2xl font-bold" style={{ color: COLORS.primary }}>
            {loading ? "..." : earnedThisMonth.toLocaleString()}
          </p>
          <p className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>
            USDT
          </p>
        </div>

        {/* Claimable Now */}
        <div>
          <p className="text-xs mb-1" style={{ color: COLORS.textSecondary }}>
            Claimable Now
          </p>
          <p className="text-2xl font-bold" style={{ color: COLORS.warning }}>
            {loading ? "..." : claimableNow.toLocaleString()}
          </p>
          <p className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>
            USDT
          </p>
        </div>
      </div>

      {/* Claim Button */}
      <button
        onClick={onClaimRewards}
        disabled={claimableNow === 0 || loading}
        className="w-full py-3 rounded font-semibold transition-all"
        style={{
          backgroundColor:
            claimableNow === 0 || loading ? COLORS.bgSecondary : COLORS.success,
          color:
            claimableNow === 0 || loading ? COLORS.textSecondary : COLORS.textPrimary,
          cursor:
            claimableNow === 0 || loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Loading..." : claimableNow === 0 ? "No Rewards to Claim" : `Claim ${claimableNow.toLocaleString()} USDT`}
      </button>
    </div>
  );
};
