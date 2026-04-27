// Admin transactions list page — unified view of all platform financial activity
'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminTable, TableColumn } from '@/components/admin/AdminTable';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminFilters, FilterField } from '@/components/admin/AdminFilters';
import { adminApi } from '@/lib/adminApi';

export default function AdminTransactionsPage() {
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', asset: '', status: '' });

  const fetchTxs = useCallback(async () => {
    setLoading(true);
    try {
      // Backend: GET /api/v1/admin/transactions (if exists) or fallback
      const res = await adminApi.get<any[]>('/admin/transactions').catch(() => []);
      setTxs(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTxs();
  }, [fetchTxs]);

  const filterFields: FilterField[] = [
    {
      key: 'type',
      type: 'select',
      placeholder: 'All Types',
      options: [
        { label: 'Deposit', value: 'DEPOSIT' },
        { label: 'Withdrawal', value: 'WITHDRAWAL' },
        { label: 'Trade', value: 'TRADE' },
      ],
    },
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
  ];

  const columns: TableColumn<any>[] = [
    { key: 'user', header: 'User', render: (t) => <span className="font-bold text-text-primary text-xs">{t.user_email || 'User'}</span> },
    { key: 'type', header: 'Type', render: (t) => <AdminBadge status={t.type} /> },
    { key: 'amount', header: 'Amount', render: (t) => <span className={`font-mono text-xs font-black ${t.amount < 0 ? 'text-color-danger' : 'text-color-success'}`}>{t.amount} {t.asset_symbol}</span> },
    { key: 'usd', header: 'USD Value', render: (t) => <span className="text-text-tertiary text-[10px] font-mono">${(t.usd_amount || 0).toLocaleString()}</span> },
    { key: 'status', header: 'Status', render: (t) => <AdminBadge status={t.status || 'COMPLETED'} /> },
    { key: 'date', header: 'Date', render: (t) => <span className="text-text-tertiary text-xs">{new Date(t.created_at).toLocaleString()}</span> },
    {
      key: 'hash',
      header: 'Tx Hash',
      render: (t) => t.reference_id && (
        <code className="text-[10px] bg-bg-tertiary px-1 text-text-tertiary rounded truncate max-w-[80px] inline-block">
          {t.reference_id}
        </code>
      ),
      className: 'text-right'
    }
  ];

  return (
    <AdminAuthGuard>
      <AdminLayout title="Transactions">
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
            data={txs}
            loading={loading}
            emptyMessage="No transactions found."
          />
        </div>
      </AdminLayout>
    </AdminAuthGuard>
  );
}
