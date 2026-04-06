'use client';

import { DashboardLayout } from '../dashboard-layout';
import { useState, useCallback } from 'react';
import { useColdStorage } from '@/hooks/useColdStorage';
import { useFunds } from '@/hooks/useFunds';
import { VaultOverview } from '@/components/cold-storage/VaultOverview';
import { AssetsTable } from '@/components/cold-storage/AssetsTable';
import { MoveToVaultModal } from '@/components/cold-storage/MoveToVaultModal';

export default function ColdStoragePage() {
  const { vault, transactions, loading, error, depositToVault, withdrawFromVault, toggleLock } =
    useColdStorage();
  const { data: fundsData } = useFunds();
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [lockLoading, setLockLoading] = useState(false);

  const handleToggleLock = useCallback(
    async (newState: boolean) => {
      try {
        setLockLoading(true);
        await toggleLock(newState);
      } catch (err) {
        console.error('Error toggling lock:', err);
      } finally {
        setLockLoading(false);
      }
    },
    [toggleLock]
  );

  const handleMoveToVault = useCallback(
    async (asset: string, amount: number) => {
      try {
        await depositToVault(asset, amount);
        setMoveModalOpen(false);
      } catch (err) {
        console.error('Error depositing to vault:', err);
      }
    },
    [depositToVault]
  );

  const handleWithdraw = useCallback(
    async (symbol: string, amount: number) => {
      if (!confirm(`Withdraw ${amount} ${symbol} from cold storage?`)) return;
      try {
        await withdrawFromVault(symbol, amount);
      } catch (err) {
        console.error('Error withdrawing from vault:', err);
      }
    },
    [withdrawFromVault]
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-text-secondary">Loading cold storage...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Cold Storage Vault</h1>
          <p className="text-text-secondary">Secure your assets in cold storage with advanced lock mechanism</p>
        </div>

        {error && (
          <div className="bg-danger bg-opacity-20 border border-danger rounded-lg p-4 mb-6">
            <p className="text-danger">{error}</p>
          </div>
        )}

        {vault && (
          <VaultOverview
            totalBalanceUsd={vault.total_balance_usd}
            isLocked={vault.is_locked}
            lastWithdrawalAt={vault.last_withdrawal_at}
            createdAt={vault.created_at}
            onLockToggle={handleToggleLock}
            loading={lockLoading}
          />
        )}

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setMoveModalOpen(true)}
            className="bg-primary hover:opacity-80 text-white font-semibold py-2 px-6 rounded transition"
          >
            Move to Cold Storage
          </button>
        </div>

        {vault && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">Assets in Vault</h2>
            <AssetsTable assets={vault.assets} onWithdraw={handleWithdraw} loading={lockLoading} />
          </div>
        )}

        {transactions.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-4">Recent Transactions</h2>
            <div className="bg-bg-secondary border border-color-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-bg-tertiary border-b border-color-border">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-text-secondary">Type</th>
                      <th className="px-6 py-3 text-left font-semibold text-text-secondary">Asset</th>
                      <th className="px-6 py-3 text-right font-semibold text-text-secondary">Amount</th>
                      <th className="px-6 py-3 text-right font-semibold text-text-secondary">USD Value</th>
                      <th className="px-6 py-3 text-left font-semibold text-text-secondary">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 5).map((tx) => (
                      <tr key={tx.id} className="border-b border-color-border hover:bg-bg-tertiary transition">
                        <td className="px-6 py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              tx.transaction_type === 'COLD_STORAGE_DEPOSIT'
                                ? 'bg-success bg-opacity-20 text-success'
                                : 'bg-warning bg-opacity-20 text-warning'
                            }`}
                          >
                            {tx.transaction_type === 'COLD_STORAGE_DEPOSIT' ? 'Deposit' : 'Withdrawal'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-text-primary">{tx.asset_symbol}</td>
                        <td className="px-6 py-3 text-right text-text-primary">{tx.amount.toFixed(8)}</td>
                        <td className="px-6 py-3 text-right text-success">
                          ${tx.usd_amount?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-3 text-text-tertiary text-xs">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {vault && (
        <MoveToVaultModal
          isOpen={moveModalOpen}
          onClose={() => setMoveModalOpen(false)}
          onSubmit={handleMoveToVault}
          availableAssets={fundsData?.balances?.map((balance) => ({
            symbol: balance.asset,
            balance: balance.available || 0
          })) || []}
        />
      )}
    </DashboardLayout>
  );
}
