'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

interface Props {
  trader: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const StartCopyTradeModal = ({ trader, onClose, onSuccess }: Props) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    copy_mode: 'fixed_amount',
    fixed_amount: 100,
    leverage: 1.0,
    percentage: 10,
    max_position_size: 1000,
    enable_stop_loss: true,
    stop_loss_percentage: 10,
    enable_take_profit: true,
    take_profit_percentage: 20
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await api.post((API_ENDPOINTS as any).COPY_TRADING.START, {
        trader_id: trader.trader_id || trader.id,
        ...formData
      });
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to start copy trade. Please check your balance or configuration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="startTitle">
      <div className="bg-[#181A20] border border-white/10 rounded-[2.5rem] w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-10 space-y-8">
            <header className="flex justify-between items-center">
              <div>
                <h2 id="startTitle" className="text-2xl font-black text-white uppercase tracking-tighter">Copy {trader.username}</h2>
                <p className="text-[#848E9C] text-xs font-bold uppercase tracking-widest mt-1">Configure your mirror strategy</p>
              </div>
              <button type="button" onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
                <i className="pi pi-times text-white"></i>
              </button>
            </header>

            {error && (
              <div className="p-4 rounded-xl bg-red-400/10 border border-red-400/20 text-red-100 text-xs font-bold animate-pulse">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] text-[#848E9C] font-black uppercase tracking-widest block">Copying Mode</label>
                <div className="grid grid-cols-3 gap-3">
                  {['fixed_amount', 'proportional', 'percentage'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setFormData({ ...formData, copy_mode: mode })}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${formData.copy_mode === mode ? 'bg-[#FCD535] text-[#111111] shadow-lg shadow-[#FCD535]/10' : 'bg-white/5 text-[#848E9C] border border-white/5 hover:bg-white/10'}`}>
                      {mode.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {formData.copy_mode === 'fixed_amount' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] text-[#848E9C] font-black uppercase tracking-widest block">Fixed USD Per Trade</label>
                  <input
                    type="number"
                    value={formData.fixed_amount}
                    onChange={(e) => setFormData({ ...formData, fixed_amount: parseFloat(e.target.value) })}
                    className="w-full bg-[#1E2329]/20 border border-white/10 p-5 rounded-2xl outline-none focus:border-[#FCD535] transition-all text-white font-bold"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] text-[#848E9C] font-black uppercase tracking-widest block">Stop Loss %</label>
                  <input
                    type="number"
                    value={formData.stop_loss_percentage}
                    onChange={(e) => setFormData({ ...formData, stop_loss_percentage: parseFloat(e.target.value) })}
                    className="w-full bg-[#1E2329]/20 border border-white/10 p-4 rounded-xl outline-none focus:border-[#FCD535] transition-all text-white font-bold"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] text-[#848E9C] font-black uppercase tracking-widest block">Take Profit %</label>
                  <input
                    type="number"
                    value={formData.take_profit_percentage}
                    onChange={(e) => setFormData({ ...formData, take_profit_percentage: parseFloat(e.target.value) })}
                    className="w-full bg-[#1E2329]/20 border border-white/10 p-4 rounded-xl outline-none focus:border-[#FCD535] transition-all text-white font-bold"
                  />
                </div>
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full bg-[#FCD535] text-[#111111] py-5 rounded-2xl font-black transition-all duration-500 shadow-2xl flex items-center justify-center gap-3 hover:brightness-110 disabled:opacity-50">
              {loading ? <i className="pi pi-spin pi-spinner text-xl"></i> : <i className="pi pi-check-circle text-xl"></i>}
              <span className="uppercase tracking-widest">{loading ? 'Activating Feed...' : 'ACTIVATE COPY TRADE'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
