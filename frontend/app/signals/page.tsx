'use client';

import { DashboardLayout } from '../dashboard-layout';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export default function SignalsPage() {
  const [signals, setSignals] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSignals();
  }, []);

  const loadSignals = async () => {
    try {
      const [sigRes, srcRes] = await Promise.all([
        api.get(API_ENDPOINTS.SIGNALS.LIST).catch(() => []),
        api.get(`${API_ENDPOINTS.SIGNALS.LIST}/sources`).catch(() => [])
      ]);
      setSignals(sigRes || []);
      setSources(srcRes || []);
    } catch (e) {
       console.error(e);
    } finally {
       setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-10 max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-text-primary mb-3">Trading Signals</h1>
            <p className="text-text-secondary text-lg">Harness institutional intelligence with real-time AI and analyst-driven market insights.</p>
          </div>
          <div className="bg-color-primary/10 border border-color-primary/20 px-6 py-3 rounded-2xl flex items-center gap-4">
             <div className="w-10 h-10 bg-color-primary text-bg-primary rounded-xl flex items-center justify-center text-xl">
                <i className="pi pi-bolt"></i>
             </div>
             <div>
                <p className="text-[10px] text-text-tertiary font-black uppercase">Signal Accuracy</p>
                <p className="text-lg font-bold text-text-primary">84.2% Avg</p>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
           {/* Sidebar: Sources */}
           <div className="space-y-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-text-tertiary px-1 flex items-center gap-2">
                 <i className="pi pi-filter"></i> Premium Sources
              </h2>
              <div className="space-y-3">
                 {sources.length === 0 ? (
                   [1,2,3].map(i => (
                     <div key={i} className="bg-bg-secondary border border-color-border p-5 rounded-2xl animate-pulse h-24"></div>
                   ))
                 ) : sources.map((source) => (
                    <div key={source.id} className="bg-bg-secondary border border-color-border p-5 rounded-2xl hover:border-color-primary/50 transition cursor-pointer flex items-center justify-between group shadow-lg">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center font-black text-xs text-text-primary group-hover:bg-color-primary group-hover:text-bg-primary transition">
                             {source.name.substring(0,2)}
                          </div>
                          <div>
                             <h4 className="font-bold text-sm text-text-primary">{source.name}</h4>
                             <p className="text-[10px] text-text-tertiary">{source.accuracy_percent}% Success</p>
                          </div>
                       </div>
                       <i className="pi pi-angle-right text-text-tertiary group-hover:translate-x-1 transition"></i>
                    </div>
                 ))}
                 
                 <div className="p-8 bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-color-border rounded-2xl text-center">
                    <i className="pi pi-verified text-4xl text-color-primary mb-4 block"></i>
                    <h5 className="font-bold text-text-primary mb-2">Connect Your Bot</h5>
                    <p className="text-[10px] text-text-tertiary leading-normal px-4">Integrate your own trading scripts via our REST API Signal Webhooks.</p>
                 </div>
              </div>
           </div>

           {/* Main Feed: Signals */}
           <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-text-tertiary px-1 flex justify-between items-center">
                 <span>Active Market Alerts</span>
                 <span className="text-[10px] text-color-success flex items-center gap-1"><i className="pi pi-circle-fill text-[8px]"></i> Real-time Feed</span>
              </h2>
              
              <div className="space-y-6">
                 {loading ? (
                   [1,2].map(i => (
                     <div key={i} className="bg-bg-secondary border border-color-border p-8 rounded-3xl animate-pulse h-48"></div>
                   ))
                 ) : signals.length === 0 ? (
                    <div className="bg-bg-secondary border border-color-border p-20 rounded-3xl text-center">
                       <i className="pi pi-wifi text-5xl text-bg-tertiary mb-6 block"></i>
                       <p className="text-text-secondary font-bold">Waiting for high-confidence market entries...</p>
                    </div>
                 ) : signals.map((sig) => (
                    <div key={sig.id} className="bg-bg-secondary border border-color-border rounded-3xl overflow-hidden shadow-2xl hover:border-color-primary/30 transition-all group">
                       <div className="p-8 flex flex-col md:flex-row gap-8">
                          <div className="flex flex-col md:items-center justify-center md:w-32 border-b md:border-b-0 md:border-r border-color-border/30 pb-6 md:pb-0 md:pr-8">
                             <h3 className="text-2xl font-black text-text-primary mb-1">{sig.symbol}</h3>
                             <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${sig.action === 'BUY' ? 'bg-color-success text-bg-primary' : 'bg-color-danger text-text-primary'}`}>
                                {sig.action}
                             </span>
                          </div>

                          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-6">
                             <div>
                                <p className="text-[10px] text-text-tertiary font-black uppercase mb-1">Entry Price</p>
                                <p className="text-lg font-mono font-bold text-text-primary">${sig.entry_price.toLocaleString()}</p>
                             </div>
                             <div>
                                <p className="text-[10px] text-text-tertiary font-black uppercase mb-1">Target Price</p>
                                <p className="text-lg font-mono font-bold text-color-success">${sig.target_price.toLocaleString()}</p>
                             </div>
                             <div>
                                <p className="text-[10px] text-text-tertiary font-black uppercase mb-1">Stop Loss</p>
                                <p className="text-lg font-mono font-bold text-color-danger">${sig.stop_loss.toLocaleString()}</p>
                             </div>
                             
                             <div className="col-span-2 md:col-span-3 pt-6 border-t border-color-border/30 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                   <div className="flex -space-x-2">
                                      {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-bg-tertiary border border-color-border"></div>)}
                                   </div>
                                   <p className="text-[10px] text-text-tertiary font-bold">{sig.accuracy_percent}% Consensus</p>
                                </div>
                                <button className="bg-color-primary hover:bg-color-primary-hover text-bg-primary px-6 py-2 rounded-lg font-black text-xs uppercase transition tracking-tight">
                                   Execute Trade
                                </button>
                             </div>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
