// QR + address panel for Assets Deposit modal
'use client';

import { QRCodeSVG } from 'qrcode.react';
import type { DepositAddressResponse } from '@/lib/fundsApi';

export function AssetsDepositAddressPanel({
  loading,
  error,
  addressData,
  baseAssetSymbol,
  network,
  onCopy,
}: {
  loading: boolean;
  error: string | null;
  addressData: DepositAddressResponse | null;
  baseAssetSymbol: string;
  network: string;
  onCopy: (address: string) => void;
}) {
  return (
    <div className="bg-bg-tertiary border border-color-border rounded-lg p-5">
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-stretch">
        <div className="flex-1 min-w-[280px]">
          <div className="bg-bg-primary border border-color-border rounded-lg p-4 flex items-center justify-center min-h-[232px]">
            {loading ? (
              <i className="pi pi-spin pi-spinner text-4xl text-color-primary" />
            ) : error ? (
              <div className="text-color-danger text-sm font-bold">{error}</div>
            ) : addressData ? (
              <QRCodeSVG value={addressData.address} size={200} level="H" includeMargin={false} />
            ) : (
              <p className="text-text-tertiary font-bold">Select an asset/network to view your address.</p>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4 min-w-[280px]">
          <div className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Wallet deposit address</div>

          <div className="bg-bg-primary border border-color-border px-4 py-3 rounded-md w-full flex items-center justify-between gap-4">
            <code className="text-color-primary break-all text-xs md:text-sm">
              {addressData?.address || (loading ? 'Fetching...' : '--')}
            </code>
            <button
              type="button"
              disabled={!addressData?.address || loading}
              onClick={() => addressData?.address && onCopy(addressData.address)}
              className="text-text-secondary hover:text-text-primary transition disabled:opacity-50"
            >
              <i className="pi pi-copy" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-bg-primary border border-color-border rounded-lg p-3">
              <div className="text-text-tertiary text-[10px] font-bold uppercase tracking-widest mb-1">Min deposit</div>
              <div className="font-mono font-bold text-text-primary">{addressData ? addressData.minDeposit : '--'}</div>
            </div>
            <div className="bg-bg-primary border border-color-border rounded-lg p-3">
              <div className="text-text-tertiary text-[10px] font-bold uppercase tracking-widest mb-1">Network fee</div>
              <div className="font-mono font-bold text-text-primary">{addressData ? addressData.fee : '--'}</div>
            </div>
          </div>

          <div className="p-4 bg-color-warning/10 border border-color-warning/20 rounded-lg text-left w-full">
            <div className="flex gap-3">
              <i className="pi pi-exclamation-triangle text-color-warning mt-1" />
              <div className="text-xs text-color-warning/90">
                <p className="font-bold mb-1 uppercase tracking-wider">Warning</p>
                <p>
                  Only send {baseAssetSymbol} on the {network} network to this address. Sending any other asset may result in permanent loss.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

