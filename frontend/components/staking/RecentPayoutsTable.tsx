"use client";

import { COLORS } from "@/constants";

interface RecentPayout {
  id: string;
  amount: number;
  earned_on_date: string;
  paid_on_date: string | null;
  status: string;
  reward_type: string;
}

interface RecentPayoutsTableProps {
  payouts: RecentPayout[];
  loading?: boolean;
}

export const RecentPayoutsTable: React.FC<RecentPayoutsTableProps> = ({
  payouts,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="h-10 bg-gray-800 rounded animate-pulse" />
          ))}
      </div>
    );
  }

  if (!payouts || payouts.length === 0) {
    return (
      <div className="text-center py-6">
        <p style={{ color: COLORS.textSecondary }}>No recent payouts</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID":
        return COLORS.success;
      case "ACCRUED":
        return COLORS.warning;
      case "CLAIMED":
        return COLORS.primary;
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID":
        return "rgba(14, 203, 129, 0.1)";
      case "ACCRUED":
        return "rgba(243, 123, 36, 0.1)";
      case "CLAIMED":
        return "rgba(252, 213, 53, 0.1)";
      default:
        return COLORS.border;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottomColor: COLORS.border, borderBottomWidth: 1 }}>
            <th
              className="text-left py-2 px-3 font-semibold"
              style={{ color: COLORS.textSecondary }}
            >
              Type
            </th>
            <th
              className="text-right py-2 px-3 font-semibold"
              style={{ color: COLORS.textSecondary }}
            >
              Amount
            </th>
            <th
              className="text-center py-2 px-3 font-semibold"
              style={{ color: COLORS.textSecondary }}
            >
              Status
            </th>
            <th
              className="text-right py-2 px-3 font-semibold"
              style={{ color: COLORS.textSecondary }}
            >
              Date
            </th>
          </tr>
        </thead>
        <tbody>
          {payouts.slice(0, 5).map((payout) => {
            const earnedDate = new Date(payout.earned_on_date);
            const dateStr = earnedDate.toLocaleDateString();

            return (
              <tr
                key={payout.id}
                style={{
                  borderBottomColor: COLORS.border,
                  borderBottomWidth: 1,
                }}
              >
                <td className="py-2 px-3" style={{ color: COLORS.textPrimary }}>
                  <div className="font-medium">{payout.reward_type}</div>
                  <div className="text-xs" style={{ color: COLORS.textSecondary }}>
                    {payout.reward_type.replace(/_/g, " ").toLowerCase()}
                  </div>
                </td>
                <td className="py-2 px-3 text-right" style={{ color: COLORS.success }}>
                  +{payout.amount.toLocaleString()} USDT
                </td>
                <td className="py-2 px-3 text-center">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: getStatusBgColor(payout.status),
                      color: getStatusColor(payout.status),
                    }}
                  >
                    {payout.status}
                  </span>
                </td>
                <td className="py-2 px-3 text-right" style={{ color: COLORS.textSecondary }}>
                  {dateStr}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
