"use client";

import { COLORS } from "@/constants";
import { EmptyState } from "../shared/EmptyState";

interface LeaderboardEntry {
  rank: number;
  username: string;
  total_earnings: number;
  referral_count: number;
  tier: string;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  loading?: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  entries,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="h-20 rounded animate-pulse"
              style={{ backgroundColor: COLORS.bgTertiary }}
            />
          ))}
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return <EmptyState message="No leaderboard data available" icon="pi-trophy" />;
  }

  const topThree = entries.slice(0, 3);
  const rest = entries.slice(3);

  const getPodiumColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "#FFD700";
      case 2:
        return "#C0C0C0";
      case 3:
        return "#CD7F32";
      default:
        return COLORS.textSecondary;
    }
  };

  return (
    <div>
      {/* Podium - Top 3 */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {topThree.map((entry) => (
            <div
              key={entry.rank}
              className="border rounded-xl p-6 text-center"
              style={{
                backgroundColor: COLORS.bgSecondary,
                borderColor: getPodiumColor(entry.rank),
                borderWidth: 2,
              }}
            >
              <div
                className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-black"
                style={{
                  backgroundColor: `${getPodiumColor(entry.rank)}20`,
                  color: getPodiumColor(entry.rank),
                }}
              >
                {entry.rank}
              </div>
              <p
                className="font-bold text-lg mb-1"
                style={{ color: COLORS.textPrimary }}
              >
                {entry.username}
              </p>
              <p
                className="text-sm mb-2"
                style={{ color: COLORS.textSecondary }}
              >
                {entry.tier}
              </p>
              <p
                className="text-2xl font-black"
                style={{ color: COLORS.success }}
              >
                ${entry.total_earnings.toLocaleString()}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: COLORS.textSecondary }}
              >
                {entry.referral_count} referrals
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Rest of Leaderboard */}
      {rest.length > 0 && (
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
                  Rank
                </th>
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
                  Tier
                </th>
                <th
                  className="text-right py-3 px-4 text-sm font-semibold"
                  style={{ color: COLORS.textSecondary }}
                >
                  Referrals
                </th>
                <th
                  className="text-right py-3 px-4 text-sm font-semibold"
                  style={{ color: COLORS.textSecondary }}
                >
                  Total Earnings
                </th>
              </tr>
            </thead>
            <tbody>
              {rest.map((entry) => (
                <tr
                  key={entry.rank}
                  style={{
                    borderBottomColor: COLORS.border,
                    borderBottomWidth: 1,
                  }}
                >
                  <td
                    className="py-3 px-4 font-bold"
                    style={{ color: COLORS.textPrimary }}
                  >
                    #{entry.rank}
                  </td>
                  <td
                    className="py-3 px-4 font-semibold"
                    style={{ color: COLORS.textPrimary }}
                  >
                    {entry.username}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className="px-2 py-1 rounded text-xs font-semibold"
                      style={{
                        backgroundColor: `${COLORS.primary}20`,
                        color: COLORS.primary,
                      }}
                    >
                      {entry.tier}
                    </span>
                  </td>
                  <td
                    className="py-3 px-4 text-right"
                    style={{ color: COLORS.textSecondary }}
                  >
                    {entry.referral_count}
                  </td>
                  <td
                    className="py-3 px-4 text-right font-bold"
                    style={{ color: COLORS.success }}
                  >
                    ${entry.total_earnings.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
