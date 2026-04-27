"use client";

import { COLORS } from "@/constants";

interface ReferralMetricsProps {
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  pendingCommissions: number;
  loading?: boolean;
}

export const ReferralMetrics: React.FC<ReferralMetricsProps> = ({
  totalReferrals,
  activeReferrals,
  totalEarnings,
  pendingCommissions,
  loading = false,
}) => {
  const metrics = [
    {
      label: "Total Referrals",
      value: loading ? "..." : totalReferrals.toString(),
      icon: "pi-user-plus",
      color: COLORS.primary,
    },
    {
      label: "Active Traders",
      value: loading ? "..." : activeReferrals.toString(),
      icon: "pi-chart-line",
      color: COLORS.success,
    },
    {
      label: "Total Earnings",
      value: loading ? "..." : `$${totalEarnings.toLocaleString()}`,
      icon: "pi-dollar",
      color: COLORS.warning,
    },
    {
      label: "Pending",
      value: loading ? "..." : `$${pendingCommissions.toLocaleString()}`,
      icon: "pi-clock",
      color: COLORS.info,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="border rounded-xl p-6 flex flex-col items-center text-center shadow-lg"
          style={{
            backgroundColor: COLORS.bgSecondary,
            borderColor: COLORS.border,
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-3"
            style={{
              backgroundColor: COLORS.bgTertiary,
              color: metric.color,
            }}
          >
            <i className={`pi ${metric.icon}`}></i>
          </div>
          <p
            className="text-[10px] font-black uppercase tracking-widest mb-1"
            style={{ color: COLORS.textTertiary }}
          >
            {metric.label}
          </p>
          <p
            className="text-3xl font-black tracking-tight"
            style={{ color: COLORS.textPrimary }}
          >
            {metric.value}
          </p>
        </div>
      ))}
    </div>
  );
};
