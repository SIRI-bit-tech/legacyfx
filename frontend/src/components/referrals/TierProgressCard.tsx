"use client";

import { COLORS } from "@/constants";

interface TierProgressCardProps {
  currentTier: string;
  totalReferrals: number;
  activeReferrals: number;
  commissionRate: number;
  nextTier: string | null;
  nextTierThreshold: number | null;
  loading?: boolean;
}

export const TierProgressCard: React.FC<TierProgressCardProps> = ({
  currentTier,
  totalReferrals,
  activeReferrals,
  commissionRate,
  nextTier,
  nextTierThreshold,
  loading = false,
}) => {
  const tiers = [
    { name: "BRONZE", threshold: 0, rate: 10, color: "#CD7F32" },
    { name: "SILVER", threshold: 10, rate: 20, color: "#C0C0C0" },
    { name: "GOLD", threshold: 50, rate: 30, color: "#FFD700" },
    { name: "PLATINUM", threshold: 100, rate: 40, color: "#E5E4E2" },
  ];

  const currentTierIndex = tiers.findIndex((t) => t.name === currentTier);
  const progress = nextTierThreshold
    ? (activeReferrals / nextTierThreshold) * 100
    : 100;

  return (
    <div
      className="border rounded-2xl p-6"
      style={{
        backgroundColor: COLORS.bgSecondary,
        borderColor: COLORS.border,
      }}
    >
      <h3
        className="text-xl font-bold mb-6"
        style={{ color: COLORS.textPrimary }}
      >
        Tier Progress
      </h3>

      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm mb-1" style={{ color: COLORS.textSecondary }}>
            Current Tier
          </p>
          <div className="flex items-center gap-2">
            <span
              className="text-2xl font-bold"
              style={{
                color:
                  tiers.find((t) => t.name === currentTier)?.color ||
                  COLORS.primary,
              }}
            >
              {currentTier}
            </span>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: `${COLORS.success}20`,
                color: COLORS.success,
              }}
            >
              {commissionRate}% Commission
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm mb-1" style={{ color: COLORS.textSecondary }}>
            Active Referrals
          </p>
          <p
            className="text-2xl font-bold"
            style={{ color: COLORS.textPrimary }}
          >
            {loading ? "..." : activeReferrals}
          </p>
        </div>
      </div>

      {nextTier && nextTierThreshold && (
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>
              Progress to {nextTier}
            </p>
            <p className="text-sm font-bold" style={{ color: COLORS.textPrimary }}>
              {activeReferrals} / {nextTierThreshold}
            </p>
          </div>
          <div
            className="w-full h-3 rounded-full overflow-hidden"
            style={{ backgroundColor: COLORS.bgTertiary }}
          >
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: COLORS.primary,
              }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {tiers.map((tier, index) => {
          const isUnlocked = index <= currentTierIndex;
          return (
            <div
              key={tier.name}
              className="text-center p-3 rounded-lg border transition-all"
              style={{
                backgroundColor: isUnlocked
                  ? COLORS.bgTertiary
                  : COLORS.bgPrimary,
                borderColor: isUnlocked ? tier.color : COLORS.border,
                opacity: isUnlocked ? 1 : 0.5,
              }}
            >
              <div
                className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center"
                style={{
                  backgroundColor: isUnlocked ? `${tier.color}20` : COLORS.bgTertiary,
                  color: isUnlocked ? tier.color : COLORS.textTertiary,
                }}
              >
                <i className={`pi ${isUnlocked ? "pi-check" : "pi-lock"} text-xs`}></i>
              </div>
              <p
                className="text-xs font-bold mb-1"
                style={{ color: isUnlocked ? COLORS.textPrimary : COLORS.textTertiary }}
              >
                {tier.name}
              </p>
              <p
                className="text-[10px]"
                style={{ color: COLORS.textSecondary }}
              >
                {tier.rate}%
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
