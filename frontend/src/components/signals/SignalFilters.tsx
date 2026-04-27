import React from 'react';
import { SignalFilters } from '@/hooks/useSignals';

interface FilterProps {
  filters: SignalFilters;
  setFilters: (f: SignalFilters) => void;
}

export const SignalFiltersComponent: React.FC<FilterProps> = ({ filters, setFilters }) => {
  const handleChange = (name: string, value: string) => {
    setFilters({ ...filters, [name]: value });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 mb-8 relative z-20">
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-text-tertiary font-black uppercase tracking-widest ml-1">Asset Class</span>
        <div className="relative">
          <select
            value={filters.asset_type || 'all'}
            onChange={(e) => handleChange('asset_type', e.target.value)}
            className="appearance-none bg-bg-secondary border border-color-border/40 rounded-xl px-4 py-2.5 pr-10 text-[12px] font-bold text-text-primary outline-none cursor-pointer hover:border-color-primary/30 transition-all min-w-[160px] [&>option]:bg-bg-secondary [&>option]:text-text-primary"
          >
            <option value="all">All Markets</option>
            <option value="crypto">Cryptocurrency</option>
            <option value="forex">Forex Pairs</option>
            <option value="stock">Stock Equity</option>
          </select>
          <i className="pi pi-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-text-tertiary pointer-events-none"></i>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-text-tertiary font-black uppercase tracking-widest ml-1">Signal Type</span>
        <div className="relative">
          <select
            value={filters.signal_type || 'all'}
            onChange={(e) => handleChange('signal_type', e.target.value)}
            className="appearance-none bg-bg-secondary border border-color-border/40 rounded-xl px-4 py-2.5 pr-10 text-[12px] font-bold text-text-primary outline-none cursor-pointer hover:border-color-primary/30 transition-all min-w-[150px] [&>option]:bg-bg-secondary [&>option]:text-text-primary"
          >
            <option value="all">All Signals</option>
            <option value="buy">Buy Only</option>
            <option value="sell">Sell Only</option>
          </select>
          <i className="pi pi-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-text-tertiary pointer-events-none"></i>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-text-tertiary font-black uppercase tracking-widest ml-1">Timeframe</span>
        <div className="relative">
          <select
            value={filters.timeframe || '4H'}
            onChange={(e) => handleChange('timeframe', e.target.value)}
            className="appearance-none bg-bg-secondary border border-color-border/40 rounded-xl px-4 py-2.5 pr-10 text-[12px] font-bold text-text-primary outline-none cursor-pointer hover:border-color-primary/30 transition-all min-w-[140px] [&>option]:bg-bg-secondary [&>option]:text-text-primary"
          >
            <option value="1H">1 Hour (H1)</option>
            <option value="4H">4 Hour (H4)</option>
            <option value="1D">1 Day (D1)</option>
          </select>
          <i className="pi pi-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-text-tertiary pointer-events-none"></i>
        </div>
      </div>

    </div>
  );
};
