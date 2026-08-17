// Admin generate-transaction page — create realistic transaction history for any user
'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminTable, TableColumn } from '@/components/admin/AdminTable';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { MessageModal } from '@/components/admin/AdminModal';
import { adminApi, adminGenerateTransactionApi } from '@/lib/adminApi';

const TX_TYPES = [
  { label: 'Daily Earnings', value: 'EARNINGS' },
  { label: 'Deposit', value: 'DEPOSIT' },
  { label: 'Withdrawal', value: 'WITHDRAWAL' },
  { label: 'Staking Reward', value: 'STAKING_REWARD' },
  { label: 'Mining Reward', value: 'MINING_REWARD' },
  { label: 'Credit', value: 'CREDIT' },
  { label: 'Debit', value: 'DEBIT' },
];

const ASSETS = ['USD', 'BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'SOL', 'XRP'];

interface UserOption {
  id: string;
  email: string;
  tier: string;
  account_balance: number;
  trading_balance: number;
}

// Helper: format date to YYYY-MM-DD for input[type=date]
function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function AdminGenerateTransactionPage() {
  // Users
  const [users, setUsers] = useState<UserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Form
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('USD');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(toDateStr(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))); // 30 days ago
  const [endDate, setEndDate] = useState(toDateStr(new Date()));
  const [submitting, setSubmitting] = useState(false);

  // Recent transactions for selected user
  const [recentTxs, setRecentTxs] = useState<any[]>([]);
  const [txsLoading, setTxsLoading] = useState(false);

  // Modal
  const [modal, setModal] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' }>({
    open: false,
    title: '',
    message: '',
    type: 'success',
  });

  // Fetch users
  useEffect(() => {
    (async () => {
      try {
        const res = await adminApi.get<UserOption[]>('/admin/users');
        setUsers(res || []);
      } catch (e) {
        console.error(e);
      } finally {
        setUsersLoading(false);
      }
    })();
  }, []);

  // Fetch recent transactions for selected user
  const fetchUserTxs = useCallback(async (userId: string) => {
    setTxsLoading(true);
    try {
      const allTxs = await adminApi.get<any[]>('/admin/transactions');
      const userTxs = (allTxs || []).filter((t: any) => {
        const matchUser = users.find((u) => u.id === userId);
        if (!matchUser) return false;
        return t.user_email === matchUser.email;
      });
      setRecentTxs(userTxs.slice(0, 20));
    } catch (e) {
      console.error(e);
    } finally {
      setTxsLoading(false);
    }
  }, [users]);

  useEffect(() => {
    if (selectedUser) {
      fetchUserTxs(selectedUser.id);
    } else {
      setRecentTxs([]);
    }
  }, [selectedUser, fetchUserTxs]);

  // Filtered users for dropdown
  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.id.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Toggle type
  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Select all / clear all
  const toggleAllTypes = () => {
    if (selectedTypes.length === TX_TYPES.length) {
      setSelectedTypes([]);
    } else {
      setSelectedTypes(TX_TYPES.map((t) => t.value));
    }
  };

  // Estimate transaction count based on date range
  const getEstimatedTxCount = (): { min: number; max: number } => {
    if (!startDate || !endDate) return { min: 0, max: 0 };
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    // Backend uses 2-5 per day, capped at 50
    const minCount = Math.max(selectedTypes.length, days * 2);
    const maxCount = Math.min(50, days * 5);
    return { min: Math.min(minCount, 50), max: maxCount };
  };

  // Submit
  const handleSubmit = async () => {
    if (!selectedUser) return;
    if (selectedTypes.length === 0) return;
    if (!amount || parseFloat(amount) <= 0) return;
    if (!startDate || !endDate) return;

    setSubmitting(true);
    try {
      const result = await adminGenerateTransactionApi.generate({
        user_id: selectedUser.id,
        types: selectedTypes,
        amount: parseFloat(amount),
        asset_symbol: asset,
        description: description.trim() || undefined,
        start_date: startDate,
        end_date: endDate,
      });

      const priceInfo = asset !== 'USD' && result.asset_price_used
        ? `\n${asset} Price Used: $${result.asset_price_used.toLocaleString()}\nTotal ${asset}: ${result.total_asset_amount.toFixed(8)}`
        : '';

      setModal({
        open: true,
        title: 'Transactions Generated',
        message: `${result.message}${priceInfo}\n\nNew Account Balance: $${result.new_account_balance.toLocaleString()}\nNew Trading Balance: $${result.new_trading_balance.toLocaleString()}`,
        type: 'success',
      });

      // Reset form
      setSelectedTypes([]);
      setAmount('');
      setDescription('');

      // Refresh recent txs
      fetchUserTxs(selectedUser.id);

      // Update user in the list with new balances
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? { ...u, account_balance: result.new_account_balance, trading_balance: result.new_trading_balance }
            : u
        )
      );
      setSelectedUser((prev) =>
        prev ? { ...prev, account_balance: result.new_account_balance, trading_balance: result.new_trading_balance } : prev
      );
    } catch (e: any) {
      setModal({
        open: true,
        title: 'Error',
        message: e.message || 'Failed to generate transaction',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Recent transactions table columns
  const txColumns: TableColumn<any>[] = [
    {
      key: 'type',
      header: 'Type',
      render: (t) => <AdminBadge status={t.type} />,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (t) => (
        <span className={`font-mono text-xs font-black ${t.amount < 0 ? 'text-color-danger' : 'text-color-success'}`}>
          {t.amount > 0 ? '+' : ''}{t.amount} {t.asset_symbol}
        </span>
      ),
    },
    {
      key: 'usd',
      header: 'USD Value',
      render: (t) => (
        <span className="text-text-tertiary text-[10px] font-mono">
          ${(t.usd_amount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => <AdminBadge status={t.status || 'COMPLETED'} />,
    },
    {
      key: 'date',
      header: 'Date',
      render: (t) => (
        <span className="text-text-tertiary text-xs">
          {new Date(t.created_at).toLocaleString()}
        </span>
      ),
    },
  ];

  const isFormValid = selectedUser && selectedTypes.length > 0 && amount && parseFloat(amount) > 0 && startDate && endDate;
  const estimatedCount = getEstimatedTxCount();

  return (
    <AdminAuthGuard>
      <AdminLayout title="Generate Transaction">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <p className="text-text-secondary text-sm">
              Generate realistic transaction history for a user. The total amount will be broken into multiple
              smaller transactions, converted to the selected asset at live market price, and spread across the date range
              with unique timestamps (≥45 min apart).
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-bg-secondary border border-color-border rounded-xl p-6 space-y-6">
            {/* User Selection */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-tertiary">
                Select User
              </label>
              <div className="relative">
                <div
                  className="w-full bg-bg-primary border border-color-border rounded-lg px-4 py-3 cursor-pointer flex items-center justify-between"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  {selectedUser ? (
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-color-primary/10 flex items-center justify-center text-[10px] font-black text-color-primary border border-color-primary/20">
                        {selectedUser.email[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-text-primary text-sm font-bold">{selectedUser.email}</span>
                        <span className="text-text-tertiary text-[10px] font-mono">
                          Balance: ${(selectedUser.account_balance || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-text-secondary text-sm">
                      {usersLoading ? 'Loading users...' : 'Click to select a user'}
                    </span>
                  )}
                  <i className={`pi pi-chevron-${showDropdown ? 'up' : 'down'} text-text-tertiary text-xs`} />
                </div>

                {showDropdown && (
                  <div className="absolute z-20 mt-1 w-full bg-bg-secondary border border-color-border rounded-lg shadow-2xl max-h-64 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-color-border shrink-0">
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search by email or ID..."
                        className="w-full bg-bg-primary border border-color-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-color-primary"
                        autoFocus
                      />
                    </div>
                    <div className="overflow-y-auto max-h-48">
                      {filteredUsers.length === 0 ? (
                        <div className="p-4 text-center text-text-tertiary text-xs">No users found</div>
                      ) : (
                        filteredUsers.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            className={`w-full text-left px-4 py-3 hover:bg-bg-tertiary transition flex items-center gap-3 ${
                              selectedUser?.id === u.id ? 'bg-color-primary/5' : ''
                            }`}
                            onClick={() => {
                              setSelectedUser(u);
                              setShowDropdown(false);
                              setUserSearch('');
                            }}
                          >
                            <div className="w-6 h-6 rounded-full bg-bg-tertiary flex items-center justify-center text-[9px] font-black text-text-secondary border border-color-border">
                              {u.email[0].toUpperCase()}
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-text-primary text-xs font-bold truncate">{u.email}</span>
                              <span className="text-text-tertiary text-[10px] font-mono truncate">
                                {u.tier} • ${(u.account_balance || 0).toLocaleString()}
                              </span>
                            </div>
                            {selectedUser?.id === u.id && (
                              <i className="pi pi-check text-color-primary text-xs" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction Types — Multi-select */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-widest text-text-tertiary">
                  Transaction Type(s)
                </label>
                <button
                  type="button"
                  onClick={toggleAllTypes}
                  className="text-[10px] text-color-primary hover:underline font-bold uppercase tracking-wide"
                >
                  {selectedTypes.length === TX_TYPES.length ? 'Clear All' : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TX_TYPES.map((t) => {
                  const isSelected = selectedTypes.includes(t.value);
                  const colorMap: Record<string, string> = {
                    DEPOSIT: 'border-color-success/40 bg-color-success/5 text-color-success',
                    WITHDRAWAL: 'border-color-danger/40 bg-color-danger/5 text-color-danger',
                    EARNINGS: 'border-color-success/40 bg-color-success/5 text-color-success',
                    STAKING_REWARD: 'border-color-primary/40 bg-color-primary/5 text-color-primary',
                    MINING_REWARD: 'border-color-primary/40 bg-color-primary/5 text-color-primary',
                    CREDIT: 'border-color-primary/40 bg-color-primary/5 text-color-primary',
                    DEBIT: 'border-color-warning/40 bg-color-warning/5 text-color-warning',
                  };
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => toggleType(t.value)}
                      className={`relative py-3 px-4 rounded-lg border text-sm font-bold transition-all ${
                        isSelected
                          ? colorMap[t.value]
                          : 'border-color-border bg-bg-primary text-text-secondary hover:border-text-tertiary'
                      }`}
                    >
                      {isSelected && (
                        <i className="pi pi-check absolute top-1.5 right-1.5 text-[9px]" />
                      )}
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount + Asset Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-tertiary">
                  Total Amount <span className="text-text-secondary font-normal normal-case">(in USD)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary font-mono text-lg">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="any"
                    className="w-full bg-bg-primary border border-color-border rounded-lg pl-9 pr-4 py-3 text-text-primary font-mono text-lg placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-color-primary"
                  />
                </div>
                {amount && parseFloat(amount) > 0 && asset !== 'USD' && (
                  <p className="text-[10px] text-color-primary font-mono">
                    ≈ Will be converted to {asset} at live market price
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-tertiary">
                  Asset
                </label>
                <select
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                  className="w-full bg-bg-primary border border-color-border rounded-lg px-4 py-3 text-text-primary font-mono text-lg focus:outline-none focus:ring-2 focus:ring-color-primary appearance-none cursor-pointer"
                >
                  {ASSETS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-tertiary">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-bg-primary border border-color-border rounded-lg px-4 py-3 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-color-primary [color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-tertiary">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-bg-primary border border-color-border rounded-lg px-4 py-3 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-color-primary [color-scheme:dark]"
                />
              </div>
            </div>
            {startDate && endDate && (
              <p className="text-[10px] text-text-tertiary font-mono -mt-3">
                Estimated: ~{estimatedCount.min}–{estimatedCount.max} transactions will be generated with unique timestamps (≥45 min apart)
              </p>
            )}

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-tertiary">
                Description <span className="text-text-secondary font-normal normal-case">(optional)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Auto-generated if left empty"
                className="w-full bg-bg-primary border border-color-border rounded-lg px-4 py-3 text-text-primary text-sm placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-color-primary"
              />
            </div>

            {/* Summary */}
            {isFormValid && (
              <div className="bg-bg-tertiary/50 border border-color-border rounded-lg p-4 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Summary</p>
                <div className="text-sm text-text-primary space-y-1">
                  <p>
                    <span className="text-text-secondary">User:</span>{' '}
                    <span className="font-bold">{selectedUser?.email}</span>
                  </p>
                  <p>
                    <span className="text-text-secondary">Types:</span>{' '}
                    <span className="font-bold">{selectedTypes.join(', ')}</span>
                  </p>
                  <p>
                    <span className="text-text-secondary">Total USD:</span>{' '}
                    <span className="font-bold font-mono">${parseFloat(amount).toLocaleString()}</span>
                    {asset !== 'USD' && (
                      <span className="text-text-tertiary text-xs"> → converted to {asset} at live price</span>
                    )}
                  </p>
                  <p>
                    <span className="text-text-secondary">Date Range:</span>{' '}
                    <span className="font-bold">{new Date(startDate).toLocaleDateString()} → {new Date(endDate).toLocaleDateString()}</span>
                  </p>
                  <p>
                    <span className="text-text-secondary">Estimated Transactions:</span>{' '}
                    <span className="font-bold">{estimatedCount.min}–{estimatedCount.max}</span>
                    <span className="text-text-tertiary text-xs"> (broken down with random amounts, unique times)</span>
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!isFormValid || submitting}
              className="w-full py-4 bg-color-primary text-bg-primary rounded-lg font-black text-sm uppercase tracking-widest transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-color-primary/20"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="pi pi-spin pi-spinner" /> Generating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <i className="pi pi-plus-circle" /> Generate Transaction History
                </span>
              )}
            </button>
          </div>

          {/* Recent Transactions for Selected User */}
          {selectedUser && (
            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">
                  Recent Transactions — {selectedUser.email}
                </h3>
                <button
                  onClick={() => fetchUserTxs(selectedUser.id)}
                  className="text-xs text-text-tertiary hover:text-color-primary transition font-bold flex items-center gap-1"
                >
                  <i className="pi pi-refresh text-[10px]" /> Refresh
                </button>
              </div>
              <div className="bg-bg-secondary p-1 rounded-xl shadow-sm">
                <AdminTable
                  columns={txColumns}
                  data={recentTxs}
                  loading={txsLoading}
                  emptyMessage="No transactions found for this user."
                />
              </div>
            </div>
          )}
        </div>

        {/* Result Modal */}
        <MessageModal
          isOpen={modal.open}
          onClose={() => setModal((prev) => ({ ...prev, open: false }))}
          title={modal.title}
          message={modal.message}
          type={modal.type}
        />
      </AdminLayout>
    </AdminAuthGuard>
  );
}
