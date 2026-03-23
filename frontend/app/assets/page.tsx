'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '../dashboard-layout';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolioAssets } from '@/hooks/usePortfolioAssets';
import { usePortfolioSummary } from '@/hooks/usePortfolioSummary';
import { fetchRecentTransactions } from '@/lib/transactionsApi';
import { AssetsBalancesTable } from '@/components/assets/AssetsBalancesTable';
import { AssetsDepositModal } from '@/components/assets/AssetsDepositModal';
import { AssetsMetricCard } from '@/components/assets/AssetsMetricCard';
import { AssetsPageHeader } from '@/components/assets/AssetsPageHeader';
import { AssetsRecentTransactions } from '@/components/assets/AssetsRecentTransactions';
import { AssetsWithdrawModal } from '@/components/assets/AssetsWithdrawModal';

export default function AssetsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;

  const summary = usePortfolioSummary(userId);
  const { assets, loading: assetsLoading, error: assetsError } = usePortfolioAssets(userId);

  const [hideZeroBalances, setHideZeroBalances] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [depositAssetSymbol, setDepositAssetSymbol] = useState<string | null>(null);
  const [withdrawAssetSymbol, setWithdrawAssetSymbol] = useState<string | null>(null);

  const assetOptions = useMemo(() => assets.map((a) => ({ symbol: a.symbol, name: a.name })), [assets]);
  const withdrawOptions = useMemo(
    () => assets.map((a) => ({ symbol: a.symbol, name: a.name, available: a.available })),
    [assets]
  );

  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);
  const [recentTxs, setRecentTxs] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const run = async () => {
      setRecentLoading(true);
      setRecentError(null);
      try {
        const res = await fetchRecentTransactions({ userId, limit: 5 });
        if (cancelled) return;
        setRecentTxs(res?.transactions || []);
      } catch (err: any) {
        if (cancelled) return;
        setRecentError(String(err?.message || 'Failed to load recent transactions'));
      } finally {
        if (cancelled) return;
        setRecentLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const formatUsd = (value: number) =>
    value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const openDeposit = (assetSymbol: string | null) => {
    if (!userId) return;
    setDepositAssetSymbol(assetSymbol);
    setDepositOpen(true);
  };

  const openWithdraw = (assetSymbol: string | null) => {
    if (!userId) return;
    setWithdrawAssetSymbol(assetSymbol);
    setWithdrawOpen(true);
  };

  const onTrade = (assetSymbol: string) => {
    router.push(`/trade?symbol=${encodeURIComponent(assetSymbol)}`);
  };

  const totalBalanceValue = summary.loading ? '--' : `$${formatUsd(summary.netWorth)}`;
  const availableValue = summary.loading ? '--' : `$${formatUsd(summary.available)}`;
  const inOrdersValue = summary.loading ? '--' : `$${formatUsd(summary.inOrders)}`;
  const unrealisedPnlValue = summary.loading
    ? '--'
    : `${summary.unrealisedPnl >= 0 ? '+' : '-'}$${formatUsd(Math.abs(summary.unrealisedPnl))}`;

  const totalBalanceToday =
    summary.loading
      ? '--'
      : `${summary.change24h >= 0 ? '+' : '-'}$${formatUsd(Math.abs(summary.change24h))} today`;
  const pnlPct =
    summary.loading ? '--' : `${summary.pnlPercent >= 0 ? '+' : ''}${summary.pnlPercent.toFixed(2)}%`;

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <AssetsPageHeader
          onDeposit={() => openDeposit(null)}
          onWithdraw={() => openWithdraw(null)}
          onTransfer={() => openWithdraw(null)}
        />

        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <AssetsMetricCard
            label="Total balance"
            value={totalBalanceValue}
            subLabel={totalBalanceToday}
            subLabelTone={summary.loading ? 'neutral' : summary.change24h >= 0 ? 'success' : 'danger'}
          />
          <AssetsMetricCard
            label="Available"
            value={availableValue}
            subLabel={summary.loading ? '--' : 'Ready to trade'}
          />
          <AssetsMetricCard
            label="In orders"
            value={inOrdersValue}
            subLabel={summary.loading ? '--' : `${summary.openOrdersCount} open orders`}
          />
          <AssetsMetricCard
            label="Unrealised P&L"
            value={unrealisedPnlValue}
            subLabel={pnlPct}
            subLabelTone={summary.loading ? 'neutral' : summary.unrealisedPnl >= 0 ? 'success' : 'danger'}
          />
        </section>

        {assetsError ? <div className="text-color-danger font-bold mb-6">{assetsError}</div> : null}

        <div className="mb-8">
          <AssetsBalancesTable
            userId={userId || ''}
            assets={assets}
            loading={assetsLoading}
            hideZeroBalances={hideZeroBalances}
            onToggleHideZeroBalances={setHideZeroBalances}
            onDeposit={(assetSymbol) => openDeposit(assetSymbol)}
            onWithdraw={(assetSymbol) => openWithdraw(assetSymbol)}
            onTrade={onTrade}
          />
        </div>

        <AssetsRecentTransactions transactions={recentTxs} loading={recentLoading} error={recentError} />

        <AssetsDepositModal
          isOpen={depositOpen}
          onClose={() => setDepositOpen(false)}
          userId={userId || ''}
          initialAssetSymbol={depositAssetSymbol}
          assetOptions={assetOptions}
        />

        <AssetsWithdrawModal
          isOpen={withdrawOpen}
          onClose={() => setWithdrawOpen(false)}
          userId={userId || ''}
          initialAssetSymbol={withdrawAssetSymbol}
          assetOptions={withdrawOptions}
        />
      </div>
    </DashboardLayout>
  );
}
