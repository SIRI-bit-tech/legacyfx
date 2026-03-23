// Order book component displaying live bids and asks
'use client';

import { useOrderBook } from '@/hooks/useOrderBook';
import { useState } from 'react';

interface OrderBookProps {
  symbol: string;
  currentPrice?: number;
}

export function OrderBook({ symbol, currentPrice = 0 }: OrderBookProps) {
  const { bids, asks, loading, error } = useOrderBook(symbol);
  const [flashingRows, setFlashingRows] = useState<Set<string>>(new Set());

  // Take top 10 bids and asks
  const topBids = bids.slice(0, 10);
  const topAsks = asks.slice(0, 10).reverse(); // Reverse so highest ask is at bottom

  const handleRowFlash = (key: string) => {
    setFlashingRows(prev => new Set(prev).add(key));
    setTimeout(() => {
      setFlashingRows(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 300);
  };

  const renderOrderRow = (price: number, quantity: number, type: 'bid' | 'ask', index: number) => {
    const key = `${type}-${price}-${index}`;
    const isFlashing = flashingRows.has(key);
    const color = type === 'bid' ? 'text-color-success' : 'text-color-danger';
    const bgColor = type === 'bid' ? 'bg-color-success/5' : 'bg-color-danger/5';
    const percentage = Math.min((quantity / 10) * 100, 100); // Normalize for visual

    return (
      <div
        key={key}
        className={`flex justify-between relative py-0.5 px-2 transition-colors ${
          isFlashing ? 'bg-color-primary/10' : ''
        }`}
      >
        <div
          className={`absolute inset-0 ${bgColor}`}
          style={{ width: `${percentage}%`, right: 0, left: 'auto' }}
        />
        <span className={`${color} relative font-bold`}>
          {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className="text-text-secondary relative">
          {quantity.toFixed(4)}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-text-tertiary text-sm">
          <i className="pi pi-spin pi-spinner mr-2"></i>
          Loading order book...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <i className="pi pi-exclamation-triangle text-color-danger text-2xl mb-2"></i>
          <div className="text-text-tertiary text-xs">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col text-[10px] font-mono p-2">
      {/* Header */}
      <div className="flex justify-between px-2 pb-2 text-text-tertiary font-bold uppercase text-[9px]">
        <span>Price (USDT)</span>
        <span>Amount</span>
      </div>

      {/* Asks (Sells) - Displayed in reverse order */}
      <div className="space-y-0.5 flex flex-col-reverse mb-2">
        {topAsks.length > 0 ? (
          topAsks.map((ask, i) => renderOrderRow(ask.price, ask.quantity, 'ask', i))
        ) : (
          <div className="text-text-tertiary text-center py-2 text-[9px]">No asks</div>
        )}
      </div>

      {/* Current Price */}
      <div className="py-2 px-2 border-y border-color-border/30 text-center my-1">
        <span
          className={`text-lg font-black ${
            currentPrice > 0 ? 'text-color-success' : 'text-text-primary'
          }`}
        >
          {currentPrice > 0
            ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '--'}
        </span>
        <span className="text-[8px] text-text-tertiary block">
          ≈ ${currentPrice > 0 ? currentPrice.toLocaleString() : '--'}
        </span>
      </div>

      {/* Bids (Buys) */}
      <div className="space-y-0.5 mt-2">
        {topBids.length > 0 ? (
          topBids.map((bid, i) => renderOrderRow(bid.price, bid.quantity, 'bid', i))
        ) : (
          <div className="text-text-tertiary text-center py-2 text-[9px]">No bids</div>
        )}
      </div>
    </div>
  );
}
