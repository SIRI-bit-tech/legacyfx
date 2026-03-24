// Admin users management page — search, filter, and detailed list
'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminTable, TableColumn } from '@/components/admin/AdminTable';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminFilters, FilterField } from '@/components/admin/AdminFilters';
import { UserDrawer } from '@/components/admin/UserDrawer';
import { useAdminUsers } from '@/hooks/admin/useAdminUsers';

export default function AdminUsersPage() {
  const { users, loading, filters, setFilters, updateStatus } = useAdminUsers();
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const filterFields: FilterField[] = [
    { key: 'search', type: 'search', placeholder: 'Name or email...' },
    {
      key: 'status',
      type: 'select',
      placeholder: 'All Statuses',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Unverified', value: 'unverified' },
      ],
    },
  ];

  const columns: TableColumn<any>[] = [
    {
      key: 'user',
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-[10px] font-black border border-color-border text-text-secondary">
            {u.email[0].toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-text-primary text-xs truncate max-w-[150px]">{u.email}</span>
            <span className="text-[10px] text-text-tertiary font-mono truncate max-w-[150px]">{u.id}</span>
          </div>
        </div>
      ),
    },
    { key: 'tier', header: 'Tier', render: (u) => <AdminBadge status={u.tier} /> },
    { key: 'status', header: 'Status', render: (u) => <AdminBadge status={u.status} /> },
    { key: 'joined', header: 'Joined', render: () => <span className="text-text-tertiary text-xs">Oct 24, 2023</span> },
    {
      key: 'actions',
      header: '',
      render: (u) => (
        <button
          onClick={() => setSelectedUser(u)}
          className="bg-bg-tertiary hover:bg-bg-elevated text-text-primary px-3 py-1.5 rounded-lg text-xs font-bold transition border border-color-border"
        >
          View
        </button>
      ),
      className: 'text-right',
    },
  ];

  return (
    <AdminAuthGuard>
      <AdminLayout title="Users">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <AdminFilters
            fields={filterFields}
            values={filters}
            onChange={(k, v) => setFilters((prev) => ({ ...prev, [k]: v }))}
          />
          <button className="bg-bg-secondary text-text-primary px-4 py-2 rounded-lg text-xs font-bold border border-color-border hover:bg-bg-tertiary transition flex items-center gap-2 self-start md:self-auto">
            <i className="pi pi-download text-[10px]" />
            Export CSV
          </button>
        </div>

        {/* User Table */}
        <div className="bg-bg-secondary p-1 rounded-xl shadow-sm overflow-hidden">
          <AdminTable
            columns={columns}
            data={users}
            loading={loading}
            emptyMessage="No users matching your search."
          />
        </div>

        {/* User Detail Side Drawer */}
        <UserDrawer
          user={selectedUser}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdateStatus={updateStatus}
        />
      </AdminLayout>
    </AdminAuthGuard>
  );
}
