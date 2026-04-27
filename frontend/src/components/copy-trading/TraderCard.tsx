'use client';

import { TraderAvatar } from './TraderAvatar';

interface Props {
  trader: any;
  onViewAnalytics: (trader: any) => void;
  onStartCopy: (trader: any) => void;
}

export const TraderCard = ({ trader, onViewAnalytics, onStartCopy }: Props) => {
  const getRankLevel = (t: any) => {
    const winRate = parseFloat(t.win_rate || 0);
    const followers = parseInt(t.followers || 0);
    if (winRate > 90 && followers > 1000) return 'Diamond';
    if (winRate > 80 || followers > 500) return 'Gold';
    if (winRate > 60) return 'Silver';
    return 'Elite';
  };

  const level = trader.level || getRankLevel(trader);

  const getRankColor = (l: string) => {
    switch (l) {
      case 'Diamond': return 'text-[#00D1FF] border-[#00D1FF]/30 bg-[#00D1FF]/10';
      case 'Gold': return 'text-[#F3BA2F] border-[#F3BA2F]/30 bg-[#F3BA2F]/10';
      case 'Silver': return 'text-[#C0C0C0] border-[#C0C0C0]/30 bg-[#C0C0C0]/10';
      default: return 'text-[#FCD535] border-[#FCD535]/30 bg-[#FCD535]/10';
    }
  };

  const roiValue = parseFloat(trader.roi || 0);

  return (
    <div className="group relative bg-[#181A20] border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-[#FCD535]/40 transition-all duration-500 shadow-2xl flex flex-col scale-100 hover:scale-[1.02]">
      <div className="p-8 pb-0">
        <div className="flex items-center justify-between mb-8">
          <div className="relative">
            <TraderAvatar trader={trader} />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-green-400 border-4 border-[#181A20]"></div>
          </div>
          <div className={`px-4 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${getRankColor(level)}`}>
            {level}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-2xl font-black text-white group-hover:text-[#FCD535] transition-colors duration-300 mb-1 leading-none">{trader.username}</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#848E9C] font-black uppercase tracking-widest">Main Asset</span>
            <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-white font-bold">{trader.trading_pair || 'ETH/USDT'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[#1E2329]/20 p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center group-hover:bg-[#FCD535]/5 transition-all duration-500">
            <p className="text-[10px] text-[#848E9C] uppercase font-black tracking-widest mb-1">Total ROI</p>
            <p className="text-2xl font-black text-[#FCD535]">{roiValue > 0 ? '+' : ''}{roiValue.toFixed(1)}%</p>
          </div>
          <div className="bg-[#1E2329]/20 p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center group-hover:bg-green-400/5 transition-all duration-500">
            <p className="text-[10px] text-[#848E9C] uppercase font-black tracking-widest mb-1">Win Rate</p>
            <p className="text-2xl font-black text-green-400">{parseFloat(trader.win_rate || 0).toFixed(1)}%</p>
          </div>
        </div>

        <div className="space-y-4 px-2 mb-10">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#848E9C] font-bold uppercase tracking-widest">Active Copiers</span>
            <span className="text-white font-black bg-[#1E2329] px-3 py-1 rounded-lg">{(trader.followers || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#848E9C] font-bold uppercase tracking-widest">Fund Managed</span>
            <span className="text-white font-black">${(parseFloat(trader.aum || 0)).toLocaleString()}</span>
          </div>
        </div>

        <button 
          onClick={() => onStartCopy(trader)}
          className="w-full bg-[#FCD535] text-[#111111] py-5 rounded-2xl font-black transition-all duration-500 flex items-center justify-center gap-3 shadow-xl shadow-[#FCD535]/10 hover:shadow-[#FCD535]/25 hover:brightness-110 active:scale-[0.98]">
          <i className="pi pi-copy text-xl"></i>
          <span className="tracking-tighter uppercase">START COPY TRADE</span>
        </button>
      </div>

      <div className="mt-8 py-5 bg-white/[0.02] border-t border-white/5 flex justify-center">
        <button
          onClick={() => onViewAnalytics(trader)}
          className="text-[10px] text-[#848E9C] hover:text-[#FCD535] font-black tracking-[0.3em] uppercase flex items-center gap-3 transition-all transform hover:scale-105">
          View Extended Analytics <i className="pi pi-chevron-right"></i>
        </button>
      </div>
    </div>
  );
};
