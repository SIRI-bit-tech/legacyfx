'use client';

import { DashboardLayout } from '../dashboard-layout';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

// Internal Components
import { StatCard } from '@/components/copy-trading/StatCard';
import { TraderCard } from '@/components/copy-trading/TraderCard';
import { TraderStatsModal } from '@/components/copy-trading/TraderStatsModal';
import { StartCopyTradeModal } from '@/components/copy-trading/StartCopyTradeModal';

export default function CopyTradingPage() {
  const [traders, setTraders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filter, setFilter] = useState('All');
  const [selectedTrader, setSelectedTrader] = useState<any | null>(null);
  const [traderToCopy, setTraderToCopy] = useState<any | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const copySuccessTimer = useRef<any>(null);

  useEffect(() => {
    loadTraders();
    return () => {
      if (copySuccessTimer.current) {
        clearTimeout(copySuccessTimer.current);
      }
    };
  }, []);

  const loadTraders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`${(API_ENDPOINTS as any).COPY_TRADING.MASTER_TRADERS}?limit=50`);
      const tradersList = Array.isArray(res) ? res : res?.data || [];
      setTraders(tradersList);
    } catch (err) {
      console.error('Failed to load traders:', err);
      setError('Connection engine failed to fetch master trader data.');
      setTraders([]);
    } finally {
      setLoading(false);
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

  const avgRoiStr = traders.length > 0 
    ? (traders.reduce((sum, t) => sum + (parseFloat(t.roi) || 0), 0) / traders.length * 100).toFixed(1) 
    : '0';
    
  const avgWinRate = traders.length > 0 
    ? (traders.reduce((sum, t) => sum + (parseFloat(t.win_rate) || 0), 0) / traders.length).toFixed(1) 
    : '0';

  const totalAum = traders.reduce((sum, t) => sum + (parseFloat(t.aum) || 0), 0);

  const stats = [
    { label: 'Master Traders', value: traders.length, icon: 'pi pi-users', color: 'text-blue-400' },
    { label: 'Avg Total ROI', value: `${parseFloat(avgRoiStr) > 0 ? '+' : ''}${avgRoiStr}%`, icon: 'pi pi-chart-line', color: 'text-green-400' },
    { label: 'Avg Win Rate', value: `${avgWinRate}%`, icon: 'pi pi-bolt', color: 'text-yellow-400' },
    { label: 'Copying Volume', value: `$${(totalAum / 1000).toFixed(1)}K`, icon: 'pi pi-wallet', color: 'text-[#FCD535]' },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-16 h-16 border-4 border-[#FCD535]/20 border-t-[#FCD535] rounded-full animate-spin"></div>
          <p className="text-[#848E9C] font-black uppercase tracking-widest text-[10px]">Loading Master Traders...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {selectedTrader && <TraderStatsModal trader={selectedTrader} onClose={() => setSelectedTrader(null)} />}
      
      {traderToCopy && (
        <StartCopyTradeModal 
          trader={traderToCopy} 
          onClose={() => setTraderToCopy(null)} 
          onSuccess={() => {
            setTraderToCopy(null);
            setCopySuccess(true);
            
            // Clear any existing timer to prevent overlaps
            if (copySuccessTimer.current) {
              clearTimeout(copySuccessTimer.current);
            }
            
            // Set a new timer to dismiss the success state
            copySuccessTimer.current = setTimeout(() => {
              setCopySuccess(false);
              copySuccessTimer.current = null;
            }, 5000);
          }} 
        />
      )}

      {copySuccess && (
        <div 
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="fixed top-24 right-10 z-[200] p-6 bg-green-400 rounded-2xl shadow-2xl animate-in slide-in-from-right-10 duration-500 flex items-center gap-4 text-[#111111]"
        >
          <i className="pi pi-check-circle text-2xl"></i>
          <div>
            <div className="font-black uppercase tracking-widest text-xs">Mirror Activated</div>
            <div className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">Your engine is now copying in real-time.</div>
          </div>
        </div>
      )}

      <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-12 pb-20">
        <header className="relative py-16 px-10 rounded-[3rem] overflow-hidden bg-gradient-to-br from-[#1E2329] to-[#0B0E11] border border-white/5 shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FCD535]/10 border border-[#FCD535]/20 text-[#FCD535] text-[10px] font-black uppercase tracking-widest mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FCD535] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FCD535]"></span>
              </span>
              Next-Gen Copy Trading Active
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
              Elite <span className="text-[#FCD535]">Copy Trading</span> Engine
            </h1>
            <p className="text-[#848E9C] text-xl font-medium leading-relaxed max-w-xl">
              Mirror institutional-grade strategies from verified master traders in real-time.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-[#FCD535]/5 via-transparent to-transparent"></div>
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#FCD535]/10 rounded-full blur-[120px]"></div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {stats.map((stat, i) => (
            <StatCard key={i} stat={stat} />
          ))}
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex bg-[#181A20] p-1.5 rounded-[1.5rem] border border-white/5 w-full lg:w-auto overflow-x-auto no-scrollbar">
            {['All', 'High ROI', 'Low Risk', 'Trending'].map((f, i) => (
              <button
                key={i}
                onClick={() => setFilter(f)}
                className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${f === filter ? 'bg-[#FCD535] text-[#111111] shadow-xl shadow-[#FCD535]/20' : 'text-[#848E9C] hover:text-white'}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-96 group">
            <i className="pi pi-search absolute left-6 top-1/2 -translate-y-1/2 text-[#848E9C] group-focus-within:text-[#FCD535] transition-colors"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search master traders..."
              className="w-full bg-[#181A20] border border-white/5 rounded-2xl pl-14 pr-8 py-4.5 focus:border-[#FCD535]/50 outline-none transition-all placeholder:text-[#848E9C] text-white shadow-2xl text-sm"
            />
          </div>
        </div>

        {error ? (
          <div className="py-24 text-center bg-red-400/5 rounded-[3.5rem] border border-red-400/10 shadow-2xl animate-in slide-in-from-right-10 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-400/50 to-transparent"></div>
            <i className="pi pi-exclamation-triangle text-7xl text-red-500 mb-8 block drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]"></i>
            <h3 className="text-xl font-black text-red-400 uppercase tracking-widest mb-4">Connection Engine Failure</h3>
            <p className="text-[#848E9C] text-sm max-w-md mx-auto mb-10 font-black uppercase tracking-tighter opacity-70">
              The real-time data terminal is experiencing a synchronization error: {error}
            </p>
            <button 
              onClick={loadTraders}
              className="bg-red-500 hover:bg-red-400 text-bg-primary px-12 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-red-500/20"
            >
              Retry Connection
            </button>
          </div>
        ) : traders.length === 0 ? (
          <div className="py-24 text-center bg-[#181A20]/40 rounded-[3.5rem] border border-white/5 shadow-2xl">
            <i className="pi pi-users text-7xl text-[#1E2329] mb-8 block"></i>
            <h2 className="text-xl font-black text-[#FCD535] uppercase tracking-widest mb-4">Scanning for Top Performers</h2>
            <p className="text-[#848E9C] text-sm max-w-md mx-auto font-black uppercase tracking-tighter opacity-60">
              The Elite Copy Trading network is currently scouting for new Master Traders to feature on the terminal.
            </p>
          </div>
        ) : filteredTraders.length === 0 ? (
          <div className="py-24 text-center bg-[#0B0E11]/40 rounded-[3.5rem] border border-white/5 shadow-2xl">
            <i className="pi pi-search-minus text-7xl text-[#1E2329] mb-8 block"></i>
            <h3 className="text-xl font-black text-[#848E9C] uppercase tracking-widest mb-4">No Mirror Signal Matches</h3>
            <p className="text-[#848E9C] text-sm max-w-md mx-auto font-black uppercase tracking-tighter opacity-60">
              Your current search query or filter combination yielded no active signal matches on the terminal.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredTraders.map((trader) => (
              <TraderCard 
                key={trader.trader_id || trader.id} 
                trader={trader} 
                onViewAnalytics={setSelectedTrader}
                onStartCopy={setTraderToCopy}
              />
            ))}
          </div>
        )}

        <div className="p-10 bg-[#FCD535]/5 border border-[#FCD535]/10 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8">
          <div className="w-16 h-16 rounded-[1.5rem] bg-[#FCD535]/10 flex items-center justify-center flex-shrink-0 animate-pulse">
            <i className="pi pi-shield text-3xl text-[#FCD535] shadow-glow"></i>
          </div>
          <div>
            <h4 className="text-lg font-black text-white mb-2 uppercase tracking-widest">Global Risk Control Center</h4>
            <p className="text-xs text-[#848E9C] leading-relaxed max-w-4xl font-black uppercase tracking-tighter opacity-80">
              Trading entails significant capital risk. Copy-trading allows you to mirror strategies, but past performance does not guarantee future results. Managed by Legacy FX Multi-Cluster Cloud System.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
