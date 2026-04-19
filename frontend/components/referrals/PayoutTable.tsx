"use client";

import { COLORS } from "@/constants";
import { Pagination } from "../shared/Pagination";
import { EmptyState } from "../shared/EmptyState";

interface Payout {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  transaction_hash: string | null;
}

interface PayoutTableProps {
  payouts: Payout[];
  loading?: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const PayoutTable: React.FC<PayoutTableProps> = ({
  payouts,
  loading = false,
  page,
  totalPages,
  onPageChange,
}) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="h-16 rounded animate-pulse"
              style={{ backgroundColor: COLORS.bgTertiary }}
            />
          ))}
      </div>
    );
  }

  if (!payouts || payouts.length === 0) {
    return <EmptyState message="No payout history yet" icon="pi-wallet" />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return COLORS.success;
      case "PENDING":
        return COLORS.warning;
      case "FAILED":
        return COLORS.danger;
      default:
        return COLORS.textSecondary;
    }
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr
              style={{
                borderBottomColor: COLORS.border,
                borderBottomWidth: 1,
              }}
            >
              <th
                className="text-left py-3 px-4 text-sm font-semibold"
                style={{ color: COLORS.textSecondary }}
              >
                Payout ID
              </th>
              <th
                className="text-right py-3 px-4 text-sm font-semibold"
                style={{ color: COLORS.textSecondary }}
              >
                Amount
              </th>
              <th
                className="text-center py-3 px-4 text-sm font-semibold"
                style={{ color: COLORS.textSecondary }}
              >
                Status
              </th>
              <th
                className="text-right py-3 px-4 text-sm font-semibold"
                style={{ color: COLORS.textSecondary }}
              >
                Created
              </th>
              <th
                className="text-right py-3 px-4 text-sm font-semibold"
                style={{ color: COLORS.textSecondary }}
              >
                Paid
              </th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((payout) => (
              <tr
                key={payout.id}
                style={{
                  borderBottomColor: COLORS.border,
                  borderBottomWidth: 1,
                }}
              >
                <td className="py-3 px-4" style={{ color: COLORS.textPrimary }}>
                  <div className="font-mono text-sm">
                    {payout.id.substring(0, 8)}...
                  </div>
                  {payout.transaction_hash && (
                    <div
                      className="text-xs"
                      style={{ color: COLORS.textSecondary }}
                    >
                      TX: {payout.transaction_hash.substring(0, 10)}...
                    </div>
                  )}
                </td>
                <td
                  className="py-3 px-4 text-right font-bold"
                  style={{ color: COLORS.success }}
                >
                  ${payout.amount.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className="px-2 py-1 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: `${getStatusColor(payout.status)}20`,
                      color: getStatusColor(payout.status),
                    }}
                  >
                    {payout.status}
                  </span>
                </td>
                <td
                  className="py-3 px-4 text-right"
                  style={{ color: COLORS.textSecondary }}
                >
                  {new Date(payout.created_at).toLocaleDateString()}
                </td>
                <td
                  className="py-3 px-4 text-right"
                  style={{ color: COLORS.textSecondary }}
                >
                  {payout.paid_at
                    ? new Date(payout.paid_at).toLocaleDateString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};
