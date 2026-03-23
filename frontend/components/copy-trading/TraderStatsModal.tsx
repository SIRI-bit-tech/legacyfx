'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { COLORS } from '@/constants';
import { TraderAvatar } from './TraderAvatar';

interface Props {
  trader: any;
  onClose: () => void;
}

export const TraderStatsModal = ({ trader, onClose }: Props) => {
  const roiData = [...(trader.pnlRatios || [])].reverse().map((p: any, i: number) => ({
    week: `W${i + 1}`,
    roi: parseFloat((parseFloat(p.pnlRatio || 0) * 100).toFixed(2)),
  }));

  const worstWeek = roiData.length > 0 
    ? roiData.reduce((min: any, d: any) => d.roi < min.roi ? d : min, roiData[0])
    : { roi: 0 };
  
  const drawdownValue = Math.abs(Math.min(0, worstWeek.roi));
  const maxDrawdown = drawdownValue.toFixed(1);
  const riskScore = parseFloat(maxDrawdown) < 10 ? 'Low' : parseFloat(maxDrawdown) < 30 ? 'Medium' : 'High';
  const riskColor = riskScore === 'Low' ? 'text-green-400' : riskScore === 'Medium' ? 'text-yellow-400' : 'text-red-400';
  const pairs = (trader.traderInsts || []).slice(0, 10).map((p: string) => p.replace('-SWAP', ''));

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 outline-none" 
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalTitle"
    >
      <div className="bg-[#181A20] border border-white/10 rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <TraderAvatar trader={trader} />
            <div>
              <h2 id="modalTitle" className="text-lg font-bold text-white uppercase tracking-tighter">{trader.username}</h2>
              <span className="text-[10px] text-[#848E9C] font-black uppercase tracking-widest">Verified Institutional Trader</span>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
             <i className="pi pi-times text-white"></i>
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#1E2329]/20 rounded-2xl p-6 border border-white/5 text-center">
              <div className="text-[10px] text-[#848E9C] font-black uppercase mb-1 tracking-widest">Total ROI</div>
              <div className="text-3xl font-black text-[#FCD535]">{parseFloat(trader.roi || 0).toFixed(1)}%</div>
            </div>
            <div className="bg-[#1E2329]/20 rounded-2xl p-6 border border-white/5 text-center">
              <div className="text-[10px] text-[#848E9C] font-black uppercase mb-1 tracking-widest">Win Rate</div>
              <div className="text-3xl font-black text-green-400">{parseFloat(trader.win_rate || 0).toFixed(1)}%</div>
            </div>
            <div className="bg-[#1E2329]/20 rounded-2xl p-6 border border-white/5 text-center">
              <div className="text-[10px] text-[#848E9C] font-black uppercase mb-1 tracking-widest">Max Drawdown</div>
              <div className={`text-3xl font-black ${riskColor}`}>{maxDrawdown}%</div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Performance Curve</h3>
            <div className="h-64 bg-[#1E2329]/10 rounded-2xl p-4 border border-white/5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={roiData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2B2F36" vertical={false} />
                  <XAxis dataKey="week" stroke="#474D57" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#474D57" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E2329', border: '1px solid #2B2F36', borderRadius: '1rem' }}
                    labelStyle={{ color: '#FCD535', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="roi" stroke={COLORS.primary || '#FCD535'} strokeWidth={3} dot={{ r: 4, fill: COLORS.primary || '#FCD535' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
               <h3 className="text-sm font-bold text-white uppercase tracking-widest">Risk Assessment</h3>
               <div className="p-5 rounded-2xl bg-[#1E2329]/20 border border-white/5">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-[#848E9C]">Strategy Aggressiveness</span>
                    <span className={`text-sm font-bold ${riskColor}`}>{riskScore}</span>
                  </div>
                  <div className="h-2 bg-[#0B0E11] rounded-full overflow-hidden">
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
                   <span key={i} className="px-3 py-1.5 bg-[#1E2329]/40 rounded-lg text-[10px] font-bold text-[#848E9C] border border-white/10 uppercase">
                     {pair}
                   </span>
                 )) : (
                   <span className="text-xs text-[#848E9C] italic">Diversified Index</span>
                 )}
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
