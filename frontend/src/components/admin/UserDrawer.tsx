// Admin user details drawer — full screen on mobile, right-side panel on desktop
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AdminBadge } from './AdminBadge';
import { AdminModal } from './AdminModal';
import { adminUsersApi } from '@/lib/adminApi';

export function UserDrawer({
  user,
  isOpen,
  onClose,
  onUpdateStatus,
  onRefresh,
}: {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onRefresh?: () => void;
}) {
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpTarget, setTopUpTarget] = useState('both');
  const [topUpDescription, setTopUpDescription] = useState('Admin Balance Top Up');
  const [submittingTopUp, setSubmittingTopUp] = useState(false);
  const [topUpFeedback, setTopUpFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) return null;

  const isSuspended = user.status?.toLowerCase() === 'suspended';

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopUpFeedback(null);
    const amountVal = parseFloat(topUpAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setTopUpFeedback({ type: 'error', text: 'Please enter a valid positive amount.' });
      return;
    }

    setSubmittingTopUp(true);
    try {
      const res = await adminUsersApi.topUpBalance(user.id, {
        amount: amountVal,
        target: topUpTarget,
        mode: 'add',
        description: topUpDescription.trim() || 'Admin Balance Top Up',
      });

      // Update local user balances immediately
      user.trading_balance = res.trading_balance;
      user.account_balance = res.account_balance;

      setTopUpFeedback({
        type: 'success',
        text: `Successfully added $${amountVal.toLocaleString()} to user balance!`,
      });
      setTopUpAmount('');

      if (onRefresh) {
        onRefresh();
      }
    } catch (err: any) {
      setTopUpFeedback({
        type: 'error',
        text: err?.message || 'Failed to top up balance. Please try again.',
      });
    } finally {
      setSubmittingTopUp(false);
    }
  };

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title="User Details" size="lg">
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4 border-b border-color-border pb-6">
          <div className="w-16 h-16 rounded-full bg-color-primary/10 border border-color-primary/20 flex items-center justify-center text-color-primary text-2xl font-black">
            {user.email[0].toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">{user.email}</h3>
            <p className="text-text-tertiary text-xs font-mono">{user.id}</p>
            <div className="flex gap-2 mt-2">
              <AdminBadge status={user.tier} />
              <AdminBadge status={user.status} />
              <AdminBadge status={user.kyc_status} />
            </div>
            {user.kyc_status && user.kyc_status !== 'UNVERIFIED' && (
              <a 
                href={`/admin/kyc`} 
                className="inline-block mt-2 text-[10px] font-bold text-color-primary hover:underline"
              >
                Review KYC Documents →
              </a>
            )}
          </div>
        </div>

        {/* Info Grid & Top Up Banner */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-tertiary uppercase font-black tracking-widest">
              Financial Balances
            </span>
            <button
              onClick={() => setShowTopUp(!showTopUp)}
              className="text-xs font-bold text-color-primary hover:underline flex items-center gap-1"
            >
              <i className={`pi ${showTopUp ? 'pi-minus-circle' : 'pi-plus-circle'}`} />
              {showTopUp ? 'Hide Top Up Form' : '+ Top Up Balance'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-bg-tertiary/30 p-3 rounded-lg border border-color-border/50 relative">
              <p className="text-[10px] text-text-tertiary uppercase font-black mb-1">Trading Balance</p>
              <p className="text-xl font-black text-text-primary font-mono">
                ${(user.trading_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-bg-tertiary/30 p-3 rounded-lg border border-color-border/50 relative">
              <p className="text-[10px] text-text-tertiary uppercase font-black mb-1">Account Equity</p>
              <p className="text-xl font-black text-text-primary font-mono">
                ${(user.account_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="col-span-2 bg-bg-tertiary/30 p-3 rounded-lg border border-color-border/50">
              <p className="text-[10px] text-text-tertiary uppercase font-black mb-1">Joined Date</p>
              <p className="text-sm font-bold text-text-secondary">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>

          {/* Quick Top-Up Form */}
          {showTopUp && (
            <form onSubmit={handleTopUpSubmit} className="bg-bg-tertiary/60 border border-color-primary/40 rounded-xl p-4 space-y-3 mt-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-color-primary tracking-wider flex items-center gap-1.5">
                  <i className="pi pi-wallet" /> Quick Top Up User Balance
                </span>
                <span className="text-[10px] text-text-tertiary">Real-time update</span>
              </div>

              {topUpFeedback && (
                <div
                  className={`p-2.5 rounded-lg text-xs font-bold ${
                    topUpFeedback.type === 'success'
                      ? 'bg-color-success/10 text-color-success border border-color-success/30'
                      : 'bg-color-danger/10 text-color-danger border border-color-danger/30'
                  }`}
                >
                  {topUpFeedback.text}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-black text-text-tertiary mb-1">
                    Amount ($ USD)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 5000"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    required
                    className="w-full bg-bg-primary border border-color-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-color-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-text-tertiary mb-1">
                    Apply To
                  </label>
                  <select
                    value={topUpTarget}
                    onChange={(e) => setTopUpTarget(e.target.value)}
                    className="w-full bg-bg-primary border border-color-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-color-primary"
                  >
                    <option value="both">Both (Trading & Account Equity)</option>
                    <option value="trading">Trading Balance (Updates Net Worth)</option>
                    <option value="account">Account Equity (Updates Trading Balance)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-text-tertiary mb-1">
                  Description / Reference Note
                </label>
                <input
                  type="text"
                  placeholder="Admin Balance Top Up"
                  value={topUpDescription}
                  onChange={(e) => setTopUpDescription(e.target.value)}
                  className="w-full bg-bg-primary border border-color-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-color-primary"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submittingTopUp}
                  className="flex-1 py-2.5 bg-color-primary text-bg-primary rounded-lg font-bold text-xs uppercase tracking-wider hover:opacity-90 transition disabled:opacity-50"
                >
                  {submittingTopUp ? 'Crediting...' : 'Confirm Top Up'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTopUp(false)}
                  className="px-4 py-2.5 bg-bg-primary text-text-tertiary rounded-lg font-bold text-xs hover:text-text-primary transition border border-color-border"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-color-border space-y-3">
          <p className="text-[10px] text-text-tertiary uppercase font-black mb-1">Administrative Actions</p>
          <div className="flex flex-col gap-2">
            {/* Top Up Balance Action Button */}
            <button
              onClick={() => setShowTopUp(true)}
              className="w-full py-2.5 rounded-lg bg-color-primary/10 text-color-primary border border-color-primary/30 font-bold text-sm hover:bg-color-primary/20 transition flex items-center justify-center gap-2"
            >
              <i className="pi pi-plus-circle" /> Top Up User Balance ($ USD)
            </button>

            {/* Link to Full Transaction History Generator */}
            <Link
              href="/admin/generate-transaction"
              className="w-full py-2.5 rounded-lg bg-bg-tertiary text-text-primary border border-color-border font-bold text-xs hover:bg-bg-elevated transition text-center block"
            >
              Generate Full Transaction History →
            </Link>

            {user.status?.toUpperCase() !== 'ACTIVE' && (
              <button
                onClick={() => onUpdateStatus(user.id, 'ACTIVE')}
                className="w-full py-2.5 rounded-lg bg-color-success text-bg-primary font-bold text-sm hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg shadow-color-success/20"
              >
                <i className="pi pi-check-circle" /> Approve Account & Send Welcome Email
              </button>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => onUpdateStatus(user.id, isSuspended ? 'ACTIVE' : 'SUSPENDED')}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${
                  isSuspended
                    ? 'bg-color-success text-bg-primary hover:bg-color-success/90'
                    : 'bg-color-danger/10 text-color-danger border border-color-danger/30 hover:bg-color-danger/20'
                }`}
              >
                {isSuspended ? 'Lift Suspension' : 'Suspend Account'}
              </button>
              <button className="flex-1 py-2 rounded-lg bg-bg-tertiary text-text-primary text-sm font-bold hover:bg-bg-elevated transition border border-color-border">
                Reset Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminModal>
  );
}
