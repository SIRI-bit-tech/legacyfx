import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export interface CopiedSignal {
  id: string;
  signal_id: string;
  symbol: string;
  signal_type: 'buy' | 'sell';
  entry_price: number;
  take_profit: number;
  stop_loss: number;
  status: 'active' | 'closed' | 'cancelled';
  copied_at: string;
  trade_url?: string;
}

export const useCopiedSignals = () => {
  const [copiedSignals, setCopiedSignals] = useState<CopiedSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchCopiedSignals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/signals/copied');
      setCopiedSignals(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user signals');
    } finally {
      setLoading(false);
    }
  }, []);

  const copySignal = async (signalId: string, openTradeNow: boolean = false) => {
    try {
      const result = await api.post(`/api/signals/${signalId}/copy`, { open_trade_now: openTradeNow });
      if (result.success) {
        if (openTradeNow && result.trade_url) {
          router.push(result.trade_url);
        } else {
          await fetchCopiedSignals();
        }
        return { success: true };
      }
      return { success: false, error: 'Failed' };
    } catch (err: any) {
      console.error('Failed to copy signal:', err);
      return { success: false, error: err.message };
    }
  };

  const cancelCopy = async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/api/signals/copied/${id}`);
      setCopiedSignals(prev => prev.filter(s => s.id !== id));
      return true;
    } catch (err: any) {
      console.error('Failed to cancel copied signal:', err);
      setError(err.message || 'Failed to cancel signal');
      return false;
    }
  };

  useEffect(() => {
    fetchCopiedSignals();
  }, [fetchCopiedSignals]);

  return { copiedSignals, loading, error, copySignal, cancelCopy, refresh: fetchCopiedSignals };
};
