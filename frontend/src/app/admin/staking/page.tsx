// Admin staking management page — create/manage pools, set APY, view all user stakes
'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminTable, TableColumn } from '@/components/admin/AdminTable';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminModal } from '@/components/admin/AdminModal';
import { adminApi } from '@/lib/adminApi';

interface StakingPool {
  id: string;
  asset_symbol: string;
  staking_type: string;
  annual_percentage_yield: number;
  min_stake_amount: number;
  lock_period_days: number;
  payout_frequency: string;
  total_staked_amount: number;
  pool_capacity_amount: number | null;
  active_users_count: number;
  is_active: boolean;
}

interface UserStake {
  id: string;
  user_email: string;
  asset_symbol: string;
  amount_staked: number;
  earned_so_far: number;
  annual_earning_rate: number;
  is_locked: boolean;
  started_at: string;
}

export default function AdminStakingPage() {
  const [activeTab, setActiveTab] = useState<'pools' | 'stakes'>('pools');
  const [pools, setPools] = useState<StakingPool[]>([]);
  const [stakes, setStakes] = useState<UserStake[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPool, setEditPool] = useState<StakingPool | null>(null);
  const [newPool, setNewPool] = useState({
    asset_symbol: 'USDT',
    staking_type: 'FLEXIBLE',
    annual_percentage_yield: 10,
    min_stake_amount: 100,
    lock_period_days: 0,
    payout_frequency: 'DAILY',
    pool_capacity_amount: 1000000,
  });

  const fetchPools = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get<StakingPool[]>('/staking/pools');
      setPools(res);
    } catch (err: any) {
      console.error('Failed to fetch pools:', err);
      // Show user-friendly error message
      if (err.message.includes('Failed to fetch')) {
        console.warn('Backend server may not be running. Using empty data.');
      }
      setPools([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStakes = useCallback(async () => {
    setLoading(true);
    try {
      // This endpoint would need to be created in backend
      const res = await adminApi.get<UserStake[]>('/admin/staking/all-stakes').catch(() => []);
      setStakes(res);
    } catch (err: any) {
      console.error('Failed to fetch stakes:', err);
      if (err.message.includes('Failed to fetch')) {
        console.warn('Backend server may not be running. Using empty data.');
      }
      setStakes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'pools') {
      fetchPools();
    } else {
      fetchStakes();
    }
  }, [activeTab, fetchPools, fetchStakes]);

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.post('/staking/admin/pools', newPool);
      setModalOpen(false);
      setNewPool({
        asset_symbol: 'USDT',
        staking_type: 'FLEXIBLE',
        annual_percentage_yield: 10,
        min_stake_amount: 100,
        lock_period_days: 0,
        payout_frequency: 'DAILY',
        pool_capacity_amount: 1000000,
      });
      await fetchPools();
    } catch (err: any) {
      alert(err.message || 'Failed to create pool');
    }
  };

  const handleUpdatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPool) return;
    
    try {
      await adminApi.put(`/staking/admin/pools/${editPool.id}`, {
        annual_percentage_yield: editPool.annual_percentage_yield,
        min_stake_amount: editPool.min_stake_amount,
        pool_capacity_amount: editPool.pool_capacity_amount,
        is_active: editPool.is_active,
        payout_frequency: editPool.payout_frequency,
      });
      setEditPool(null);
      await fetchPools();
    } catch (err: any) {
      alert(err.message || 'Failed to update pool');
    }
  };

  const togglePoolStatus = async (pool: StakingPool) => {
    try {
      await adminApi.put(`/staking/admin/pools/${pool.id}`, {
        is_active: !pool.is_active,
      });
      await fetchPools();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle pool status');
    }
  };

  const poolColumns: TableColumn<StakingPool>[] = [
    {
      key: 'asset',
      header: 'Asset / Type',
      render: (p) => (
        <div className="flex flex-col">
          <span className="font-black text-text-primary text-xs">{p.asset_symbol}</span>
          <span className="text-[10px] text-text-tertiary">{p.staking_type}</span>
        </div>
      ),
    },
    {
      key: 'apy',
      header: 'APY',
      render: (p) => (
        <span className="font-mono text-xs text-color-success font-bold">
          {p.annual_percentage_yield.toFixed(2)}%
        </span>
      ),
    },
    {
      key: 'min_stake',
      header: 'Min Stake',
      render: (p) => (
        <span className="text-xs text-text-primary">
          {p.min_stake_amount.toLocaleString()} {p.asset_symbol}
        </span>
      ),
    },
    {
      key: 'lock',
      header: 'Lock Period',
      render: (p) => (
        <span className="text-xs text-text-secondary">
          {p.lock_period_days === 0 ? 'Flexible' : `${p.lock_period_days} days`}
        </span>
      ),
    },
    {
      key: 'payout',
      header: 'Payout',
      render: (p) => (
        <span className="text-xs text-text-secondary">{p.payout_frequency}</span>
      ),
    },
    {
      key: 'tvl',
      header: 'TVL / Capacity',
      render: (p) => (
        <div className="flex flex-col">
          <span className="text-xs text-text-primary font-semibold">
            {p.total_staked_amount.toLocaleString()}
          </span>
          {p.pool_capacity_amount && (
            <span className="text-[10px] text-text-tertiary">
              / {p.pool_capacity_amount.toLocaleString()}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'users',
      header: 'Users',
      render: (p) => (
        <span className="text-xs text-text-primary">{p.active_users_count}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <AdminBadge status={p.is_active ? 'Active' : 'Inactive'} />,
    },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setEditPool(p)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border bg-bg-tertiary text-text-primary border-color-border hover:bg-bg-elevated transition"
          >
            Edit
          </button>
          <button
            onClick={() => togglePoolStatus(p)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
              p.is_active
                ? 'bg-color-danger/10 text-color-danger border-color-danger/30 hover:bg-color-danger/20'
                : 'bg-color-success/10 text-color-success border-color-success/30 hover:bg-color-success/20'
            }`}
          >
            {p.is_active ? 'Disable' : 'Enable'}
          </button>
        </div>
      ),
      className: 'text-right',
    },
  ];

  const stakeColumns: TableColumn<UserStake>[] = [
    {
      key: 'user',
      header: 'User',
      render: (s) => (
        <span className="text-xs text-text-primary">{s.user_email}</span>
      ),
    },
    {
      key: 'asset',
      header: 'Asset',
      render: (s) => (
        <span className="font-black text-xs text-text-primary">{s.asset_symbol}</span>
      ),
    },
    {
      key: 'staked',
      header: 'Staked Amount',
      render: (s) => (
        <span className="text-xs text-text-primary font-semibold">
          {s.amount_staked.toLocaleString()} {s.asset_symbol}
        </span>
      ),
    },
    {
      key: 'earned',
      header: 'Earned',
      render: (s) => (
        <span className="text-xs text-color-success font-semibold">
          {s.earned_so_far.toLocaleString()} {s.asset_symbol}
        </span>
      ),
    },
    {
      key: 'rate',
      header: 'Annual Rate',
      render: (s) => (
        <span className="text-xs text-text-secondary">
          {s.annual_earning_rate.toLocaleString()} {s.asset_symbol}/yr
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => <AdminBadge status={s.is_locked ? 'Locked' : 'Active'} />,
    },
    {
      key: 'started',
      header: 'Started',
      render: (s) => (
        <span className="text-xs text-text-tertiary">
          {new Date(s.started_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <AdminAuthGuard>
      <AdminLayout title="Staking Management">
        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setActiveTab('pools')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
              activeTab === 'pools'
                ? 'bg-color-primary text-bg-primary'
                : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
            }`}
          >
            Pools
          </button>
          <button
            onClick={() => setActiveTab('stakes')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
              activeTab === 'stakes'
                ? 'bg-color-primary text-bg-primary'
                : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
            }`}
          >
            All User Stakes
          </button>
        </div>

        {activeTab === 'pools' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-text-secondary text-sm">
                Create and manage staking pools, set APY rates, and control pool capacity.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="bg-color-primary text-bg-primary px-4 py-2 rounded-lg text-xs font-bold hover:bg-color-primary-hover transition flex items-center gap-2"
              >
                <i className="pi pi-plus text-[10px]" />
                Create Pool
              </button>
            </div>

            <div className="bg-bg-secondary p-1 rounded-xl shadow-sm">
              <AdminTable
                columns={poolColumns}
                data={pools}
                loading={loading}
                emptyMessage="No staking pools configured."
              />
            </div>
          </>
        )}

        {activeTab === 'stakes' && (
          <>
            <div className="mb-6">
              <p className="text-text-secondary text-sm">
                View all active staking positions across all users.
              </p>
            </div>

            <div className="bg-bg-secondary p-1 rounded-xl shadow-sm">
              <AdminTable
                columns={stakeColumns}
                data={stakes}
                loading={loading}
                emptyMessage="No active stakes found."
              />
            </div>
          </>
        )}

        {/* Create Pool Modal */}
        <AdminModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Create Staking Pool"
        >
          <form onSubmit={handleCreatePool} className="space-y-4">
            <div>
              <label className="block text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1.5">
                Asset Symbol
              </label>
              <input
                type="text"
                value={newPool.asset_symbol}
                onChange={(e) => setNewPool({ ...newPool, asset_symbol: e.target.value.toUpperCase() })}
                className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1.5">
                Staking Type
              </label>
              <select
                value={newPool.staking_type}
                onChange={(e) => setNewPool({ ...newPool, staking_type: e.target.value })}
                className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-3 py-2 text-sm"
              >
                <option value="FLEXIBLE">Flexible</option>
                <option value="FIXED_30">Fixed 30 Days</option>
                <option value="FIXED_90">Fixed 90 Days</option>
                <option value="FIXED_180">Fixed 180 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1.5">
                Annual APY (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={newPool.annual_percentage_yield}
                onChange={(e) => setNewPool({ ...newPool, annual_percentage_yield: parseFloat(e.target.value) })}
                className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1.5">
                Min Stake Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={newPool.min_stake_amount}
                onChange={(e) => setNewPool({ ...newPool, min_stake_amount: parseFloat(e.target.value) })}
                className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1.5">
                Lock Period (Days)
              </label>
              <input
                type="number"
                value={newPool.lock_period_days}
                onChange={(e) => setNewPool({ ...newPool, lock_period_days: parseInt(e.target.value) })}
                className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1.5">
                Payout Frequency
              </label>
              <select
                value={newPool.payout_frequency}
                onChange={(e) => setNewPool({ ...newPool, payout_frequency: e.target.value })}
                className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-3 py-2 text-sm"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1.5">
                Pool Capacity
              </label>
              <input
                type="number"
                step="0.01"
                value={newPool.pool_capacity_amount}
                onChange={(e) => setNewPool({ ...newPool, pool_capacity_amount: parseFloat(e.target.value) })}
                className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-color-primary text-bg-primary py-2.5 rounded-lg font-bold text-sm hover:bg-color-primary-hover transition mt-2"
            >
              Create Pool
            </button>
          </form>
        </AdminModal>

        {/* Edit Pool Modal */}
        <AdminModal
          isOpen={!!editPool}
          onClose={() => setEditPool(null)}
          title="Edit Staking Pool"
        >
          {editPool && (
            <form onSubmit={handleUpdatePool} className="space-y-4">
              <div>
                <label className="block text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1.5">
                  Annual APY (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editPool.annual_percentage_yield}
                  onChange={(e) => setEditPool({ ...editPool, annual_percentage_yield: parseFloat(e.target.value) })}
                  className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1.5">
                  Min Stake Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editPool.min_stake_amount}
                  onChange={(e) => setEditPool({ ...editPool, min_stake_amount: parseFloat(e.target.value) })}
                  className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1.5">
                  Pool Capacity
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editPool.pool_capacity_amount || 0}
                  onChange={(e) => setEditPool({ ...editPool, pool_capacity_amount: parseFloat(e.target.value) })}
                  className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1.5">
                  Payout Frequency
                </label>
                <select
                  value={editPool.payout_frequency}
                  onChange={(e) => setEditPool({ ...editPool, payout_frequency: e.target.value })}
                  className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-3 py-2 text-sm"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editPool.is_active}
                  onChange={(e) => setEditPool({ ...editPool, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_active" className="text-text-primary text-sm">
                  Pool Active
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-color-primary text-bg-primary py-2.5 rounded-lg font-bold text-sm hover:bg-color-primary-hover transition mt-2"
              >
                Update Pool
              </button>
            </form>
          )}
        </AdminModal>
      </AdminLayout>
    </AdminAuthGuard>
  );
}
