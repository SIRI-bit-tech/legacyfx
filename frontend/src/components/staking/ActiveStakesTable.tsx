"use client";

import { COLORS } from "@/constants";

interface ActiveStake {
  id: string;
  asset_symbol: string;
  amount_staked: number;
  total_earned_amount: number;
  earned_so_far: number | null;
  next_payout_date: string | null;
  annual_earning_rate: number | null;
  is_locked: boolean | null;
  started_at: string;
}

interface ActiveStakesTableProps {
  stakes: ActiveStake[];
  loading?: boolean;
  onUnstake?: (stakeId: string) => void;
}

export const ActiveStakesTable: React.FC<ActiveStakesTableProps> = ({
  stakes,
  loading = false,
  onUnstake,
}) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />
          ))}
      </div>
    );
  }

  if (!stakes || stakes.length === 0) {
    return (
      <div className="text-center py-8">
        <p style={{ color: COLORS.textSecondary }}>No active stakes</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottomColor: COLORS.border, borderBottomWidth: 1 }}>
            <th
              className="text-left py-3 px-4 text-sm font-semibold"
              style={{ color: COLORS.textSecondary }}
            >
              Asset
            </th>
            <th
              className="text-right py-3 px-4 text-sm font-semibold"
              style={{ color: COLORS.textSecondary }}
            >
              Staked Amount
            </th>
            <th
              className="text-right py-3 px-4 text-sm font-semibold"
              style={{ color: COLORS.textSecondary }}
            >
              Earned
            </th>
            <th
              className="text-right py-3 px-4 text-sm font-semibold"
              style={{ color: COLORS.textSecondary }}
            >
              Annual Rate
            </th>
            <th
              className="text-center py-3 px-4 text-sm font-semibold"
              style={{ color: COLORS.textSecondary }}
            >
              Status
            </th>
            <th
              className="text-center py-3 px-4 text-sm font-semibold"
              style={{ color: COLORS.textSecondary }}
            >
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {stakes.map((stake) => {
            const startDate = new Date(stake.started_at);

            return (
              <tr
                key={stake.id}
                style={{
                  borderBottomColor: COLORS.border,
                  borderBottomWidth: 1,
                }}
              >
                <td
                  className="py-3 px-4"
                  style={{ color: COLORS.textPrimary }}
                >
                  <div className="font-semibold">{stake.asset_symbol}</div>
                  <div className="text-xs" style={{ color: COLORS.textSecondary }}>
                    Since {startDate.toLocaleDateString()}
                  </div>
                </td>
                <td className="py-3 px-4 text-right" style={{ color: COLORS.textPrimary }}>
                  {stake.amount_staked.toLocaleString()} {stake.asset_symbol}
                </td>
                <td
                  className="py-3 px-4 text-right"
                  style={{ color: COLORS.success }}
                >
                  {(stake.earned_so_far ?? stake.total_earned_amount).toLocaleString()} {stake.asset_symbol}
                </td>
                <td className="py-3 px-4 text-right" style={{ color: COLORS.textPrimary }}>
                  {stake.annual_earning_rate
                    ? `${stake.annual_earning_rate.toLocaleString()} ${stake.asset_symbol}/yr`
                    : "-"}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className="px-2 py-1 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: stake.is_locked
                        ? "rgba(243, 123, 36, 0.1)"
                        : "rgba(14, 203, 129, 0.1)",
                      color: stake.is_locked ? COLORS.warning : COLORS.success,
                    }}
                  >
                    {stake.is_locked ? "Locked" : "Active"}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => onUnstake?.(stake.id)}
                    disabled={stake.is_locked ?? false}
                    className="text-xs px-3 py-1 rounded transition-all"
                    style={{
                      backgroundColor: stake.is_locked
                        ? COLORS.bgSecondary
                        : "rgba(246, 70, 93, 0.1)",
                      color: stake.is_locked ? COLORS.textSecondary : COLORS.danger,
                      cursor: stake.is_locked ? "not-allowed" : "pointer",
                    }}
                  >
                    Unstake
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
