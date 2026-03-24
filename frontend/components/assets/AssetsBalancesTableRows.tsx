// Assets balances table rows renderer
'use client';

import type { AssetRow } from './assetsTypes';
import { formatNumber } from './assetsTableUtils';

export function AssetsBalancesTableRows({
  assets,
  onDeposit,
  onWithdraw,
  onTrade,
}: {
  assets: AssetRow[];
  onDeposit: (assetSymbol: string) => void;
  onWithdraw: (assetSymbol: string) => void;
  onTrade: (assetSymbol: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-bg-tertiary/50 text-text-tertiary text-[10px] uppercase font-bold tracking-widest">
            <th className="px-6 py-4">Asset</th>
            <th className="px-6 py-4 text-right">Total</th>
            <th className="px-6 py-4 text-right">Available</th>
            <th className="px-6 py-4 text-right">In orders</th>
            <th className="px-6 py-4 text-right">Value (USD)</th>
            <th className="px-6 py-4">Allocation</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-color-border/30">
          {assets.map((a) => (
            <tr key={a.symbol} className="hover:bg-bg-tertiary/30 transition-colors group">
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center font-black text-xs text-text-primary border border-color-border">
                    {a.symbol.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">{a.name}</p>
                    <p className="text-[10px] text-text-tertiary font-bold">{a.symbol}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5 text-right">
                <p className="font-mono text-sm text-text-primary">{formatNumber(a.total)}</p>
              </td>
              <td className="px-6 py-5 text-right">
                <p className="font-mono text-sm text-color-success">{formatNumber(a.available)}</p>
              </td>
              <td className="px-6 py-5 text-right">
                <p className="font-mono text-sm text-text-tertiary">{formatNumber(a.inOrders)}</p>
              </td>
              <td className="px-6 py-5 text-right">
                <p className="font-mono text-sm font-bold text-text-primary">
                  ${a.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-3 min-w-[160px]">
                  <div className="flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-color-primary"
                      style={{ width: `${Math.max(0, Math.min(100, a.allocationPercent || 0))}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-text-tertiary">
                    {Number.isFinite(a.allocationPercent) ? a.allocationPercent.toFixed(2) : '0.00'}%
                  </span>
                </div>
              </td>
              <td className="px-6 py-5 text-right">
                <div className="flex justify-end gap-2 opacity-100">
                  <button
                    type="button"
                    onClick={() => onDeposit(a.symbol)}
                    className="px-3 py-1 rounded-lg text-[10px] font-bold border border-color-border hover:border-color-primary/40 text-color-primary hover:text-color-primary transition"
                  >
                    Deposit
                  </button>
                  <button
                    type="button"
                    onClick={() => onWithdraw(a.symbol)}
                    className="px-3 py-1 rounded-lg text-[10px] font-bold border border-color-border hover:border-color-danger/40 text-color-danger hover:text-color-danger transition"
                  >
                    Withdraw
                  </button>
                  <button
                    type="button"
                    onClick={() => onTrade(a.symbol)}
                    className="px-3 py-1 rounded-lg text-[10px] font-bold border border-color-border hover:border-color-primary/30 text-text-tertiary hover:text-text-primary transition"
                  >
                    Trade
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

