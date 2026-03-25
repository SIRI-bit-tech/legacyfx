import { useState, useEffect, useCallback } from 'react';
import { realEstateApi } from '@/services/real-estate/api';

export function useRealEstateListings(initialFilters: any = {}) {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  
  // Set explicit defaults for filters to ensure select boxes have a value
  const [filters, setFilters] = useState({ 
    type: 'all', 
    priceRange: 'any',
    property_type: 'any',
    min_beds: 'any',
    city: '',
    search: '',
    ...initialFilters, 
    limit: 8 
  });

  const fetchListings = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await realEstateApi.getListings({
        ...filters,
        page: pageNum,
        limit: 8
      });
      
      setListings(res.listings || []);
      setHasMore(res.has_more);
      setTotal(res.total);
      setPage(pageNum);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchListings(1);
  }, [filters, fetchListings]);

  const updateFilters = (newFilters: any) => {
    setFilters((prev: any) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const goToPage = (pageNum: number) => {
    if (!loading) {
      fetchListings(pageNum);
    }
  };

  return { 
    listings, 
    loading, 
    error, 
    filters, 
    page, 
    total, 
    hasMore, 
    updateFilters, 
    goToPage, 
    refresh: () => fetchListings(page) 
  };
}
