// Trade history component showing executed trades
'use client';

import { useState, useEffect, useRef } from 'react';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { toDisplay } from '@/utils/symbolFormat';

interface Trade {
  id: string;
  symbol: string;
  side: string;
  price: number;
  quantity: number;
  total: number;
  fee: number;
  created_at: string;
}

export function TradeHistory() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const hasFetchedOnce = useRef(false);

  useEffect(() => {
    if (!hasFetchedOnce.current) {
      hasFetchedOnce.current = true;
      fetchTradeHistory();
    }
  }, [page]);

  const fetchTradeHistory = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      
      if (!token) {
        console.error('No access token found');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/trading/trades/history?${params}`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch trade history');

      const data = await response.json();
      setTrades(data.trades || []);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('Error fetching trade history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <TableSkeleton rows={10} cols={7} />;
  }

  if (trades.length === 0) {
    return <EmptyState message="No trade history found" icon="pi-chart-line" />;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-bg-tertiary/50 border-b border-color-border">
            <tr>
              <th className="text-left py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
                Pair
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
              <th className="text-right py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
                Total
              </th>
              <th className="text-right py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
                Fee
              </th>
              <th className="text-left py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-color-border/30">
            {trades.map((trade) => (
              <tr key={trade.id} className="hover:bg-bg-tertiary/30 transition-colors">
                <td className="py-3 px-4 font-bold text-text-primary">
                  {toDisplay(trade.symbol)}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`font-bold ${
                      trade.side === 'BUY' ? 'text-color-success' : 'text-color-danger'
                    }`}
                  >
                    {trade.side}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono text-text-primary">
                  ${trade.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-right font-mono text-text-secondary">
                  {trade.quantity.toFixed(4)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-text-primary font-bold">
                  ${trade.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-right font-mono text-text-tertiary">
                  ${trade.fee.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-text-tertiary text-[10px]">
                  {new Date(trade.created_at).toLocaleString()}
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
