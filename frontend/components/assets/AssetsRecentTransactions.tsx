// Recent transactions card for the Assets page
'use client';

import { useMemo } from 'react';

type TxType = 'deposit' | 'withdraw' | 'trade';

export type RecentTransaction = {
  type: TxType;
  asset: string;
  amount: number;
  status: 'confirmed' | 'pending' | 'awaiting_confirmation' | 'filled' | 'failed' | string;
  network: string;
  date: string;
  txHash: string;
};

function formatTxDate(isoDate: string) {
  const dt = new Date(isoDate);
  if (Number.isNaN(dt.getTime())) return isoDate;
  const datePart = dt.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
  const timePart = dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${datePart}, ${timePart}`;
}

function truncateHash(hash: string) {
  const h = hash || '';
  if (h.length <= 12) return h || '--';
  return `${h.slice(0, 6)}...${h.slice(-6)}`;
}

function typePillClass(type: TxType) {
  if (type === 'deposit') return 'bg-color-success/10 text-color-success border-color-success/20';
  if (type === 'withdraw') return 'bg-color-danger/10 text-color-danger border-color-danger/20';
  return 'bg-color-info/10 text-color-info border-color-info/20';
}

function statusPillClass(status: string) {
  const s = status.toLowerCase();
  if (s === 'confirmed' || s === 'filled') return 'bg-color-success/10 text-color-success border-color-success/20';
  if (s === 'pending' || s === 'awaiting_confirmation') return 'bg-color-warning/10 text-color-warning border-color-warning/20';
  if (s === 'failed') return 'bg-color-danger/10 text-color-danger border-color-danger/20';
  return 'bg-bg-tertiary/20 text-text-tertiary border-color-border';
}

export function AssetsRecentTransactions({
  transactions,
  loading,
  error,
}: {
  transactions: RecentTransaction[];
  loading: boolean;
  error: string | null;
}) {
  const safeTxs = useMemo(() => transactions || [], [transactions]);

  return (
    <section className="bg-bg-secondary border border-color-border rounded-2xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-color-border flex justify-between items-center">
        <h3 className="font-bold text-lg text-text-primary">Recent transactions</h3>
        <a href="/transactions" className="text-color-primary hover:underline text-xs font-black uppercase tracking-widest">
          View all
        </a>
      </div>

      {loading ? (
        <div className="p-6">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="animate-pulse flex items-center gap-3 py-3">
              <div className="h-7 w-24 bg-bg-tertiary/50 rounded" />
              <div className="h-4 flex-1 bg-bg-tertiary/50 rounded" />
              <div className="h-4 w-28 bg-bg-tertiary/50 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 text-color-danger text-sm font-bold">{error}</div>
      ) : safeTxs.length === 0 ? (
        <div className="p-10 text-center text-text-tertiary font-bold">No recent transactions.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-bg-tertiary/50 text-text-tertiary text-[10px] uppercase font-black tracking-widest">
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Asset</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Network</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Tx Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-color-border/30">
              {safeTxs.map((t, idx) => {
                const amountPrefix = t.type === 'deposit' ? '+' : t.type === 'withdraw' ? '-' : '';
                const amountAbs = Math.abs(t.amount || 0);
                const amountClass =
                  t.type === 'deposit' ? 'text-color-success' : t.type === 'withdraw' ? 'text-color-danger' : 'text-text-tertiary';
                const hashOrInternal = t.type === 'trade' ? 'Internal' : truncateHash(t.txHash);
                const hashClass = t.type === 'trade' ? 'text-text-tertiary' : 'text-color-primary';

                return (
                  <tr key={`${t.txHash}-${idx}`} className="hover:bg-bg-tertiary/20 transition-colors">
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${typePillClass(
                          t.type
                        )}`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-text-primary">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-bg-tertiary border border-color-border flex items-center justify-center text-[10px] font-bold">
                          {t.asset.slice(0, 2).toUpperCase()}
                        </span>
                        {t.asset}
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-right font-mono font-bold ${amountClass}`}>
                      {amountPrefix}
                      {amountAbs.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusPillClass(
                          t.status
                        )}`}
                      >
                        {t.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-tertiary">{t.network}</td>
                    <td className="px-6 py-4 text-text-tertiary">{formatTxDate(t.date)}</td>
                    <td className={`px-6 py-4 text-right font-mono font-bold ${hashClass}`}>{hashOrInternal}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

