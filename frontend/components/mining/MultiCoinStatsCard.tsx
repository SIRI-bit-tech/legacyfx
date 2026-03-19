'use client';

import React, { useState, useEffect } from 'react';
import { useAbly } from '@/hooks/useAbly';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';
import { Activity, Database, Clock, RefreshCcw, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CoinStats {
    coin_symbol: string;
    coin_name: string;
    algorithm: string;
    network_hashrate: string;
    difficulty: string;
    block_time_avg: number;
    market_price_usd: number;
    data_available: boolean;
}

interface MultiCoinStatsCardProps {
    initialCoin?: string;
}

export const MultiCoinStatsCard: React.FC<MultiCoinStatsCardProps> = ({ initialCoin = "BTC" }) => {
    const [selectedCoin, setSelectedCoin] = useState(initialCoin);
    const [allCoins, setAllCoins] = useState<CoinStats[]>([]);
    const [currentStats, setCurrentStats] = useState<CoinStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadAllCoins();
    }, []);

    useEffect(() => {
        if (allCoins.length > 0) {
            const stats = allCoins.find(coin => coin.coin_symbol === selectedCoin);
            setCurrentStats(stats || null);
        }
    }, [selectedCoin, allCoins]);

    // Listen for live mining-stats updates via Ably
    useAbly('mining-stats', (message: any) => {
        if (message && message.name === 'update') {
            // Refresh data when updates are received
            loadAllCoins();
        }
    });

    const loadAllCoins = async () => {
        try {
            setLoading(true);
            setError(null);
            const endpoint = (API_ENDPOINTS.MINING as any).STATS_ALL || "/mining/stats/all";
            const response = await api.get(endpoint);
            setAllCoins(response.coins || []);
            
            // Auto-select first coin with available data
            const availableCoins = response.coins?.filter((coin: any) => coin.data_available) || [];
            if (availableCoins.length > 0 && !selectedCoin) {
                setSelectedCoin(availableCoins[0].coin_symbol);
            }
        } catch (err) {
            console.error('Error loading multi-coin stats:', err);
            setError('Failed to load mining statistics');
        } finally {
            setLoading(false);
        }
    };

    const getPriceChangeIcon = (price: number) => {
        if (price === 0) return <Minus className="w-4 h-4 text-gray-400" />;
        return price > 1000 ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />;
    };

    const getPriceChangeColor = (price: number) => {
        if (price === 0) return 'text-gray-400';
        return price > 1000 ? 'text-green-500' : 'text-red-500';
    };

    const formatPrice = (price: number) => {
        if (price === 0) return 'N/A';
        if (price < 0.01) return '< $0.01';
        if (price < 1) return `$${price.toFixed(4)}`;
        if (price < 100) return `$${price.toFixed(2)}`;
        return `$${price.toLocaleString()}`;
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-card/50 backdrop-blur-md border border-border/50 rounded-xl p-6 animate-pulse">
                        <div className="h-4 bg-gray-600 rounded mb-4 w-1/3"></div>
                        <div className="h-8 bg-gray-600 rounded mb-2 w-2/3"></div>
                        <div className="h-4 bg-gray-600 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-8">
                <p className="text-red-400 text-center">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 mb-8">
            {/* Coin Selector */}
            <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm font-medium text-text-secondary mr-2">Select Coin:</span>
                {allCoins.map((coin) => (
                    <button
                        key={coin.coin_symbol}
                        onClick={() => setSelectedCoin(coin.coin_symbol)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                            selectedCoin === coin.coin_symbol
                                ? 'bg-color-primary text-black border border-color-primary/50 shadow-lg shadow-color-primary/10'
                                : 'bg-card/50 border border-border/50 hover:bg-card/80 text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        {coin.coin_symbol}
                    </button>
                ))}
            </div>

            {/* Main Stats Display */}
            {currentStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Network Hashrate */}
                    <div className="bg-card/50 backdrop-blur-md border border-border/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs text-text-tertiary uppercase tracking-wider">Network Hashrate</p>
                            <Activity className="w-4 h-4 text-blue-500" />
                        </div>
                        <p className="text-lg font-bold font-mono text-text-primary">
                            {currentStats.data_available ? currentStats.network_hashrate : 'N/A'}
                        </p>
                        {!currentStats.data_available && (
                            <p className="text-xs text-text-tertiary mt-1">Data unavailable</p>
                        )}
                    </div>

                    {/* Difficulty */}
                    <div className="bg-card/50 backdrop-blur-md border border-border/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs text-text-tertiary uppercase tracking-wider">Difficulty</p>
                            <Database className="w-4 h-4 text-purple-500" />
                        </div>
                        <p className="text-lg font-bold font-mono text-text-primary">
                            {currentStats.data_available ? currentStats.difficulty : 'N/A'}
                        </p>
                        {!currentStats.data_available && (
                            <p className="text-xs text-text-tertiary mt-1">Data unavailable</p>
                        )}
                    </div>

                    {/* Block Time */}
                    <div className="bg-card/50 backdrop-blur-md border border-border/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs text-text-tertiary uppercase tracking-wider">Block Time</p>
                            <Clock className="w-4 h-4 text-green-500" />
                        </div>
                        <p className="text-lg font-bold font-mono text-text-primary">
                            {currentStats.data_available ? `${Math.round(currentStats.block_time_avg)}s` : 'N/A'}
                        </p>
                        {!currentStats.data_available && (
                            <p className="text-xs text-text-tertiary mt-1">Data unavailable</p>
                        )}
                    </div>

                    {/* Market Price */}
                    <div className="bg-card/50 backdrop-blur-md border border-border/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs text-text-tertiary uppercase tracking-wider">Market Price</p>
                            {getPriceChangeIcon(currentStats.market_price_usd)}
                        </div>
                        <p className={`text-lg font-bold font-mono ${getPriceChangeColor(currentStats.market_price_usd)}`}>
                            {formatPrice(currentStats.market_price_usd)}
                        </p>
                        <p className="text-xs text-text-tertiary mt-1">{currentStats.algorithm}</p>
                    </div>
                </div>
            )}

            {/* Algorithm Info */}
            {currentStats && (
                <div className="bg-card/30 border border-border/30 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-text-primary">{currentStats.coin_name}</h3>
                            <p className="text-sm text-text-secondary">Mining Algorithm: {currentStats.algorithm}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            currentStats.data_available 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                            {currentStats.data_available ? 'Live Data' : 'Limited Data'}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
