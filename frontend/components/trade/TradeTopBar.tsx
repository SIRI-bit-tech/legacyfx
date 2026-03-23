// Top bar component displaying live symbol statistics
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTopBarStats } from '@/hooks/useTopBarStats';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';
import { TRADING_PAIRS } from '@/constants';
import { toDisplay } from '@/utils/symbolFormat';

interface TradeTopBarProps {
  symbol: string;
  onSymbolChange?: (symbol: string) => void;
}

type SymbolOption = {
  value: string; // internal app format (e.g. BTCUSDT, EURUSD, AAPL)
  label: string; // human label (e.g. BTC/USDT, EUR/USD)
};

const normalizeSymbolForApp = (raw: string) => raw.replace(/[-/]/g, '').toUpperCase().trim();

export function TradeTopBar({ symbol, onSymbolChange }: TradeTopBarProps) {
  const stats = useTopBarStats(symbol, 'crypto');

  const knownQuotes = useMemo(
    () => ['USDT', 'USDC', 'USD', 'BTC', 'ETH', 'BNB'],
    []
  );

  const normalizedCurrent = normalizeSymbolForApp(symbol);
  const displaySymbol = knownQuotes.some((q) => normalizedCurrent.endsWith(q))
    ? toDisplay(normalizedCurrent)
    : normalizedCurrent;

  const [cryptoPairs, setCryptoPairs] = useState<SymbolOption[]>([]);
  const [customTicker, setCustomTicker] = useState<string>('');
  const [selectionMode, setSelectionMode] = useState<'preset' | 'custom'>('preset');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownWrapRef = useRef<HTMLDivElement | null>(null);

  const stockTickers: SymbolOption[] = useMemo(
    () => [
      { value: 'AAPL', label: 'AAPL' },
      { value: 'MSFT', label: 'MSFT' },
      { value: 'TSLA', label: 'TSLA' },
      { value: 'AMZN', label: 'AMZN' },
      { value: 'NVDA', label: 'NVDA' },
      { value: 'META', label: 'META' },
      { value: 'NFLX', label: 'NFLX' },
    ],
    []
  );

  useEffect(() => {
    if (!isDropdownOpen) return;

    const onDocMouseDown = (e: MouseEvent) => {
      const el = dropdownWrapRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [isDropdownOpen]);

  useEffect(() => {
    let mounted = true;

    const loadPairs = async () => {
      try {
        const res = await api.get(API_ENDPOINTS.MARKETS.PAIRS);
        if (!mounted) return;

        const options: SymbolOption[] = (res || [])
          .map((p: any) => {
            const base = (p.base_symbol || '').toString().toUpperCase();
            const quote = (p.quote_symbol || '').toString().toUpperCase();
            if (!base || !quote) return null;
            return {
              value: `${base}${quote}`,
              label: `${base}/${quote}`,
            } as SymbolOption;
          })
          .filter(Boolean);

        // Keep list stable and compact.
        options.sort((a, b) => a.label.localeCompare(b.label));
        // Fallback: if backend has no active trading pairs in DB yet,
        // show the starter crypto pairs from constants so the dropdown isn't empty.
        const finalOptions =
          options.length > 0
            ? options
            : TRADING_PAIRS.map((pair) => {
                const [baseRaw, quoteRaw] = pair.split('/');
                const base = baseRaw.toUpperCase();
                const quote = quoteRaw.toUpperCase();
                return {
                  value: `${base}${quote}`,
                  label: `${base}/${quote}`,
                } as SymbolOption;
              });

        setCryptoPairs(finalOptions);
      } catch (e) {
        console.warn('TradeTopBar: failed to load trading pairs', e);
        // Same fallback if the request fails entirely.
        const fallbackOptions = TRADING_PAIRS.map((pair) => {
          const [baseRaw, quoteRaw] = pair.split('/');
          const base = baseRaw.toUpperCase();
          const quote = quoteRaw.toUpperCase();
          return {
            value: `${base}${quote}`,
            label: `${base}/${quote}`,
          } as SymbolOption;
        });
        setCryptoPairs(fallbackOptions);
      }
    };

    loadPairs();
    return () => {
      mounted = false;
    };
  }, []);

  const forexPairs: SymbolOption[] = useMemo(
    () => [
      { value: 'EURUSD', label: 'EUR/USD' },
      { value: 'GBPUSD', label: 'GBP/USD' },
      { value: 'USDJPY', label: 'USD/JPY' },
      { value: 'USDCHF', label: 'USD/CHF' },
      { value: 'USDCAD', label: 'USD/CAD' },
      { value: 'AUDUSD', label: 'AUD/USD' },
      { value: 'NZDUSD', label: 'NZD/USD' },
    ],
    []
  );

  const presetOptions = useMemo(() => {
    const all = [...cryptoPairs, ...forexPairs, ...stockTickers];

    // Ensure current symbol is present in the dropdown (avoids controlled <select> mismatch).
    const currentInList = all.some((o) => o.value === normalizedCurrent);
    if (!currentInList) {
      all.unshift({ value: normalizedCurrent, label: displaySymbol });
    }

    return all;
  }, [cryptoPairs, forexPairs, normalizedCurrent, displaySymbol]);

  const currentIsCustom = selectionMode === 'custom';
  const currentPresetValue = normalizedCurrent;

  const priceColor = stats.change24h >= 0 ? 'text-color-success' : 'text-color-danger';

  return (
    <div className="bg-bg-secondary border-b border-color-border px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        {/* Symbol Selector */}
        <div className="flex items-center gap-2" ref={dropdownWrapRef}>
          <button
            type="button"
            className="flex items-center gap-2 bg-bg-primary/40 border border-color-border rounded-lg px-3 py-2 cursor-pointer"
            onClick={() => {
              if (currentIsCustom) setSelectionMode('preset');
              setIsDropdownOpen((v) => !v);
            }}
            aria-label="Select trading symbol"
          >
            <span className="text-xl font-black text-text-primary">
              {currentIsCustom ? toDisplay(customTicker || normalizedCurrent) : displaySymbol}
            </span>
            <i className="pi pi-chevron-down text-xs text-text-tertiary pointer-events-none" />
          </button>

          {isDropdownOpen && (
            <div className="absolute mt-2 w-64 max-h-[320px] overflow-y-auto bg-bg-primary border border-color-border rounded-xl shadow-lg z-[2000]">
              <div className="p-2">
                {presetOptions.map((opt) => {
                  const active = opt.value === currentPresetValue && selectionMode !== 'custom';
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                        active
                          ? 'bg-color-primary/15 text-color-primary'
                          : 'text-text-primary hover:bg-bg-tertiary/40'
                      }`}
                      onClick={() => {
                        setSelectionMode('preset');
                        onSymbolChange?.(normalizeSymbolForApp(opt.value));
                        setIsDropdownOpen(false);
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}

                <button
                  type="button"
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    selectionMode === 'custom'
                      ? 'bg-color-primary/15 text-color-primary'
                      : 'text-text-primary hover:bg-bg-tertiary/40'
                  }`}
                  onClick={() => {
                    setSelectionMode('custom');
                    setCustomTicker(normalizedCurrent);
                    setIsDropdownOpen(false);
                  }}
                >
                  Custom ticker...
                </button>
              </div>
            </div>
          )}
        </div>

        {selectionMode === 'custom' && (
          <input
            className="bg-bg-primary/40 border border-color-border rounded-lg px-2 py-1 text-xs text-text-primary outline-none w-28"
            value={customTicker}
            onChange={(e) => setCustomTicker(e.target.value)}
            onBlur={() => {
              const next = normalizeSymbolForApp(customTicker);
              if (next) onSymbolChange?.(next);
              setCustomTicker(next);
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              const next = normalizeSymbolForApp(customTicker);
              if (next) onSymbolChange?.(next);
              setCustomTicker(next);
            }}
            placeholder="e.g. AAPL"
            aria-label="Custom ticker"
          />
        )}

        {/* Stats */}
        <div className="hidden md:flex gap-6">
          {/* Price */}
          <div>
            <p className="text-[10px] text-text-tertiary font-bold uppercase">Price</p>
            <p className={`text-sm font-mono font-bold ${priceColor}`}>
              {stats.loading ? '--' : `$${stats.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </p>
          </div>

          {/* 24h Change */}
          <div>
            <p className="text-[10px] text-text-tertiary font-bold uppercase">24h Change</p>
            <p className={`text-sm font-mono font-bold ${priceColor}`}>
              {stats.loading ? '--' : `${stats.change24h >= 0 ? '+' : ''}${stats.change24h.toFixed(2)}%`}
            </p>
          </div>

          {/* 24h High */}
          <div>
            <p className="text-[10px] text-text-tertiary font-bold uppercase">24h High</p>
            <p className="text-sm font-mono text-text-primary">
              {stats.loading ? '--' : `$${stats.high24h.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            </p>
          </div>

          {/* 24h Low */}
          <div>
            <p className="text-[10px] text-text-tertiary font-bold uppercase">24h Low</p>
            <p className="text-sm font-mono text-text-primary">
              {stats.loading ? '--' : `$${stats.low24h.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            </p>
          </div>

          {/* 24h Volume */}
          <div>
            <p className="text-[10px] text-text-tertiary font-bold uppercase">24h Volume</p>
            <p className="text-sm font-mono text-text-primary">
              {stats.loading 
                ? '--' 
                : stats.volume24h >= 1e9 
                  ? `$${(stats.volume24h / 1e9).toFixed(2)}B`
                  : `$${(stats.volume24h / 1e6).toFixed(1)}M`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button className="p-2 text-text-tertiary hover:text-text-primary transition">
          <i className="pi pi-bell"></i>
        </button>
        <button className="p-2 text-text-tertiary hover:text-text-primary transition">
          <i className="pi pi-star"></i>
        </button>
      </div>
    </div>
  );
}
