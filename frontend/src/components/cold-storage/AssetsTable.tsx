'use client';

import { useCallback } from 'react';

interface Asset {
  asset_symbol: string;
  balance: number;
  usd_value: number;
}

interface AssetsTableProps {
  assets: Asset[];
  onWithdraw: (symbol: string, amount: number) => void;
  loading?: boolean;
}

export function AssetsTable({ assets, onWithdraw, loading = false }: AssetsTableProps) {
  if (!assets || assets.length === 0) {
    return (
      <div className="bg-bg-secondary border border-color-border rounded-lg p-12 text-center">
        <p className="text-text-secondary">No assets in cold storage yet.</p>
        <p className="text-text-tertiary text-sm mt-2">Start by depositing funds from your trading account.</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary border border-color-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-bg-tertiary border-b border-color-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-text-tertiary">Asset</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-text-tertiary">Balance</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-text-tertiary">USD Value</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-text-tertiary">Action</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, idx) => (
              <tr key={idx} className="border-b border-color-border hover:bg-bg-tertiary transition">
                <td className="px-6 py-4 text-text-primary font-semibold">{asset.asset_symbol}</td>
                <td className="px-6 py-4 text-right text-text-primary">{asset.balance.toFixed(8)}</td>
                <td className="px-6 py-4 text-right text-success">${asset.usd_value.toFixed(2)}</td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => onWithdraw(asset.asset_symbol, asset.balance)}
                    disabled={loading}
                    className="text-info hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-semibold"
                  >
                    Withdraw
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
