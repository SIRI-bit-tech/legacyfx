import { DashboardLayout } from '../dashboard-layout';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export default function CopyTradingPage() {
  const [traders, setTraders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTraders();
  }, []);

  const loadTraders = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.TRADES.COPY_TRADERS);
      setTraders(res || []);
    } catch (err) {
      console.error('Failed to load traders:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <i className="pi pi-spin pi-spinner text-4xl text-color-primary"></i>
        </div>
      </DashboardLayout>
    );
  }


  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Copy Trading</h1>
          <p className="text-text-secondary">Automate your portfolio by following the platform's professional master traders.</p>
        </header>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Copiers', value: '45,201', icon: 'pi-users', color: 'text-color-info' },
            { label: 'Total AUM', value: '$12.4M', icon: 'pi-briefcase', color: 'text-color-primary' },
            { label: 'Avg Monthly ROI', value: '+14.2%', icon: 'pi-chart-bar', color: 'text-color-success' },
            { label: 'Live Trades', value: '1,245', icon: 'pi-sync', color: 'text-color-warning' },
          ].map((stat, i) => (
            <div key={i} className="bg-bg-secondary border border-color-border p-6 rounded-xl hover:bg-bg-tertiary transition cursor-default">
              <div className={`text-2xl mb-2 ${stat.color}`}>
                <i className={`pi ${stat.icon}`}></i>
              </div>
              <p className="text-xs text-text-tertiary font-bold uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
           <div className="flex bg-bg-secondary p-1 rounded-lg border border-color-border">
              {['All', 'High ROI', 'Low Risk', 'Trending'].map((filter, i) => (
                <button key={i} className={`px-4 py-1.5 rounded text-sm font-semibold transition ${i === 0 ? 'bg-color-primary text-bg-primary' : 'text-text-secondary hover:text-text-primary'}`}>
                  {filter}
                </button>
              ))}
           </div>
           <div className="relative w-full md:w-64">
              <i className="pi pi-search absolute left-4 top-3.5 text-text-tertiary"></i>
              <input type="text" placeholder="Search Master Traders" className="w-full bg-bg-secondary border border-color-border rounded-lg pl-12 py-3 focus:border-color-primary outline-none" />
           </div>
        </div>

        {/* Traders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {traders.map((trader) => (
            <div key={trader.id} className="bg-bg-secondary border border-color-border rounded-2xl overflow-hidden hover:border-color-primary/50 transition flex flex-col group">
              <div className="p-6">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-bg-tertiary rounded-full flex items-center justify-center font-bold text-xl text-color-primary border-2 border-color-border group-hover:border-color-primary transition">
                       {trader.avatar}
                    </div>
                    <div>
                       <h3 className="font-bold text-text-primary group-hover:text-color-primary transition">{trader.name}</h3>
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-bg-tertiary px-1.5 py-0.5 rounded text-text-tertiary font-bold">{trader.asset}</span>
                          <div className="flex items-center gap-1 text-[10px] text-color-warning font-bold">
                             <i className="pi pi-star-fill text-[8px]"></i> 4.9
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-bg-tertiary/30 p-3 rounded-xl border border-color-border/30">
                       <p className="text-[10px] text-text-tertiary uppercase font-bold mb-1">Win Rate</p>
                       <p className="font-mono text-sm text-color-success font-bold">{trader.winRate}</p>
                    </div>
                    <div className="bg-bg-tertiary/30 p-3 rounded-xl border border-color-border/30">
                       <p className="text-[10px] text-text-tertiary uppercase font-bold mb-1">Total ROI</p>
                       <p className="font-mono text-sm text-color-primary font-bold">{trader.roi}</p>
                    </div>
                 </div>

                 <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-xs">
                       <span className="text-text-tertiary">Followers</span>
                       <span className="text-text-primary font-bold">{trader.followers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs items-center">
                       <span className="text-text-tertiary">Risk Score</span>
                       <div className="flex gap-0.5">
                          {[1,2,3,4,5].map((s) => (
                            <div key={s} className={`w-2 h-1 rounded-full ${s <= trader.risk ? (trader.risk <= 2 ? 'bg-color-success' : trader.risk <= 4 ? 'bg-color-warning' : 'bg-color-danger') : 'bg-bg-tertiary'}`}></div>
                          ))}
                       </div>
                    </div>
                 </div>

                 <button className="w-full bg-bg-tertiary text-text-primary hover:bg-color-primary hover:text-bg-primary py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 border border-color-border">
                    <i className="pi pi-copy"></i>
                    Copy Trader
                 </button>
              </div>
              
              <div className="mt-auto border-t border-color-border p-4 bg-bg-tertiary/20 flex justify-center">
                 <button className="text-xs text-text-tertiary hover:text-color-primary flex items-center gap-1 font-bold tracking-tight">
                    VIEW PERFORMANCE HISTORY <i className="pi pi-angle-right"></i>
                 </button>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-12 p-6 bg-bg-tertiary/30 border border-color-border rounded-xl flex items-start gap-4">
           <i className="pi pi-info-circle text-text-tertiary mt-1"></i>
           <p className="text-[11px] text-text-tertiary leading-relaxed">
             Trading involves significant risk. Copying other traders does not guarantee profits. Past performance is not indicative of future results. Legacy FX handles automated order execution; ensure you have sufficient trading balance to replicate trades. 
           </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
