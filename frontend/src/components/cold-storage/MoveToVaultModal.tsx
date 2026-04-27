'use client';

import { useState, useCallback, useEffect } from 'react';

interface MoveToVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (assetSymbol: string, amount: number) => Promise<void>;
  availableAssets: { symbol: string; balance: number }[];
  loading?: boolean;
}

export function MoveToVaultModal({
  isOpen,
  onClose,
  onSubmit,
  availableAssets,
  loading = false
}: MoveToVaultModalProps) {
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Reset form state when modal closes
  const resetForm = useCallback(() => {
    setSelectedAsset('');
    setAmount('');
    setError('');
    setSubmitting(false);
  }, []);

  // Clear state whenever modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const selectedAssetData = availableAssets.find(a => a.symbol === selectedAsset);
  const maxAmount = selectedAssetData?.balance || 0;

  const handleSetMax = useCallback(() => {
    if (maxAmount > 0) {
      setAmount(maxAmount.toString());
      setError('');
    }
  }, [maxAmount]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedAsset) {
      setError('Please select an asset');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amountNum > maxAmount) {
      setError(`Insufficient balance. Max: ${maxAmount}`);
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(selectedAsset, amountNum);
      setSelectedAsset('');
      setAmount('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isSubmitting = loading || submitting;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-secondary border border-color-border rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-text-primary mb-4">Move to Cold Storage</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Asset Selector */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">Asset</label>
            <select
              value={selectedAsset}
              onChange={(e) => {
                setSelectedAsset(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 bg-bg-tertiary border border-color-border rounded text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select an asset...</option>
              {availableAssets.map((asset) => (
                <option key={asset.symbol} value={asset.symbol}>
                  {asset.symbol} (Balance: {asset.balance.toFixed(8)})
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          {selectedAsset && (
            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-sm font-semibold text-text-secondary">Amount</label>
                <button
                  type="button"
                  onClick={handleSetMax}
                  className="text-xs text-info hover:text-primary transition"
                >
                  Max: {maxAmount.toFixed(8)}
                </button>
              </div>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-bg-tertiary border border-color-border rounded text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {/* Error Message */}
          {error && <div className="text-danger bg-danger bg-opacity-20 p-2 rounded text-sm">{error}</div>}

          {/* Info Box */}
          <div className="bg-info bg-opacity-20 border border-info rounded p-3">
            <p className="text-info text-xs">
              ℹ️ Funds moved to cold storage will be locked by default for security.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              disabled={isSubmitting}
              className="flex-1 bg-bg-tertiary hover:bg-opacity-80 text-text-primary font-semibold py-2 px-4 rounded transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedAsset || !amount}
              className="flex-1 bg-primary hover:opacity-80 text-bgPrimary font-semibold py-2 px-4 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : 'Move to Vault'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
