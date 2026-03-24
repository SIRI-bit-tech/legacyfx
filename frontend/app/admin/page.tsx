// Admin overview page — dashboard stats and recent activity tables
'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminCard } from '@/components/admin/AdminCard';
import { AdminTable, TableColumn } from '@/components/admin/AdminTable';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { useAdminStats } from '@/hooks/admin/useAdminStats';
import Link from 'next/link';

export default function AdminOverviewPage() {
  const { stats, recentUsers, pendingWithdrawals, loading } = useAdminStats();

  const userColumns: TableColumn<any>[] = [
    { key: 'email', header: 'User', render: (u) => <span className="font-medium text-text-primary">{u.email}</span> },
    { key: 'tier', header: 'Tier', render: (u) => <AdminBadge status={u.tier} /> },
    { key: 'status', header: 'Status', render: (u) => <AdminBadge status={u.status} /> },
    { key: 'actions', header: '', render: (u) => (
      <Link href={`/admin/users?id=${u.id}`} className="text-color-primary hover:underline font-bold text-xs">View</Link>
    ), className: 'text-right' }
  ];

  const withdrawalColumns: TableColumn<any>[] = [
    { key: 'user', header: 'User', render: (w) => <span className="text-text-secondary">{w.user_email}</span> },
    { key: 'amount', header: 'Amount', render: (w) => <span className="font-mono text-text-primary">{w.amount} {w.asset}</span> },
    { key: 'status', header: 'Status', render: (w) => <AdminBadge status={w.status} /> },
    { key: 'actions', header: '', render: (w) => (
      <Link href="/admin/withdrawals" className="text-color-primary hover:underline font-bold text-xs">Manage</Link>
    ), className: 'text-right' }
  ];

  return (
    <AdminAuthGuard>
      <AdminLayout title="Overview">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <AdminCard
            label="Total Users"
            value={stats?.total_users ?? '0'}
            loading={loading}
            icon="👤"
          />
          <AdminCard
            label="Total Deposited"
            value={`$${(stats?.total_deposited ?? 0).toLocaleString()}`}
            loading={loading}
            icon="💰"
          />
          <AdminCard
            label="Pending Withdrawals"
            value={stats?.pending_withdrawals ?? '0'}
            loading={loading}
            icon="⏳"
          />
          <AdminCard
            label="System Status"
            value={stats?.system_status ?? 'ONLINE'}
            loading={loading}
            icon="⚙️"
          />
        </div>

        {/* Recent Data Tables */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">Recent Users</h3>
              <Link href="/admin/users" className="text-xs text-text-tertiary hover:text-color-primary transition font-bold">View all →</Link>
            </div>
            <AdminTable
              columns={userColumns}
              data={recentUsers}
              loading={loading}
              emptyMessage="No recent users."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">Pending Withdrawals</h3>
              <Link href="/admin/withdrawals" className="text-xs text-text-tertiary hover:text-color-primary transition font-bold">View all →</Link>
            </div>
            <AdminTable
              columns={withdrawalColumns}
              data={pendingWithdrawals}
              loading={loading}
              emptyMessage="No pending withdrawals."
            />
          </div>
        </div>
      </AdminLayout>
    </AdminAuthGuard>
  );
}
