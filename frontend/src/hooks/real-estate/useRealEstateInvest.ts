import { useState, useCallback, useRef } from 'react';
import { realEstateApi } from '@/services/real-estate/api';

export function useRealEstateInvest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const isSubmittingRef = useRef(false);

  const invest = useCallback(async (propertyId: string, amount: number, tokens: number) => {
    if (isSubmittingRef.current) return false;
    isSubmittingRef.current = true;

    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await realEstateApi.invest({ property_id: propertyId, amount, tokens });
      setSuccess(true);
      return true;
    } catch (err: any) {
      setError(err?.message || 'Investment failed');
      return false;
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  }, []);

  const exit = useCallback(async (investmentId: string) => {
    if (isSubmittingRef.current) return false;
    isSubmittingRef.current = true;

    setLoading(true);
    setError(null);
    try {
      await realEstateApi.exit(investmentId);
      return true;
    } catch (err: any) {
      setError(err?.message || 'Exit failed');
      return false;
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  }, []);

  return { invest, exit, loading, error, success, reset: () => setSuccess(false) };
}
