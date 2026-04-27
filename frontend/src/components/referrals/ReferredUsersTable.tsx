"use client";

import { COLORS } from "@/constants";
import { Pagination } from "../shared/Pagination";
import { EmptyState } from "../shared/EmptyState";

interface ReferredUser {
  id: string;
  email: string;
  username: string | null;
  status: string;
  total_commission_earned: number;
  joined_at: string;
  first_deposit_at: string | null;
}

interface ReferredUsersTableProps {
  users: ReferredUser[];
  loading?: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const ReferredUsersTable: React.FC<ReferredUsersTableProps> = ({
  users,
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

  if (!users || users.length === 0) {
    return <EmptyState message="No referred users yet" icon="pi-users" />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return COLORS.success;
      case "PENDING":
        return COLORS.warning;
      case "INACTIVE":
        return COLORS.textTertiary;
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
                User
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
                Commission Earned
              </th>
              <th
                className="text-right py-3 px-4 text-sm font-semibold"
                style={{ color: COLORS.textSecondary }}
              >
                Joined
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                style={{
                  borderBottomColor: COLORS.border,
                  borderBottomWidth: 1,
                }}
              >
                <td className="py-3 px-4" style={{ color: COLORS.textPrimary }}>
                  <div className="font-semibold">
                    {user.username || user.email}
                  </div>
                  {user.first_deposit_at && (
                    <div
                      className="text-xs"
                      style={{ color: COLORS.textSecondary }}
                    >
                      First deposit:{" "}
                      {new Date(user.first_deposit_at).toLocaleDateString()}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className="px-2 py-1 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: `${getStatusColor(user.status)}20`,
                      color: getStatusColor(user.status),
                    }}
                  >
                    {user.status}
                  </span>
                </td>
                <td
                  className="py-3 px-4 text-right font-semibold"
                  style={{ color: COLORS.success }}
                >
                  ${user.total_commission_earned.toLocaleString()}
                </td>
                <td
                  className="py-3 px-4 text-right"
                  style={{ color: COLORS.textSecondary }}
                >
                  {new Date(user.joined_at).toLocaleDateString()}
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
