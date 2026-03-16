'use client';

import { DashboardLayout } from '../dashboard-layout';
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export default function DepositPage() {
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [amount, setAmount] = useState('0.1');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  
  const assets = [
    { name: 'Bitcoin', symbol: 'BTC' },
    { name: 'Ethereum', symbol: 'ETH' },
    { name: 'USDT (ERC20)', symbol: 'USDT' },
  ];

  const currentAsset = assets.find(a => a.symbol === selectedAsset) || assets[0];

  useEffect(() => {
    fetchAddress();
  }, [selectedAsset]);

  const fetchAddress = async () => {
    setLoading(true);
    try {
      const res = await api.post(API_ENDPOINTS.DEPOSITS.REQUEST, {
        asset_symbol: selectedAsset,
        amount: parseFloat(amount) || 0.1,
        blockchain_network: selectedAsset === 'BTC' ? 'BITCOIN' : 'ERC20'
      });
      setAddress(res.wallet_address);
    } catch (e) {
      console.error('Failed to fetch address:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Deposit Assets</h1>
          <p className="text-text-secondary">Transfer cryptocurrency to your brokerage account</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-6">
            <div className="bg-bg-secondary border border-color-border p-6 rounded-lg">
              <label className="block text-sm font-medium text-text-secondary mb-2">Select Asset</label>
              <div className="grid grid-cols-3 gap-3">
                {assets.map((asset) => (
                  <button
                    key={asset.symbol}
                    onClick={() => setSelectedAsset(asset.symbol)}
                    className={`py-3 px-4 rounded border transition-all flex flex-col items-center gap-1 ${
                      selectedAsset === asset.symbol
                        ? 'border-color-primary bg-color-primary/10 text-color-primary'
                        : 'border-color-border hover:bg-bg-tertiary text-text-secondary'
                    }`}
                  >
                    <span className="font-bold">{asset.symbol}</span>
                    <span className="text-xs">{asset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-bg-secondary border border-color-border p-6 rounded-lg">
              <label className="block text-sm font-medium text-text-secondary mb-2">Deposit Amount (Optional)</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-bg-tertiary border border-color-border rounded px-4 py-3 focus:outline-none focus:border-color-primary transition"
                />
                <span className="absolute right-4 top-3.5 text-text-tertiary font-bold">{selectedAsset}</span>
              </div>
              <p className="mt-2 text-xs text-text-tertiary">
                Enter the amount you plan to send to see current confirmation status.
              </p>
            </div>
          </div>

          {/* QR and Address */}
          <div className="bg-bg-secondary border border-color-border p-8 rounded-lg flex flex-col items-center text-center">
            <div className="bg-white p-4 rounded-xl mb-6 min-h-[232px] flex items-center justify-center">
              {loading ? (
                <i className="pi pi-spin pi-spinner text-3xl text-bg-secondary"></i>
              ) : address ? (
                <QRCodeSVG 
                  value={address} 
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              ) : (
                <p className="text-text-tertiary">Select an asset to generate address</p>
              )}
            </div>
            
            <h3 className="text-text-primary font-bold mb-2">Your {currentAsset.name} Deposit Address</h3>
            <div className="bg-bg-tertiary border border-color-border px-4 py-3 rounded-md w-full flex items-center justify-between gap-4 mb-4">
              <code className="text-color-primary break-all text-xs md:text-sm">{loading ? 'Generating...' : address || '---'}</code>
              <button 
                onClick={() => address && navigator.clipboard.writeText(address)}
                className="text-text-secondary hover:text-text-primary"
                disabled={!address}
                title="Copy Address"
              >
                <i className="pi pi-copy"></i>
              </button>
            </div>

            <div className="p-4 bg-color-warning/10 border border-color-warning/20 rounded-lg text-left w-full">
              <div className="flex gap-3">
                <i className="pi pi-exclamation-triangle text-color-warning mt-1"></i>
                <div className="text-xs text-color-warning/80">
                  <p className="font-bold mb-1 uppercase tracking-wider">Warning</p>
                  <p>Send ONLY {currentAsset.symbol} to this address. Sending any other coin or token may result in permanent loss.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 group">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <i className="pi pi-info-circle text-color-primary"></i>
            How to Deposit
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: 1, title: 'Select Currency', desc: 'Choose the cryptocurrency you want to deposit into your account.' },
              { step: 2, title: 'Copy Address', desc: 'Copy the unique wallet address shown above or scan the QR code.' },
              { step: 3, title: 'Send Assets', desc: 'Use your personal wallet or exchange to send the assets to your Legacy FX address.' },
            ].map((s) => (
              <div key={s.step} className="bg-bg-secondary border border-color-border p-6 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-color-primary text-bg-primary flex items-center justify-center font-bold mb-4">
                  {s.step}
                </div>
                <h4 className="text-text-primary font-bold mb-2">{s.title}</h4>
                <p className="text-sm text-text-secondary">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
