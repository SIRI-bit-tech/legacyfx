'use client';

import { DashboardLayout } from '../dashboard-layout';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.ACTIVITY.LIST);
      setTransactions(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED': return 'bg-color-success/10 text-color-success border-color-success/20';
      case 'PENDING': return 'bg-color-warning/10 text-color-warning border-color-warning/20';
      case 'REJECTED': 
      case 'FAILED': return 'bg-color-danger/10 text-color-danger border-color-danger/20';
      default: return 'bg-bg-tertiary text-text-tertiary border-color-border';
    }
  };

  const renderTableContent = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={5} className="py-20 text-center text-text-tertiary">
            Loading history...
          </td>
        </tr>
      );
    }

    if (transactions.length === 0) {
      return (
        <tr>
          <td colSpan={5} className="py-20 text-center">
            <i className="pi pi-history text-4xl text-text-tertiary mb-4 block"></i>
            <p className="text-text-tertiary italic">No transactions recorded yet.</p>
          </td>
        </tr>
      );
    }

    return transactions.map((t) => (
      <tr key={t.id} className="hover:bg-bg-tertiary/20 transition-colors">
        <td className="px-6 py-4 text-xs">
          <p className="text-text-primary font-bold">
            {new Date(t.created_at).toLocaleDateString()}
          </p>
          <p className="text-text-tertiary text-[10px]">
            {new Date(t.created_at).toLocaleTimeString()}
          </p>
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-color-primary tracking-tighter mb-1">
              {t.type.replace("_", " ")}
            </span>
            <span className="text-text-secondary text-xs truncate max-w-[200px]">
              {t.description}
            </span>
          </div>
        </td>
        <td className="px-6 py-4 font-bold text-text-primary">
          {t.asset_symbol}
        </td>
        <td className="px-6 py-4 text-right font-bold text-text-primary">
          {t.amount.toLocaleString()}{" "}
          <span className="text-[10px] text-text-tertiary">{t.asset_symbol}</span>
        </td>
        <td className="px-6 py-4 text-right">
          <span
            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${getStatusColor(
              t.status
            )}`}
          >
            {t.status}
          </span>
        </td>
      </tr>
    ));
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-10 max-w-7xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-text-primary mb-3">Transaction History</h1>
            <p className="text-text-secondary">Comprehensive log of every trade, deposit, withdrawal, and subscription on your account.</p>
          </div>
          <div className="flex gap-2">
             <button className="bg-bg-secondary border border-color-border px-4 py-2 rounded-lg text-text-primary text-xs font-bold hover:bg-bg-tertiary transition">
                <i className="pi pi-filter"></i> Filters
             </button>
             <button className="bg-bg-secondary border border-color-border px-4 py-2 rounded-lg text-text-primary text-xs font-bold hover:bg-bg-tertiary transition">
                <i className="pi pi-download"></i> Export PDF
             </button>
          </div>
        </header>

        {/* Transaction Table */}
        <div className="bg-bg-secondary border border-color-border rounded-2xl overflow-hidden shadow-2xl">
           <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                 <thead>
                    <tr className="bg-bg-tertiary text-text-tertiary text-[10px] uppercase font-black tracking-widest border-b border-color-border">
                       <th className="px-6 py-5">Date/Time</th>
                       <th className="px-6 py-5">Type / Description</th>
                       <th className="px-6 py-5">Asset</th>
                       <th className="px-6 py-5 text-right">Amount</th>
                       <th className="px-6 py-5 text-right">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-color-border/30 font-mono">
                    {renderTableContent()}
                 </tbody>
              </table>
           </div>
           
           <div className="p-6 bg-bg-tertiary/20 border-t border-color-border flex justify-between items-center">
              <span className="text-xs text-text-tertiary">Showing last 50 transactions</span>
              <div className="flex gap-2">
                 <button className="w-8 h-8 rounded bg-bg-secondary border border-color-border flex items-center justify-center opacity-50"><i className="pi pi-chevron-left text-xs"></i></button>
                 <button className="w-8 h-8 rounded bg-bg-secondary border border-color-border flex items-center justify-center"><i className="pi pi-chevron-right text-xs"></i></button>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
