// Admin settings page — global platform configuration and mining parameters
'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { adminSettingsApi } from '@/lib/adminApi';
import { ImageUpload } from '@/components/admin/ImageUpload';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'LegacyFX',
    supportEmail: 'support@legacyfx.com',
    minWithdrawal: 10,
    maintenanceMode: false,
    miningWallet: '',
    miningQR: '',
    subscriptionWalletAddress: '',
    subscriptionWalletId: '',
    subscriptionWalletQR: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Initial fetch of settings
    const fetchSettings = async () => {
      try {
        const res = await adminSettingsApi.get().catch(() => ({}));
        setSettings(prev => ({
          ...prev,
          ...res,
          // Map backend keys to local state keys if they differ
          miningWallet: res.mining_wallet_id || res.miningWallet || '',
          miningQR: res.mining_wallet_qr || res.miningQR || '',
          subscriptionWalletAddress: res.subscription_wallet_address || '',
          subscriptionWalletId: res.subscription_wallet_id || '',
          subscriptionWalletQR: res.subscription_wallet_qr || '',
        }));
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      // Prepare settings for general update
      const updateData = {
        siteName: settings.siteName,
        supportEmail: settings.supportEmail,
        minWithdrawal: settings.minWithdrawal,
        maintenanceMode: settings.maintenanceMode,
        // Include new subscription keys
        subscription_wallet_address: settings.subscriptionWalletAddress,
        subscription_wallet_id: settings.subscriptionWalletId,
        subscription_wallet_qr: settings.subscriptionWalletQR,
      };

      await adminSettingsApi.update(updateData);

      // Update mining wallet (allow empty string to clear the backend value)
      if (settings.miningWallet !== undefined) {
        await adminSettingsApi.updateMining(settings.miningWallet, settings.miningQR);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Settings save error:', err);
      alert(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminAuthGuard>
      <AdminLayout title="System Settings">
        <form onSubmit={handleSave} className="max-w-4xl space-y-8">
          {/* General Settings */}
          <section className="bg-bg-secondary border border-color-border rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest text-text-primary mb-6 flex items-center gap-2">
              <i className="pi pi-cog text-color-primary" />
              <span>General Configuration</span>
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="siteName" className="block text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1.5 font-mono">Platform Name</label>
                <input
                  id="siteName"
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-color-primary"
                />
              </div>
              <div>
                <label htmlFor="supportEmail" className="block text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1.5 font-mono">Support Email</label>
                <input
                  id="supportEmail"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-color-primary"
                />
              </div>
              <div>
                <label htmlFor="minWithdrawal" className="block text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1.5 font-mono">Min Withdrawal ($)</label>
                <input
                  id="minWithdrawal"
                  type="number"
                  value={settings.minWithdrawal}
                  onChange={(e) => setSettings({ ...settings, minWithdrawal: Number.parseInt(e.target.value) })}
                  className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-color-primary"
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="maintenance"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="w-4 h-4 rounded border-color-border bg-bg-tertiary accent-color-primary"
                />
                <label htmlFor="maintenance" className="text-sm font-bold text-text-primary">Maintenance Mode</label>
              </div>
            </div>
          </section>

          {/* Mining Settings */}
          <section className="bg-bg-secondary border border-color-border rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest text-text-primary mb-6 flex items-center gap-2">
              <i className="pi pi-bolt text-color-primary" />
              <span>Mining Parameters</span>
            </h3>
            <div className="space-y-6">
              <div>
                <label htmlFor="miningWallet" className="block text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1.5 font-mono">Admin Mining Wallet ID</label>
                <input
                  id="miningWallet"
                  type="text"
                  value={settings.miningWallet}
                  onChange={(e) => setSettings({ ...settings, miningWallet: e.target.value })}
                  placeholder="0x..."
                  className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-3 py-2 text-sm font-mono focus:border-color-primary"
                />
                <p className="text-[10px] text-text-tertiary mt-2">This wallet receives all mining subscription payments.</p>
              </div>
              <ImageUpload
                label="Mining Wallet QR Code"
                value={settings.miningQR}
                onChange={(url) => setSettings({ ...settings, miningQR: url })}
                helperText="Upload the QR code for the admin mining wallet."
              />
            </div>
          </section>

          {/* Subscription Settings */}
          <section className="bg-bg-secondary border border-color-border rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest text-text-primary mb-6 flex items-center gap-2">
              <i className="pi pi-star text-color-primary" />
              <span>Subscription Payment Details</span>
            </h3>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="subWalletAddress" className="block text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1.5 font-mono">Subscription Wallet Address</label>
                  <input
                    id="subWalletAddress"
                    type="text"
                    value={settings.subscriptionWalletAddress}
                    onChange={(e) => setSettings({ ...settings, subscriptionWalletAddress: e.target.value })}
                    placeholder="e.g. 0x123... or bc1..."
                    className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-3 py-2 text-sm font-mono focus:border-color-primary"
                  />
                </div>
                <div>
                  <label htmlFor="subWalletId" className="block text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1.5 font-mono">Network / Wallet ID (Tag)</label>
                  <input
                    id="subWalletId"
                    type="text"
                    value={settings.subscriptionWalletId}
                    onChange={(e) => setSettings({ ...settings, subscriptionWalletId: e.target.value })}
                    placeholder="e.g. USDT (TRC20)"
                    className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-color-primary"
                  />
                </div>
              </div>
              <ImageUpload
                label="Subscription Wallet QR Code"
                value={settings.subscriptionWalletQR}
                onChange={(url) => setSettings({ ...settings, subscriptionWalletQR: url })}
                helperText="This QR code will be shown to users when they click 'Upgrade' on the subscription page."
              />
            </div>
          </section>

          <footer className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-color-primary text-bg-primary rounded-xl font-black uppercase tracking-widest text-xs hover:bg-color-primary-hover transition shadow-lg shadow-color-primary/20 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />}
              Save All Changes
            </button>
            {success && (
              <span className="text-color-success text-xs font-bold animate-pulse flex items-center gap-1">
                <i className="pi pi-check" /> Changes saved successfully
              </span>
            )}
          </footer>
        </form>
      </AdminLayout>
    </AdminAuthGuard>
  );
}
