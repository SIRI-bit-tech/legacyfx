'use client';

import React from 'react';
import { MiningSubscription } from '@/global';
import { Power, Timer, Calendar, Info } from 'lucide-react';

interface ActiveMinerCardProps {
    sub: MiningSubscription;
}

export const ActiveMinerCard: React.FC<ActiveMinerCardProps> = ({ sub }) => {
    const isPending = sub.status === 'PENDING';
    const isActive = sub.status === 'ACTIVE';

    return (
        <div className={`bg-card/20 border ${isPending ? 'border-orange-500/20' : 'border-border/40'} rounded-2xl p-5 relative overflow-hidden group`}>
            {isActive && (
                <div className="absolute top-0 right-0 p-3">
                    <div className="flex items-center space-x-1">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-[10px] uppercase font-bold text-green-500 tracking-tighter">Live</span>
                    </div>
                </div>
            )}

            <div className="flex items-center space-x-4 mb-4">
                <div className={`p-3 rounded-xl ${isPending ? 'bg-orange-500/10 text-orange-500' : 'bg-primary/10 text-primary'}`}>
                    <Power size={22} className={isActive ? 'animate-pulse' : ''} />
                </div>
                <div>
                    <h4 className="font-bold">{sub.plan_name}</h4>
                    <p className="text-xs text-muted-foreground uppercase">{sub.coin_symbol} Cloud Miner</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase">Status</p>
                    <p className={`text-xs font-bold ${isPending ? 'text-orange-500' : 'text-primary'}`}>
                        {isPending ? 'Awaiting payment verification' : sub.status}
                    </p>
                </div>
                <div className="space-y-1 text-right">
                    <p className="text-[10px] text-muted-foreground uppercase">Earnings</p>
                    <p className="text-xs font-mono font-bold text-green-500">{sub.total_earnings.toFixed(8)} {sub.coin_symbol}</p>
                </div>
            </div>

            <div className="border-t border-border/30 pt-4 flex items-center justify-between text-[10px] text-muted-foreground">
                <div className="flex items-center">
                    <Calendar size={12} className="mr-1" />
                    <span>Starts: {new Date(sub.start_date).toLocaleDateString()}</span>
                </div>
                {sub.end_date && (
                    <div className="flex items-center">
                        <Timer size={12} className="mr-1" />
                        <span>Ends: {new Date(sub.end_date).toLocaleDateString()}</span>
                    </div>
                )}
                {isPending && (
                    <div className="flex items-center text-orange-500">
                        <Info size={12} className="mr-1" />
                        <span className="font-bold">Pending Payment</span>
                    </div>
                )}
            </div>
        </div>
    );
};
