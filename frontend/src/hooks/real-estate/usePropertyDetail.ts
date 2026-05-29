import { useState, useEffect, useCallback } from 'react';
import { realEstateApi } from '@/services/real-estate/api';

export function usePropertyDetail(propertyId: string | null) {
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProperty = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await realEstateApi.getProperty(propertyId);
      setProperty(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch property details');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  return { property, loading, error, refresh: fetchProperty };
}
