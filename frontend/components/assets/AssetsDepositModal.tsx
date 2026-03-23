// Deposit modal for the Assets page
'use client';

import { useEffect, useMemo, useState } from 'react';
import { AssetsDepositAddressPanel } from './AssetsDepositAddressPanel';
import { AssetsDepositModalSelectors } from './AssetsDepositModalSelectors';
import { useDepositAddress } from '@/hooks/useDepositAddress';

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

export function AssetsDepositModal({
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
  assetOptions: Array<{ symbol: string; name: string }>;
}) {
  const initialAsset = useMemo(
    () => initialAssetSymbol || assetOptions[0]?.symbol || 'BTC',
    [initialAssetSymbol, assetOptions]
  );

  const [assetSymbol, setAssetSymbol] = useState(initialAsset);
  const baseAssetSymbol = useMemo(() => getBaseAssetSymbol(assetSymbol), [assetSymbol]);
  const networksForAsset = DEPOSIT_NETWORKS[baseAssetSymbol] || [];
  const [network, setNetwork] = useState(DEPOSIT_NETWORKS[getBaseAssetSymbol(initialAsset)]?.[0] || '');
  const [amount, setAmount] = useState<string>('0.1');

  useEffect(() => {
    if (!isOpen) return;
    setAssetSymbol(initialAsset);
    setNetwork(DEPOSIT_NETWORKS[getBaseAssetSymbol(initialAsset)]?.[0] || '');
    setAmount('0.1');
  }, [isOpen, initialAsset]);

  useEffect(() => {
    setNetwork((prev) => (networksForAsset.includes(prev) ? prev : networksForAsset[0] || ''));
  }, [baseAssetSymbol]); // eslint-disable-line react-hooks/exhaustive-deps

  const { loading, addressData, error } = useDepositAddress({
    isOpen,
    userId,
    asset: baseAssetSymbol,
    network,
  });

  const onCopy = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      // ignore copy errors
    }
  };

  if (!isOpen) return null;

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
          <h2 className="text-xl font-bold text-text-primary">Deposit</h2>
          <button type="button" onClick={onClose} className="w-10 h-10 rounded-lg hover:bg-bg-tertiary transition">
            <i className="pi pi-times" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <AssetsDepositModalSelectors
            assetSymbol={assetSymbol}
            onChangeAsset={setAssetSymbol}
            assetOptions={assetOptions}
            network={network}
            onChangeNetwork={setNetwork}
            networksForAsset={networksForAsset}
            amount={amount}
            onChangeAmount={setAmount}
          />

          <AssetsDepositAddressPanel
            loading={loading}
            error={error}
            addressData={addressData}
            baseAssetSymbol={baseAssetSymbol}
            network={network}
            onCopy={onCopy}
          />
        </div>
      </div>
    </div>
  );
}

