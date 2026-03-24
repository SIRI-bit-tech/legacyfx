// Admin orders page — global view of all user market and limit orders
'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminTable, TableColumn } from '@/components/admin/AdminTable';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminFilters, FilterField } from '@/components/admin/AdminFilters';
import { adminApi } from '@/lib/adminApi';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ symbol: '', status: '', side: '' });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      // Backend: GET /api/v1/admin/orders (if exists) or fallback
      const res = await adminApi.get<any[]>('/admin/orders').catch(() => []);
      setOrders(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to manually cancel this order?')) return;
    try {
      await adminApi.patch(`/admin/orders/${id}/cancel`);
      await fetchOrders();
    } catch (err) {
      alert('Failed to cancel order');
    }
  };

  const filterFields: FilterField[] = [
    { key: 'symbol', type: 'search', placeholder: 'Symbol (e.g. BTCUSDT)' },
    {
      key: 'side',
      type: 'select',
      placeholder: 'All Sides',
      options: [
        { label: 'Buy', value: 'BUY' },
        { label: 'Sell', value: 'SELL' },
      ],
    },
    {
      key: 'status',
      type: 'select',
      placeholder: 'All Statuses',
      options: [
        { label: 'Open', value: 'OPEN' },
        { label: 'Filled', value: 'FILLED' },
        { label: 'Cancelled', value: 'CANCELLED' },
      ],
    },
  ];

  const columns: TableColumn<any>[] = [
    { key: 'user', header: 'User', render: (o) => <span className="font-bold text-text-primary text-xs truncate max-w-[120px] inline-block">{o.user_email || 'User'}</span> },
    { key: 'symbol', header: 'Symbol', render: (o) => <span className="text-xs font-black text-text-primary">{o.symbol}</span> },
    { key: 'side', header: 'Side', render: (o) => <AdminBadge status={o.side} variant={o.side === 'BUY' ? 'success' : 'danger'} /> },
    { key: 'type', header: 'Type', render: (o) => <span className="text-text-tertiary text-[10px] font-bold uppercase">{o.type}</span> },
    { key: 'amount', header: 'Amount', render: (o) => <span className="font-mono text-xs text-text-secondary">{o.amount}</span> },
    { key: 'price', header: 'Price', render: (o) => <span className="font-mono text-xs text-text-secondary">{o.price || 'Market'}</span> },
    { key: 'status', header: 'Status', render: (o) => <AdminBadge status={o.status} /> },
    {
      key: 'actions',
      header: '',
      render: (o) => o.status === 'OPEN' && (
        <button
          onClick={() => handleCancel(o.id)}
          className="text-color-danger hover:underline font-bold text-xs"
        >
          Cancel
        </button>
      ),
      className: 'text-right'
    }
  ];

  return (
    <AdminAuthGuard>
      <AdminLayout title="Orders">
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
            data={orders}
            loading={loading}
            emptyMessage="No orders found."
          />
        </div>
      </AdminLayout>
    </AdminAuthGuard>
  );
}
