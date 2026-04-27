// Hook for subscribing to live order book updates
import { useState, useEffect, useRef } from 'react';
import { useAblyClient } from './useAblyClient';
import { toKuCoin } from '@/utils/symbolFormat';

export interface OrderBookLevel {
  price: number;
  quantity: number;
  total?: number;
}

interface OrderBookData {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  loading: boolean;
  error: string | null;
}

export function useOrderBook(symbol: string) {
  const [orderBook, setOrderBook] = useState<OrderBookData>({
    bids: [],
    asks: [],
    loading: true,
    error: null,
  });

  const { channel: getChannel, isConnected } = useAblyClient();
  const channelRef = useRef<any>(null);
  const notifiedRef = useRef<boolean>(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const getChannelRef = useRef(getChannel);

  // Keep the latest getter without re-triggering the subscription effect.
  useEffect(() => {
    getChannelRef.current = getChannel;
  }, [getChannel]);

  useEffect(() => {
    if (!symbol) return;

    // Wait for Ably to connect before proceeding
    if (!isConnected) {
      console.log('Waiting for Ably connection...');
      return;
    }

    if (!getChannelRef.current) return;

    let mounted = true;
    const normalized = symbol.replaceAll(/[-\\/]/g, '').toUpperCase();

    // Forex presets used by the TradeTopBar dropdown.
    const forexSymbols = new Set(['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'USDCAD', 'AUDUSD', 'NZDUSD']);

    // Crypto quote assets we convert to KuCoin format.
    const cryptoQuotes = ['USDT', 'USDC', 'BTC', 'ETH', 'BNB', 'USD'];
    const isForex = forexSymbols.has(normalized);
    const isCrypto = !isForex && cryptoQuotes.some((q) => normalized.endsWith(q));

    // Backend publishes:
    // - crypto order books to: orderbook:{KUCOIN_SYMBOL}
    // - forex/stocks synthetic order books to: orderbook:{RAW_SYMBOL}
    const orderbookChannelKey = isCrypto ? toKuCoin(normalized) : normalized;

    // Reset UI state for the new subscription.
    setOrderBook({
      bids: [],
      asks: [],
      loading: true,
      error: null,
    });

    // Set a timeout to stop loading after 5 seconds even if no data received
    loadingTimeoutRef.current = setTimeout(() => {
      if (mounted) {
        setOrderBook(prev => ({
          ...prev,
          loading: false,
          error: 'No data available now'
        }));
      }
    }, 5000);

    const normalizedForRequest = symbol.replaceAll(/[-/]/g, '').toUpperCase();

    // Notify backend that we're subscribing to this symbol's order book
    const notifySubscribe = async () => {
      if (notifiedRef.current) return;

      const token = globalThis.window === undefined ? null : localStorage.getItem('access_token');

      if (!token) {
        console.warn('No access token available for order book subscription');
        return;
      }

      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/ably/subscribe-orderbook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
          body: JSON.stringify({ symbol: normalizedForRequest, action: 'subscribe' }),
        });
        notifiedRef.current = true;
      } catch (err) {
        console.error('Error notifying backend:', err);
      }
    };

    notifySubscribe();

    // Subscribe to Ably channel for order book updates.
    // Backend broadcasts on KuCoin-formatted symbol channel: orderbook:{BTC-USDT}
    const channelName = `orderbook:${orderbookChannelKey}`;
    const ablyChannel = getChannelRef.current(channelName);

    if (!ablyChannel) {
      console.warn('Ably channel not available yet');
      return;
    }

    channelRef.current = ablyChannel;

    // Handle snapshot (full order book)
    channelRef.current.subscribe('snapshot', (message: any) => {
      if (!mounted) return;

      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      const data = message.data;
      setOrderBook({
        bids: data.bids || [],
        asks: data.asks || [],
        loading: false,
        error: null,
      });
    });

    // Handle incremental updates
    channelRef.current.subscribe('update', (message: any) => {
      if (!mounted) return;

      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      const data = message.data;
      setOrderBook(prev => ({
        ...prev,
        bids: data.bids || prev.bids,
        asks: data.asks || prev.asks,
        loading: false,
      }));
    });

    return () => {
      mounted = false;

      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }

      // Notify backend that we're unsubscribing
      if (notifiedRef.current) {
        const token = globalThis.window === undefined ? null : localStorage.getItem('access_token');
        if (token) {
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/ably/subscribe-orderbook`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
            body: JSON.stringify({ symbol: normalizedForRequest, action: 'unsubscribe' }),
          }).catch(err => console.error('Error notifying backend:', err));
        }

        notifiedRef.current = false;
      }
    };
  }, [symbol, isConnected]);

  return orderBook;
}
