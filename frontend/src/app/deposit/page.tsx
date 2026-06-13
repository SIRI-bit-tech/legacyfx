'use client';

import { DashboardLayout } from '../dashboard-layout';
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';
import { KYCGuard } from '@/components/user/KYCGuard';
import { UploadDropzone } from '@/utils/uploadthing';
import toast from 'react-hot-toast';

import { usePrice } from '@/hooks/useMarketData';

export default function DepositPage() {
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [usdAmount, setUsdAmount] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [pendingDepositId, setPendingDepositId] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const { price } = usePrice(selectedAsset === 'USDT' ? 'BTCUSDT' : `${selectedAsset}USDT`);
  const currentPrice = selectedAsset === 'USDT' ? 1 : (price || 0);
  const cryptoAmount = (usdAmount && currentPrice > 0) ? (Number.parseFloat(usdAmount) / currentPrice).toFixed(8) : '0';

  const assets = [
    { name: 'Bitcoin', symbol: 'BTC' },
    { name: 'Ethereum', symbol: 'ETH' },
    { name: 'USDT (TRC20)', symbol: 'USDT' },
  ];

  const currentAsset = assets.find(a => a.symbol === selectedAsset) || assets[0];

  useEffect(() => {
    fetchAddress();
  }, [selectedAsset]);

  const fetchAddress = async () => {
    setLoading(true);
    try {
      const network = selectedAsset === 'BTC' ? 'BITCOIN' : selectedAsset === 'ETH' ? 'ERC20' : 'TRC20';
      const res: any = await api.get(`${API_ENDPOINTS.DEPOSITS.ADDRESS}?asset_symbol=${selectedAsset}&blockchain_network=${network}`);
      setAddress(res.wallet_address);
    } catch (e) {
      console.error('Failed to fetch address:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleMadeDeposit = async () => {
    if (!usdAmount || Number.parseFloat(usdAmount) <= 0) {
      toast.error('Please enter a valid USD amount first.');
      return;
    }
    setSubmitLoading(true);
    try {
      const res: any = await api.post(API_ENDPOINTS.DEPOSITS.REQUEST, {
        asset_symbol: selectedAsset,
        amount: Number.parseFloat(cryptoAmount),
        fiat_amount: Number.parseFloat(usdAmount),
        blockchain_network: selectedAsset === 'BTC' ? 'BITCOIN' : selectedAsset === 'ETH' ? 'ERC20' : 'TRC20'
      });
      setPendingDepositId(res.id);
      setShowProofModal(true);
    } catch (e: any) {
      toast.error(e.message || 'Failed to initialize deposit request.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderQRCode = () => {
    if (loading) {
      return <i className="pi pi-spin pi-spinner text-3xl text-bg-secondary"></i>;
    }

    if (address) {
      return (
        <QRCodeSVG
          value={address}
          size={200}
          level="H"
          includeMargin={false}
        />
      );
    }

    return <p className="text-text-tertiary">Select an asset to generate address</p>;
  };

  return (
    <DashboardLayout>
      <KYCGuard>
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary">Deposit Assets</h1>
            <p className="text-text-secondary">Transfer cryptocurrency to your brokerage account</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="space-y-6">
              <div className="bg-bg-secondary border border-color-border p-6 rounded-lg">
                <span className="block text-sm font-medium text-text-secondary mb-2">Select Asset</span>
                <div className="grid grid-cols-3 gap-3">
                  {assets.map((asset) => (
                    <button
                      key={asset.symbol}
                      onClick={() => setSelectedAsset(asset.symbol)}
                      className={`py-3 px-4 rounded border transition-all flex flex-col items-center gap-1 ${selectedAsset === asset.symbol
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
                <label htmlFor="deposit-amount" className="block text-sm font-medium text-text-secondary mb-2">Deposit Amount (USD Required)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-text-secondary font-bold">$</span>
                  <input
                    id="deposit-amount"
                    type="number"
                    value={usdAmount}
                    onChange={(e) => setUsdAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-bg-tertiary border border-color-border rounded pl-8 pr-12 py-3 focus:outline-none focus:border-color-primary transition text-text-primary"
                  />
                  <span className="absolute right-4 top-3.5 text-text-tertiary font-bold">USD</span>
                </div>
                {usdAmount && Number.parseFloat(usdAmount) > 0 && currentPrice > 0 && (
                  <div className="mt-3 p-3 bg-bg-tertiary rounded flex justify-between items-center border border-color-border">
                    <span className="text-sm text-text-secondary">You will pay:</span>
                    <span className="text-color-primary font-bold font-mono">{cryptoAmount} {selectedAsset}</span>
                  </div>
                )}
                <p className="mt-3 text-xs text-text-tertiary">
                  Enter the USD amount you plan to deposit.
                </p>
              </div>
            </div>

            {/* QR and Address */}
            <div className="bg-bg-secondary border border-color-border p-8 rounded-lg flex flex-col items-center text-center">
              <div className="bg-white p-4 rounded-xl mb-6 min-h-[232px] flex items-center justify-center">
                {renderQRCode()}
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

              <button
                onClick={handleMadeDeposit}
                disabled={!usdAmount || Number.parseFloat(usdAmount) <= 0 || submitLoading || loading}
                className="mt-6 w-full bg-color-primary hover:bg-color-primary-hover text-black py-4 rounded-lg font-bold text-lg transition shadow-lg shadow-color-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitLoading ? 'Processing...' : 'I Have Made Deposit'}
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-12 group">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <i className="pi pi-info-circle text-color-primary"></i> How to Deposit
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { step: 1, title: 'Select Currency', desc: 'Choose the cryptocurrency you want to deposit into your account.' },
                { step: 2, title: 'Copy Address', desc: 'Copy the unique wallet address shown above or scan the QR code.' },
                { step: 3, title: 'Send Assets', desc: 'Use your personal wallet or exchange to send the assets to your Prime Meridian Markets address.' },
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

        {showProofModal && pendingDepositId && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-bg-secondary p-6 rounded-xl w-full max-w-md border border-color-border relative">
              <button 
                onClick={() => setShowProofModal(false)}
                className="absolute top-4 right-4 text-text-secondary hover:text-text-primary"
              >
                <i className="pi pi-times"></i>
              </button>
              <h3 className="text-xl font-bold text-text-primary mb-2">Upload Proof of Payment</h3>
              <p className="text-sm text-text-secondary mb-6">
                Please upload a screenshot or receipt of your transaction to speed up the verification process.
              </p>
              
              <div className="border border-dashed border-color-border rounded-xl p-4 bg-bg-tertiary">
                <UploadDropzone
                  endpoint="proofUploader"
                  onUploadBegin={() => setUploadingProof(true)}
                  onClientUploadComplete={async (res) => {
                    setUploadingProof(false);
                    if (res && res[0]) {
                      try {
                        await api.post(API_ENDPOINTS.DEPOSITS.CONFIRM(pendingDepositId), {
                          proof_url: res[0].ufsUrl || res[0].url
                        });
                        toast.success('Proof uploaded successfully! Awaiting admin verification.');
                        setShowProofModal(false);
                        setUsdAmount('');
                      } catch (e: any) {
                        toast.error(e.message || 'Failed to confirm deposit.');
                      }
                    }
                  }}
                  onUploadError={(error: Error) => {
                    setUploadingProof(false);
                    toast.error(`Upload failed: ${error.message}`);
                  }}
                  appearance={{
                    container: "p-4 w-full",
                    label: "text-text-secondary hover:text-color-primary transition-colors",
                    allowedContent: "text-text-tertiary",
                    button: "bg-color-primary text-black font-bold mt-4"
                  }}
                />
              </div>
              
              {uploadingProof && (
                <p className="text-center text-color-primary mt-4 text-sm animate-pulse">Uploading...</p>
              )}
            </div>
          </div>
        )}
      </KYCGuard>
    </DashboardLayout>
  );
}
