// Order history component with pagination and filters
'use client';

import { useState, useEffect } from 'react';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Pagination } from '@/components/shared/Pagination';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { toDisplay } from '@/utils/symbolFormat';

interface Order {
  id: string;
  symbol: string;
  type: string;
  side: string;
  price: number;
  quantity: number;
  status: string;
  created_at: string;
}

export function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<'all' | 'filled' | 'cancelled'>('all');

  useEffect(() => {
    fetchOrderHistory();
  }, [page, filter]);

  const fetchOrderHistory = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (filter !== 'all') {
        params.append('status', filter.toUpperCase());
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      
      if (!token) {
        console.error('No access token found');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/trading/orders/history?${params}`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch order history');

      const data = await response.json();
      setOrders(data.orders || []);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('Error fetching order history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <TableSkeleton rows={10} cols={7} />;
  }

  if (orders.length === 0) {
    return <EmptyState message="No order history found" icon="pi-history" />;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Filters */}
      <div className="px-4 py-3 border-b border-color-border flex gap-2">
        {(['all', 'filled', 'cancelled'] as const).map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded uppercase tracking-wider transition ${
              filter === f
                ? 'bg-color-primary text-bg-primary'
                : 'bg-bg-tertiary text-text-tertiary hover:text-text-primary'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-bg-tertiary/50 border-b border-color-border">
            <tr>
              <th className="text-left py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
                Pair
              </th>
              <th className="text-left py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
                Type
              </th>
              <th className="text-left py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
                Side
              </th>
              <th className="text-right py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
                Price
              </th>
              <th className="text-right py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
                Amount
              </th>
              <th className="text-center py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
                Status
              </th>
              <th className="text-left py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-color-border/30">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-bg-tertiary/30 transition-colors">
                <td className="py-3 px-4 font-bold text-text-primary">
                  {toDisplay(order.symbol)}
                </td>
                <td className="py-3 px-4 text-text-secondary uppercase text-[10px] font-bold">
                  {order.type}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`font-bold ${
                      order.side === 'BUY' ? 'text-color-success' : 'text-color-danger'
                    }`}
                  >
                    {order.side}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono text-text-primary">
                  ${order.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-right font-mono text-text-secondary">
                  {order.quantity.toFixed(4)}
                </td>
                <td className="py-3 px-4 text-center">
                  <StatusBadge status={order.status} />
                </td>
                <td className="py-3 px-4 text-text-tertiary text-[10px]">
                  {new Date(order.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
