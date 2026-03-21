'use client';

import { DashboardLayout } from '../dashboard-layout';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS, COLORS } from '@/constants';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function CopyTradingPage() {
  const [traders, setTraders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filter, setFilter] = useState('All');
  const [selectedTrader, setSelectedTrader] = useState<any | null>(null);

  useEffect(() => {
    loadTraders();
  }, []);

  const loadTraders = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${(API_ENDPOINTS as any).COPY_TRADING.MASTER_TRADERS}?limit=50`);
      const tradersList = Array.isArray(res) ? res : res?.data || [];
      setTraders(tradersList);
    } catch (err) {
      console.error('Failed to load traders:', err);
      setTraders([]);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (level: string) => {
    switch (level) {
      case 'Diamond': return 'text-[#00D1FF] border-[#00D1FF]/30 bg-[#00D1FF]/10';
      case 'Gold': return 'text-[#F3BA2F] border-[#F3BA2F]/30 bg-[#F3BA2F]/10';
      case 'Silver': return 'text-[#C0C0C0] border-[#C0C0C0]/30 bg-[#C0C0C0]/10';
      default: return 'text-text-tertiary border-color-border bg-bg-tertiary/30';
    }
  };

  const TraderAvatar = ({ trader }: { trader: any }) => {
    const [imgError, setImgError] = useState(false);
    if (trader.avatar_url && !imgError) {
      return (
        <img
          src={trader.avatar_url}
          alt={trader.username}
          onError={() => setImgError(true)}
          className="w-16 h-16 rounded-3xl object-cover border border-white/10 group-hover:scale-105 transition-transform duration-500"
        />
      );
    }
    return (
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-bg-tertiary to-bg-secondary flex items-center justify-center text-2xl font-black text-color-primary border border-white/10 group-hover:scale-105 transition-transform duration-500">
        {trader.username?.charAt(0).toUpperCase()}
      </div>
    );
  };

  const TraderStatsModal = ({ trader, onClose }: { trader: any; onClose: () => void }) => {
    const roiData = [...(trader.pnlRatios || [])].reverse().map((p: any, i: number) => ({
      week: `W${i + 1}`,
      roi: parseFloat((parseFloat(p.pnlRatio) * 100).toFixed(2)),
    }));

    const worstWeek = roiData.reduce((min: any, d: any) => d.roi < min.roi ? d : min, roiData[0] || { roi: 0 });
    const maxDrawdown = Math.abs(Math.min(0, worstWeek?.roi ?? 0)).toFixed(1);
    const riskScore = parseFloat(maxDrawdown) < 10 ? 'Low' : parseFloat(maxDrawdown) < 30 ? 'Medium' : 'High';
    const riskColor = riskScore === 'Low' ? 'text-green-400' : riskScore === 'Medium' ? 'text-yellow-400' : 'text-red-400';
    const pairs = (trader.traderInsts || []).slice(0, 10).map((p: string) => p.replace('-SWAP', ''));

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
        <div className="bg-[#181A20] border border-white/10 rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-4">
              <TraderAvatar trader={trader} />
              <div>
                <h2 className="text-lg font-bold text-white">{trader.username}</h2>
                <span className="text-xs text-text-tertiary">Verified OKX Trader</span>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <i className="pi pi-times text-text-secondary"></i>
            </button>
          </div>

          <div className="p-6 space-y-8">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total ROI', value: `+${trader.roi.toFixed(1)}%`, color: 'text-color-primary' },
                { label: 'Win Rate', value: `${trader.win_rate.toFixed(1)}%`, color: 'text-green-400' },
                { label: 'Copiers', value: trader.followers.toLocaleString(), color: 'text-white' },
              ].map((s, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center">
                  <p className="text-[10px] text-text-tertiary uppercase font-black tracking-widest mb-1">{s.label}</p>
                  <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {roiData.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Weekly ROI History</h3>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={roiData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip
                        contentStyle={{ background: '#1E2329', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                        labelStyle={{ color: '#fff', fontSize: 12 }}
                        formatter={(val: any) => [`${val}%`, 'ROI']}
                      />
                      <Line type="monotone" dataKey="roi" stroke="#F3BA2F" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Risk & Drawdown</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Risk Score', value: riskScore, color: riskColor },
                  { label: 'Max Drawdown', value: `-${maxDrawdown}%`, color: 'text-red-400' },
                  { label: 'Lead Days', value: trader.lead_days ?? 'N/A', color: 'text-white' },
                  { label: 'Assets Managed', value: `$${(trader.aum || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: 'text-white' },
                ].map((s, i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                    <p className="text-[10px] text-text-tertiary uppercase font-black tracking-widest mb-1">{s.label}</p>
                    <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {pairs.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">
                  Trading Pairs ({trader.traderInsts?.length || 0} total)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {pairs.map((pair: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white font-bold tracking-wider">
                      {pair}
                    </span>
                  ))}
                  {(trader.traderInsts?.length || 0) > 10 && (
                    <span className="px-3 py-1.5 rounded-xl bg-color-primary/10 border border-color-primary/20 text-[11px] text-color-primary font-bold">
                      +{trader.traderInsts.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}

            <button className="w-full bg-color-primary text-bg-primary py-4 rounded-2xl font-black transition-all duration-300 hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-3">
              <i className="pi pi-copy"></i>
              START COPY TRADE
            </button>
          </div>
        </div>
      </div>
    );
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
      {selectedTrader && <TraderStatsModal trader={selectedTrader} onClose={() => setSelectedTrader(null)} />}

      <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-12">
        <header className="relative py-12 px-8 rounded-3xl overflow-hidden bg-gradient-to-br from-[#1E2329] to-[#0B0E11] border border-white/5 shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-color-primary/10 border border-color-primary/20 text-color-primary text-[10px] font-bold uppercase tracking-widest mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-color-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-color-primary"></span>
              </span>
              Live Market Integration Active
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight tracking-tight">
              Elite <span className="text-color-primary">Copy Trading</span> Engine
            </h1>
            <p className="text-text-secondary text-lg leading-relaxed">
              Automate your wealth generation by mirroring the world's most profitable traders in real-time.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-color-primary/5 to-transparent"></div>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-color-primary/10 rounded-full blur-[100px]"></div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {[
            { label: 'Verified Traders', value: traders.length, icon: 'pi-users', color: 'text-color-info' },
            { label: 'Aggregated ROI', value: (traders.reduce((sum, t) => sum + (t.roi || 0), 0) / traders.length).toFixed(1) + '%', icon: 'pi-chart-line', color: 'text-color-success' },
            { label: 'Avg Win Rate', value: (traders.reduce((sum, t) => sum + (parseFloat(t.win_rate) || 0), 0) / traders.length).toFixed(1) + '%', icon: 'pi-bolt', color: 'text-color-warning' },
            { label: 'Copying Volume', value: '$' + (traders.reduce((sum, t) => sum + (t.aum || 0), 0) / 1000).toFixed(1) + 'K', icon: 'pi-wallet', color: 'text-color-primary' },
          ].map((stat, i) => (
            <div key={i} className="group relative bg-[#181A20] border border-white/5 p-6 rounded-[2rem] hover:border-color-primary/30 transition-all duration-500 shadow-lg hover:shadow-color-primary/5 cursor-default">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-bg-tertiary/50 ${stat.color} group-hover:scale-110 transition-transform`}>
                <i className={`pi ${stat.icon} text-xl`}></i>
              </div>
              <p className="text-[10px] text-text-tertiary font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex bg-[#181A20] p-1.5 rounded-2xl border border-white/5 self-start">
            {['All', 'High ROI', 'Low Risk', 'Trending'].map((f, i) => (
              <button
                key={i}
                onClick={() => setFilter(f)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${f === filter ? 'bg-color-primary text-bg-primary shadow-xl shadow-color-primary/20' : 'text-text-secondary hover:text-text-primary'}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-80 group">
            <i className="pi pi-search absolute left-5 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-color-primary transition-colors"></i>
            <input
              type="text"
              value={searchQuery || ''}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by nickname..."
              className="w-full bg-[#181A20] border border-white/5 rounded-2xl pl-12 pr-6 py-4 focus:border-color-primary/50 outline-none transition-all placeholder:text-text-tertiary text-white shadow-inner"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {traders.map((trader) => (
            <div key={trader.trader_id} className="group relative bg-[#181A20] border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-color-primary/40 transition-all duration-500 shadow-xl flex flex-col">
              <div className="p-8 pb-0">
                <div className="flex items-center justify-between mb-8">
                  <div className="relative">
                    <TraderAvatar trader={trader} />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-color-success border-4 border-[#181A20]"></div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${getRankColor(trader.level)}`}>
                    {trader.level || 'Elite'}
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-bold text-white group-hover:text-color-primary transition-colors duration-300 mb-1">{trader.username}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-tertiary font-medium">Main Pair:</span>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-white font-bold tracking-wider">{trader.trading_pair}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/10 flex flex-col items-center justify-center group-hover:bg-color-primary/5 group-hover:border-color-primary/20 transition-all duration-500">
                    <p className="text-[10px] text-text-tertiary uppercase font-black tracking-widest mb-1">Total ROI</p>
                    <p className="text-xl font-black text-color-primary">+{trader.roi.toFixed(1)}%</p>
                  </div>
                  <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/10 flex flex-col items-center justify-center group-hover:bg-color-success/5 group-hover:border-color-success/20 transition-all duration-500">
                    <p className="text-[10px] text-text-tertiary uppercase font-black tracking-widest mb-1">Win Rate</p>
                    <p className="text-xl font-black text-color-success">{trader.win_rate.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="space-y-4 px-2 mb-10">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-tertiary">Copiers</span>
                    <span className="text-white font-bold bg-[#2B2F36] px-3 py-1 rounded-lg">{trader.followers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-tertiary">Assets Managed</span>
                    <span className="text-white font-bold">${(trader.aum || 0).toLocaleString()}</span>
                  </div>
                </div>

                <button className="w-full bg-white/5 text-white hover:bg-color-primary hover:text-bg-primary py-4 rounded-2xl font-black transition-all duration-500 flex items-center justify-center gap-3 border border-white/10 group-hover:shadow-[0_10px_40px_rgba(252,213,53,0.15)] group-active:scale-[0.98]">
                  <i className="pi pi-copy text-lg"></i>
                  START COPY TRADE
                </button>
              </div>

              <div className="mt-8 py-5 bg-white/[0.02] border-t border-white/5 flex justify-center group/btn">
                <button
                  onClick={() => setSelectedTrader(trader)}
                  className="text-[10px] text-text-tertiary hover:text-color-primary font-black tracking-[0.2em] uppercase flex items-center gap-2 transition-all group-hover/btn:gap-4">
                  View Verified Stats <i className="pi pi-chevron-right"></i>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 bg-color-primary/5 border border-color-primary/10 rounded-3xl flex items-start gap-5">
          <div className="w-10 h-10 rounded-xl bg-color-primary/10 flex items-center justify-center flex-shrink-0">
            <i className="pi pi-exclamation-triangle text-color-primary"></i>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-widest">Global Risk Management Warning</h4>
            <p className="text-xs text-text-secondary leading-relaxed max-w-4xl font-medium">
              Trading entails significant capital risk. Copy-trading allows you to mirror strategies, but past performance across Bybit V5 clusters does not guarantee future results. Ensure your wallet balance accommodates the minimum spread requirements before initiating a contract. Managed by Legacy FX Multi-Cluster Cloud System.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}