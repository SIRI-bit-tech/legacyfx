'use client';

import { DashboardLayout } from '../dashboard-layout';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { TradeTopBar } from '@/components/trade/TradeTopBar';
import { OrderBook } from '@/components/trade/OrderBook';
import { OpenOrders } from '@/components/trade/OpenOrders';
import { OrderHistory } from '@/components/trade/OrderHistory';
import { TradeHistory } from '@/components/trade/TradeHistory';
import { FundsTab } from '@/components/trade/FundsTab';
import { useTopBarStats } from '@/hooks/useTopBarStats';
import { useSearchParams } from 'next/navigation';
import { KYCGuard } from '@/components/user/KYCGuard';
import { useAuth } from '@/hooks/useAuth';
import { AlertModal } from '@/components/shared/AlertModal';

declare global {
  var TradingView: any;
}

const getTradingViewSymbol = (rawSymbol: string): string => {
  const s = rawSymbol.replaceAll(/[-/]/g, '').toUpperCase().trim();
  const fxQuotes = ['USD', 'JPY', 'CHF', 'GBP', 'CAD', 'AUD', 'NZD'];
  const isFx = s.length === 6 && fxQuotes.some((q) => s.endsWith(q));
  if (isFx) return `FX_IDC:${s}`;
  const cryptoQuotes = ['USDT', 'USDC', 'USD', 'BTC', 'ETH', 'BNB'];
  const isCrypto = cryptoQuotes.some((q) => s.endsWith(q));
  if (isCrypto) return `BINANCE:${s}`;
  return `NASDAQ:${s}`;
};

const normalizeAppSymbol = (raw: string): string => {
  return (raw || '').replace(/^.*:/, '').replaceAll(/[-/]/g, '').toUpperCase().trim();
};

function TradePageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [showConfirm, setShowConfirm] = useState(false);
  const querySymbol = searchParams.get('symbol');
  const initialSymbol = normalizeAppSymbol(querySymbol || '') || 'BTCUSDT';

  const [symbol, setSymbol] = useState<string>(initialSymbol);
  const [side, setSide] = useState(searchParams.get('type')?.toUpperCase() || 'BUY');
  const [orderType, setOrderType] = useState(searchParams.get('entry') ? 'LIMIT' : 'MARKET');
  const [amount, setAmount] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [tradeAlert, setTradeAlert] = useState<{ isOpen: boolean; title: string; message: string; type: 'info' | 'success' | 'error' | 'warning' | 'danger' }>({ isOpen: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    if (user) {
       setOrderType(user.default_order_type || 'MARKET');
       setAmount(user.default_lot_size?.toString() || '');
    }
  }, [user]);

  const tvWidgetRef = useRef<any>(null);
  const tradingViewContainerRef = useRef<HTMLDivElement | null>(null);
  const stats = useTopBarStats(symbol, 'crypto');

  useEffect(() => {
    const next = normalizeAppSymbol(querySymbol || '');
    if (next) setSymbol((prev) => (prev === next ? prev : next));
  }, [querySymbol]);

  const ensureTvScript = useCallback(async (): Promise<void> => {
    if (globalThis.TradingView !== undefined) return;

    const scriptId = 'tradingview-widget-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      document.head.appendChild(script);
    }

    // Wait for script to load or timeout
    for (let i = 0; i < 80; i++) {
      if (globalThis.TradingView !== undefined) return;
      await new Promise(resolve => globalThis.setTimeout(resolve, 50));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      let container: HTMLDivElement | null = null;
      for (let i = 0; i < 400; i++) {
        container = tradingViewContainerRef.current;
        if (container) break;
        await new Promise((r) => globalThis.setTimeout(r, 50));
      }
      if (!container || cancelled) return;
      await ensureTvScript();
      if (cancelled) return;

      if (tvWidgetRef.current?.remove) tvWidgetRef.current.remove();
      container.innerHTML = '';

      tvWidgetRef.current = new globalThis.TradingView.widget({
        width: '100%',
        height: '100%',
        symbol: getTradingViewSymbol(symbol),
        interval: 'D',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        container_id: 'tradingview_widget',
        backgroundColor: '#1e2329',
        gridColor: 'rgba(43, 47, 54, 1)',
      });
    };
    init();
    return () => { cancelled = true; };
  }, [symbol, ensureTvScript]);

  return (
    <DashboardLayout>
      <KYCGuard>
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
          <div className="flex-1 flex flex-col border-r border-color-border">
            <TradeTopBar symbol={symbol} onSymbolChange={setSymbol} />
            <div className="flex-1 lg:h-[500px] bg-bg-primary relative min-h-[300px]">
              <div ref={tradingViewContainerRef} id="tradingview_widget" className="absolute inset-0" />
            </div>
            <div className="hidden lg:flex h-64 bg-bg-secondary border-t border-color-border flex-col">
              <div className="flex border-b border-color-border px-4">
                {['Open Orders', 'Order History', 'Trade History', 'Funds'].map((tab, i) => (
                  <button key={tab} onClick={() => setActiveTab(i)} className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${activeTab === i ? 'border-color-primary text-color-primary' : 'border-transparent text-text-tertiary hover:text-text-primary'}`}>{tab}</button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto">
                {activeTab === 0 && <OpenOrders />}
                {activeTab === 1 && <OrderHistory />}
                {activeTab === 2 && <TradeHistory />}
                {activeTab === 3 && <FundsTab />}
              </div>
            </div>
          </div>
          <div className="w-full lg:w-80 flex flex-col bg-bg-secondary lg:border-l border-t lg:border-t-0 border-color-border">
            <div className="h-64 lg:h-80 border-b border-color-border flex flex-col overflow-hidden">
              <div className="p-3 border-b border-color-border flex justify-between items-center bg-bg-tertiary/20">
                <span className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Order Book</span>
              </div>
              <OrderBook symbol={symbol} currentPrice={stats.price} />
            </div>
            <div className="p-4 space-y-4">
              <div className="flex bg-bg-tertiary p-1 rounded-lg">
                <button onClick={() => setSide('BUY')} className={`flex-1 py-2 text-xs font-bold rounded transition ${side === 'BUY' ? 'bg-color-success text-white' : 'text-text-tertiary hover:text-text-primary'}`}>BUY</button>
                <button onClick={() => setSide('SELL')} className={`flex-1 py-2 text-xs font-bold rounded transition ${side === 'SELL' ? 'bg-color-danger text-white' : 'text-text-tertiary hover:text-text-primary'}`}>SELL</button>
              </div>
              <div className="flex gap-4 text-[10px] font-bold px-1">
                {['MARKET', 'LIMIT'].map(t => (
                  <button
                    key={t}
                    onClick={() => setOrderType(t)}
                    className={`pb-1 border-b-2 transition ${orderType === t
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
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-bg-tertiary border border-color-border rounded-lg pl-4 pr-12 py-3 text-sm focus:border-color-primary outline-none text-right text-text-primary font-mono" placeholder="0.00" />
                  <span className="absolute right-3 top-3 text-[10px] text-text-tertiary font-bold uppercase">{symbol.replace('USDT', '')}</span>
                </div>
                <div className="flex justify-between px-1 text-[10px] text-text-tertiary font-black uppercase tracking-widest">
                   <span>Leverage: {user?.default_leverage || 100}x</span>
                   <span>Slippage: {user?.slippage_tolerance || 0.5}%</span>
                </div>
                 <button 
                  onClick={() => {
                    if (user?.one_click_trading) {
                      setTradeAlert({ isOpen: true, title: 'Order Executed', message: `${side} ${amount} ${symbol} executed at market price.`, type: 'success' });
                    } else if (user?.confirmation_dialogs === false) {
                      setTradeAlert({ isOpen: true, title: 'Order Executed', message: `${side} ${amount} ${symbol} executed at market price.`, type: 'success' });
                    } else {
                      setShowConfirm(true);
                    }
                  }}
                  className={`w-full py-4 rounded-xl font-black text-black transition shadow-lg ${side === 'BUY' ? 'bg-color-success shadow-color-success/10' : 'bg-color-danger shadow-color-danger/10'}`}
                >
                  {side} {symbol.replace('USDT', '')}
                </button>

               {showConfirm && (
                 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                   <div className="bg-bg-secondary border border-color-border w-full max-w-xs rounded-2xl p-6 shadow-2xl animate-in zoom-in duration-200 text-left">
                     <h4 className="text-lg font-bold text-text-primary mb-4">Confirm Order</h4>
                     <div className="space-y-2 mb-6">
                       <div className="flex justify-between text-xs"><span className="text-text-tertiary">Side</span><span className={side === 'BUY' ? 'text-color-success font-bold' : 'text-color-danger font-bold'}>{side}</span></div>
                       <div className="flex justify-between text-xs"><span className="text-text-tertiary">Asset</span><span className="text-text-primary font-bold">{symbol}</span></div>
                       <div className="flex justify-between text-xs"><span className="text-text-tertiary">Amount</span><span className="text-text-primary font-bold">{amount}</span></div>
                       <div className="flex justify-between text-xs"><span className="text-text-tertiary">Type</span><span className="text-text-primary font-bold">{orderType}</span></div>
                     </div>
                     <div className="flex gap-3">
                       <button onClick={() => setShowConfirm(false)} className="flex-1 py-2 rounded-lg bg-bg-tertiary text-text-secondary text-xs font-bold">Cancel</button>
                        <button onClick={() => { setShowConfirm(false); setTradeAlert({ isOpen: true, title: 'Order Executed', message: `${side} ${amount} ${symbol} confirmed and executed.`, type: 'success' }); }} className={`flex-1 py-2 rounded-lg text-black text-xs font-black ${side === 'BUY' ? 'bg-color-success' : 'bg-color-danger'}`}>Confirm</button>
                     </div>
                   </div>
                 </div>
               )}
              </div>
            </div>
          </div>
        </div>
      </KYCGuard>
      <AlertModal
        isOpen={tradeAlert.isOpen}
        title={tradeAlert.title}
        message={tradeAlert.message}
        type={tradeAlert.type}
        onClose={() => setTradeAlert(prev => ({ ...prev, isOpen: false }))}
      />
    </DashboardLayout>
  );
}

export default function TradePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-primary flex items-center justify-center text-text-tertiary">Loading Trade Station...</div>}>
      <TradePageContent />
    </Suspense>
  );
}