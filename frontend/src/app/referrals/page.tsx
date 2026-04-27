"use client";

import { DashboardLayout } from "../dashboard-layout";
import { useState } from "react";
import { COLORS } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { useReferralStats } from "@/hooks/referrals/useReferralStats";
import { useReferredUsers } from "@/hooks/referrals/useReferredUsers";
import { useCommissionHistory } from "@/hooks/referrals/useCommissionHistory";
import { usePayoutHistory } from "@/hooks/referrals/usePayoutHistory";
import { useLeaderboard } from "@/hooks/referrals/useLeaderboard";
import { useReferralNotifications } from "@/hooks/referrals/useReferralNotifications";
import { ReferralLinkCard } from "@/components/referrals/ReferralLinkCard";
import { TierProgressCard } from "@/components/referrals/TierProgressCard";
import { ReferralMetrics } from "@/components/referrals/ReferralMetrics";
import { ReferredUsersTable } from "@/components/referrals/ReferredUsersTable";
import { CommissionTable } from "@/components/referrals/CommissionTable";
import { PayoutTable } from "@/components/referrals/PayoutTable";
import { Leaderboard } from "@/components/referrals/Leaderboard";

export default function ReferralsPage() {
  const { user } = useAuth();
  const userId = user?.id || "";

  useReferralNotifications(userId);
  const [activeTab, setActiveTab] = useState<
    "users" | "commissions" | "payouts" | "leaderboard"
  >("users");
  const [usersPage, setUsersPage] = useState(1);
  const [commissionsPage, setCommissionsPage] = useState(1);
  const [payoutsPage, setPayoutsPage] = useState(1);

  const { stats, loading: statsLoading } = useReferralStats(userId);

  const {
    users,
    loading: usersLoading,
    totalPages: usersTotalPages,
  } = useReferredUsers(userId, { page: usersPage, limit: 20 });

  const {
    commissions,
    loading: commissionsLoading,
    totalPages: commissionsTotalPages,
  } = useCommissionHistory(userId, { page: commissionsPage, limit: 20 });

  const {
    payouts,
    loading: payoutsLoading,
    totalPages: payoutsTotalPages,
  } = usePayoutHistory(userId, payoutsPage, 20);

  const { leaders: leaderboardEntries, loading: leaderboardLoading } =
    useLeaderboard();

  const referralLink = stats?.referral_link || "";
  const referralCode = stats?.referral_code || "";

  const tabs = [
    { id: "users", label: "Referred Users", icon: "pi-users" },
    { id: "commissions", label: "Commission History", icon: "pi-dollar" },
    { id: "payouts", label: "Payout History", icon: "pi-wallet" },
    { id: "leaderboard", label: "Leaderboard", icon: "pi-trophy" },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-black mb-2"
            style={{ color: COLORS.textPrimary }}
          >
            Referral Program
          </h1>
          <p style={{ color: COLORS.textSecondary }}>
            Invite traders and earn lifetime commissions on their activity
          </p>
        </div>

        {/* Referral Link Card */}
        <div className="mb-6">
          <ReferralLinkCard
            referralCode={referralCode}
            referralLink={referralLink}
            loading={statsLoading}
          />
        </div>

        {/* Tier Progress Card */}
        <div className="mb-6">
          <TierProgressCard
            currentTier={stats?.current_tier || "BRONZE"}
            totalReferrals={stats?.total_referrals || 0}
            activeReferrals={stats?.active_referrals || 0}
            commissionRate={stats?.commission_rate || 10}
            nextTier={stats?.next_tier || null}
            nextTierThreshold={stats?.next_tier_threshold || null}
            loading={statsLoading}
          />
        </div>

        {/* Metrics Row */}
        <div className="mb-8">
          <ReferralMetrics
            totalReferrals={stats?.total_referrals || 0}
            activeReferrals={stats?.active_referrals || 0}
            totalEarnings={stats?.total_earnings || 0}
            pendingCommissions={stats?.pending_commissions || 0}
            loading={statsLoading}
          />
        </div>

        {/* Tabs */}
        <div
          className="border rounded-2xl overflow-hidden"
          style={{
            backgroundColor: COLORS.bgSecondary,
            borderColor: COLORS.border,
          }}
        >
          {/* Tab Headers */}
          <div
            className="flex border-b overflow-x-auto"
            style={{ borderColor: COLORS.border }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className="flex items-center gap-2 px-6 py-4 font-semibold transition-all whitespace-nowrap"
                style={{
                  color:
                    activeTab === tab.id
                      ? COLORS.primary
                      : COLORS.textSecondary,
                  borderBottom:
                    activeTab === tab.id
                      ? `2px solid ${COLORS.primary}`
                      : "2px solid transparent",
                }}
              >
                <i className={`pi ${tab.icon}`}></i>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "users" && (
              <ReferredUsersTable
                users={users}
                loading={usersLoading}
                page={usersPage}
                totalPages={usersTotalPages}
                onPageChange={setUsersPage}
              />
            )}
            {activeTab === "commissions" && (
              <CommissionTable
                commissions={commissions}
                loading={commissionsLoading}
                page={commissionsPage}
                totalPages={commissionsTotalPages}
                onPageChange={setCommissionsPage}
              />
            )}
            {activeTab === "payouts" && (
              <PayoutTable
                payouts={payouts}
                loading={payoutsLoading}
                page={payoutsPage}
                totalPages={payoutsTotalPages}
                onPageChange={setPayoutsPage}
              />
            )}
            {activeTab === "leaderboard" && (
              <Leaderboard
                entries={leaderboardEntries}
                loading={leaderboardLoading}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
