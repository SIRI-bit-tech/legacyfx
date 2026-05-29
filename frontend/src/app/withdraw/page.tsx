'use client';

import { DashboardLayout } from '../dashboard-layout';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';
import { KYCGuard } from '@/components/user/KYCGuard';

export default function WithdrawPage() {
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHoldings();
  }, []);

  const loadHoldings = async () => {
    try {
      const res: any = await api.get(API_ENDPOINTS.TRADES.PORTFOLIO);
      const holdings = res.holdings || [];
      const getAssetName = (symbol: string) => {
        const names: Record<string, string> = {
          'BTC': 'Bitcoin',
          'ETH': 'Ethereum'
        };
        return names[symbol] || symbol;
      };

      const getAssetFee = (symbol: string) => {
        const fees: Record<string, number> = {
          'BTC': 0.0005,
          'ETH': 0.004
        };
        return fees[symbol] || 5
      };

      const formattedAssets = holdings.map((h: any) => ({
        name: getAssetName(h.symbol),
        symbol: h.symbol,
        balance: h.quantity,
        fee: getAssetFee(h.symbol)
      }));
      setAssets(formattedAssets);
      if (formattedAssets.length > 0) {
        setSelectedAsset(formattedAssets[0].symbol);
      }
    } catch (err) {
      console.error('Failed to load assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentAsset = assets.find(a => a.symbol === selectedAsset) || assets[0] || null;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <i className="pi pi-spin pi-spinner text-4xl text-color-primary"></i>
        </div>
      );
    }

    if (!currentAsset) {
      return (
        <div className="max-w-2xl mx-auto p-8 text-center mt-12">
          <div className="bg-bg-secondary border border-color-border p-8 rounded-3xl">
            <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-6">
              <i className="pi pi-wallet text-2xl text-text-tertiary"></i>
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-3">No Assets Available</h2>
            <p className="text-text-tertiary mb-6">
              You don't have any assets available for withdrawal. Deposit funds to your account to enable withdrawals.
            </p>
            <button
              onClick={() => globalThis.location.href = '/deposit'}
              className="bg-color-primary hover:bg-color-primary-hover text-black px-6 py-3 rounded-xl font-bold text-sm transition"
            >
              Deposit Funds
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Withdraw Assets</h1>
          <p className="text-text-secondary">Send cryptocurrency to an external wallet</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-bg-secondary border border-color-border p-6 rounded-lg">
              <label htmlFor="withdraw-currency" className="block text-sm font-medium text-text-secondary mb-3">Currency</label>
              <div className="relative">
                <select
                  id="withdraw-currency"
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className="w-full bg-bg-tertiary border border-color-border rounded px-4 py-3 focus:border-color-primary appearance-none cursor-pointer text-text-primary"
                >
                  {assets.map(a => (
                    <option key={a.symbol} value={a.symbol}>{a.name} ({a.symbol})</option>
                  ))}
                </select>
                <i className="pi pi-chevron-down absolute right-4 top-4 text-text-tertiary pointer-events-none"></i>
              </div>
            </div>

            <div className="bg-bg-secondary border border-color-border p-6 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <label htmlFor="withdraw-address" className="text-sm font-medium text-text-secondary">Recipient Address</label>
                <span className="text-xs text-color-primary flex items-center gap-1 cursor-pointer hover:underline">
                  <i className="pi pi-address-book"></i> Whitelist
                </span>
              </div>
              <input
                id="withdraw-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={currentAsset ? `Paste your ${currentAsset.name} address` : "Paste your address"}
                className="w-full bg-bg-tertiary border border-color-border rounded px-4 py-3 focus:outline-none focus:border-color-primary transition text-text-primary"
              />
            </div>

            <div className="bg-bg-secondary border border-color-border p-6 rounded-lg">
              <div className="flex justify-between mb-3 text-sm">
                <label htmlFor="withdraw-amount" className="font-medium text-text-secondary">Amount</label>
                <span className="text-text-tertiary">Available: <span className="text-text-secondary font-mono">{currentAsset.balance} {currentAsset.symbol}</span></span>
              </div>
              <div className="relative">
                <input
                  id="withdraw-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-bg-tertiary border border-color-border rounded px-4 py-3 focus:outline-none focus:border-color-primary transition text-text-primary"
                />
                <div className="absolute right-4 top-2 text-xs flex flex-col items-end">
                  <button
                    onClick={() => currentAsset && setAmount(currentAsset.balance.toString())}
                    className="text-color-primary hover:text-color-primary-hover font-bold mb-0.5"
                  >
                    MAX
                  </button>
                  <span className="text-text-tertiary font-bold">{selectedAsset}</span>
                </div>
              </div>
            </div>

            <button className="w-full bg-color-primary hover:bg-color-primary-hover text-black py-4 rounded-lg font-bold text-lg transition shadow-lg shadow-color-primary/10 active:scale-95">
              Request Withdrawal
            </button>
          </div>

          {/* Details & Help */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-bg-secondary border border-color-border p-6 rounded-lg">
              <h3 className="text-text-primary font-bold mb-4 uppercase text-xs tracking-widest">Quick Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary text-xs">Network Fee</span>
                  <span className="font-mono text-text-primary">{currentAsset.fee} {currentAsset.symbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary text-xs">Net Amount</span>
                  <span className="font-mono text-color-primary font-bold">
                    {amount && currentAsset ? Math.max(0, Number.parseFloat(amount) - currentAsset.fee).toFixed(8) : '0.00'} {currentAsset.symbol}
                  </span>
                </div>
                <div className="pt-4 border-t border-color-border">
                  <p className="text-[10px] text-text-tertiary uppercase mb-2 font-bold">Security Status</p>
                  <div className="flex items-center gap-2 text-color-success text-xs">
                    <i className="pi pi-shield"></i>
                    <span>2FA Required</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-bg-secondary border border-color-border p-6 rounded-lg">
              <h3 className="text-text-primary font-bold mb-3 flex items-center gap-2">
                <i className="pi pi-info-circle"></i> Please Note
              </h3>
              <ul className="text-xs text-text-secondary space-y-3 list-disc pl-4 leading-relaxed">
                <li>Withdrawals are processed within 1-24 hours depending on network congestion.</li>
                <li>Ensure the recipient address is correct. Crypto transfers are irreversible.</li>
                <li>Minimum withdrawal for {selectedAsset} is {currentAsset.fee * 10} {selectedAsset}.</li>
                <li>Using a wrong network will result in permanent loss of funds.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <KYCGuard>
        {renderContent()}
      </KYCGuard>
    </DashboardLayout>
  );
}
