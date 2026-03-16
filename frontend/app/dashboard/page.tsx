'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';
import { DashboardLayout } from '../dashboard-layout';

export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [portfolioRes, positionsRes, pricesRes, tradesRes, statsRes] = await Promise.all([
        api.get(API_ENDPOINTS.TRADES.PORTFOLIO).catch(() => null),
        api.get(API_ENDPOINTS.STAKING.POSITIONS).catch(() => []),
        api.get(API_ENDPOINTS.MARKETS.PRICES).catch(() => []),
        api.get(`${API_ENDPOINTS.TRADES.HISTORY}?page=1&limit=5`).catch(() => []),
        api.get(API_ENDPOINTS.MARKETS.OVERVIEW).catch(() => null)
      ]);
      setPortfolio(portfolioRes);
      setPositions(positionsRes || []);
      setPrices(pricesRes || []);
      setTrades(tradesRes || []);
      setGlobalStats(statsRes);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <i className="pi pi-spin pi-spinner text-4xl text-color-primary"></i>
        <p className="text-text-secondary font-bold uppercase tracking-widest text-xs">Synchronizing Data...</p>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-text-primary mb-2">Trader Dashboard</h1>
            <p className="text-text-secondary">Welcome back. Here is what is happening with your portfolio today.</p>
          </div>
          <div className="hidden md:block text-right">
             <p className="text-[10px] text-text-tertiary font-bold uppercase mb-1">System Status</p>
             <div className="flex items-center gap-2 text-color-success text-xs font-bold">
                <i className="pi pi-circle-fill text-[8px]"></i> Operational
             </div>
          </div>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-bg-secondary border border-color-border rounded-2xl p-6 hover:border-color-primary/30 transition shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Net Worth</p>
              <i className="pi pi-wallet text-color-primary"></i>
            </div>
            <p className="font-mono text-3xl font-bold text-text-primary tracking-tight">${(portfolio?.total_value || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            <div className={`flex items-center gap-1 font-mono text-xs mt-3 font-bold ${portfolio?.total_pnl >= 0 ? 'text-color-success' : 'text-color-danger'}`}>
              <i className={`pi ${portfolio?.total_pnl >= 0 ? 'pi-arrow-up-right' : 'pi-arrow-down-right'}`}></i>
              {portfolio?.total_pnl >= 0 ? '+' : ''}{(portfolio?.total_pnl || 0).toFixed(2)}%
            </div>
          </div>
          
          <div className="bg-bg-secondary border border-color-border rounded-2xl p-6 hover:border-color-primary/30 transition shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Active Assets</p>
              <i className="pi pi-chart-bar text-color-info"></i>
            </div>
            <p className="font-mono text-3xl font-bold text-text-primary tracking-tight">{portfolio?.holdings?.length || 0}</p>
            <p className="text-[10px] text-text-tertiary font-bold mt-3">Spanning 5 Networks</p>
          </div>

          <div className="bg-bg-secondary border border-color-border rounded-2xl p-6 hover:border-color-primary/30 transition shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Staking Rewards</p>
              <i className="pi pi-database text-color-success"></i>
            </div>
            <p className="font-mono text-3xl font-bold text-color-success tracking-tight">{positions.length}</p>
            <p className="text-[10px] text-text-tertiary font-bold mt-3">Avg. 12.4% APY</p>
          </div>

          <div className="bg-bg-secondary border border-color-border rounded-2xl p-6 hover:border-color-primary/30 transition shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Global Cap</p>
              <i className="pi pi-globe text-color-warning"></i>
            </div>
            <p className="font-mono text-3xl font-bold text-text-primary tracking-tight">
              ${globalStats ? (globalStats.total_market_cap / 1e12).toFixed(2) : '--'}T
            </p>
            <p className="text-[10px] text-color-warning font-bold mt-3">BTC Dominance: {globalStats?.btc_dominance?.toFixed(1) || '--'}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Recent Trades */}
          <div className="lg:col-span-2 bg-bg-secondary border border-color-border rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-color-border flex justify-between items-center">
              <h2 className="font-bold text-xl text-text-primary">Live Portfolio</h2>
              <Link href="/assets" className="text-color-primary hover:underline text-xs font-black uppercase tracking-widest">View Full Breakdown</Link>
            </div>
            {portfolio?.holdings && portfolio.holdings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-bg-tertiary/50 text-left">
                      <th className="py-3 px-6 text-text-tertiary font-black uppercase text-[10px] tracking-widest">Asset</th>
                      <th className="text-right py-3 px-6 text-text-tertiary font-black uppercase text-[10px] tracking-widest">Quantity</th>
                      <th className="text-right py-3 px-6 text-text-tertiary font-black uppercase text-[10px] tracking-widest">USD Value</th>
                      <th className="text-right py-3 px-6 text-text-tertiary font-black uppercase text-[10px] tracking-widest">PNL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-color-border">
                    {portfolio.holdings.slice(0, 5).map((h: any, i: number) => (
                      <tr key={i} className="hover:bg-bg-tertiary/30 transition-colors">
                        <td className="py-4 px-6 font-bold text-text-primary">
                           <div className="flex items-center gap-2">
                             <span className="w-6 h-6 rounded bg-bg-tertiary text-[10px] flex items-center justify-center border border-color-border">{h.symbol}</span>
                             {h.symbol}
                           </div>
                        </td>
                        <td className="py-4 px-6 text-right font-mono text-text-secondary">{h.quantity.toFixed(4)}</td>
                        <td className="py-4 px-6 text-right font-mono text-text-primary font-bold">${h.value.toLocaleString()}</td>
                        <td className={`py-4 px-6 text-right font-mono font-bold ${h.pnl_percentage >= 0 ? 'text-color-success' : 'text-color-danger'}`}>
                          {h.pnl_percentage >= 0 ? '+' : ''}{h.pnl_percentage.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                 <i className="pi pi-inbox text-4xl text-text-tertiary mb-4"></i>
                 <p className="text-text-secondary">No holdings yet. Start trading to build your portfolio.</p>
              </div>
            )}
          </div>

          {/* Market Ticker */}
          <div className="bg-bg-secondary border border-color-border rounded-2xl overflow-hidden shadow-xl flex flex-col">
            <div className="p-6 border-b border-color-border">
               <h2 className="font-bold text-xl text-text-primary">Market Watch</h2>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[400px]">
              {prices.slice(0, 10).map((p: any) => (
                <div key={p.symbol} className="px-6 py-4 flex items-center justify-between border-b border-color-border/30 hover:bg-bg-tertiary/30 transition">
                  <div className="flex items-center gap-3">
                     <img src={p.image_url} alt="" className="w-6 h-6 rounded-full grayscale" />
                     <div>
                        <p className="font-black text-xs text-text-primary">{p.symbol}</p>
                        <p className="text-[10px] text-text-tertiary">{p.name}</p>
                     </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-text-primary text-sm">${p.current_price.toLocaleString()}</p>
                    <p className={`text-[10px] font-bold ${p.price_change_percentage_24h >= 0 ? 'text-color-success' : 'text-color-danger'}`}>
                       {p.price_change_percentage_24h >= 0 ? '+' : ''}{p.price_change_percentage_24h?.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/markets" className="p-4 bg-bg-tertiary/20 text-center text-color-primary hover:bg-bg-tertiary/50 text-[10px] font-black uppercase tracking-widest transition">
               View All Markets <i className="pi pi-angle-right ml-1"></i>
            </Link>
          </div>
        </div>

        {/* Quick Access Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
           {[
             { name: 'Trade', icon: 'pi pi-sync', href: '/trade', desc: 'Exchange assets' },
             { name: 'Deposit', icon: 'pi pi-plus-circle', href: '/deposit', desc: 'Add funds' },
             { name: 'Withdraw', icon: 'pi pi-minus-circle', href: '/withdraw', desc: 'Move funds' },
             { name: 'Mining', icon: 'pi pi-bolt', href: '/mining', desc: 'Cloud power' },
             { name: 'Staking', icon: 'pi pi-database', href: '/stake', desc: 'Earn passive' },
             { name: 'Vaults', icon: 'pi pi-lock', href: '/cold-storage', desc: 'Secure assets' },
           ].map((action) => (
             <Link key={action.name} href={action.href} className="bg-bg-secondary border border-color-border p-5 rounded-2xl hover:border-color-primary/50 hover:bg-bg-tertiary transition group shadow-md flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center text-text-tertiary group-hover:text-color-primary transition mb-3">
                   <i className={action.icon}></i>
                </div>
                <h4 className="font-bold text-text-primary text-xs mb-1">{action.name}</h4>
                <p className="text-[8px] text-text-tertiary uppercase font-black tracking-tighter">{action.desc}</p>
             </Link>
           ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
