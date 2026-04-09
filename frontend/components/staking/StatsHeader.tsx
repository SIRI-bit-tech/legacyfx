"use client";

import { COLORS } from "@/constants";

interface StatItem {
  label: string;
  value: string | number;
  suffix?: string;
  color?: string;
  loading?: boolean;
}

interface StatsHeaderProps {
  totalStaked: number;
  totalEarned: number;
  averageApy: number;
  activeStakesCount: number;
  nextPayoutDate: string | null;
  annualProjectedEarnings: number;
  loading?: boolean;
}

export const StatsHeader: React.FC<StatsHeaderProps> = ({
  totalStaked,
  totalEarned,
  averageApy,
  activeStakesCount,
  nextPayoutDate,
  annualProjectedEarnings,
  loading = false,
}) => {
  const nextPayout = nextPayoutDate
    ? new Date(nextPayoutDate).toLocaleDateString()
    : "No upcoming payouts";

  const stats: StatItem[] = [
    {
      label: "Total Staked",
      value: loading ? "..." : totalStaked.toLocaleString(),
      suffix: "USDT",
      color: COLORS.primary,
    },
    {
      label: "Total Earned",
      value: loading ? "..." : totalEarned.toLocaleString(),
      suffix: "USDT",
      color: COLORS.success,
    },
    {
      label: "Avg APY",
      value: loading ? "..." : averageApy.toFixed(2),
      suffix: "%",
      color: COLORS.warning,
    },
    {
      label: "Active Stakes",
      value: loading ? "..." : activeStakesCount,
      color: COLORS.info,
    },
  ];

  return (
    <div>
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg p-4"
            style={{
              backgroundColor: COLORS.bgTertiary,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <p className="text-sm mb-1" style={{ color: COLORS.textSecondary }}>
              {stat.label}
            </p>
            <div className="flex items-baseline gap-1">
              <p
                className="text-2xl font-bold"
                style={{ color: stat.color || COLORS.primary }}
              >
                {stat.value}
              </p>
              {stat.suffix && (
                <p
                  className="text-sm"
                  style={{ color: COLORS.textSecondary }}
                >
                  {stat.suffix}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Row: Projections and Next Payout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="rounded-lg p-4"
          style={{
            backgroundColor: COLORS.bgTertiary,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <p className="text-sm mb-1" style={{ color: COLORS.textSecondary }}>
            Annual Projected Earnings
          </p>
          <p
            className="text-2xl font-bold"
            style={{ color: COLORS.success }}
          >
            {loading ? "..." : annualProjectedEarnings.toLocaleString()}
          </p>
          <p className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>
            USDT/year
          </p>
        </div>

        <div
          className="rounded-lg p-4"
          style={{
            backgroundColor: COLORS.bgTertiary,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <p className="text-sm mb-1" style={{ color: COLORS.textSecondary }}>
            Next Payout
          </p>
          <p className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>
            {loading ? "..." : nextPayout}
          </p>
        </div>
      </div>
    </div>
  );
};
