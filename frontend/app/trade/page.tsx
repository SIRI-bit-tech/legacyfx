'use client';

import { DashboardLayout } from '../dashboard-layout';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export default function TradePage() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [side, setSide] = useState('BUY');
  const [orderType, setOrderType] = useState('MARKET');
  const [amount, setAmount] = useState('');
  const [marketData, setMarketData] = useState<any>(null);
  const [allPrices, setAllPrices] = useState<any[]>([]);

  useEffect(() => {
    loadPrices();
    const interval = setInterval(loadPrices, 10000);
    return () => clearInterval(interval);
  }, [symbol]);

  const loadPrices = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.MARKETS.PRICES);
      setAllPrices(res || []);
      const current = res.find((p: any) => symbol.startsWith(p.symbol));
      setMarketData(current);
    } catch (err) {
      console.error('Failed to load prices:', err);
    }
  };

  // TradingView Widget Loader
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof window.TradingView !== 'undefined') {
        new window.TradingView.widget({
          "width": "100%",
          "height": "100%",
          "symbol": `BINANCE:${symbol}`,
          "interval": "D",
          "timezone": "Etc/UTC",
          "theme": "dark",
          "style": "1",
          "locale": "en",
          "toolbar_bg": "#f1f3f6",
          "enable_publishing": false,
          "hide_side_toolbar": false,
          "allow_symbol_change": true,
          "hide_top_toolbar": false,
          "save_image": false,
          "container_id": "tradingview_widget",
          "backgroundColor": "#1e2329",
          "gridColor": "rgba(43, 47, 54, 1)",
        });
      }
    };
    document.head.appendChild(script);
  }, [symbol]);

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
        
        {/* Left: Chart & Markets */}
        <div className="flex-1 flex flex-col border-r border-color-border overflow-hidden">
           {/* Top Info Bar */}
           <div className="bg-bg-secondary border-b border-color-border px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2 cursor-pointer group">
                    <h2 className="text-xl font-black text-text-primary group-hover:text-color-primary transition">{symbol.replace('USDT', '/USDT')}</h2>
                    <i className="pi pi-chevron-down text-xs text-text-tertiary"></i>
                 </div>
                 <div className="hidden md:flex gap-6">
                    <div>
                       <p className="text-[10px] text-text-tertiary font-bold uppercase">Price</p>
                       <p className={`text-sm font-mono ${marketData?.price_change_percentage_24h >= 0 ? 'text-color-success' : 'text-color-danger'}`}>
                          {marketData?.current_price?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '--'}
                       </p>
                    </div>
                    <div>
                       <p className="text-[10px] text-text-tertiary font-bold uppercase">24h Change</p>
                       <p className={`text-sm font-mono ${marketData?.price_change_percentage_24h >= 0 ? 'text-color-success' : 'text-color-danger'}`}>
                          {marketData?.price_change_percentage_24h >= 0 ? '+' : ''}{marketData?.price_change_percentage_24h?.toFixed(2) || '0.00'}%
                       </p>
                    </div>
                    <div>
                       <p className="text-[10px] text-text-tertiary font-bold uppercase">24h High</p>
                       <p className="text-sm font-mono text-text-primary">{marketData?.high_24h?.toLocaleString() || '--'}</p>
                    </div>
                    <div>
                       <p className="text-[10px] text-text-tertiary font-bold uppercase">24h Volume</p>
                       <p className="text-sm font-mono text-text-primary">{marketData?.total_volume ? (marketData.total_volume / 1e6).toFixed(1) + 'M' : '--'}</p>
                    </div>
                 </div>
              </div>
              <div className="flex gap-2">
                 <button className="p-2 text-text-tertiary hover:text-text-primary"><i className="pi pi-bell"></i></button>
                 <button className="p-2 text-text-tertiary hover:text-text-primary"><i className="pi pi-star"></i></button>
              </div>
           </div>

           {/* Chart Container */}
           <div className="flex-1 bg-bg-primary relative overflow-hidden">
              <div id="tradingview_widget" className="absolute inset-0"></div>
           </div>

           {/* Bottom: Tabs (History, Orders) */}
           <div className="h-64 bg-bg-secondary border-t border-color-border flex flex-col overflow-hidden">
              <div className="flex border-b border-color-border px-4">
                 {['Open Orders', 'Order History', 'Trade History', 'Funds'].map((tab, i) => (
                   <button key={i} className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${i === 0 ? 'border-color-primary text-color-primary' : 'border-transparent text-text-tertiary hover:text-text-primary'}`}>
                      {tab}
                   </button>
                 ))}
              </div>
              <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm italic">
                 No open orders found
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
                    <button className="text-color-success p-1"><i className="pi pi-align-justify text-[10px]"></i></button>
                 </div>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col text-[10px] font-mono p-2">
                 {/* Sells (Asks) */}
                 <div className="space-y-0.5 flex flex-col-reverse mb-2">
                    {[1.002, 1.0015, 1.001, 1.0005, 1.0002].map((factor, i) => {
                       const p = (marketData?.current_price || 0) * factor;
                       return (
                          <div key={i} className="flex justify-between relative py-0.5 px-2">
                             <div className="absolute inset-0 bg-color-danger/5" style={{ width: `${(i+1)*20}%`, right: 0, left: 'auto' }}></div>
                             <span className="text-color-danger relative">{p.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                             <span className="text-text-secondary relative">0.{(i+1)*5}24</span>
                          </div>
                       );
                    })}
                 </div>
                 {/* Current Price */}
                 <div className="py-2 px-2 border-y border-color-border/30 text-center">
                    <span className={`text-lg font-black ${marketData?.price_change_percentage_24h >= 0 ? 'text-color-success' : 'text-color-danger'}`}>
                       {marketData?.current_price?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '--'}
                    </span>
                    <span className="text-[8px] text-text-tertiary block">≈ ${(marketData?.current_price || 0).toLocaleString()}</span>
                 </div>
                 {/* Buys (Bids) */}
                 <div className="space-y-0.5 mt-2">
                    {[0.9998, 0.9995, 0.9992, 0.999, 0.9985].map((factor, i) => {
                       const p = (marketData?.current_price || 0) * factor;
                       return (
                          <div key={i} className="flex justify-between relative py-0.5 px-2">
                             <div className="absolute inset-0 bg-color-success/5" style={{ width: `${(i+1)*15}%`, right: 0, left: 'auto' }}></div>
                             <span className="text-color-success relative">{p.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                             <span className="text-text-secondary relative">0.{(i+2)*4}12</span>
                          </div>
                       );
                    })}
                 </div>
              </div>
           </div>

           {/* Trading Form */}
           <div className="p-4 space-y-4">
              <div className="flex bg-bg-tertiary p-1 rounded-lg">
                 <button 
                  onClick={() => setSide('BUY')}
                  className={`flex-1 py-2 text-xs font-bold rounded transition ${side === 'BUY' ? 'bg-color-success text-white' : 'text-text-tertiary hover:text-text-primary'}`}>
                    BUY
                 </button>
                 <button 
                  onClick={() => setSide('SELL')}
                  className={`flex-1 py-2 text-xs font-bold rounded transition ${side === 'SELL' ? 'bg-color-danger text-white' : 'text-text-tertiary hover:text-text-primary'}`}>
                    SELL
                 </button>
              </div>

              <div className="flex gap-2 text-[10px] font-bold">
                 {['MARKET', 'LIMIT'].map(t => (
                    <button 
                      key={t}
                      onClick={() => setOrderType(t)}
                      className={`pb-1 border-b-2 transition ${orderType === t ? 'border-color-primary text-text-primary' : 'border-transparent text-text-tertiary hover:text-text-primary'}`}
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
                    <span className="absolute right-3 top-3 text-[10px] text-text-tertiary font-bold uppercase">BTC</span>
                 </div>
                 
                 <div className="flex justify-between px-1">
                    {[25, 50, 75, 100].map(p => (
                       <button key={p} className="text-[10px] font-bold text-text-tertiary hover:text-color-primary transition">{p}%</button>
                    ))}
                 </div>

                 <button className={`w-full py-4 rounded-xl font-black text-white transition shadow-lg ${side === 'BUY' ? 'bg-color-success hover:bg-opacity-80 shadow-color-success/10' : 'bg-color-danger hover:bg-opacity-80 shadow-color-danger/10'}`}>
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
