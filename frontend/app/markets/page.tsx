'use client';

import { DashboardLayout } from '../dashboard-layout';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export default function MarketsPage() {
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarkets();
    const interval = setInterval(loadMarkets, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  const loadMarkets = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.MARKETS.PRICES);
      setMarkets(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-10 max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-text-primary mb-3">Live Markets</h1>
          <p className="text-text-secondary">Track real-time prices, volume, and trends across 50+ institutional cryptocurrency pairs.</p>
        </header>

        {/* Market Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <div className="bg-bg-secondary border border-color-border p-6 rounded-2xl flex items-center justify-between">
              <div>
                 <p className="text-[10px] text-text-tertiary font-bold uppercase mb-1">Top Gainer</p>
                 <p className="text-lg font-bold text-text-primary">Solana (SOL)</p>
              </div>
              <span className="text-color-success font-black">+14.2%</span>
           </div>
           <div className="bg-bg-secondary border border-color-border p-6 rounded-2xl flex items-center justify-between">
              <div>
                 <p className="text-[10px] text-text-tertiary font-bold uppercase mb-1">High Volume</p>
                 <p className="text-lg font-bold text-text-primary">Bitcoin (BTC)</p>
              </div>
              <span className="text-text-primary font-black">$42.1B</span>
           </div>
           <div className="bg-bg-secondary border border-color-border p-6 rounded-2xl flex items-center justify-between">
              <div>
                 <p className="text-[10px] text-text-tertiary font-bold uppercase mb-1">Market Sentiment</p>
                 <p className="text-lg font-bold text-text-primary">Strong Buy</p>
              </div>
              <div className="flex gap-1 text-color-success">
                 <i className="pi pi-star-fill text-xs"></i>
                 <i className="pi pi-star-fill text-xs"></i>
                 <i className="pi pi-star-fill text-xs"></i>
              </div>
           </div>
        </div>

        {/* Market Table */}
        <div className="bg-bg-secondary border border-color-border rounded-2xl overflow-hidden shadow-2xl">
           <div className="p-6 border-b border-color-border flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex gap-4">
                 {['Spot', 'Futures', 'New', 'Favorites'].map((cat, i) => (
                    <button key={i} className={`text-xs font-black uppercase tracking-widest ${i === 0 ? 'text-color-primary border-b-2 border-color-primary pb-1' : 'text-text-tertiary hover:text-text-primary transition'}`}>
                       {cat}
                    </button>
                 ))}
              </div>
              <div className="relative">
                 <i className="pi pi-search absolute left-3 top-2.5 text-text-tertiary text-sm"></i>
                 <input type="text" placeholder="Search markets..." className="bg-bg-tertiary border border-color-border rounded-lg pl-9 py-2 text-sm focus:border-color-primary outline-none" />
              </div>
           </div>

           <div className="overflow-x-auto text-sm">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-bg-tertiary/30 text-text-tertiary text-[10px] uppercase font-black tracking-widest border-b border-color-border">
                       <th className="px-6 py-5">Name</th>
                       <th className="px-6 py-5">Price</th>
                       <th className="px-6 py-5 text-right">24h Change</th>
                       <th className="px-6 py-5 text-right hidden lg:table-cell">24h Volume</th>
                       <th className="px-6 py-5 text-right hidden lg:table-cell">Market Cap</th>
                       <th className="px-6 py-5 text-right font-bold">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-color-border/50">
                    {loading ? (
                      <tr><td colSpan={6} className="py-20 text-center text-text-tertiary">Fetching global market data...</td></tr>
                    ) : markets.map((m) => (
                       <tr key={m.symbol} className="hover:bg-bg-tertiary/20 transition-colors group">
                          <td className="px-6 py-5">
                             <div className="flex items-center gap-3">
                                <img src={m.image_url} alt="" className="w-8 h-8 rounded-full grayscale group-hover:grayscale-0 transition-all" />
                                <div>
                                   <p className="font-bold text-text-primary">{m.name}</p>
                                   <p className="text-[10px] text-text-tertiary font-bold">{m.symbol}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-5">
                             <p className="font-mono font-bold text-text-primary">${m.current_price.toLocaleString()}</p>
                          </td>
                          <td className="px-6 py-5 text-right">
                             <span className={`text-[11px] font-black px-2 py-1 rounded ${m.price_change_percentage_24h >= 0 ? 'bg-color-success/10 text-color-success' : 'bg-color-danger/10 text-color-danger'}`}>
                                {m.price_change_percentage_24h?.toFixed(2)}%
                             </span>
                          </td>
                          <td className="px-6 py-5 text-right text-text-secondary text-xs font-mono hidden lg:table-cell">
                             ${(m.total_volume / 1e6).toFixed(1)}M
                          </td>
                          <td className="px-6 py-5 text-right text-text-secondary text-xs font-mono hidden lg:table-cell">
                             ${(m.market_cap / 1e9).toFixed(2)}B
                          </td>
                          <td className="px-6 py-5 text-right">
                             <Link href={`/trade?s=${m.symbol}USDT`} className="bg-bg-tertiary hover:bg-color-primary hover:text-bg-primary px-4 py-2 rounded-lg text-xs font-black uppercase transition-all tracking-tighter">
                                Trade
                             </Link>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
