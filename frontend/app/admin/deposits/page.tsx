// Admin deposits management page — filter and confirm/reject user deposits
'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminTable, TableColumn } from '@/components/admin/AdminTable';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminFilters, FilterField } from '@/components/admin/AdminFilters';
import { useAdminDeposits } from '@/hooks/admin/useAdminDeposits';

export default function AdminDepositsPage() {
  const { deposits, loading, filters, setFilters, approve, reject } = useAdminDeposits();

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
        { label: 'Pending', value: 'PENDING' },
        { label: 'Confirmed', value: 'CONFIRMED' },
        { label: 'Failed', value: 'FAILED' },
      ],
    },
  ];

  const columns: TableColumn<any>[] = [
    {
      key: 'user',
      header: 'User',
      render: (d) => (
        <div className="flex flex-col">
          <span className="font-bold text-text-primary text-xs">{d.user_email || 'User'}</span>
          <span className="text-[10px] text-text-tertiary font-mono">{d.user_id?.slice(0, 8)}...</span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (d) => (
        <div className="flex flex-col">
          <span className="font-black text-text-primary text-xs font-mono">{d.amount} {d.asset_symbol}</span>
          <span className="text-[10px] text-text-tertiary font-mono">${(d.fiat_amount || 0).toLocaleString()}</span>
        </div>
      ),
    },
    { key: 'network', header: 'Network', render: (d) => <span className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">{d.blockchain_network}</span> },
    { key: 'status', header: 'Status', render: (d) => <AdminBadge status={d.status} /> },
    { key: 'date', header: 'Date', render: (d) => <span className="text-text-tertiary text-xs">{new Date(d.created_at).toLocaleDateString()}</span> },
    {
      key: 'actions',
      header: '',
      render: (d) => (
        <div className="flex items-center justify-end gap-2">
          {d.status === 'PENDING' && (
            <>
              <button
                onClick={() => approve(d.id)}
                className="bg-color-success px-3 py-1.5 rounded-lg text-bg-primary text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition"
              >
                Approve
              </button>
              <button
                onClick={() => reject(d.id)}
                className="bg-bg-tertiary text-color-danger border border-color-danger/30 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-color-danger/10 transition"
              >
                Reject
              </button>
            </>
          )}
          {d.transaction_hash && (
            <a
              href={`https://etherscan.io/tx/${d.transaction_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-tertiary hover:text-color-primary transition"
              title="View Tx Hash"
            >
              <i className="pi pi-external-link text-xs" />
            </a>
          )}
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <AdminAuthGuard>
      <AdminLayout title="Deposits">
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
            data={deposits}
            loading={loading}
            emptyMessage="No deposits matching filters."
          />
        </div>
      </AdminLayout>
    </AdminAuthGuard>
  );
}
