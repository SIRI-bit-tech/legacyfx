'use client';

import React, { useState, useEffect } from 'react';
import { useAbly } from '@/hooks/useAbly';
import { MiningStats } from '@/global';
import { Activity, Database, Clock, RefreshCcw } from 'lucide-react';

interface MiningStatsCardProps {
    initialStats?: MiningStats;
}

export const MiningStatsCard: React.FC<MiningStatsCardProps> = ({ initialStats }) => {
    const [stats, setStats] = useState<MiningStats | undefined>(initialStats);
    
    // Listen for live mining-stats updates via Ably
    useAbly('mining-stats', (message) => {
        if (message.name === 'update') {
            setStats(prev => ({ ...prev, ...message.data }));
        }
    });

    const statItems = [
        { label: 'Network Difficulty', value: stats?.difficulty || '...', icon: Database, color: 'text-blue-500' },
        { label: 'Global Hashrate', value: stats?.network_hashrate || '...', icon: Activity, color: 'text-green-500' },
        { label: 'Avg Block Time', value: stats?.block_time_avg ? `${Math.round(stats.block_time_avg / 60)}m` : '...', icon: Clock, color: 'text-purple-500' },
        { label: 'Last Updated', value: stats?.updated_at ? new Date(stats.updated_at).toLocaleTimeString() : '...', icon: RefreshCcw, color: 'text-orange-500' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statItems.map((item, idx) => (
                <div key={idx} className="bg-card/50 backdrop-blur-md border border-border/50 rounded-xl p-4 flex items-center space-x-4">
                    <div className={`p-3 rounded-lg bg-background/50 ${item.color}`}>
                        <item.icon size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</p>
                        <p className="text-lg font-bold font-mono">{item.value}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};
