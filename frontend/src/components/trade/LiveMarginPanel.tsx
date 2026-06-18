import React, { useMemo } from 'react';
import { OrderMarker } from './LightweightChart';

interface LiveMarginPanelProps {
  balance: number;
  currentPrice: number;
  activeOrders: OrderMarker[];
  leverage?: number;
}

export function LiveMarginPanel({ balance, currentPrice, activeOrders, leverage = 100 }: LiveMarginPanelProps) {
  // Calculate unrealized PnL based on open positions and the current live price
  const unrealizedPnL = useMemo(() => {
    if (!currentPrice || currentPrice === 0) return 0;
    
    let pnl = 0;
    activeOrders.forEach(order => {
      const quantity = order.quantity || 0; 
      
      if (order.side === 'BUY') {
        pnl += (currentPrice - order.price) * quantity;
      } else {
        pnl += (order.price - currentPrice) * quantity;
      }
    });
    return pnl;
  }, [currentPrice, activeOrders]);

  const equity = balance + unrealizedPnL;
  
  // Margin = notional value / leverage
  const marginUsed = useMemo(() => {
    let margin = 0;
    activeOrders.forEach(order => {
      const quantity = order.quantity || 0;
      const notional = order.price * quantity;
      margin += notional / leverage;
    });
    return margin;
  }, [activeOrders, leverage]);

  const freeMargin = equity - marginUsed;

  const isProfitable = unrealizedPnL >= 0;

  return (
    <div className="bg-bg-tertiary border-t border-color-border px-6 py-3 flex flex-wrap gap-6 items-center text-[11px] uppercase tracking-widest font-black shrink-0">
      <div className="flex flex-col">
        <span className="text-text-tertiary mb-1">Balance</span>
        <span className="text-text-primary text-sm">${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      
      <div className="flex flex-col">
        <span className="text-text-tertiary mb-1">Equity</span>
        <span className="text-text-primary text-sm">${equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>

      <div className="flex flex-col">
        <span className="text-text-tertiary mb-1">Unrealized PnL</span>
        <span className={`text-sm ${isProfitable ? 'text-color-success' : 'text-color-danger'}`}>
          {isProfitable ? '+' : ''}${Math.abs(unrealizedPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      <div className="flex flex-col">
        <span className="text-text-tertiary mb-1">Margin Used</span>
        <span className="text-text-primary text-sm">${marginUsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>

      <div className="flex flex-col">
        <span className="text-text-tertiary mb-1">Free Margin</span>
        <span className="text-text-primary text-sm">${freeMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    </div>
  );
}
