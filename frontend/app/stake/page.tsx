'use client';

import { DashboardLayout } from '../dashboard-layout';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export default function StakePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [myStaking, setMyStaking] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStakingData();
  }, []);

  const loadStakingData = async () => {
    try {
      const [prodRes, myRes, statsRes] = await Promise.all([
        api.get(API_ENDPOINTS.STAKING.POOLS).catch(() => []),
        api.get(API_ENDPOINTS.STAKING.POSITIONS).catch(() => []),
        api.get(API_ENDPOINTS.MARKETS.OVERVIEW).catch(() => null)
      ]);
      setProducts(prodRes || []);
      setMyStaking(myRes || []);
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
          <h1 className="text-4xl font-black text-text-primary mb-3 text-pretty">Staking & Passive Yield</h1>
          <p className="text-text-secondary text-lg max-w-3xl">Commit your assets to the network and earn high-yield institutional rewards. Secure, transparent, and distributed daily.</p>
        </header>

        {/* Global Staking Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
           {[
             { label: 'Total Value Locked', value: globalStats?.platform_tvl ? `$${(globalStats.platform_tvl / 1e6).toFixed(1)}M` : '$0.00', item: 'Locked' },
             { label: 'Avg Monthly APY', value: '14.2%', item: 'Yield' },
             { label: 'Platform Volume', value: globalStats?.total_volume ? `$${(globalStats.total_volume / 1e9).toFixed(1)}B` : '--', item: '24h' },
             { label: 'Network Stakers', value: globalStats?.active_miners?.toLocaleString() || '0', item: 'Users' },
           ].map((s, i) => (
             <div key={i} className="bg-bg-secondary border border-color-border p-6 rounded-2xl shadow-xl hover:bg-bg-tertiary/50 transition">
                <p className="text-[10px] text-text-tertiary font-black uppercase tracking-widest mb-1">{s.label}</p>
                <p className="text-2xl font-black text-text-primary mb-1">{s.value}</p>
                <div className="flex items-center gap-1 text-[10px] text-color-success font-bold uppercase">
                   <i className="pi pi-chart-line"></i> {s.item} Trending
                </div>
             </div>
           ))}
        </div>


        {/* My Staking Summary */}
        {myStaking.length > 0 && (
          <section className="mb-16">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-text-primary flex items-center gap-2">
                   <i className="pi pi-database text-color-primary"></i> My Active Staking
                </h2>
                <button className="text-[10px] font-black uppercase text-color-primary hover:underline">Claim All Rewards</button>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {myStaking.map((s) => (
                  <div key={s.id} className="bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-color-primary/20 p-6 rounded-3xl flex items-center justify-between shadow-2xl">
                     <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 bg-color-primary text-bg-primary rounded-2xl flex items-center justify-center text-xl font-black">
                           {s.asset_symbol?.substring(0,2)}
                        </div>
                        <div>
                           <p className="font-bold text-lg text-text-primary">{s.asset_symbol}</p>
                           <p className="text-xs text-text-tertiary">Locked until <span className="text-text-primary font-mono">{new Date(s.unlock_date).toLocaleDateString()}</span></p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] text-text-tertiary font-black uppercase">Staked Balance</p>
                        <p className="text-xl font-black text-text-primary">{s.amount.toLocaleString()} {s.asset_symbol}</p>
                        <span className="text-xs text-color-success font-bold">+{s.apy}% APY</span>
                     </div>
                  </div>
                ))}
             </div>
          </section>
        )}

        {/* Staking Products */}
        <section>
          <div className="flex justify-between items-center mb-10">
             <h2 className="text-2xl font-black text-text-primary">Available Staking Pools</h2>
             <div className="flex gap-2">
                {['All', 'High Yield', 'Flexible', 'Locked'].map((f, i) => (
                   <button key={i} className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-tight transition ${i === 0 ? 'bg-color-primary text-bg-primary' : 'bg-bg-secondary text-text-tertiary hover:text-text-primary border border-color-border'}`}>
                      {f}
                   </button>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <div key={p.id} className="bg-bg-secondary border border-color-border rounded-3xl overflow-hidden hover:border-color-primary/40 transition group shadow-xl">
                 <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                       <div className="w-12 h-12 bg-bg-tertiary rounded-2xl flex items-center justify-center text-xl text-text-primary border border-color-border">
                          {p.asset_symbol === 'BTC' ? <i className="pi pi-bitcoin"></i> : p.asset_symbol === 'ETH' ? <i className="pi pi-ethereum"></i> : p.asset_symbol.substring(0,1)}
                       </div>
                       <div className="text-right">
                          <p className="text-2xl font-black text-color-primary group-hover:scale-110 transition-transform origin-right">{p.apy}%</p>
                          <p className="text-[10px] text-text-tertiary font-black uppercase">APY</p>
                       </div>
                    </div>
                    
                    <h3 className="text-xl font-black text-text-primary mb-2">{p.name}</h3>
                    <p className="text-xs text-text-tertiary mb-6">Min: <span className="text-text-secondary font-bold">{p.min_investment} {p.asset_symbol}</span></p>
                    
                    <div className="space-y-3 mb-8">
                       <div className="flex justify-between text-[10px] font-bold uppercase text-text-tertiary">
                          <span>Lock Duration</span>
                          <span className="text-text-primary">{p.duration_days} Days</span>
                       </div>
                       <div className="flex justify-between text-[10px] font-bold uppercase text-text-tertiary">
                          <span>Risk Level</span>
                          <span className="text-color-success">Low</span>
                       </div>
                    </div>

                    <button className="w-full bg-bg-tertiary group-hover:bg-color-primary text-text-primary group-hover:text-bg-primary py-3.5 rounded-2xl font-black transition-all flex items-center justify-center gap-2 border border-color-border group-hover:border-color-primary shadow-lg shadow-black/20">
                       <i className="pi pi-box"></i> Stake Now
                    </button>
                 </div>
              </div>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <div className="mt-16 p-8 bg-bg-tertiary/20 border border-color-border rounded-3xl flex items-start gap-6 max-w-4xl mx-auto">
           <i className="pi pi-info-circle text-text-tertiary mt-1 text-xl"></i>
           <div>
              <h4 className="text-sm font-bold text-text-primary mb-2 uppercase tracking-widest">Staking Notice</h4>
              <p className="text-xs text-text-tertiary leading-relaxed">
                Tokens committed to staking pools are locked for the duration specified. Early unstaking may incur a penalty fee or loss of accrued rewards. APY rates are adjusted weekly based on network rewards and platform liquidity. All rewards are automatically credited to your trading balance.
              </p>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
