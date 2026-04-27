'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';
import { DashboardLayout } from '../dashboard-layout';
import { usePortfolioAssets } from '@/hooks/usePortfolioAssets';
import { usePortfolioSummary } from '@/hooks/usePortfolioSummary';

export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [prices, setPrices] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [networkStatusExpanded, setNetworkStatusExpanded] = useState(false);
  const [coldStorageBalance, setColdStorageBalance] = useState<number>(0);
  const [stakingStats, setStakingStats] = useState<any>(null);

  const summary = usePortfolioSummary();
  const { assets, loading: assetsLoading } = usePortfolioAssets();
  const activeAssetsCount = assetsLoading ? '--' : assets.filter((a) => a.total > 0).length;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [portfolioRes, pricesRes, tradesRes, statsRes, coldStorageRes, stakingRes] = (await Promise.all([
        api.get(API_ENDPOINTS.TRADES.PORTFOLIO).catch(() => null),
        api.get(API_ENDPOINTS.MARKETS.PRICES).catch(() => []),
        api.get(`${API_ENDPOINTS.TRADES.HISTORY}?page=1&limit=5`).catch(() => []),
        api.get(API_ENDPOINTS.MARKETS.OVERVIEW).catch(() => null),
        api.get(API_ENDPOINTS.COLD_STORAGE.VAULT).catch(() => ({ total_balance_usd: 0 })),
        api.get('/api/v1/staking/stats').catch(() => null)
      ])) as [any, any[], any[], any, any, any];
      setPortfolio(portfolioRes);
      setPrices(pricesRes || []);
      setTrades(tradesRes || []);
      setGlobalStats(statsRes);
      setColdStorageBalance(coldStorageRes?.total_balance_usd || 0);
      setStakingStats(stakingRes);
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
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-10">
        <header className="mb-6 lg:mb-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
          <div>
            <h1 className="text-2xl lg:text-4xl font-black text-text-primary mb-2">Trader Dashboard</h1>
            <p className="text-sm lg:text-base text-text-secondary">Welcome back. Here is what is happening with your portfolio today.</p>
          </div>
          <div className="text-right relative w-full lg:w-auto">
             <p className="text-[10px] text-text-tertiary font-bold uppercase mb-1">System Status</p>
             <div 
               className="flex items-center gap-2 text-color-success text-xs font-bold cursor-pointer hover:opacity-80 transition justify-end lg:justify-start"
               onClick={() => setNetworkStatusExpanded(!networkStatusExpanded)}
             >
                <i className="pi pi-circle-fill text-[8px]"></i>
                <span className="hidden sm:inline">Operational</span>
                <i className={`pi pi-chevron-${networkStatusExpanded ? 'up' : 'down'} text-[8px]`}></i>
             </div>
             {networkStatusExpanded && (
               <div className="absolute right-0 top-full mt-2 bg-bg-secondary border border-color-border rounded-lg p-3 shadow-xl z-10 min-w-[200px] lg:min-w-[220px]">
                 <div className="space-y-2">
                   <div className="flex items-center justify-between text-[10px] lg:text-[11px] flex-col lg:flex-row gap-1 lg:gap-2">
                     <span className="text-text-secondary">ETH Mainnet</span>
                     <div className="flex items-center gap-2">
                       <span className="text-text-tertiary text-xs lg:text-sm">Gas: 12 Gwei</span>
                       <i className="pi pi-circle-fill text-[6px] text-color-success"></i>
                       <span className="text-color-success font-bold text-xs lg:text-sm">Live</span>
                     </div>
                   </div>
                   <div className="flex items-center justify-between text-[10px] lg:text-[11px] flex-col lg:flex-row gap-1 lg:gap-2">
                     <span className="text-text-secondary">BTC Network</span>
                     <div className="flex items-center gap-2">
                       <span className="text-text-tertiary text-xs lg:text-sm">Mempool: Normal</span>
                       <i className="pi pi-circle-fill text-[6px] text-color-success"></i>
                       <span className="text-color-success font-bold text-xs lg:text-sm">Live</span>
                     </div>
                   </div>
                   <div className="flex items-center justify-between text-[10px] lg:text-[11px] flex-col lg:flex-row gap-1 lg:gap-2">
                     <span className="text-text-secondary">BSC</span>
                     <div className="flex items-center gap-2">
                       <span className="text-text-tertiary text-xs lg:text-sm">Congestion: Low</span>
                       <i className="pi pi-circle-fill text-[6px] text-color-success"></i>
                       <span className="text-color-success font-bold text-xs lg:text-sm">Live</span>
                     </div>
                   </div>
                   <div className="flex items-center justify-between text-[10px] lg:text-[11px] flex-col lg:flex-row gap-1 lg:gap-2">
                     <span className="text-text-secondary">Solana</span>
                     <div className="flex items-center gap-2">
                       <span className="text-text-tertiary text-xs lg:text-sm">TPS: 2,847</span>
                       <i className="pi pi-circle-fill text-[6px] text-color-success"></i>
                       <span className="text-color-success font-bold text-xs lg:text-sm">Live</span>
                     </div>
                   </div>
                 </div>
               </div>
             )}
          </div>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
          <div className="bg-bg-secondary border border-color-border rounded-2xl p-6 hover:border-color-primary/30 transition shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Net Worth</p>
              <i className="pi pi-wallet text-color-primary"></i>
            </div>
            <p className="font-mono text-3xl font-bold text-text-primary tracking-tight">
              {summary.loading ? '--' : `$${summary.netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </p>
            <div className={`flex items-center gap-1 font-mono text-xs mt-3 font-bold ${summary.change24h >= 0 ? 'text-color-success' : 'text-color-danger'}`}>
              <i className={`pi ${summary.change24h >= 0 ? 'pi-arrow-up-right' : 'pi-arrow-down-right'}`}></i>
              {summary.loading ? '--' : `${summary.change24h >= 0 ? '+' : ''}${summary.change24h.toFixed(2)}%`}
            </div>
          </div>
          
          <div className="bg-bg-secondary border border-color-border rounded-2xl p-6 hover:border-color-primary/30 transition shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Active Assets</p>
              <i className="pi pi-chart-bar text-color-info"></i>
            </div>
            <p className="font-mono text-3xl font-bold text-text-primary tracking-tight">{activeAssetsCount}</p>
            <p className="text-[10px] text-text-tertiary font-bold mt-3">Spanning 5 Networks</p>
          </div>

          <div className="bg-bg-secondary border border-color-border rounded-2xl p-6 hover:border-color-primary/30 transition shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Trading Balance</p>
              <i className="pi pi-wallet text-color-success"></i>
            </div>
            <p className="font-mono text-3xl font-bold text-color-success tracking-tight">
              {summary.loading ? '--' : `$${summary.available.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </p>
            <p className="text-[10px] text-text-tertiary font-bold mt-3">Available to trade</p>
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

          <div className="bg-bg-secondary border border-color-border rounded-2xl p-6 hover:border-color-primary/30 transition shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Cold Storage</p>
              <Link href="/cold-storage">
                <i className="pi pi-lock text-color-info hover:text-color-primary transition cursor-pointer"></i>
              </Link>
            </div>
            <p className="font-mono text-3xl font-bold text-color-info tracking-tight">
              ${coldStorageBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <Link href="/cold-storage" className="text-[10px] text-color-info font-bold mt-3 hover:underline">Manage Vault →</Link>
          </div>

          <div className="bg-bg-secondary border border-color-border rounded-2xl p-6 hover:border-color-primary/30 transition shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Staking</p>
              <Link href="/staking">
                <i className="pi pi-chart-line text-color-success hover:text-color-primary transition cursor-pointer"></i>
              </Link>
            </div>
            <p className="font-mono text-3xl font-bold text-color-success tracking-tight">
              ${stakingStats?.total_staked_usd ? stakingStats.total_staked_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </p>
            <p className="text-[10px] text-color-success font-bold mt-3">{stakingStats?.active_stakes_count || 0} Active • {stakingStats?.avg_apy ? stakingStats.avg_apy.toFixed(1) : '0'}% APY</p>
            <Link href="/staking" className="text-[10px] text-color-success font-bold mt-2 hover:underline block">View Staking →</Link>
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
              <div className="p-8">
                {/* P&L Chart Placeholder */}
                <div className="mb-8 h-20 border border-dashed border-color-border/50 rounded-lg flex items-center justify-center">
                  <p className="text-text-tertiary text-xs">P&L chart will appear once you hold assets</p>
                </div>
                
                {/* Empty State */}
                <div className="text-center mb-8">
                  <i className="pi pi-inbox text-4xl text-text-tertiary mb-4"></i>
                  <p className="text-text-secondary mb-6">No holdings yet. Start trading to build your portfolio.</p>
                  <Link 
                    href="/trade" 
                    className="inline-flex items-center gap-2 bg-color-primary hover:bg-color-primary/90 text-bg-primary font-bold px-6 py-3 rounded-lg transition shadow-lg"
                  >
                    Start Trading <i className="pi pi-arrow-right text-sm"></i>
                  </Link>
                </div>

                {/* Suggested Assets */}
                <div className="mt-8">
                  <h3 className="text-text-tertiary text-[10px] font-black uppercase tracking-widest mb-4">Suggested Assets</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { symbol: 'BTC', name: 'Bitcoin', price: 67234.50, change: 2.34, icon: '/icons/crypto/btc.svg' },
                      { symbol: 'ETH', name: 'Ethereum', price: 3456.78, change: 1.89, icon: '/icons/crypto/eth.svg' },
                      { symbol: 'SOL', name: 'Solana', price: 142.56, change: 4.12, icon: '/icons/crypto/sol.svg' }
                    ].map((asset) => (
                      <div key={asset.symbol} className="bg-bg-tertiary/30 border border-color-border rounded-lg p-4 hover:border-color-primary/30 transition">
                        <div className="flex items-center gap-2 mb-3">
                          <img src={asset.icon} alt={asset.symbol} className="w-6 h-6" />
                          <div>
                            <p className="font-bold text-xs text-text-primary">{asset.symbol}</p>
                            <p className="text-[9px] text-text-tertiary">{asset.name}</p>
                          </div>
                        </div>
                        <p className="font-mono text-sm font-bold text-text-primary mb-1">${asset.price.toLocaleString()}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-bold text-color-success">+{asset.change}%</p>
                          <Link 
                            href={`/trade?pair=${asset.symbol}/USDT`}
                            className="text-[9px] font-bold text-color-primary hover:underline uppercase tracking-wider"
                          >
                            Trade
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Market Ticker */}
          <div className="bg-bg-secondary border border-color-border rounded-2xl overflow-hidden shadow-xl flex flex-col">
            <div className="p-6 border-b border-color-border">
               <h2 className="font-bold text-xl text-text-primary">Market Watch</h2>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[400px]">
              {prices.slice(0, 10).map((p: any, idx: number) => {
                const sparklineColor = p.price_change_percentage_24h >= 0 ? '#0ECB81' : '#F6465D';
                // Generate realistic sparkline path data
                const sparklinePaths = [
                  'M 0 20 Q 10 18, 20 15 T 40 12 T 60 8',
                  'M 0 8 Q 10 12, 20 10 T 40 15 T 60 20',
                  'M 0 16 Q 10 14, 20 12 T 40 10 T 60 6',
                  'M 0 10 Q 10 8, 20 12 T 40 14 T 60 18',
                  'M 0 18 Q 10 15, 20 13 T 40 9 T 60 5',
                  'M 0 6 Q 10 9, 20 11 T 40 15 T 60 19',
                  'M 0 14 Q 10 12, 20 10 T 40 8 T 60 4',
                  'M 0 12 Q 10 14, 20 16 T 40 18 T 60 22',
                  'M 0 22 Q 10 19, 20 16 T 40 12 T 60 8',
                  'M 0 8 Q 10 10, 20 12 T 40 16 T 60 20'
                ];
                const sparklinePath = sparklinePaths[idx % sparklinePaths.length];
                
                return (
                  <div key={p.symbol} className="px-6 py-4 flex items-center justify-between border-b border-color-border/30 hover:bg-bg-tertiary/30 transition">
                    <div className="flex items-center gap-3">
                       <img src={p.image_url} alt="" className="w-6 h-6 rounded-full" />
                       <div>
                          <p className="font-black text-xs text-text-primary">{p.symbol}</p>
                          <p className="text-[10px] text-text-tertiary">{p.name}</p>
                       </div>
                    </div>
                    <svg width="60" height="32" viewBox="0 0 60 32" className="mx-2">
                      <path 
                        d={sparklinePath}
                        fill="none" 
                        stroke={sparklineColor} 
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                    <div className="text-right">
                      <p className="font-mono font-bold text-text-primary text-sm">${p.current_price.toLocaleString()}</p>
                      <p className={`text-[10px] font-bold ${p.price_change_percentage_24h >= 0 ? 'text-color-success' : 'text-color-danger'}`}>
                         {p.price_change_percentage_24h >= 0 ? '+' : ''}{p.price_change_percentage_24h?.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                );
              })}
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
