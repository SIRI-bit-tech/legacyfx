// Order book component displaying live bids and asks
'use client';

import { useOrderBook } from '@/hooks/useOrderBook';
import { useState, useMemo } from 'react';

interface OrderBookProps {
  symbol: string;
  currentPrice?: number;
}

/** Return the number of decimal places appropriate for a given price. */
function getPriceDecimals(price: number): number {
  if (price <= 0) return 2;
  if (price < 0.01) return 8;     // micro-cap crypto
  if (price < 1) return 6;        // sub-dollar tokens
  if (price < 10) return 5;       // forex pairs like EUR/USD ~1.17
  if (price < 100) return 4;      // mid-range
  if (price < 1000) return 3;     // e.g. ETH
  if (price < 10000) return 2;    // e.g. BTC at a few thousand
  return 2;
}

/** Format a quantity – show more decimals for very small quantities. */
function formatQuantity(qty: number): string {
  if (qty < 0.0001) return qty.toExponential(2);
  if (qty < 1) return qty.toFixed(6);
  if (qty < 100) return qty.toFixed(4);
  return qty.toFixed(2);
}

export function OrderBook({ symbol, currentPrice = 0 }: Readonly<OrderBookProps>) {
  const { bids, asks, loading, error } = useOrderBook(symbol);
  const [flashingRows] = useState<Set<string>>(new Set());

  // Take top 10 bids and asks
  const topBids = bids.slice(0, 10);
  const topAsks = asks.slice(0, 10).reverse(); // Reverse so highest ask is at bottom

  // Determine price precision from actual data or current price
  const priceDecimals = useMemo(() => {
    const refPrice = currentPrice > 0
      ? currentPrice
      : (bids.length > 0 ? bids[0].price : asks.length > 0 ? asks[0].price : 0);
    return getPriceDecimals(refPrice);
  }, [currentPrice, bids, asks]);


  const renderOrderRow = (price: number, quantity: number, type: 'bid' | 'ask', index: number) => {
    const key = `${type}-${price}-${index}`;
    const isFlashing = flashingRows.has(key);
    const color = type === 'bid' ? 'text-color-success' : 'text-color-danger';
    const bgColor = type === 'bid' ? 'bg-color-success/5' : 'bg-color-danger/5';
    const percentage = Math.min((quantity / 10) * 100, 100); // Normalize for visual

    return (
      <div
        key={key}
        className={`flex justify-between relative py-0.5 px-2 transition-colors ${isFlashing ? 'bg-color-primary/10' : ''
          }`}
      >
        <div
          className={`absolute inset-0 ${bgColor}`}
          style={{ width: `${percentage}%`, right: 0, left: 'auto' }}
        />
        <span className={`${color} relative font-bold`}>
          {price.toLocaleString(undefined, { minimumFractionDigits: priceDecimals, maximumFractionDigits: priceDecimals })}
        </span>
        <span className="text-text-secondary relative">
          {formatQuantity(quantity)}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-text-tertiary text-sm">
          <i className="pi pi-spin pi-spinner mr-2"></i>
          <span>Loading order book...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-text-tertiary text-xs">No data available now</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col text-[10px] font-mono p-2">
      {/* Header */}
      <div className="flex justify-between px-2 pb-2 text-text-tertiary font-bold uppercase text-[9px]">
        <span>Price</span>
        <span>Amount</span>
      </div>

      {/* Asks (Sells) - Displayed in reverse order */}
      <div className="space-y-0.5 flex flex-col-reverse mb-2">
        {topAsks.length > 0 ? (
          topAsks.map((ask, i) => renderOrderRow(ask.price, ask.quantity, 'ask', i))
        ) : (
          <div className="text-text-tertiary text-center py-2 text-[9px]">No data available now</div>
        )}
      </div>

      {/* Current Price */}
      <div className="py-2 px-2 border-y border-color-border/30 text-center my-1">
        <span
          className={`text-lg font-black ${currentPrice > 0 ? 'text-color-success' : 'text-text-primary'
            }`}
        >
          {currentPrice > 0
            ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: priceDecimals, maximumFractionDigits: priceDecimals })
            : '--'}
        </span>
        <span className="text-[8px] text-text-tertiary block">
          ≈ ${currentPrice > 0 ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--'}
        </span>
      </div>

      {/* Bids (Buys) */}
      <div className="space-y-0.5 mt-2">
        {topBids.length > 0 ? (
          topBids.map((bid, i) => renderOrderRow(bid.price, bid.quantity, 'bid', i))
        ) : (
          <div className="text-text-tertiary text-center py-2 text-[9px]">No data available now</div>
        )}
      </div>
    </div>
  );
}
