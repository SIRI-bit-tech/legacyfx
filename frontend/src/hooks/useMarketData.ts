import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export function useMarketData() {
  const [prices, setPrices] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const data = await api.get(API_ENDPOINTS.MARKETS.PRICES);
        if (Array.isArray(data)) {
          const pricesMap: Record<string, number> = {};
          data.forEach((item: any) => {
            if (item.symbol) {
              pricesMap[item.symbol.toUpperCase()] = item.current_price;
            }
          });
          setPrices(pricesMap);
        }
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();

    // Refresh every 30 seconds
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  return { prices, loading, error };
}

export function usePrice(symbol: string) {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const data: any = await api.get(API_ENDPOINTS.MARKETS.PRICES);
        if (Array.isArray(data)) {
          const baseSymbol = symbol.replace('USDT', '').toUpperCase();
          const coin = data.find((c: any) => c.symbol.toUpperCase() === baseSymbol);
          if (coin && coin.current_price) {
            setPrice(coin.current_price);
          }
        }
      } catch (err) {
        console.error('Failed to fetch price:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 10000);
    return () => clearInterval(interval);
  }, [symbol]);

  return { price, loading };
}
