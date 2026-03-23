// Hook for fetching and subscribing to live price statistics
import { useState, useEffect, useRef } from 'react';
import { useAblyClient } from './useAblyClient';
import { useAuth } from './useAuth';

interface TopBarStats {
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  loading: boolean;
  error: string | null;
}

export function useTopBarStats(symbol: string, type: 'crypto' | 'forex' | 'stock' = 'crypto') {
  const [stats, setStats] = useState<TopBarStats>({
    price: 0,
    change24h: 0,
    high24h: 0,
    low24h: 0,
    volume24h: 0,
    loading: true,
    error: null,
  });

  const { channel, isConnected } = useAblyClient();
  const { isAuthenticated } = useAuth();
  const channelRef = useRef<any>(null);
  const subscribedSymbolRef = useRef<string | null>(null);

  useEffect(() => {
    if (!symbol || !channel || !isConnected) return;

    let mounted = true;

    // Notify backend that we're subscribing to this symbol
    const notifySubscribe = async () => {
      if (subscribedSymbolRef.current === symbol) return;

      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/ably/subscribe-symbol`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
          credentials: 'include',
          body: JSON.stringify({ symbol, action: 'subscribe' }),
        });
        subscribedSymbolRef.current = symbol;
      } catch (err) {
        console.error('Error notifying backend:', err);
      }
    };

    notifySubscribe();

    // Subscribe to Ably channel for live updates
    const channelName = `prices:${symbol}`;
    const ablyChannel = channel(channelName);

    if (!ablyChannel) {
      console.warn('Ably channel not available yet');
      return;
    }

    channelRef.current = ablyChannel;

    channelRef.current.subscribe('update', (message: any) => {
      if (!mounted) return;

      const data = message.data;
      setStats({
        price: data.price || 0,
        change24h: data.change24h || 0,
        high24h: data.high24h || 0,
        low24h: data.low24h || 0,
        volume24h: data.volume24h || 0,
        loading: false,
        error: null,
      });
    });

    return () => {
      mounted = false;

      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }

      // Notify backend that we're unsubscribing
      if (subscribedSymbolRef.current === symbol) {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/ably/subscribe-symbol`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
          credentials: 'include',
          body: JSON.stringify({ symbol, action: 'unsubscribe' }),
        }).catch(err => console.error('Error notifying backend:', err));

        subscribedSymbolRef.current = null;
      }
    };
  }, [symbol, type, channel]);

  return stats;
}
