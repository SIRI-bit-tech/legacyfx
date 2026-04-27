// Admin assets management page — enable/disable platform assets and monitor live prices
'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminTable, TableColumn } from '@/components/admin/AdminTable';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminModal, MessageModal } from '@/components/admin/AdminModal';
import { adminApi } from '@/lib/adminApi';

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({ symbol: '', name: '' });
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info', title: string = 'Admin Action') => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, isOpen: false }));
  };

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get<any[]>('/admin/assets').catch(() => [
        { id: '1', symbol: 'BTC', name: 'Bitcoin', price: 65000, change24h: 2.5, is_enabled: true },
        { id: '2', symbol: 'ETH', name: 'Ethereum', price: 3500, change24h: -1.2, is_enabled: true },
        { id: '3', symbol: 'USDT', name: 'Tether', price: 1.0, change24h: 0.0, is_enabled: true },
      ]);
      setAssets(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleAsset = async (id: string, current: boolean) => {
    try {
      await adminApi.patch(`/admin/assets/${id}/toggle`, { is_enabled: !current });
      await fetchAssets();
    } catch (err) {
      showAlert('Failed to toggle asset status. Please check your connection.', 'error', 'Error');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.post('/admin/assets', newAsset);
      setModalOpen(false);
      setNewAsset({ symbol: '', name: '' });
      await fetchAssets();
      showAlert('Asset added successfully!', 'success', 'Success');
    } catch (err) {
      showAlert('Failed to add new asset. Ensure the symbol is unique.', 'error', 'Error');
    }
  };

  const columns: TableColumn<any>[] = [
    {
      key: 'asset',
      header: 'Asset',
      render: (a) => (
        <div className="flex flex-col">
          <span className="font-black text-text-primary text-xs">{a.symbol}</span>
          <span className="text-[10px] text-text-tertiary">{a.name}</span>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Live Price',
      render: (a) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs text-text-primary font-bold">${a.price?.toLocaleString()}</span>
          <span className={`text-[10px] font-bold ${a.change24h >= 0 ? 'text-color-success' : 'text-color-danger'}`}>
            {a.change24h >= 0 ? '+' : ''}{a.change24h}%
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => <AdminBadge status={a.is_enabled ? 'Enabled' : 'Disabled'} />,
    },
    {
      key: 'actions',
      header: '',
      render: (a) => (
        <div className="flex justify-end">
          <button
            onClick={() => toggleAsset(a.id, a.is_enabled)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
              a.is_enabled
                ? 'bg-bg-tertiary text-text-tertiary border-color-border hover:bg-bg-elevated'
                : 'bg-color-primary/10 text-color-primary border-color-primary/30 hover:bg-color-primary/20'
            }`}
          >
            {a.is_enabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <AdminAuthGuard>
      <AdminLayout title="Assets & Prices">
        <div className="flex items-center justify-between mb-6">
          <p className="text-text-secondary text-sm">Control which assets are tradable and view live market prices.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-color-primary text-bg-primary px-4 py-2 rounded-lg text-xs font-bold hover:bg-color-primary-hover transition flex items-center gap-2"
          >
            <i className="pi pi-plus text-[10px]" />
            Add Asset
          </button>
        </div>

        <div className="bg-bg-secondary p-1 rounded-xl shadow-sm">
          <AdminTable
            columns={columns}
            data={assets}
            loading={loading}
            emptyMessage="No assets configured."
          />
        </div>

        <AdminModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add New Asset">
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1.5">Symbol</label>
              <input
                type="text"
                placeholder="e.g. BTC"
                value={newAsset.symbol}
                onChange={(e) => setNewAsset({ ...newAsset, symbol: e.target.value.toUpperCase() })}
                className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1.5">Asset Name</label>
              <input
                type="text"
                placeholder="e.g. Bitcoin"
                value={newAsset.name}
                onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-color-primary text-bg-primary py-2.5 rounded-lg font-bold text-sm hover:bg-color-primary-hover transition mt-2"
            >
              Add Asset
            </button>
          </form>
        </AdminModal>

        <MessageModal 
          isOpen={alertConfig.isOpen}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          onClose={closeAlert}
        />
      </AdminLayout>
    </AdminAuthGuard>
  );
}
