// Balances table used on the Assets page
'use client';

import { useMemo } from 'react';
import type { AssetRow } from './assetsTypes';
import { exportAssetsCsv } from './assetsTableUtils';
import { AssetsBalancesEmptyState } from './AssetsBalancesEmptyState';
import { AssetsBalancesTableRows } from './AssetsBalancesTableRows';
import { AssetsBalancesTableSkeleton } from './AssetsBalancesTableSkeleton';

export function AssetsBalancesTable({
  userId,
  assets,
  loading,
  hideZeroBalances,
  onToggleHideZeroBalances,
  onDeposit,
  onWithdraw,
  onTrade,
}: {
  userId: string;
  assets: AssetRow[];
  loading: boolean;
  hideZeroBalances: boolean;
  onToggleHideZeroBalances: (next: boolean) => void;
  onDeposit: (assetSymbol: string) => void;
  onWithdraw: (assetSymbol: string) => void;
  onTrade: (assetSymbol: string) => void;
}) {
  const visibleAssets = useMemo(() => {
    if (!hideZeroBalances) return assets;
    return assets.filter((a) => (a.total ?? 0) > 0);
  }, [assets, hideZeroBalances]);

  const handleExportCsv = () => {
    const exportDate = new Date();
    const datePart = exportDate.toISOString().slice(0, 10);
    exportAssetsCsv({ userId, datePart, rows: visibleAssets });
  };

  return (
    <section className="bg-bg-secondary border border-color-border rounded-2xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-color-border flex justify-between items-center gap-4">
        <h3 className="font-bold text-lg text-text-primary">My balances</h3>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={loading || visibleAssets.length === 0}
            className="bg-bg-tertiary border border-color-border px-5 py-2 rounded-lg text-text-primary text-xs font-bold hover:bg-bg-tertiary/70 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <i className="pi pi-download mr-2" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => onToggleHideZeroBalances(!hideZeroBalances)}
            className="text-xs text-text-tertiary font-bold uppercase tracking-widest hover:text-text-primary transition underline-offset-2 hover:underline"
          >
            Hide zero balances
          </button>
        </div>
      </div>

      {loading ? (
        <AssetsBalancesTableSkeleton />
      ) : visibleAssets.length === 0 ? (
        <AssetsBalancesEmptyState onDeposit={onDeposit} defaultAssetSymbol={assets[0]?.symbol || 'BTC'} />
      ) : (
        <AssetsBalancesTableRows assets={visibleAssets} onDeposit={onDeposit} onWithdraw={onWithdraw} onTrade={onTrade} />
      )}
    </section>
  );
}

