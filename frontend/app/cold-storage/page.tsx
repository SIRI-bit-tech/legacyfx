'use client';

import { DashboardLayout } from '../dashboard-layout';
import { useState, useEffect, useRef, useCallback } from 'react';
import { TradeTopBar } from '@/components/trade/TradeTopBar';
import { OrderBook } from '@/components/trade/OrderBook';
import { OpenOrders } from '@/components/trade/OpenOrders';
import { OrderHistory } from '@/components/trade/OrderHistory';
import { TradeHistory } from '@/components/trade/TradeHistory';
import { FundsTab } from '@/components/trade/FundsTab';
import { useTopBarStats } from '@/hooks/useTopBarStats';

// Extend window type for TradingView global
declare global {
  interface Window {
    TradingView: any;
  }
}

export default function TradePage() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [side, setSide] = useState('BUY');
  const [orderType, setOrderType] = useState('MARKET');
  const [amount, setAmount] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  // Mount guard — ensures DOM is fully painted before TradingView init
  const [isMounted, setIsMounted] = useState(false);

  const tvWidgetRef = useRef<any>(null);
  const tradingViewContainerRef = useRef<HTMLDivElement | null>(null);

  const stats = useTopBarStats(symbol, 'crypto');

  // Step 1 — set isMounted only after first full render
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Step 2 — load TradingView script once
  const ensureTvScript = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window.TradingView !== 'undefined') {
        resolve();
        return;
      }

      const scriptId = 'tradingview-widget-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;

      const poll = (count = 0) => {
        if (typeof window.TradingView !== 'undefined') { resolve(); return; }
        if (count >= 80) { resolve(); return; } // give up after ~4s, initWidget will warn
        window.setTimeout(() => poll(count + 1), 50);
      };

      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => poll();
        script.onerror = () => {
          console.error('TradingView: failed to load tv.js');
          resolve();
        };
        document.head.appendChild(script);
      } else {
        poll();
      }
    });
  }, []);

  // Step 3 — init widget only after isMounted is true and symbol changes
  useEffect(() => {
    // Guard: do nothing until the DOM is fully painted and auth is resolved
    if (!isMounted) return;

    let cancelled = false;

    const init = async () => {
      // Wait for container to appear in DOM (it renders after isMounted=true)
      let container: HTMLDivElement | null = null;
      for (let i = 0; i < 20; i++) {
        container = tradingViewContainerRef.current;
        if (container) break;
        await new Promise(r => window.setTimeout(r, 50));
      }

      if (!container) {
        console.warn('TradingView: container ref still null after waiting');
        return;
      }

      if (cancelled) return;

      await ensureTvScript();

      if (cancelled) return;

      if (typeof window.TradingView === 'undefined') {
        console.error('TradingView: tv.js loaded but window.TradingView is undefined');
        return;
      }

      // Clean up previous widget instance
      try {
        if (tvWidgetRef.current?.remove) tvWidgetRef.current.remove();
      } catch { /* ignore */ }

      // Clear container to avoid duplicate iframes
      container.innerHTML = '';

      // Retry widget init up to 5 times in case TV global isn't ready
      for (let attempt = 1; attempt <= 5; attempt++) {
        if (cancelled) return;
        try {
          tvWidgetRef.current = new window.TradingView.widget({
            width: '100%',
            height: '100%',
            symbol: `BINANCE:${symbol}`,
            interval: 'D',
            timezone: 'Etc/UTC',
            theme: 'dark',
            style: '1',
            locale: 'en',
            toolbar_bg: '#f1f3f6',
            enable_publishing: false,
            hide_side_toolbar: false,
            allow_symbol_change: true,
            hide_top_toolbar: false,
            save_image: false,
            container_id: 'tradingview_widget',
            backgroundColor: '#1e2329',
            gridColor: 'rgba(43, 47, 54, 1)',
          });
          console.log(`TradingView: widget init success (attempt ${attempt})`, { symbol });
          return;
        } catch (e) {
          console.warn(`TradingView: init attempt ${attempt} failed`, e);
          if (attempt < 5) await new Promise(r => window.setTimeout(r, 300));
        }
      }

      console.error('TradingView: widget failed after all retries', { symbol });
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [symbol, isMounted, ensureTvScript]);

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">

        {/* Left: Chart & Markets */}
        <div className="flex-1 flex flex-col border-r border-color-border overflow-hidden">

          {/* Top Info Bar */}
          <TradeTopBar symbol={symbol} onSymbolChange={setSymbol} />

          {/* Chart Container — only rendered after mount so ref is guaranteed */}
          <div className="flex-1 bg-bg-primary relative overflow-hidden">
            {isMounted ? (
              <div
                ref={tradingViewContainerRef}
                id="tradingview_widget"
                className="absolute inset-0"
              />
            ) : (
              // Placeholder shown while auth resolves and DOM mounts
              <div className="absolute inset-0 flex items-center justify-center bg-bg-primary">
                <div className="text-center">
                  <div className="inline-block animate-spin text-color-primary mb-3 text-2xl">
                    <i className="pi pi-bolt" />
                  </div>
                  <p className="text-text-tertiary text-xs">Loading chart...</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Tabs */}
          <div className="h-64 bg-bg-secondary border-t border-color-border flex flex-col overflow-hidden">
            <div className="flex border-b border-color-border px-4">
              {['Open Orders', 'Order History', 'Trade History', 'Funds'].map((tab, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTab(i)}
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                    activeTab === i
                      ? 'border-color-primary text-color-primary'
                      : 'border-transparent text-text-tertiary hover:text-text-primary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-hidden">
              {activeTab === 0 && <OpenOrders />}
              {activeTab === 1 && <OrderHistory />}
              {activeTab === 2 && <TradeHistory />}
              {activeTab === 3 && <FundsTab />}
            </div>
          </div>
        </div>

        {/* Right: Order Book & Trading Panel */}
        <div className="w-full lg:w-80 flex flex-col bg-bg-secondary overflow-hidden">

          {/* Order Book */}
          <div className="flex-1 border-b border-color-border flex flex-col overflow-hidden">
            <div className="p-3 border-b border-color-border flex justify-between items-center bg-bg-tertiary/20">
              <span className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Order Book</span>
              <div className="flex gap-1">
                <button className="text-color-success p-1">
                  <i className="pi pi-align-justify text-[10px]" />
                </button>
              </div>
            </div>
            <OrderBook symbol={symbol} currentPrice={stats.price} />
          </div>

          {/* Trading Form */}
          <div className="p-4 space-y-4">
            <div className="flex bg-bg-tertiary p-1 rounded-lg">
              <button
                onClick={() => setSide('BUY')}
                className={`flex-1 py-2 text-xs font-bold rounded transition ${
                  side === 'BUY' ? 'bg-color-success text-white' : 'text-text-tertiary hover:text-text-primary'
                }`}
              >
                BUY
              </button>
              <button
                onClick={() => setSide('SELL')}
                className={`flex-1 py-2 text-xs font-bold rounded transition ${
                  side === 'SELL' ? 'bg-color-danger text-white' : 'text-text-tertiary hover:text-text-primary'
                }`}
              >
                SELL
              </button>
            </div>

            <div className="flex gap-2 text-[10px] font-bold">
              {['MARKET', 'LIMIT'].map(t => (
                <button
                  key={t}
                  onClick={() => setOrderType(t)}
                  className={`pb-1 border-b-2 transition ${
                    orderType === t
                      ? 'border-color-primary text-text-primary'
                      : 'border-transparent text-text-tertiary hover:text-text-primary'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-[10px] text-text-tertiary font-bold uppercase">Amount</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-bg-tertiary border border-color-border rounded-lg pl-14 pr-12 py-3 text-sm focus:border-color-primary outline-none text-right font-mono"
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-3 text-[10px] text-text-tertiary font-bold uppercase">
                  {symbol.replace('USDT', '')}
                </span>
              </div>

              <div className="flex justify-between px-1">
                {[25, 50, 75, 100].map(p => (
                  <button
                    key={p}
                    className="text-[10px] font-bold text-text-tertiary hover:text-color-primary transition"
                  >
                    {p}%
                  </button>
                ))}
              </div>

              <button
                className={`w-full py-4 rounded-xl font-black text-white transition shadow-lg ${
                  side === 'BUY'
                    ? 'bg-color-success hover:bg-opacity-80 shadow-color-success/10'
                    : 'bg-color-danger hover:bg-opacity-80 shadow-color-danger/10'
                }`}
              >
                {side} {symbol.replace('USDT', '')}
              </button>

              <div className="flex justify-between text-[10px] text-text-tertiary px-1 pt-2">
                <span>Available</span>
                <span className="text-text-secondary font-bold">0.00000000 USDT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}