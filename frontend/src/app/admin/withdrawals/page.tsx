// Admin withdrawals management page — filter and approve/reject user withdrawals
'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminTable, TableColumn } from '@/components/admin/AdminTable';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminFilters, FilterField } from '@/components/admin/AdminFilters';
import { useAdminWithdrawals } from '@/hooks/admin/useAdminWithdrawals';

export default function AdminWithdrawalsPage() {
  const { withdrawals, loading, filters, setFilters, approve, reject } = useAdminWithdrawals();

  const filterFields: FilterField[] = [
    {
      key: 'asset',
      type: 'select',
      placeholder: 'All Assets',
      options: [
        { label: 'BTC', value: 'BTC' },
        { label: 'ETH', value: 'ETH' },
        { label: 'USDT', value: 'USDT' },
      ],
    },
    {
      key: 'status',
      type: 'select',
      placeholder: 'All Statuses',
      options: [
        { label: 'Awaiting Confirm', value: 'AWAITING_CONFIRMATION' },
        { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
        { label: 'Processing', value: 'PROCESSING' },
        { label: 'Completed', value: 'COMPLETED' },
        { label: 'Rejected', value: 'REJECTED' },
      ],
    },
  ];

  const columns: TableColumn<any>[] = [
    {
      key: 'user',
      header: 'User',
      render: (w) => (
        <div className="flex flex-col">
          <span className="font-bold text-text-primary text-xs">{w.user_email || 'User'}</span>
          <span className="text-[10px] text-text-tertiary font-mono">{w.user_id?.slice(0, 8)}...</span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (w) => (
        <div className="flex flex-col text-right sm:text-left">
          <span className="font-black text-text-primary text-xs font-mono">{w.amount} {w.asset_symbol}</span>
          <span className="text-[10px] text-text-tertiary font-mono">Fee: {w.fee}</span>
        </div>
      ),
    },
    {
      key: 'destination',
      header: 'Destination',
      render: (w) => (
        <div className="flex items-center gap-2">
          <code className="text-[10px] bg-bg-tertiary px-1.5 py-0.5 rounded text-text-tertiary font-mono truncate max-w-[100px]">
            {w.destination_address}
          </code>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (w) => <AdminBadge status={w.status} /> },
    { key: 'date', header: 'Requested', render: (w) => <span className="text-text-tertiary text-xs">{new Date(w.created_at).toLocaleDateString()}</span> },
    {
      key: 'actions',
      header: '',
      render: (w) => (
        <div className="flex items-center justify-end gap-2">
          {w.status === 'PENDING_APPROVAL' && (
            <>
              <button
                onClick={() => approve(w.id)}
                className="bg-color-primary text-bg-primary px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-color-primary-hover transition"
              >
                Approve
              </button>
              <button
                onClick={() => reject(w.id)}
                className="bg-bg-tertiary text-color-danger border border-color-danger/30 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-color-danger/10 transition"
              >
                Reject
              </button>
            </>
          )}
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <AdminAuthGuard>
      <AdminLayout title="Withdrawals">
        <div className="mb-6">
          <AdminFilters
            fields={filterFields}
            values={filters}
            onChange={(k, v) => setFilters((prev) => ({ ...prev, [k]: v }))}
          />
        </div>

        <div className="bg-bg-secondary p-1 rounded-xl shadow-sm">
          <AdminTable
            columns={columns}
            data={withdrawals}
            loading={loading}
            emptyMessage="No withdrawals matching filters."
          />
        </div>
      </AdminLayout>
    </AdminAuthGuard>
  );
}
