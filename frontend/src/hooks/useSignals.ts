import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface Signal {
  id?: string;
  symbol: string;
  asset_type: 'crypto' | 'forex' | 'stocks';
  signal_type: 'buy' | 'sell' | 'hold';
  strength: 'strong' | 'moderate' | 'weak';
  timeframe: string;
  entry_price: number;
  take_profit: number;
  stop_loss: number;
  rsi?: number;
  macd?: string;
  ema_signal?: string;
  bb_signal?: string;
  sma_signal?: string;
  is_active: boolean;
  generated_at: string;
  expires_at?: string;
  created_at?: string;
}

export interface SignalFilters {
  asset_type?: string;
  signal_type?: string;
  strength?: string;
  timeframe?: string;
}

export interface SignalsResponse {
  signals: Signal[];
  total: number;
  page: number;
  stats: any;
}

export const useSignals = (filters: SignalFilters = {}, page = 1, limit = 12) => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.asset_type && filters.asset_type !== 'all') queryParams.append('asset_type', filters.asset_type);
      if (filters.signal_type && filters.signal_type !== 'all') queryParams.append('signal_type', filters.signal_type);
      if (filters.strength && filters.strength !== 'all') queryParams.append('strength', filters.strength);
      if (filters.timeframe) queryParams.append('timeframe', filters.timeframe);
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());

      const data: SignalsResponse = await api.get(`/signals/?${queryParams.toString()}`);
      setSignals(data.signals);
      setTotal(data.total);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch signals');
    } finally {
      setLoading(false);
    }
  }, [filters.asset_type, filters.signal_type, filters.strength, filters.timeframe, page, limit]);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  return { signals, total, loading, error, refresh: fetchSignals };
};
