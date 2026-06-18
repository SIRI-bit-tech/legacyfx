'use client';

import { DashboardLayout } from '../dashboard-layout';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { TradeTopBar } from '@/components/trade/TradeTopBar';
import { OrderBook } from '@/components/trade/OrderBook';
import { OpenOrders } from '@/components/trade/OpenOrders';
import { ActivePositions } from '@/components/trade/ActivePositions';
import { OrderHistory } from '@/components/trade/OrderHistory';
import { TradeHistory } from '@/components/trade/TradeHistory';
import { FundsTab } from '@/components/trade/FundsTab';
import { useTopBarStats } from '@/hooks/useTopBarStats';
import { useSearchParams } from 'next/navigation';
import { KYCGuard } from '@/components/user/KYCGuard';
import { useAuth } from '@/hooks/useAuth';
import { AlertModal } from '@/components/shared/AlertModal';
import { api } from '@/lib/api';
import useSWR from 'swr';
import { LiveMarginPanel } from '@/components/trade/LiveMarginPanel';

import { LightweightChart, OrderMarker } from '@/components/trade/LightweightChart';
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

const getAssetType = (rawSymbol: string): 'crypto' | 'forex' | 'stock' => {
  const s = rawSymbol.replaceAll(/[-/]/g, '').toUpperCase().trim();
  const fxQuotes = ['USD', 'JPY', 'CHF', 'GBP', 'CAD', 'AUD', 'NZD'];
  if (s.length === 6 && fxQuotes.some((q) => s.endsWith(q)) && !s.endsWith('USDT')) return 'forex';
  const cryptoQuotes = ['USDT', 'USDC', 'BTC', 'ETH', 'BNB'];
  if (cryptoQuotes.some((q) => s.endsWith(q))) return 'crypto';
  return 'stock';
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
  const [activeOrders, setActiveOrders] = useState<OrderMarker[]>([]);
  const [tradeAlert, setTradeAlert] = useState<{ isOpen: boolean; title: string; message: string; type: 'info' | 'success' | 'error' | 'warning' | 'danger' }>({ isOpen: false, title: '', message: '', type: 'info' });
  const [limitPrice, setLimitPrice] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [leverage, setLeverage] = useState<number>(100);
  const { data: openOrdersData, mutate: mutateOrders } = useSWR(user ? '/trading/orders/open' : null, (url) => api.get(url));
  const { data: fundsData, mutate: mutateFunds } = useSWR(user ? '/trading/funds' : null, (url) => api.get(url));
  const { data: positionsData, mutate: mutatePositions } = useSWR(user ? '/trading/positions' : null, (url) => api.get(url));

  // Load active positions from backend (persists across login/logout)
  useEffect(() => {
    if (positionsData && Array.isArray(positionsData)) {
      const markers: OrderMarker[] = positionsData
        .filter((p: any) => p.is_open && p.symbol === symbol)
        .map((p: any) => ({
          id: p.id,
          time: Math.floor(new Date(p.created_at).getTime() / 1000),
          price: p.entry_price,
          side: p.side as 'BUY' | 'SELL',
          quantity: p.quantity,
          takeProfit: p.take_profit,
          stopLoss: p.stop_loss,
        }));
      setActiveOrders(markers);
    }
  }, [positionsData, symbol]);

  useEffect(() => {
    if (user) {
      setOrderType(user.default_order_type || 'MARKET');
      setAmount(user.default_lot_size?.toString() || '');
      setLeverage(user.default_leverage || 100);
    }
  }, [user]);

  const assetType = getAssetType(symbol);
  const stats = useTopBarStats(symbol, assetType);

  const executeOrder = async () => {
    const currentPrice = stats?.price || 0;
    if (currentPrice === 0) return;
    
    if (!takeProfit || !stopLoss) {
      setTradeAlert({ isOpen: true, title: 'Validation Error', message: 'Take Profit and Stop Loss are required.', type: 'warning' });
      return;
    }
    
    if (orderType === 'LIMIT' && !limitPrice) {
      setTradeAlert({ isOpen: true, title: 'Validation Error', message: 'Limit Price is required for Limit Orders.', type: 'warning' });
      return;
    }
    
    try {
      const executionPrice = orderType === 'LIMIT' ? parseFloat(limitPrice) : currentPrice;
      const selectedLeverage = leverage || user?.default_leverage || 100;
      const notionalSize = parseFloat(amount) * selectedLeverage;
      const cryptoQuantity = notionalSize / executionPrice;

      const response = await api.post('/trading/orders', {
        symbol,
        quantity: cryptoQuantity,
        trade_type: side,
        order_type: orderType,
        price: orderType === 'LIMIT' ? parseFloat(limitPrice) : undefined,
        leverage: selectedLeverage,
        take_profit: parseFloat(takeProfit),
        stop_loss: parseFloat(stopLoss)
      });
      
      const newOrder: OrderMarker = {
        id: response.id || Math.random().toString(36).substr(2, 9),
        time: Math.floor(Date.now() / 1000), // seconds timestamp
        price: response.entry_price || executionPrice,
        side: side as 'BUY' | 'SELL',
        quantity: cryptoQuantity,
        takeProfit: parseFloat(takeProfit),
        stopLoss: parseFloat(stopLoss),
      };
      
      setActiveOrders(prev => [...prev, newOrder]);
      mutateOrders(); // Refresh from backend
      mutateFunds();  // Refresh balance
      mutatePositions(); // Refresh positions
      
      // Clear the form for next trade
      setAmount('');
      setTakeProfit('');
      setStopLoss('');
      setLimitPrice('');
      
      setTradeAlert({ isOpen: true, title: 'Order Executed', message: `${side} $${amount} of ${symbol} executed at ${newOrder.price}.`, type: 'success' });
    } catch (error: any) {
      setTradeAlert({ 
        isOpen: true, 
        title: 'Trade Failed', 
        message: error.message || 'Failed to execute order. Please check your balance.', 
        type: 'error' 
      });
    }
  };

  // Using new LightweightChart component instead of TradingView widget

  return (
    <DashboardLayout>
      <KYCGuard>
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
          <div className="flex-1 flex flex-col border-r border-color-border min-w-0">
            <TradeTopBar symbol={symbol} onSymbolChange={setSymbol} />
            <div className="flex-1 flex flex-col relative min-h-0">
              {/* Live Chart Container */}
              <LightweightChart symbol={symbol} assetType={assetType} orders={activeOrders} />
            </div>
            <LiveMarginPanel
              balance={fundsData?.[0]?.total_balance || user?.trading_balance || 0}
              currentPrice={stats?.price || 0}
              activeOrders={activeOrders}
              leverage={leverage || user?.default_leverage || 100}
            />
            <div className="hidden lg:flex h-64 bg-bg-secondary border-t border-color-border flex-col min-w-0">
              <div className="flex border-b border-color-border px-4 overflow-x-auto hide-scrollbar">
                {['Positions', 'Open Orders', 'Order History', 'Trade History', 'Funds'].map((tab, i) => (
                  <button key={tab} onClick={() => setActiveTab(i)} className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${activeTab === i ? 'border-color-primary text-color-primary' : 'border-transparent text-text-tertiary hover:text-text-primary'}`}>{tab}</button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto">
                {activeTab === 0 && <ActivePositions positions={positionsData || []} mutatePositions={mutatePositions} mutateFunds={mutateFunds} />}
                {activeTab === 1 && <OpenOrders />}
                {activeTab === 2 && <OrderHistory />}
                {activeTab === 3 && <TradeHistory />}
                {activeTab === 4 && <FundsTab />}
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
                {orderType === 'LIMIT' && (
                  <div className="relative">
                    <input type="number" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} className="w-full bg-bg-tertiary border border-color-border rounded-lg pl-4 pr-12 py-3 text-sm focus:border-color-primary outline-none text-left text-text-primary font-mono" placeholder="Limit Price" />
                    <span className="absolute right-3 top-3 text-[10px] text-text-tertiary font-bold uppercase">USD</span>
                  </div>
                )}
                <div className="relative">
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-bg-tertiary border border-color-border rounded-lg pl-4 pr-12 py-3 text-sm focus:border-color-primary outline-none text-left text-text-primary font-mono" placeholder="0.00" />
                  <span className="absolute right-3 top-3 text-[10px] text-text-tertiary font-bold uppercase">USD</span>
                </div>
                
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type="number" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} className="w-full bg-bg-tertiary border border-color-border rounded-lg pl-8 py-3 text-sm focus:border-color-success outline-none text-right text-text-primary font-mono" placeholder="Take Profit" />
                    <span className="absolute left-3 top-3 text-[10px] text-color-success font-bold uppercase">TP</span>
                  </div>
                  <div className="relative flex-1">
                    <input type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className="w-full bg-bg-tertiary border border-color-border rounded-lg pl-8 py-3 text-sm focus:border-color-danger outline-none text-right text-text-primary font-mono" placeholder="Stop Loss" />
                    <span className="absolute left-3 top-3 text-[10px] text-color-danger font-bold uppercase">SL</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-color-border/30">
                  <div className="flex justify-between px-1 text-[10px] text-text-tertiary font-black uppercase tracking-widest">
                    <span>Leverage: {leverage}x</span>
                    <span>Slippage: {user?.slippage_tolerance || 0.5}%</span>
                  </div>
                  <div className="px-1 flex items-center gap-3">
                    <input 
                      type="range" 
                      min="1" 
                      max="1000" 
                      step="1"
                      value={leverage} 
                      onChange={(e) => setLeverage(parseInt(e.target.value))} 
                      className="flex-1 accent-color-primary h-1 bg-bg-tertiary rounded-lg appearance-none cursor-pointer" 
                    />
                    <div className="relative w-16">
                      <input 
                        type="number" 
                        value={leverage} 
                        onChange={(e) => setLeverage(parseInt(e.target.value) || 1)}
                        className="w-full bg-bg-tertiary border border-color-border rounded pl-2 pr-4 py-1 text-xs focus:border-color-primary outline-none text-right text-text-primary font-mono" 
                      />
                      <span className="absolute right-1.5 top-1 text-[10px] text-text-tertiary font-bold">x</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (user?.one_click_trading || user?.confirmation_dialogs === false) {
                      executeOrder();
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
                        <div className="flex justify-between text-xs"><span className="text-text-tertiary">Amount</span><span className="text-text-primary font-bold">${amount}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-text-tertiary">Type</span><span className="text-text-primary font-bold">{orderType}</span></div>
                        {orderType === 'LIMIT' && (
                          <div className="flex justify-between text-xs"><span className="text-text-tertiary">Limit Price</span><span className="text-text-primary font-bold">{limitPrice}</span></div>
                        )}
                        <div className="flex justify-between text-xs"><span className="text-text-tertiary">Take Profit</span><span className="text-color-success font-bold">{takeProfit}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-text-tertiary">Stop Loss</span><span className="text-color-danger font-bold">{stopLoss}</span></div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setShowConfirm(false)} className="flex-1 py-2 rounded-lg bg-bg-tertiary text-text-secondary text-xs font-bold">Cancel</button>
                        <button onClick={() => {
                          setShowConfirm(false);
                          executeOrder();
                        }} className={`flex-1 py-2 rounded-lg text-black text-xs font-black ${side === 'BUY' ? 'bg-color-success' : 'bg-color-danger'}`}>Confirm</button>
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