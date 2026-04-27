'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export default function WalletsPage() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [depositForm, setDepositForm] = useState({ asset_symbol: 'BTC', amount: 0 });
  const [withdrawForm, setWithdrawForm] = useState({ asset_symbol: 'BTC', amount: 0, to_address: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [walletsRes, depositsRes, withdrawalsRes] = (await Promise.all([
        api.get(API_ENDPOINTS.WALLETS.LIST).catch(() => []),
        api.get(API_ENDPOINTS.WALLETS.DEPOSIT_HISTORY).catch(() => []),
        api.get(API_ENDPOINTS.WALLETS.WITHDRAW_HISTORY).catch(() => [])
      ])) as [any[], any[], any[]];
      setWallets(walletsRes || []);
      setDeposits(depositsRes || []);
      setWithdrawals(withdrawalsRes || []);
      setError('');
    } catch (err) {
      setError('Failed to load wallets');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    try {
      setSubmitting(true);
      await api.post(API_ENDPOINTS.WALLETS.DEPOSIT, depositForm);
      setShowDepositForm(false);
      setDepositForm({ asset_symbol: 'BTC', amount: 0 });
      await loadWalletData();
    } catch (err: any) {
      setError('Deposit failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setSubmitting(true);
      await api.post(API_ENDPOINTS.WALLETS.WITHDRAW, withdrawForm);
      setShowWithdrawForm(false);
      setWithdrawForm({ asset_symbol: 'BTC', amount: 0, to_address: '' });
      await loadWalletData();
    } catch (err: any) {
      setError('Withdrawal failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <main className="min-h-screen bg-bg-primary flex items-center justify-center">
      <p className="text-text-primary">Loading wallets...</p>
    </main>
  );

  const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);

  return (
    <main className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="font-display text-5xl font-bold text-text-primary mb-8">Wallets</h1>

        {error && <div className="bg-color-danger bg-opacity-20 border border-color-danger text-color-danger px-4 py-3 rounded mb-6">{error}</div>}

        {/* Balance Summary */}
        <div className="bg-bg-secondary border border-color-border rounded-lg p-8 mb-8">
          <h2 className="font-display text-2xl font-bold text-text-primary mb-6">Total Balance</h2>
          <p className="font-mono text-5xl font-bold text-color-primary">${totalBalance.toFixed(2)}</p>
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => setShowDepositForm(!showDepositForm)}
              className="px-6 py-3 bg-color-success hover:opacity-90 text-bg-primary font-semibold rounded transition-colors"
            >
              Deposit
            </button>
            <button
              onClick={() => setShowWithdrawForm(!showWithdrawForm)}
              className="px-6 py-3 bg-color-danger hover:opacity-90 text-white font-semibold rounded transition-colors"
            >
              Withdraw
            </button>
            <Link
              href="/cold-storage"
              className="px-6 py-3 bg-color-info hover:opacity-90 text-white font-semibold rounded transition-colors"
            >
              Move to Cold Storage
            </Link>
          </div>
        </div>

        {/* Deposit Form */}
        {showDepositForm && (
          <div className="bg-bg-secondary border border-color-border rounded-lg p-8 mb-8">
            <h2 className="font-display text-2xl font-bold text-text-primary mb-6">Initiate Deposit</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Asset (BTC, ETH...)"
                value={depositForm.asset_symbol}
                onChange={(e) => setDepositForm({ ...depositForm, asset_symbol: e.target.value.toUpperCase() })}
                className="px-4 py-3 bg-bg-primary border border-color-border rounded text-text-primary"
              />
              <input
                type="number"
                step="0.0001"
                placeholder="Amount"
                value={depositForm.amount}
                onChange={(e) => setDepositForm({ ...depositForm, amount: parseFloat(e.target.value) })}
                className="px-4 py-3 bg-bg-primary border border-color-border rounded text-text-primary"
              />
              <button
                onClick={handleDeposit}
                disabled={submitting}
                className="px-6 py-3 bg-color-success hover:opacity-90 text-bg-primary font-semibold rounded transition-colors disabled:opacity-50"
              >
                {submitting ? 'Processing...' : 'Generate Address'}
              </button>
            </div>
          </div>
        )}

        {/* Withdraw Form */}
        {showWithdrawForm && (
          <div className="bg-bg-secondary border border-color-border rounded-lg p-8 mb-8">
            <h2 className="font-display text-2xl font-bold text-text-primary mb-6">Request Withdrawal</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Asset (BTC, ETH...)"
                  value={withdrawForm.asset_symbol}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, asset_symbol: e.target.value.toUpperCase() })}
                  className="px-4 py-3 bg-bg-primary border border-color-border rounded text-text-primary"
                />
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Amount"
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: parseFloat(e.target.value) })}
                  className="px-4 py-3 bg-bg-primary border border-color-border rounded text-text-primary"
                />
              </div>
              <input
                type="text"
                placeholder="Recipient Address"
                value={withdrawForm.to_address}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, to_address: e.target.value })}
                className="w-full px-4 py-3 bg-bg-primary border border-color-border rounded text-text-primary"
              />
              <button
                onClick={handleWithdraw}
                disabled={submitting}
                className="w-full px-6 py-3 bg-color-danger hover:opacity-90 text-white font-semibold rounded transition-colors disabled:opacity-50"
              >
                {submitting ? 'Processing...' : 'Request Withdrawal'}
              </button>
            </div>
          </div>
        )}

        {/* Wallets */}
        {wallets.length > 0 && (
          <div className="bg-bg-secondary border border-color-border rounded-lg p-8 mb-8">
            <h2 className="font-display text-2xl font-bold text-text-primary mb-6">Your Wallets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {wallets.map((w: any) => (
                <div key={w.id} className="bg-bg-primary border border-color-border rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-mono font-bold text-color-primary mb-1">{w.asset_symbol}</p>
                      <p className="text-text-secondary text-sm">{w.wallet_type}</p>
                    </div>
                    <p className="font-mono text-2xl font-bold text-text-primary">${(w.balance || 0).toFixed(2)}</p>
                  </div>
                  {w.address && (
                    <div className="mt-4 p-3 bg-bg-secondary rounded text-xs text-text-secondary break-all">
                      {w.address}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deposit History */}
        {deposits.length > 0 && (
          <div className="bg-bg-secondary border border-color-border rounded-lg p-8 mb-8">
            <h2 className="font-display text-2xl font-bold text-text-primary mb-6">Deposit History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-color-border">
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">Date</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">Asset</th>
                    <th className="text-right py-3 px-4 text-text-secondary font-semibold">Amount</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map((d: any) => (
                    <tr key={d.id} className="border-b border-color-border hover:bg-bg-tertiary">
                      <td className="py-4 px-4 text-text-secondary">{new Date(d.created_at).toLocaleDateString()}</td>
                      <td className="py-4 px-4 font-mono font-bold text-color-primary">{d.asset_symbol}</td>
                      <td className="py-4 px-4 text-right font-mono text-text-primary">${(d.amount || 0).toFixed(2)}</td>
                      <td className="py-4 px-4">
                        <span className="text-xs font-semibold px-3 py-1 rounded bg-color-warning bg-opacity-20 text-color-warning">
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Withdrawal History */}
        {withdrawals.length > 0 && (
          <div className="bg-bg-secondary border border-color-border rounded-lg p-8">
            <h2 className="font-display text-2xl font-bold text-text-primary mb-6">Withdrawal History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-color-border">
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">Date</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">Asset</th>
                    <th className="text-right py-3 px-4 text-text-secondary font-semibold">Amount</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w: any) => (
                    <tr key={w.id} className="border-b border-color-border hover:bg-bg-tertiary">
                      <td className="py-4 px-4 text-text-secondary">{new Date(w.created_at).toLocaleDateString()}</td>
                      <td className="py-4 px-4 font-mono font-bold text-color-primary">{w.asset_symbol}</td>
                      <td className="py-4 px-4 text-right font-mono text-text-primary">${(w.amount || 0).toFixed(2)}</td>
                      <td className="py-4 px-4">
                        <span className={`text-xs font-semibold px-3 py-1 rounded ${w.status === 'COMPLETED' ? 'bg-color-success bg-opacity-20 text-color-success' : 'bg-color-warning bg-opacity-20 text-color-warning'}`}>
                          {w.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
