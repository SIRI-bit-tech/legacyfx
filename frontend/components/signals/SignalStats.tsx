import React from 'react';
import { SignalStatsData } from '@/hooks/useSignalStats';

interface SignalStatsProps {
  stats: SignalStatsData | null;
  loading: boolean;
}

export const SignalStats: React.FC<SignalStatsProps> = ({ stats, loading }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-bg-secondary border border-color-border/40 rounded-xl p-4 flex flex-col justify-between hover:border-color-primary/30 transition-all">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">Active Signals</span>
          <div className="flex items-center gap-1.5">
             <span className="w-1.5 h-1.5 rounded-full bg-color-success animate-pulse"></span>
             <span className="text-[9px] text-color-success font-bold uppercase tracking-widest">Live</span>
          </div>
        </div>
        <div className="text-2xl font-bold text-text-primary">
          {loading ? '...' : stats?.total_active || 0}
        </div>
        <div className="text-[10px] text-text-tertiary mt-1">Real-time market entries</div>
      </div>

      <div className="bg-bg-secondary border border-color-border/40 rounded-xl p-4 flex flex-col justify-between hover:border-color-primary/30 transition-all">
        <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider mb-2">Overall Win Rate</span>
        <div className="text-2xl font-bold text-color-success">
          {loading ? '...' : `${stats?.overall_accuracy || 0}%`}
        </div>
        <div className="text-[10px] text-text-tertiary mt-1">Verified historical accuracy</div>
      </div>

      <div className="bg-bg-secondary border border-color-border/40 rounded-xl p-4 flex flex-col justify-between hover:border-color-primary/30 transition-all">
        <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider mb-2">Buy Accuracy</span>
        <div className="text-2xl font-bold text-text-primary">
          {loading ? '...' : `${stats?.buy_accuracy || 0}%`}
        </div>
        <div className="text-[10px] text-text-tertiary mt-1">Bullish signal performance</div>
      </div>

      <div className="bg-bg-secondary border border-color-border/40 rounded-xl p-4 flex flex-col justify-between hover:border-color-primary/30 transition-all">
        <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider mb-2">Sell Accuracy</span>
        <div className="text-2xl font-bold text-text-primary">
          {loading ? '...' : `${stats?.sell_accuracy || 0}%`}
        </div>
        <div className="text-[10px] text-text-tertiary mt-1">Bearish signal performance</div>
      </div>
    </div>
  );
};
