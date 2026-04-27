// Live portfolio summary hook used by Assets and Dashboard
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useAblyClient } from './useAblyClient';
import { useAuth } from './useAuth';

export type PortfolioSummary = {
  netWorth: number;
  available: number;
  inOrders: number;
  unrealisedPnl: number;
  pnlPercent: number;
  change24h: number;
  openOrdersCount: number;
  loading: boolean;
  error: string | null;
};

export function usePortfolioSummary(userId?: string): PortfolioSummary {
  const { channel: getChannel, isConnected } = useAblyClient();
  const { user, loading: authLoading } = useAuth();
  const effectiveUserId = userId || user?.id;

  const getChannelRef = useRef(getChannel);
  useEffect(() => {
    getChannelRef.current = getChannel;
  }, [getChannel]);

  const [summary, setSummary] = useState<PortfolioSummary>({
    netWorth: 0,
    available: 0,
    inOrders: 0,
    unrealisedPnl: 0,
    pnlPercent: 0,
    change24h: 0,
    openOrdersCount: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!effectiveUserId) {
      setSummary((prev) => ({
        ...prev,
        loading: authLoading,
        error: null,
      }));
      return;
    }

    let cancelled = false;

    const fetchSummary = async () => {
      try {
        const res = await api.get(`/funds/summary?userId=${encodeURIComponent(effectiveUserId)}`);
        if (cancelled) return;
        setSummary({
          netWorth: Number(res.netWorth || 0),
          available: Number(res.available || 0),
          inOrders: Number(res.inOrders || 0),
          unrealisedPnl: Number(res.unrealisedPnl || 0),
          pnlPercent: Number(res.pnlPercent || 0),
          change24h: Number(res.change24h || 0),
          openOrdersCount: Number(res.openOrdersCount || 0),
          loading: false,
          error: null,
        });
      } catch (err: any) {
        if (cancelled) return;
        setSummary((prev) => ({
          ...prev,
          loading: false,
          error: String(err?.message || 'Failed to load portfolio summary'),
        }));
      }
    };

    // Initial fetch
    setSummary((prev) => ({ ...prev, loading: true, error: null }));
    fetchSummary();

    // Ably subscription
    if (isConnected) {
      const channelName = `funds:${effectiveUserId}`;
      const ch = getChannelRef.current(channelName);
      if (ch) {
        const handler = () => fetchSummary();
        ch.subscribe('update', handler);

        return () => {
          cancelled = true;
          ch.unsubscribe();
        };
      }
    }

    return () => {
      cancelled = true;
    };
  }, [effectiveUserId, isConnected, authLoading]);

  return summary;
}

