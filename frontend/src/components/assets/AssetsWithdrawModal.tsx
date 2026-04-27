// Withdraw modal for the Assets page
'use client';

import { useEffect, useMemo, useState } from 'react';
import { requestWithdrawal } from '@/lib/fundsApi';
import { AssetsWithdrawModalPanel } from './AssetsWithdrawModalPanel';
import { AssetsWithdrawModalSelectors } from './AssetsWithdrawModalSelectors';

const DEPOSIT_NETWORKS: Record<string, string[]> = {
  BTC: ['BITCOIN'],
  USDT: ['ERC20'],
  TRX: ['TRON'],
  BCH: ['BCH_MAINNET'],
};

function getBaseAssetSymbol(symbol: string) {
  const clean = (symbol || '').replace(/[-/]/g, '').toUpperCase().trim();
  const quotes = ['USDT', 'USDC', 'USD'];
  for (const q of quotes) {
    if (clean.endsWith(q) && clean.length > q.length) return clean.slice(0, -q.length);
  }
  return clean;
}

function estimateNetworkFee(baseAssetSymbol: string) {
  const s = baseAssetSymbol.toUpperCase();
  if (s === 'BTC') return 0.0005;
  if (s === 'ETH') return 0.004; // fallback if ETH appears
  return 5.0;
}

export function AssetsWithdrawModal({
  isOpen,
  onClose,
  userId,
  initialAssetSymbol,
  assetOptions,
}: {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialAssetSymbol: string | null;
  assetOptions: Array<{ symbol: string; name: string; available: number }>;
}) {
  const initialAsset = useMemo(
    () => initialAssetSymbol || assetOptions[0]?.symbol || 'BTC',
    [initialAssetSymbol, assetOptions]
  );

  const [assetSymbol, setAssetSymbol] = useState(initialAsset);
  const baseAssetSymbol = useMemo(() => getBaseAssetSymbol(assetSymbol), [assetSymbol]);
  const networksForAsset = DEPOSIT_NETWORKS[baseAssetSymbol] || [];

  const [network, setNetwork] = useState(DEPOSIT_NETWORKS[getBaseAssetSymbol(initialAsset)]?.[0] || '');

  const [destinationAddress, setDestinationAddress] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const selectedAsset = assetOptions.find((a) => a.symbol === assetSymbol);
  const availableBalance = selectedAsset?.available ?? 0;
  const networkFeeEstimate = estimateNetworkFee(baseAssetSymbol);

  useEffect(() => {
    if (!isOpen) return;
    setAssetSymbol(initialAsset);
    setNetwork(DEPOSIT_NETWORKS[getBaseAssetSymbol(initialAsset)]?.[0] || '');
    setDestinationAddress('');
    setAmount('');
    setError(null);
    setSubmittedMessage(null);
  }, [isOpen, initialAsset]);

  useEffect(() => {
    setNetwork((prev) => (networksForAsset.includes(prev) ? prev : networksForAsset[0] || ''));
  }, [baseAssetSymbol]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const onSubmit = async () => {
    setError(null);
    setSubmittedMessage(null);

    const amountNum = parseFloat(amount);
    if (!destinationAddress.trim()) return setError('Destination address is required.');
    if (!Number.isFinite(amountNum) || amountNum <= 0) return setError('Enter a valid amount.');
    if (amountNum > availableBalance) return setError('Amount exceeds available balance.');
    if (!network) return setError('Asset and network are required.');

    try {
      setSubmitting(true);
      await requestWithdrawal({
        userId,
        asset: baseAssetSymbol,
        network,
        address: destinationAddress.trim(),
        amount: amountNum,
      });
      setSubmittedMessage('Check your email to confirm this withdrawal');
    } catch (err: any) {
      setError(String(err?.message || 'Withdrawal request failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-bg-secondary border border-color-border rounded-xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-color-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-text-primary">Withdraw</h2>
          <button type="button" onClick={onClose} className="w-10 h-10 rounded-lg hover:bg-bg-tertiary transition">
            <i className="pi pi-times" />
          </button>
        </div>

        <AssetsWithdrawModalSelectors
          assetSymbol={assetSymbol}
          onChangeAsset={setAssetSymbol}
          assetOptions={assetOptions.map((a) => ({ symbol: a.symbol, name: a.name }))}
          network={network}
          onChangeNetwork={setNetwork}
          networksForAsset={networksForAsset}
        />

        <AssetsWithdrawModalPanel
          availableBalance={availableBalance}
          baseAssetSymbol={baseAssetSymbol}
          networkFeeEstimate={networkFeeEstimate}
          destinationAddress={destinationAddress}
          onChangeDestination={setDestinationAddress}
          amount={amount}
          onChangeAmount={setAmount}
          onMax={() => setAmount(availableBalance.toString())}
          onSubmit={onSubmit}
          submitting={submitting}
          error={error}
          submittedMessage={submittedMessage}
        />
      </div>
    </div>
  );
}

