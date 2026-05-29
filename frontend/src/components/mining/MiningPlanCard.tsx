'use client';

import React from 'react';
import { Cpu, Zap, Coins, ArrowRight } from 'lucide-react';

interface MiningPlan {
  id: string;
  name: string;
  coin_symbol: string;
  hashrate: string;
  daily_earnings: number;
  daily_usd_profit?: number;
  total_coin_profit?: number;
  total_usd_profit?: number;
  roi_percentage?: number;
  price: number;
  duration_days: number;
  is_active: boolean;
  current_price?: number;
}

interface MiningPlanCardProps {
    plan: MiningPlan;
    onSubscribe: (plan: MiningPlan) => void;
}

export const MiningPlanCard: React.FC<MiningPlanCardProps> = ({ plan, onSubscribe }) => {
    // Use real-time profit data from backend if available
    const dailyEarnings = Number(plan.daily_earnings) || 0;
    const dailyUsdProfit = plan.daily_usd_profit || 0;
    const totalUsdProfit = plan.total_usd_profit || 0;
    const totalCoinProfit = plan.total_coin_profit || 0;
    const roiPercentage = plan.roi_percentage || 0;
    const currentPrice = plan.current_price || 0;
    
    return (
        <div className="bg-card/30 backdrop-blur-xl border border-border/50 rounded-2xl p-6 flex flex-col h-full hover:border-primary/50 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.coin_symbol} Cloud Mining</p>
                    {currentPrice > 0 && (
                        <p className="text-xs text-green-500">Current Price: ${currentPrice.toLocaleString()}</p>
                    )}
                </div>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Zap size={20} />
                </div>
            </div>

            <div className="space-y-4 mb-8 flex-grow">
                <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center text-muted-foreground"><Cpu size={16} className="mr-2" /> Hashrate</span>
                    <span className="font-mono text-primary font-bold">{plan.hashrate}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center text-muted-foreground"><Coins size={16} className="mr-2" /> Daily Profit</span>
                    <div className="text-right">
                        <span className="font-mono text-green-500 font-bold block">
                            {dailyEarnings} {plan.coin_symbol}
                        </span>
                        {dailyUsdProfit > 0 ? (
                            <span className="text-xs text-blue-500">
                                (${dailyUsdProfit.toFixed(2)})
                            </span>
                        ) : dailyUsdProfit === 0 ? (
                            <span className="text-xs text-yellow-500">
                                (No profit data)
                            </span>
                        ) : null}
                    </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center text-muted-foreground"><Coins size={16} className="mr-2" /> Est. Total Profit</span>
                    <div className="text-right">
                        <span className="font-mono text-blue-500 font-bold block">
                            {totalCoinProfit.toFixed(4)} {plan.coin_symbol}
                        </span>
                        {totalUsdProfit > 0 ? (
                            <span className="text-xs text-purple-500">
                                (${totalUsdProfit.toFixed(2)})
                            </span>
                        ) : totalUsdProfit === 0 ? (
                            <span className="text-xs text-yellow-500">
                                (No profit data)
                            </span>
                        ) : null}
                    </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">ROI</span>
                    <span className="font-mono text-purple-500 font-bold">{roiPercentage}%</span>
                </div>
                <div className="flex items-center justify-between text-sm border-t border-border/30 pt-4">
                    <span className="text-muted-foreground">Price</span>
                    <span className="text-2xl font-bold">${plan.price.toLocaleString()}</span>
                </div>
                <div className="text-xs text-center text-muted-foreground italic">
                    Duration: {plan.duration_days} Days
                </div>
            </div>

            <button 
                onClick={() => onSubscribe(plan)}
                className="w-full py-4 bg-color-primary text-black rounded-xl font-bold flex items-center justify-center space-x-2 hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-color-primary/10"
            >
                <span className="uppercase tracking-wider text-sm">Subscribe to this plan</span>
                <ArrowRight size={18} />
            </button>
        </div>
    );
};
