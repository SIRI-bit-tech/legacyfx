// Funds tab component displaying user balances
'use client';

import { useFunds } from '@/hooks/useFunds';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { useState } from 'react';

export function FundsTab() {
  const { balances, loading, error } = useFunds();
  const [showAll, setShowAll] = useState(false);

  // Filter balances based on showAll toggle
  const displayedBalances = showAll
    ? balances
    : balances.filter(b => b.total_balance > 0);

  if (loading) {
    return <TableSkeleton rows={8} cols={4} />;
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-color-danger text-sm">
          <i className="pi pi-exclamation-circle mr-2"></i>
          {error}
        </div>
      </div>
    );
  }

  if (displayedBalances.length === 0 && !showAll) {
    return (
      <div className="flex-1 flex flex-col">
        <EmptyState message="No assets with balance found" icon="pi-wallet" />
        <div className="p-4 border-t border-color-border text-center">
          <button
            onClick={() => setShowAll(true)}
            className="text-color-primary hover:underline text-xs font-bold uppercase tracking-wider"
          >
            Show All Assets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toggle */}
      <div className="px-4 py-3 border-b border-color-border flex items-center justify-between">
        <span className="text-xs text-text-tertiary font-bold uppercase tracking-wider">
          {showAll ? 'All Assets' : 'Assets with Balance'}
        </span>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs text-text-secondary">Show all assets</span>
          <div className="relative">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-bg-tertiary rounded-full peer peer-checked:bg-color-primary transition-colors"></div>
            <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
          </div>
        </label>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-bg-tertiary/50 border-b border-color-border">
            <tr>
              <th className="text-left py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
                Asset
              </th>
              <th className="text-right py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
                Total Balance
              </th>
              <th className="text-right py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
                Available
              </th>
              <th className="text-right py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
                In Order
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-color-border/30">
            {displayedBalances.map((balance) => (
              <tr key={balance.asset} className="hover:bg-bg-tertiary/30 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-bg-tertiary border border-color-border flex items-center justify-center text-[10px] font-bold text-text-primary">
                      {balance.asset.substring(0, 2)}
                    </div>
                    <span className="font-bold text-text-primary">{balance.asset}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right font-mono text-text-primary font-bold">
                  {balance.total_balance.toFixed(8)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-color-success">
                  {balance.available.toFixed(8)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-text-tertiary">
                  {balance.in_order.toFixed(8)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="px-4 py-3 border-t border-color-border bg-bg-tertiary/20">
        <div className="flex justify-between items-center text-xs">
          <span className="text-text-tertiary font-bold uppercase tracking-wider">
            Total Assets
          </span>
          <span className="text-text-primary font-bold">
            {displayedBalances.length} {displayedBalances.length === 1 ? 'asset' : 'assets'}
          </span>
        </div>
      </div>
    </div>
  );
}
