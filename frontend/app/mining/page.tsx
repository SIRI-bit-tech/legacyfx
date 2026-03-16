'use client';

import { DashboardLayout } from '../dashboard-layout';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export default function MiningPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [myMining, setMyMining] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMiningData();
  }, []);

  const loadMiningData = async () => {
    try {
      const [plansRes, myRes, statsRes] = await Promise.all([
        api.get(API_ENDPOINTS.MINING.PLANS).catch(() => []),
        api.get(API_ENDPOINTS.MINING.ACTIVE).catch(() => []),
        api.get(API_ENDPOINTS.MARKETS.OVERVIEW).catch(() => null)
      ]);
      setPlans(plansRes || []);
      setMyMining(myRes || []);
      setGlobalStats(statsRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-10 max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-text-primary mb-3">Cloud Mining</h1>
          <p className="text-text-secondary text-lg">Lease institutional-grade hardware power and start mining top-tier cryptocurrencies without managing any physical gear.</p>
        </header>

        {/* Global Mining Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
           {[
             { label: 'Total HP Allocated', value: globalStats?.total_hashpower || '1.2 EH/s', icon: 'pi-bolt', color: 'text-color-primary' },
             { label: 'Active Miners', value: globalStats?.active_miners?.toLocaleString() || '0', icon: 'pi-server', color: 'text-color-info' },
             { label: 'Platform TVL', value: `$${(globalStats?.platform_tvl / 1e6).toFixed(1)}M` || '--', icon: 'pi-wallet', color: 'text-color-success' },
           ].map((s, i) => (
             <div key={i} className="bg-bg-secondary border border-color-border p-8 rounded-2xl flex flex-col justify-between h-40 shadow-xl">
                <p className="text-[10px] text-text-tertiary font-black uppercase tracking-widest">{s.label}</p>
                <div className="flex items-center justify-between">
                   <p className="text-3xl font-black text-text-primary">{s.value}</p>
                   <i className={`pi ${s.icon} text-2xl ${s.color}`}></i>
                </div>
             </div>
           ))}
        </div>


        {/* Active Subscriptions */}
        {myMining.length > 0 && (
          <section className="mb-16">
             <h2 className="text-xl font-black text-text-primary mb-6 flex items-center gap-3">
                <i className="pi pi-circle-fill text-[8px] text-color-success animate-pulse"></i>
                Active Mining Power
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myMining.map((m) => (
                  <div key={m.id} className="bg-bg-secondary border border-color-success/30 p-6 rounded-2xl flex items-center justify-between shadow-lg shadow-color-success/5">
                     <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 bg-color-success/10 text-color-success rounded-xl flex items-center justify-center text-xl">
                           <i className="pi pi-sync pi-spin"></i>
                        </div>
                        <div>
                           <p className="font-bold text-text-primary">{m.plan_name}</p>
                           <p className="text-xs text-text-tertiary">Hashrate: <span className="text-text-secondary">{m.hashrate}</span></p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-xs text-text-tertiary uppercase font-black">Daily Est.</p>
                        <p className="text-sm font-mono font-bold text-color-success">+{m.daily_earnings} {m.coin_symbol}</p>
                     </div>
                  </div>
                ))}
             </div>
          </section>
        )}

        {/* Mining Plans */}
        <section>
          <h2 className="text-xl font-black text-text-primary mb-8 px-1 border-l-4 border-color-primary ml-1">Allocated Hardware Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-bg-secondary border border-color-border rounded-3xl overflow-hidden hover:border-color-primary/40 transition group shadow-2xl">
                 <div className="p-8 pb-4">
                    <div className="flex justify-between items-start mb-6">
                       <span className="bg-bg-tertiary text-text-primary px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-color-border uppercase">{plan.coin_symbol} Cloud</span>
                       <span className="text-color-primary font-bold text-sm">{plan.duration_days} Days</span>
                    </div>
                    <h3 className="text-2xl font-black text-text-primary mb-2 tracking-tight group-hover:text-color-primary transition">{plan.name}</h3>
                    <p className="text-4xl font-black text-text-primary mb-6">${plan.price.toLocaleString()}</p>
                    
                    <div className="space-y-4 mb-8">
                       <div className="flex justify-between items-center py-3 border-y border-color-border/30">
                          <span className="text-xs text-text-tertiary font-bold uppercase">Hashrate</span>
                          <span className="text-sm font-mono font-bold text-text-primary">{plan.hashrate}</span>
                       </div>
                       <div className="flex justify-between items-center py-2">
                          <span className="text-xs text-text-tertiary font-bold uppercase">Daily Rewards</span>
                          <span className="text-sm font-mono font-bold text-color-success">{plan.daily_earnings} {plan.coin_symbol}</span>
                       </div>
                    </div>

                    <button className="w-full bg-color-primary hover:bg-color-primary-hover text-bg-primary py-4 rounded-2xl font-black transition shadow-lg shadow-color-primary/10">
                       Start Mining Now
                    </button>
                 </div>
                 <div className="p-4 bg-bg-tertiary/20 text-center text-[10px] text-text-tertiary font-bold uppercase tracking-tight">
                    NO SETUP FEES • INSTANT ACTIVATION
                 </div>
              </div>
            ))}
            
            {/* Custom Plan Placeholder */}
            <div className="bg-bg-primary border border-dashed border-color-border rounded-3xl p-8 flex flex-col items-center justify-center text-center opacity-70 hover:opacity-100 transition cursor-pointer">
               <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center text-2xl mb-4">
                  <i className="pi pi-cog"></i>
               </div>
               <h3 className="text-lg font-bold text-text-primary mb-2">Custom Package</h3>
               <p className="text-xs text-text-secondary">Tailor hashrate and duration for large enterprise allocations.</p>
            </div>
          </div>
        </section>

        {/* Hardware Status */}
        <div className="mt-20 p-8 bg-bg-secondary border border-color-border rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex gap-6 items-center">
              <i className="pi pi-map text-text-tertiary text-4xl"></i>
              <div>
                 <h4 className="text-lg font-bold">Global Datacenters</h4>
                 <p className="text-xs text-text-secondary">Uptime: 99.98% • Locations: Iceland, Canada, USA, Georgia</p>
              </div>
           </div>
           <button className="text-color-primary text-xs font-black uppercase tracking-widest border-b border-color-primary pb-1">Watch Live Stream <i className="pi pi-external-link ml-1"></i></button>
        </div>
      </div>
    </DashboardLayout>
  );
}
