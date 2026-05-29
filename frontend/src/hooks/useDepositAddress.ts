// Hook to fetch deposit address data for deposit modal
import { useEffect, useRef, useState } from 'react';
import { fetchDepositAddress, type DepositAddressResponse } from '@/lib/fundsApi';

const DEPOSIT_NOT_AVAILABLE =
  'Deposit address for this network is not available yet. Please contact support.';

export function useDepositAddress({
  isOpen,
  userId,
  asset,
  network,
}: {
  isOpen: boolean;
  userId: string;
  asset: string;
  network: string;
}): {
  loading: boolean;
  addressData: DepositAddressResponse | null;
  error: string | null;
} {
  const cacheRef = useRef<Record<string, DepositAddressResponse>>({});
  const [loading, setLoading] = useState(false);
  const [addressData, setAddressData] = useState<DepositAddressResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
      setAddressData(null);
      setError(null);
      return;
    }

    if (!asset || !network) {
      setAddressData(null);
      setError(null);
      setLoading(false);
      return;
    }

    const key = `${userId}|${asset}|${network}`;
    const cached = cacheRef.current[key];
    if (cached) {
      setAddressData(cached);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setAddressData(null);

    fetchDepositAddress({ userId, asset, network })
      .then((res) => {
        if (cancelled) return;
        cacheRef.current[key] = res;
        setAddressData(res);
      })
      .catch((err: any) => {
        if (cancelled) return;
        const msg = String(err?.message || '');
        if (!msg || msg.toLowerCase().includes('not available') || msg.toLowerCase().includes('404')) {
          setError(DEPOSIT_NOT_AVAILABLE);
        } else {
          setError(msg);
        }
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, userId, asset, network]);

  return { loading, addressData, error };
}

