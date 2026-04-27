"use client";

import { COLORS } from "@/constants";
import { Pagination } from "../shared/Pagination";
import { EmptyState } from "../shared/EmptyState";

interface Commission {
  id: string;
  commission_type: string;
  amount: number;
  status: string;
  created_at: string;
  referred_user_email: string;
}

interface CommissionTableProps {
  commissions: Commission[];
  loading?: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const CommissionTable: React.FC<CommissionTableProps> = ({
  commissions,
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

  if (!commissions || commissions.length === 0) {
    return <EmptyState message="No commission history yet" icon="pi-dollar" />;
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "TRADING_FEE":
        return "Trading Fee";
      case "DEPOSIT":
        return "Deposit";
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return COLORS.success;
      case "PENDING":
        return COLORS.warning;
      case "CANCELLED":
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
                Type
              </th>
              <th
                className="text-left py-3 px-4 text-sm font-semibold"
                style={{ color: COLORS.textSecondary }}
              >
                From User
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
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {commissions.map((commission) => (
              <tr
                key={commission.id}
                style={{
                  borderBottomColor: COLORS.border,
                  borderBottomWidth: 1,
                }}
              >
                <td className="py-3 px-4" style={{ color: COLORS.textPrimary }}>
                  <span className="font-semibold">
                    {getTypeLabel(commission.commission_type)}
                  </span>
                </td>
                <td
                  className="py-3 px-4"
                  style={{ color: COLORS.textSecondary }}
                >
                  {commission.referred_user_email}
                </td>
                <td
                  className="py-3 px-4 text-right font-bold"
                  style={{ color: COLORS.success }}
                >
                  ${commission.amount.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className="px-2 py-1 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: `${getStatusColor(commission.status)}20`,
                      color: getStatusColor(commission.status),
                    }}
                  >
                    {commission.status}
                  </span>
                </td>
                <td
                  className="py-3 px-4 text-right"
                  style={{ color: COLORS.textSecondary }}
                >
                  {new Date(commission.created_at).toLocaleDateString()}
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
