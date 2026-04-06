'use client';

import { useCallback } from 'react';
import { format } from 'date-fns';

interface VaultOverviewProps {
  totalBalanceUsd: number;
  isLocked: boolean;
  lastWithdrawalAt: string | null;
  createdAt: string;
  onLockToggle: (newState: boolean) => void;
  loading?: boolean;
}

export function VaultOverview({
  totalBalanceUsd,
  isLocked,
  lastWithdrawalAt,
  createdAt,
  onLockToggle,
  loading = false
}: VaultOverviewProps) {
  const handleToggleLock = useCallback(() => {
    onLockToggle(!isLocked);
  }, [isLocked, onLockToggle]);

  return (
    <div className="bg-bg-secondary border border-color-border rounded-lg p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Balance Info */}
        <div>
          <div className="text-text-tertiary text-sm mb-2">Total Cold Storage Balance</div>
          <div className="text-3xl font-bold text-text-primary mb-4">
            ${totalBalanceUsd.toFixed(2)}
          </div>
          <div className="text-text-tertiary text-xs">
            Created: {format(new Date(createdAt), 'MMM dd, yyyy HH:mm')}
          </div>
          {lastWithdrawalAt && (
            <div className="text-text-tertiary text-xs mt-1">
              Last Withdrawal: {format(new Date(lastWithdrawalAt), 'MMM dd, yyyy HH:mm')}
            </div>
          )}
        </div>

        {/* Right: Lock Status & Controls */}
        <div className="flex flex-col justify-between">
          <div>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-4 ${
              isLocked
                ? 'bg-danger bg-opacity-20 text-danger'
                : 'bg-success bg-opacity-20 text-success'
            }`}>
              {isLocked ? 'LOCKED' : 'UNLOCKED'}
            </div>
            <p className="text-text-secondary text-sm mb-4">
              {isLocked
                ? '⚠️ Vault is locked. Funds are secure but withdrawals are disabled.'
                : '✓ Vault is unlocked. You can withdraw funds if needed.'}
            </p>
          </div>
          <button
            onClick={handleToggleLock}
            disabled={loading}
            className={`${
              isLocked ? 'bg-success hover:opacity-80' : 'bg-danger hover:opacity-80'
            } text-white font-semibold py-2 px-4 rounded transition disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Processing...' : isLocked ? 'Unlock Vault' : 'Lock Vault'}
          </button>
        </div>
      </div>
    </div>
  );
}
