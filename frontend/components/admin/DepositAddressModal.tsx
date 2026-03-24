// Admin modal for adding/editing deposit addresses (wallets)
'use client';

import { useState, useEffect } from 'react';
import { AdminModal } from './AdminModal';
import { ImageUpload } from './ImageUpload';

export function DepositAddressModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: any;
}) {
  const [form, setForm] = useState({
    asset: '',
    network: '',
    address: '',
    qrCodeUrl: '',
    minDeposit: 0,
    fee: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        asset: initialData.asset || '',
        network: initialData.network || '',
        address: initialData.address || '',
        qrCodeUrl: initialData.qrCodeUrl || '',
        minDeposit: initialData.minDeposit || 0,
        fee: initialData.fee || 0,
        is_active: initialData.is_active ?? true,
      });
    } else {
      setForm({
        asset: '',
        network: '',
        address: '',
        qrCodeUrl: '',
        minDeposit: 0,
        fee: 0,
        is_active: true,
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Deposit Address' : 'Add Deposit Address'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1.5">Asset</label>
            <input
              type="text"
              value={form.asset}
              onChange={(e) => setForm({ ...form, asset: e.target.value.toUpperCase() })}
              placeholder="BTC, ETH, USDT..."
              className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-color-primary"
              required
            />
          </div>
          <div>
            <label className="block text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1.5">Network</label>
            <input
              type="text"
              value={form.network}
              onChange={(e) => setForm({ ...form, network: e.target.value.toUpperCase() })}
              placeholder="ERC20, TRC20, Mainnet..."
              className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-color-primary"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1.5">Wallet Address</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="0x..."
            className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-3 py-2 text-sm font-mono focus:border-color-primary"
            required
          />
        </div>

        <ImageUpload
          label="QR Code Image"
          value={form.qrCodeUrl}
          onChange={(url) => setForm({ ...form, qrCodeUrl: url })}
          helperText="Upload a QR code image for users to scan, or enter a URL."
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1.5">Min Deposit</label>
            <input
              type="number"
              step="any"
              value={form.minDeposit}
              onChange={(e) => setForm({ ...form, minDeposit: parseFloat(e.target.value) })}
              className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-color-primary"
            />
          </div>
          <div>
            <label className="block text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1.5">Network Fee</label>
            <input
              type="number"
              step="any"
              value={form.fee}
              onChange={(e) => setForm({ ...form, fee: parseFloat(e.target.value) })}
              className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-color-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 py-2">
          <input
            type="checkbox"
            id="is_active"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="w-4 h-4 bg-bg-tertiary border-color-border rounded accent-color-primary"
          />
          <label htmlFor="is_active" className="text-sm font-bold text-text-primary cursor-pointer">Active and visible to users</label>
        </div>

        <div className="pt-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-bg-tertiary text-text-primary rounded-lg font-bold text-sm border border-color-border hover:bg-bg-elevated transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-color-primary text-bg-primary rounded-lg font-bold text-sm hover:bg-color-primary-hover transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <span className="w-4 h-4 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />}
            {initialData ? 'Update Address' : 'Save Address'}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
