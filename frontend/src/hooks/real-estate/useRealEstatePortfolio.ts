import { useState, useEffect, useCallback } from 'react';
import { realEstateApi } from '@/services/real-estate/api';

export function useRealEstatePortfolio() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await realEstateApi.getPortfolio();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch portfolio');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  return { 
    investments: data?.investments || [],
    metrics: {
      totalValue: Number(data?.total_value || 0),
      activeCount: Number(data?.active_count || 0),
      monthlyIncome: Number(data?.monthly_income || 0),
      avgRoi: Number(data?.avg_roi || 0)
    },
    loading, 
    error, 
    refresh: fetchPortfolio 
  };
}
