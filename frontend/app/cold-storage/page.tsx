'use client';

import { DashboardLayout } from '../dashboard-layout';
import { useState } from 'react';

export default function ColdStoragePage() {
  const [isLocked, setIsLocked] = useState(true);

  const vaults = [
    { id: 1, name: 'Main Savings', asset: 'BTC', balance: 0.52, value: 34500, lastAccessed: '2024-03-01', status: 'LOCKED' },
    { id: 2, name: 'Family Trust', asset: 'ETH', balance: 12.0, value: 48000, lastAccessed: '2024-02-15', status: 'LOCKED' },
    { id: 3, name: 'Emergency Fund', asset: 'USDT', balance: 5000, value: 5000, lastAccessed: '2024-03-10', status: 'LOCKED' },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Cold Storage Vaults</h1>
            <p className="text-text-secondary">Maximum security for your long-term assets</p>
          </div>
          <button className="bg-color-primary hover:bg-color-primary-hover text-bg-primary px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition">
            <i className="pi pi-plus"></i>
            Create New Vault
          </button>
        </header>

        {/* Security Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <div className="bg-bg-secondary border border-color-border p-6 rounded-xl">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 rounded-full bg-color-success/10 text-color-success flex items-center justify-center text-xl">
                    <i className="pi pi-shield"></i>
                 </div>
                 <div>
                    <p className="text-xs text-text-tertiary font-bold uppercase">Security Level</p>
                    <p className="text-text-primary font-bold">Institutional Grade</p>
                 </div>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Assets are stored in air-gapped hardware security modules with multi-sig protection.
              </p>
           </div>
           
           <div className="bg-bg-secondary border border-color-border p-6 rounded-xl">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 rounded-full bg-color-info/10 text-color-info flex items-center justify-center text-xl">
                    <i className="pi pi-clock"></i>
                 </div>
                 <div>
                    <p className="text-xs text-text-tertiary font-bold uppercase">Withdrawal Delay</p>
                    <p className="text-text-primary font-bold">24-Hour Wait</p>
                 </div>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                All cold storage withdrawals require 24 hours to process for maximum theft prevention.
              </p>
           </div>

           <div className="bg-bg-secondary border border-color-border p-6 rounded-xl">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 rounded-full bg-color-warning/10 text-color-warning flex items-center justify-center text-xl">
                    <i className="pi pi-key"></i>
                 </div>
                 <div>
                    <p className="text-xs text-text-tertiary font-bold uppercase">Total Value Locked</p>
                    <p className="text-text-primary font-bold tracking-tight">$87,500.00</p>
                 </div>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Aggregated value of all your secure offline holdings.
              </p>
           </div>
        </div>

        {/* Vaults Table */}
        <div className="bg-bg-secondary border border-color-border rounded-xl overflow-hidden shadow-2xl">
           <div className="p-6 border-b border-color-border flex justify-between items-center">
              <h3 className="font-bold text-lg">Active Vaults</h3>
              <div className="flex gap-2 text-xs">
                <span className="flex items-center gap-1 text-text-tertiary"><i className="pi pi-circle-fill text-[8px] text-color-success"></i> Synchronized</span>
              </div>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-bg-tertiary text-text-tertiary text-[10px] uppercase font-bold tracking-widest border-b border-color-border">
                       <th className="px-6 py-4">Vault Name</th>
                       <th className="px-6 py-4">Asset</th>
                       <th className="px-6 py-4">Balance</th>
                       <th className="px-6 py-4">USD Value</th>
                       <th className="px-6 py-4">Status</th>
                       <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-color-border">
                    {vaults.map((vault) => (
                       <tr key={vault.id} className="hover:bg-bg-tertiary/50 transition-colors">
                          <td className="px-6 py-5">
                             <div className="flex items-center gap-3">
                                <i className="pi pi-folder text-color-primary"></i>
                                <span className="font-semibold text-text-primary">{vault.name}</span>
                             </div>
                          </td>
                          <td className="px-6 py-5">
                             <span className="bg-bg-tertiary px-2 py-1 rounded text-xs font-mono">{vault.asset}</span>
                          </td>
                          <td className="px-6 py-5 font-mono text-sm">{vault.balance}</td>
                          <td className="px-6 py-5 font-mono text-sm">${vault.value.toLocaleString()}</td>
                          <td className="px-6 py-5">
                             <span className="flex items-center gap-1.5 text-xs text-color-success font-bold">
                                <i className="pi pi-lock"></i> {vault.status}
                             </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                             <button className="text-text-secondary hover:text-color-primary p-2 transition">
                                <i className="pi pi-external-link"></i>
                             </button>
                             <button className="text-text-secondary hover:text-color-danger p-2 transition">
                                <i className="pi pi-unlock"></i>
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Security Upgrade CTA */}
        <div className="mt-12 bg-gradient-to-r from-bg-secondary to-bg-tertiary border border-color-border p-8 rounded-2xl flex flex-col md:flex-row items-center gap-8">
           <div className="flex-1">
              <h2 className="text-2xl font-bold mb-3">Upgrade to Multi-Signature</h2>
              <p className="text-text-secondary max-w-xl">
                Require multiple independent devices to authorize any cold storage movement. Perfect for family inheritance or corporate treasury management.
              </p>
           </div>
           <button className="whitespace-nowrap bg-bg-primary border border-color-primary text-color-primary hover:bg-color-primary hover:text-bg-primary px-8 py-3 rounded-lg font-bold transition">
              Setup Multi-Sig
           </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
