import React from 'react';
import { Signal } from '@/hooks/useSignals';
import { useCopiedSignals } from '@/hooks/useCopiedSignals';

interface SignalCardProps {
  signal: Signal;
}

export const SignalCard: React.FC<SignalCardProps> = ({ signal }) => {
  const { copySignal } = useCopiedSignals();
  const isBuy = signal.signal_type === 'buy';

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'text-color-success border-color-success/30 bg-color-success/10';
      case 'moderate': return 'text-color-warning border-color-warning/30 bg-color-warning/10';
      default: return 'text-text-tertiary border-color-border/60 bg-bg-tertiary';
    }
  };

  const getRSIColor = (rsi: number) => {
    if (rsi < 35) return 'text-color-success';
    if (rsi > 65) return 'text-color-danger';
    return 'text-text-secondary';
  };

  return (
    <div className="bg-bg-primary border border-color-border/50 rounded-xl overflow-hidden flex flex-col transition-all hover:border-color-primary/40 group shadow-subtle relative h-fit">
      {/* Header */}
      <div className="p-4 border-b border-color-border/40 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[15px] font-bold text-text-primary tracking-tight">{signal.symbol}</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-tertiary border border-color-border/40 uppercase font-medium">
              {signal.asset_type}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isBuy ? 'text-color-success' : 'text-color-danger'}`}>
              {signal.signal_type}
            </span>
            <span className="w-1 h-1 rounded-full bg-color-border/40"></span>
            <span className="text-[10px] text-text-tertiary font-medium">{signal.timeframe}</span>
          </div>
        </div>

        <div className={`text-[9px] px-2 py-1 rounded-full border font-bold uppercase tracking-wider ${getStrengthColor(signal.strength)}`}>
          {signal.strength}
        </div>
      </div>

      {/* Main Body - Prices */}
      <div className="p-5 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-text-tertiary uppercase font-bold mb-1.5 tracking-wider">Entry</span>
            <span className="text-[14px] font-mono font-bold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
              ${Number(signal.entry_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-text-tertiary uppercase font-bold mb-1.5 tracking-wider">T. Profit</span>
            <span className="text-[14px] font-mono font-bold text-color-success whitespace-nowrap overflow-hidden text-ellipsis">
              ${Number(signal.take_profit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </span>
          </div>
          <div className="flex flex-col min-w-0 text-right">
            <span className="text-[10px] text-text-tertiary uppercase font-bold mb-1.5 tracking-wider">S. Loss</span>
            <span className="text-[14px] font-mono font-bold text-color-danger whitespace-nowrap overflow-hidden text-ellipsis">
              ${Number(signal.stop_loss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </span>
          </div>
        </div>

        {/* Indicators Row */}
        <div className="flex flex-wrap gap-2.5 pt-4 border-t border-color-border/20">
          {signal.rsi && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-bg-secondary border border-color-border/30">
              <span className="text-[9px] text-text-tertiary font-black uppercase">RSI</span>
              <span className={`text-[11px] font-mono font-black ${getRSIColor(Number(signal.rsi))}`}>
                {Number(signal.rsi).toFixed(1)}
              </span>
            </div>
          )}
          {signal.macd && (
            <div className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wider ${signal.macd === 'bullish' ? 'border-color-success/30 text-color-success bg-color-success/10' : 'border-color-danger/30 text-color-danger bg-color-danger/10'}`}>
              MACD: {signal.macd}
            </div>
          )}
          {signal.ema_signal && (
            <div className="px-2.5 py-1.5 rounded-lg border border-color-border/30 text-[9px] font-black uppercase tracking-wider text-text-tertiary bg-bg-secondary">
              EMA: {signal.ema_signal}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 pt-0 mt-auto flex gap-2">
        <button
          onClick={() => copySignal(signal.id || signal.symbol)}
          className="flex-1 py-2 rounded-lg bg-bg-tertiary border border-color-border/40 text-[11px] font-bold text-text-primary hover:bg-bg-secondary transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <i className="pi pi-copy text-[10px]"></i> Copy
        </button>
        <button
          onClick={() => copySignal(signal.id || signal.symbol, true)}
          className={`flex-1 py-2 rounded-lg text-[11px] font-bold text-bg-primary transition-all active:scale-95 shadow-lg ${isBuy ? 'bg-color-primary' : 'bg-color-danger'}`}
        >
          Trade Now
        </button>
      </div>

      {/* Subtle shine effect on hover */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </div>
  );
};
