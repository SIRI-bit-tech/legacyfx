'use client';

import { DashboardLayout } from '../dashboard-layout';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

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
      const res = await api.get(API_ENDPOINTS.TRADES.PORTFOLIO);
      const holdings = res.holdings || [];
      // Map to expected format
      const formattedAssets = holdings.map((h: any) => ({
        name: h.symbol === 'BTC' ? 'Bitcoin' : h.symbol === 'ETH' ? 'Ethereum' : h.symbol,
        symbol: h.symbol,
        balance: h.quantity,
        fee: h.symbol === 'BTC' ? 0.0005 : h.symbol === 'ETH' ? 0.004 : 5.0
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <i className="pi pi-spin pi-spinner text-4xl text-color-primary"></i>
        </div>
      </DashboardLayout>
    );
  }


  const currentAsset = assets.find(a => a.symbol === selectedAsset) || assets[0] || {
    name: 'Bitcoin',
    symbol: 'BTC',
    balance: 0,
    fee: 0.0005
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Withdraw Assets</h1>
          <p className="text-text-secondary">Send cryptocurrency to an external wallet</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-bg-secondary border border-color-border p-6 rounded-lg">
              <label className="block text-sm font-medium text-text-secondary mb-3">Currency</label>
              <div className="relative">
                <select
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className="w-full bg-bg-tertiary border border-color-border rounded px-4 py-3 focus:border-color-primary appearance-none cursor-pointer"
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
                <label className="text-sm font-medium text-text-secondary">Recipient Address</label>
                <span className="text-xs text-color-primary flex items-center gap-1 cursor-pointer hover:underline">
                  <i className="pi pi-address-book"></i> Whitelist
                </span>
              </div>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={`Paste your ${currentAsset.name} address`}
                className="w-full bg-bg-tertiary border border-color-border rounded px-4 py-3 focus:outline-none focus:border-color-primary transition"
              />
            </div>

            <div className="bg-bg-secondary border border-color-border p-6 rounded-lg">
              <div className="flex justify-between mb-3 text-sm">
                <label className="font-medium text-text-secondary">Amount</label>
                <span className="text-text-tertiary">Available: <span className="text-text-secondary font-mono">{currentAsset.balance} {currentAsset.symbol}</span></span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-bg-tertiary border border-color-border rounded px-4 py-3 focus:outline-none focus:border-color-primary transition"
                />
                <div className="absolute right-4 top-2 text-xs flex flex-col items-end">
                  <button
                    onClick={() => setAmount(currentAsset.balance.toString())}
                    className="text-color-primary hover:text-color-primary-hover font-bold mb-0.5"
                  >
                    MAX
                  </button>
                  <span className="text-text-tertiary font-bold">{selectedAsset}</span>
                </div>
              </div>
            </div>

            <button className="w-full bg-color-primary hover:bg-color-primary-hover text-bg-primary py-4 rounded-lg font-bold text-lg transition shadow-lg shadow-color-primary/10">
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
                    {amount ? Math.max(0, parseFloat(amount) - currentAsset.fee).toFixed(8) : '0.00'} {currentAsset.symbol}
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

            <div className="bg-bg-elevated border border-color-border p-6 rounded-lg">
              <h3 className="text-text-primary font-bold mb-3 flex items-center gap-2">
                <i className="pi pi-info-circle"></i>
                Please Note
              </h3>
              <ul className="text-xs text-text-secondary space-y-3 list-disc pl-4">
                <li>Withdrawals are processed within 1-24 hours depending on network congestion.</li>
                <li>Ensure the recipient address is correct. Crypto transfers are irreversible.</li>
                <li>Minimum withdrawal for {selectedAsset} is {currentAsset.fee * 10} {selectedAsset}.</li>
                <li>Using a wrong network will result in permanent loss of funds.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
