// Live portfolio assets hook used by Assets page and Trade Funds tab
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useAblyClient } from './useAblyClient';
import { useAuth } from './useAuth';

type RawAsset = {
  symbol: string;
  name: string;
  total: number;
  available: number;
  inOrders: number;
};

export type PortfolioAsset = {
  symbol: string;
  name: string;
  total: number;
  available: number;
  inOrders: number;
  price: number;
  change24h: number;
  usdValue: number;
  allocationPercent: number;
};

type PriceUpdate = {
  price?: number;
  change24h?: number;
};

export function usePortfolioAssets(userId?: string): {
  assets: PortfolioAsset[];
  loading: boolean;
  error: string | null;
} {
  const { channel: getChannel, isConnected } = useAblyClient();
  const { user, loading: authLoading } = useAuth();
  const effectiveUserId = userId || user?.id;

  const getChannelRef = useRef(getChannel);
  useEffect(() => {
    getChannelRef.current = getChannel;
  }, [getChannel]);

  const [rawAssets, setRawAssets] = useState<RawAsset[]>([]);
  const [priceMap, setPriceMap] = useState<Record<string, PriceUpdate>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const symbols = useMemo(() => rawAssets.map((a) => a.symbol), [rawAssets]);

  // 1) Fetch portfolio assets + tell backend to start price broadcasting.
  useEffect(() => {
    if (!effectiveUserId) {
      setRawAssets([]);
      setPriceMap({});
      setLoading(authLoading);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const run = async () => {
      try {
        const res = await api.get(`/funds/assets?userId=${encodeURIComponent(effectiveUserId)}`);
        const list: RawAsset[] = (res?.assets || []).map((a: any) => ({
          symbol: String(a.symbol),
          name: String(a.name || a.symbol),
          total: Number(a.total || 0),
          available: Number(a.available || 0),
          inOrders: Number(a.inOrders || 0),
        }));

        if (cancelled) return;
        setRawAssets(list);
        const initialPriceMap: Record<string, PriceUpdate> = {};
        const symbolsToSubscribe: string[] = [];

        list.forEach((a) => {
          if (a.symbol === 'USD') {
            initialPriceMap[a.symbol] = { price: 1, change24h: 0 };
            return;
          }
          symbolsToSubscribe.push(a.symbol);
        });

        setPriceMap(initialPriceMap);

        if (symbolsToSubscribe.length > 0) {
          await api.post('/prices/subscribe', { userId: effectiveUserId, symbols: symbolsToSubscribe });
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(String(err?.message || 'Failed to load portfolio assets'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [effectiveUserId, authLoading]);

  // 2) Subscribe to Ably price channels for each held asset.
  useEffect(() => {
    if (!effectiveUserId) return;
    if (!isConnected) return;
    if (symbols.length === 0) return;

    const channels = new Map<string, any>();
    const priceSymbols = symbols.filter((sym) => sym !== 'USD');
    if (priceSymbols.length === 0) return;

    priceSymbols.forEach((sym) => {
      const channelName = `prices:${sym}`;
      const ch = getChannelRef.current(channelName);
      if (!ch) return;

      const handler = (message: any) => {
        const data: PriceUpdate = message?.data || {};
        setPriceMap((prev) => ({
          ...prev,
          [sym]: {
            price: data.price !== undefined ? Number(data.price) : prev[sym]?.price,
            change24h: data.change24h !== undefined ? Number(data.change24h) : prev[sym]?.change24h,
          },
        }));
      };

      ch.subscribe('update', handler);
      channels.set(sym, ch);
    });

    // Cleanup
    return () => {
      channels.forEach((ch) => {
        try {
          ch.unsubscribe();
        } catch {
          // ignore
        }
      });
      // Best-effort backend cleanup. Backend may track subscribers per symbol.
      api.post('/prices/subscribe', { userId: effectiveUserId, symbols: priceSymbols, action: 'unsubscribe' }).catch(() => null);
    };
  }, [effectiveUserId, isConnected, symbols]);

  const assets = useMemo<PortfolioAsset[]>(() => {
    if (!rawAssets || rawAssets.length === 0) return [];

    const usdBySymbol: Record<string, number> = {};
    for (const a of rawAssets) {
      const price = priceMap[a.symbol]?.price ?? 0;
      usdBySymbol[a.symbol] = a.total * price;
    }

    const totalUsd = Object.values(usdBySymbol).reduce((acc, v) => acc + v, 0);

    return rawAssets.map((a) => {
      const price = priceMap[a.symbol]?.price ?? 0;
      const change24h = priceMap[a.symbol]?.change24h ?? 0;
      const usdValue = usdBySymbol[a.symbol] || 0;
      const allocationPercent = totalUsd > 0 ? (usdValue / totalUsd) * 100 : 0;

      return {
        symbol: a.symbol,
        name: a.name,
        total: a.total,
        available: a.available,
        inOrders: a.inOrders,
        price,
        change24h,
        usdValue,
        allocationPercent,
      };
    });
  }, [rawAssets, priceMap]);

  return { assets, loading, error };
}

