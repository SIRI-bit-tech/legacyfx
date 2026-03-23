// Hook for fetching and subscribing to user balances
import { useState, useEffect, useRef } from 'react';
import { useAblyClient } from './useAblyClient';
import { useAuth } from './useAuth';

export interface Balance {
  asset: string;
  total_balance: number;
  available: number;
  in_order: number;
}

interface FundsData {
  balances: Balance[];
  loading: boolean;
  error: string | null;
}

export function useFunds(userId?: string) {
  const [data, setData] = useState<FundsData>({
    balances: [],
    loading: true,
    error: null,
  });

  const { channel } = useAblyClient();
  const { user } = useAuth();
  const channelRef = useRef<any>(null);
  const effectiveUserId = userId || user?.id;
  const hasFetchedOnce = useRef(false);

  useEffect(() => {
    if (!effectiveUserId) {
      setData({ balances: [], loading: false, error: 'User not authenticated' });
      return;
    }

    // Only fetch once, not on every re-render
    if (!hasFetchedOnce.current) {
      hasFetchedOnce.current = true;
      fetchFunds();
    }

    let mounted = true;

    // Initial fetch
    fetchFunds();

    // Subscribe to Ably channel for real-time balance updates
    if (channel) {
      const channelName = `funds:${effectiveUserId}`;
      const ablyChannel = channel(channelName);

      if (ablyChannel) {
        channelRef.current = ablyChannel;

        channelRef.current.subscribe('update', (message: any) => {
          if (!mounted) return;

          // Only refetch if this is not a self-triggered update
          // This prevents infinite loop when balance updates trigger fetch
          if (message.source !== 'initial-fetch') {
            fetchFunds();
          }
        });
      }
    }

    return () => {
      mounted = false;
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [effectiveUserId, channel]);

  const fetchFunds = async () => {
    if (!effectiveUserId) return;

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/trading/funds`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch funds');

      const balances = await response.json();

      setData({
        balances: balances || [],
        loading: false,
        error: null,
      });

      // Notify Ably channel that initial fetch is complete
      if (channelRef.current && hasFetchedOnce.current) {
        channelRef.current.publish('update', {
          source: 'initial-fetch',
          data: balances
        });
      }
    } catch (err) {
      console.error('Error fetching funds:', err);
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load balances',
      }));
    }
  };

  return { ...data, refresh: fetchFunds };
}
