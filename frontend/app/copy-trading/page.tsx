'use client';

import { DashboardLayout } from '../dashboard-layout';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS, COLORS } from '@/constants';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Extracted TraderAvatar component
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

// Extracted TraderStatsModal component
const TraderStatsModal = ({ trader, onClose }: { trader: any; onClose: () => void }) => {
  const roiData = [...(trader.pnlRatios || [])].reverse().map((p: any, i: number) => ({
    week: `W${i + 1}`,
    roi: parseFloat((parseFloat(p.pnlRatio || 0) * 100).toFixed(2)),
  }));

  const worstWeek = roiData.reduce((min: any, d: any) => d.roi < min.roi ? d : min, roiData[0] || { roi: 0 });
  const maxDrawdown = Math.abs(Math.min(0, worstWeek?.roi ?? 0)).toFixed(1);
  const riskScore = parseFloat(maxDrawdown) < 10 ? 'Low' : parseFloat(maxDrawdown) < 30 ? 'Medium' : 'High';
  const riskColor = riskScore === 'Low' ? 'text-green-400' : riskScore === 'Medium' ? 'text-yellow-400' : 'text-red-400';
  const pairs = (trader.traderInsts || []).slice(0, 10).map((p: string) => p.replace('-SWAP', ''));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
      <div className="bg-[#181A20] border border-white/10 rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <TraderAvatar trader={trader} />
            <div>
              <h2 className="text-lg font-bold text-white">{trader.username}</h2>
              <span className="text-xs text-text-tertiary uppercase tracking-tighter">Verified Institutional Trader</span>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
             <i className="pi pi-times text-white"></i>
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-bg-tertiary/20 rounded-2xl p-6 border border-white/5 text-center">
              <div className="text-[10px] text-text-tertiary font-black uppercase mb-1 tracking-widest">Total ROI</div>
              <div className="text-3xl font-black text-color-primary">{(parseFloat(trader.roi || 0) * 100).toFixed(1)}%</div>
            </div>
            <div className="bg-bg-tertiary/20 rounded-2xl p-6 border border-white/5 text-center">
              <div className="text-[10px] text-text-tertiary font-black uppercase mb-1 tracking-widest">Win Rate</div>
              <div className="text-3xl font-black text-color-success">{parseFloat(trader.win_rate || 0).toFixed(1)}%</div>
            </div>
            <div className="bg-bg-tertiary/20 rounded-2xl p-6 border border-white/5 text-center">
              <div className="text-[10px] text-text-tertiary font-black uppercase mb-1 tracking-widest">Max Drawdown</div>
              <div className={`text-3xl font-black ${riskColor}`}>{maxDrawdown}%</div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Performance Curve</h3>
            <div className="h-64 bg-bg-tertiary/10 rounded-2xl p-4 border border-white/5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={roiData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2B2F36" vertical={false} />
                  <XAxis dataKey="week" stroke="#474D57" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#474D57" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E2329', border: '1px solid #2B2F36', borderRadius: '1rem' }}
                    labelStyle={{ color: '#FCD535', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="roi" stroke={COLORS.primary} strokeWidth={3} dot={{ r: 4, fill: COLORS.primary }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
               <h3 className="text-sm font-bold text-white uppercase tracking-widest">Risk Assessment</h3>
               <div className="p-5 rounded-2xl bg-bg-tertiary/20 border border-white/5">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-text-tertiary">Strategy Aggressiveness</span>
                    <span className={`text-sm font-bold ${riskColor}`}>{riskScore}</span>
                  </div>
                  <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        riskScore === 'Low' ? 'bg-green-400 w-1/3 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 
                        riskScore === 'Medium' ? 'bg-yellow-400 w-2/3 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 
                        'bg-red-400 w-full shadow-[0_0_10px_rgba(248,113,113,0.5)]'
                      }`}
                    />
                  </div>
               </div>
             </div>
             
             <div className="space-y-4">
               <h3 className="text-sm font-bold text-white uppercase tracking-widest">Main Trade Assets</h3>
               <div className="flex flex-wrap gap-2">
                 {pairs.length > 0 ? pairs.map((pair: string, i: number) => (
                   <span key={i} className="px-3 py-1.5 bg-bg-tertiary/40 rounded-lg text-[10px] font-bold text-text-secondary border border-white/10 uppercase">
                     {pair}
                   </span>
                 )) : (
                   <span className="text-xs text-text-tertiary italic">Diversified Index</span>
                 )}
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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

  const filteredTraders = (traders || []).filter((trader: any) => {
    const searchMatch = !searchQuery.trim() || 
      (trader.username && trader.username.toLowerCase().includes(searchQuery.trim().toLowerCase()));
    
    let filterMatch = true;
    if (filter !== 'All') {
      switch (filter) {
        case 'High ROI':
          filterMatch = trader.roi && parseFloat(trader.roi) > 0.5;
          break;
        case 'Low Risk':
          filterMatch = trader.win_rate && parseFloat(trader.win_rate) > 70;
          break;
        case 'Trending':
          filterMatch = trader.followers && trader.followers > 1000;
          break;
      }
    }
    return searchMatch && filterMatch;
  });

  const avgRoi = traders.length > 0 
    ? (traders.reduce((sum, t) => sum + (parseFloat(t.roi) || 0), 0) / traders.length * 100).toFixed(1) 
    : '0';
    
  const avgWinRate = traders.length > 0 
    ? (traders.reduce((sum, t) => sum + (parseFloat(t.win_rate) || 0), 0) / traders.length).toFixed(1) 
    : '0';

  const totalAum = traders.reduce((sum, t) => sum + (parseFloat(t.aum) || 0), 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-16 h-16 border-4 border-color-primary/20 border-t-color-primary rounded-full animate-spin"></div>
          <p className="text-text-tertiary font-black uppercase tracking-widest text-[10px]">Loading Master Traders...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {selectedTrader && <TraderStatsModal trader={selectedTrader} onClose={() => setSelectedTrader(null)} />}

      <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-12 pb-20">
        <header className="relative py-16 px-10 rounded-[3rem] overflow-hidden bg-gradient-to-br from-[#1E2329] to-[#0B0E11] border border-white/5 shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-color-primary/10 border border-color-primary/20 text-color-primary text-[10px] font-black uppercase tracking-widest mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-color-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-color-primary"></span>
              </span>
              Next-Gen Copy Trading Active
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
              Elite <span className="text-color-primary">Copy Trading</span> Engine
            </h1>
            <p className="text-text-secondary text-xl font-medium leading-relaxed max-w-xl">
              Mirror institutional-grade strategies from verified master traders in real-time.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-color-primary/5 via-transparent to-transparent"></div>
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-color-primary/10 rounded-full blur-[120px]"></div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {[
            { label: 'Master Traders', value: traders.length, icon: 'pi pi-users', color: 'text-blue-400' },
            { label: 'Avg Total ROI', value: `+${avgRoi}%`, icon: 'pi pi-chart-line', color: 'text-green-400' },
            { label: 'Avg Win Rate', value: `${avgWinRate}%`, icon: 'pi pi-bolt', color: 'text-yellow-400' },
            { label: 'Copying Volume', value: `$${(totalAum / 1000).toFixed(1)}K`, icon: 'pi pi-wallet', color: 'text-color-primary' },
          ].map((stat, i) => (
            <div key={i} className="group relative bg-[#181A20] border border-white/5 p-8 rounded-[2.5rem] hover:border-color-primary/30 transition-all duration-500 shadow-xl overflow-hidden">
               <div className="relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-white/5 ${stat.color} group-hover:scale-110 transition-transform duration-500`}>
                  <i className={`${stat.icon} text-xl`}></i>
                </div>
                <p className="text-[10px] text-text-tertiary font-black uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                <p className="text-3xl font-black text-white">{stat.value}</p>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-color-primary/10 transition-all duration-500"></div>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex bg-[#181A20] p-1.5 rounded-[1.5rem] border border-white/5 w-full lg:w-auto overflow-x-auto no-scrollbar">
            {['All', 'High ROI', 'Low Risk', 'Trending'].map((f, i) => (
              <button
                key={i}
                onClick={() => setFilter(f)}
                className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${f === filter ? 'bg-color-primary text-bg-primary shadow-xl shadow-color-primary/20' : 'text-text-tertiary hover:text-white'}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-96 group">
            <i className="pi pi-search absolute left-6 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-color-primary transition-colors"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search master traders..."
              className="w-full bg-[#181A20] border border-white/5 rounded-2xl pl-14 pr-8 py-4.5 focus:border-color-primary/50 outline-none transition-all placeholder:text-text-tertiary text-white shadow-2xl text-sm"
            />
          </div>
        </div>

        {filteredTraders.length === 0 ? (
          <div className="py-20 text-center bg-bg-secondary rounded-[3rem] border border-white/5">
            <i className="pi pi-search text-6xl text-bg-tertiary mb-6 block"></i>
            <h3 className="text-lg font-bold text-text-secondary">No master traders match your search.</h3>
            <p className="text-text-tertiary text-sm mt-2">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredTraders.map((trader) => (
              <div key={trader.trader_id || trader.id} className="group relative bg-[#181A20] border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-color-primary/40 transition-all duration-500 shadow-2xl flex flex-col scale-100 hover:scale-[1.02]">
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
                    <h3 className="text-2xl font-black text-white group-hover:text-color-primary transition-colors duration-300 mb-1 leading-none">{trader.username}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-tertiary font-black uppercase tracking-widest">Main Asset</span>
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-white font-bold">{trader.trading_pair || 'ETH/USDT'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-bg-tertiary/20 p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center group-hover:bg-color-primary/5 transition-all duration-500">
                      <p className="text-[10px] text-text-tertiary uppercase font-black tracking-widest mb-1">Total ROI</p>
                      <p className="text-2xl font-black text-color-primary">+{(parseFloat(trader.roi || 0) * 100).toFixed(1)}%</p>
                    </div>
                    <div className="bg-bg-tertiary/20 p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center group-hover:bg-color-success/5 transition-all duration-500">
                      <p className="text-[10px] text-text-tertiary uppercase font-black tracking-widest mb-1">Win Rate</p>
                      <p className="text-2xl font-black text-color-success">{parseFloat(trader.win_rate || 0).toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="space-y-4 px-2 mb-10">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-tertiary font-bold uppercase tracking-widest">Active Copiers</span>
                      <span className="text-white font-black bg-bg-tertiary px-3 py-1 rounded-lg">{(trader.followers || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-tertiary font-bold uppercase tracking-widest">Fund Managed</span>
                      <span className="text-white font-black">${(parseFloat(trader.aum || 0)).toLocaleString()}</span>
                    </div>
                  </div>

                  <button className="w-full bg-color-primary text-bg-primary py-5 rounded-2xl font-black transition-all duration-500 flex items-center justify-center gap-3 shadow-xl shadow-color-primary/10 hover:shadow-color-primary/25 hover:brightness-110 active:scale-[0.98]">
                    <i className="pi pi-copy text-xl"></i>
                    <span className="tracking-tighter uppercase">START COPY TRADE</span>
                  </button>
                </div>

                <div className="mt-8 py-5 bg-white/[0.02] border-t border-white/5 flex justify-center">
                  <button
                    onClick={() => setSelectedTrader(trader)}
                    className="text-[10px] text-text-tertiary hover:text-color-primary font-black tracking-[0.3em] uppercase flex items-center gap-3 transition-all transform hover:scale-105">
                    View Extended Analytics <i className="pi pi-chevron-right"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-10 bg-color-primary/5 border border-color-primary/10 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8">
          <div className="w-16 h-16 rounded-[1.5rem] bg-color-primary/10 flex items-center justify-center flex-shrink-0 animate-pulse">
            <i className="pi pi-shield text-3xl text-color-primary shadow-glow"></i>
          </div>
          <div>
            <h4 className="text-lg font-black text-white mb-2 uppercase tracking-widest">Global Risk Control Center</h4>
            <p className="text-xs text-text-tertiary leading-relaxed max-w-4xl font-black uppercase tracking-tighter">
              Trading entails significant capital risk. Copy-trading allows you to mirror strategies, but past performance does not guarantee future results. Managed by Legacy FX Multi-Cluster Cloud System.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
