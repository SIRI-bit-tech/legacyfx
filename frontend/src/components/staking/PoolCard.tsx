"use client";

import { COLORS } from "@/constants";

interface PoolCardProps {
  id: string;
  assetSymbol: string;
  stakingType: string;
  apy: number;
  minStake: number;
  lockDays: number | null;
  payoutFrequency: string;
  totalStaked: number;
  capacity: number | null;
  capacityPct: number | null;
  usersCount: number | null;
  isActive: boolean;
  onStake?: () => void;
}

export const PoolCard: React.FC<PoolCardProps> = ({
  id,
  assetSymbol,
  stakingType,
  apy,
  minStake,
  lockDays,
  payoutFrequency,
  totalStaked,
  capacity,
  capacityPct,
  usersCount,
  isActive,
  onStake,
}) => {
  const isFlexible = stakingType === "FLEXIBLE";
  const lockLabel = isFlexible ? "Flexible" : `${lockDays}-day lock`;

  return (
    <div
      className="border rounded-lg p-6"
      style={{
        borderColor: COLORS.border,
        backgroundColor: isActive ? COLORS.bgSecondary : COLORS.bgTertiary,
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>
            {assetSymbol} Staking
          </h3>
          <p className="text-sm" style={{ color: COLORS.textSecondary }}>
            {stakingType}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color: COLORS.success }}>
            {apy.toFixed(1)}%
          </div>
          <p className="text-xs" style={{ color: COLORS.textSecondary }}>
            Annual APY
          </p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs" style={{ color: COLORS.textSecondary }}>
            Min Stake
          </p>
          <p className="font-semibold" style={{ color: COLORS.textPrimary }}>
            {minStake.toLocaleString()} {assetSymbol}
          </p>
        </div>
        <div>
          <p className="text-xs" style={{ color: COLORS.textSecondary }}>
            {lockLabel}
          </p>
        </div>
        <div>
          <p className="text-xs" style={{ color: COLORS.textSecondary }}>
            Payout Frequency
          </p>
          <p className="font-semibold" style={{ color: COLORS.textPrimary }}>
            {payoutFrequency}
          </p>
        </div>
        {usersCount !== null && (
          <div>
            <p className="text-xs" style={{ color: COLORS.textSecondary }}>
              Users Staking
            </p>
            <p className="font-semibold" style={{ color: COLORS.textPrimary }}>
              {usersCount.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Capacity Bar */}
      {capacity && capacityPct !== null && (
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <p className="text-xs" style={{ color: COLORS.textSecondary }}>
              Pool Capacity
            </p>
            <p className="text-xs font-semibold" style={{ color: COLORS.textPrimary }}>
              {capacityPct.toFixed(1)}% used
            </p>
          </div>
          <div
            className="w-full h-2 rounded-full"
            style={{ backgroundColor: COLORS.border }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100 - capacityPct, 100)}%`,
                backgroundColor: COLORS.success,
              }}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>
            {totalStaked.toLocaleString()} / {capacity.toLocaleString()} {assetSymbol}
          </p>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={onStake}
        disabled={!isActive}
        className="w-full py-2 rounded font-semibold transition-all"
        style={{
          backgroundColor: isActive ? COLORS.primary : COLORS.bgTertiary,
          color: isActive ? COLORS.bgPrimary : COLORS.textSecondary,
          cursor: isActive ? "pointer" : "not-allowed",
        }}
      >
        {isActive ? "Stake Now" : "Pool Inactive"}
      </button>
    </div>
  );
};
