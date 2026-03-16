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
      const res = await api.get(API_ENDPOINTS.TRADES.HISTORY);
      setTransactions(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-10 max-w-7xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-text-primary mb-3">Transaction History</h1>
            <p className="text-text-secondary">Comprehensive log of every trade, deposit, and withdrawal on your account.</p>
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
                       <th className="px-6 py-5">Type</th>
                       <th className="px-6 py-5">Asset</th>
                       <th className="px-6 py-5 text-right">Amount</th>
                       <th className="px-6 py-5 text-right">Price</th>
                       <th className="px-6 py-5 text-right">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-color-border/30 font-mono">
                    {loading ? (
                       <tr><td colSpan={6} className="py-20 text-center text-text-tertiary">Loading history...</td></tr>
                    ) : transactions.length === 0 ? (
                       <tr><td colSpan={6} className="py-20 text-center">
                          <i className="pi pi-history text-4xl text-text-tertiary mb-4 block"></i>
                          <p className="text-text-tertiary italic">No transactions recorded yet.</p>
                       </td></tr>
                    ) : transactions.map((t) => (
                       <tr key={t.id} className="hover:bg-bg-tertiary/20 transition-colors">
                          <td className="px-6 py-4 text-xs">
                             <p className="text-text-primary">{new Date(t.created_at).toLocaleDateString()}</p>
                             <p className="text-text-tertiary text-[10px]">{new Date(t.created_at).toLocaleTimeString()}</p>
                          </td>
                          <td className="px-6 py-4">
                             <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${
                               t.trade_type === 'BUY' ? 'bg-color-success/10 text-color-success border border-color-success/20' : 
                               t.trade_type === 'SELL' ? 'bg-color-danger/10 text-color-danger border border-color-danger/20' : 
                               'bg-bg-tertiary text-text-tertiary border border-color-border'
                             }`}>
                                {t.trade_type}
                             </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-text-primary">
                             {t.symbol}
                          </td>
                          <td className={`px-6 py-4 text-right font-bold ${t.trade_type === 'BUY' ? 'text-color-success' : 'text-color-danger'}`}>
                             {t.trade_type === 'BUY' ? '+' : '-'}{t.quantity.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right text-text-secondary text-xs">
                             ${t.price.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end gap-2 text-color-success">
                                <i className="pi pi-check-circle text-[10px]"></i>
                                <span className="text-[10px] font-black uppercase">Completed</span>
                             </div>
                          </td>
                       </tr>
                    ))}
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
