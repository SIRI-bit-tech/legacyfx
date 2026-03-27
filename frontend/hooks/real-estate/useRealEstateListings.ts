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

  // Fetch logic
  const fetchListings = useCallback(async (pageNum: number, currentFilters: any) => {
    setLoading(true);
    setError(null);
    try {
      // Map priceRange string to numeric min/max for the API
      let minPrice: number | undefined;
      let maxPrice: number | undefined;

      if (currentFilters.priceRange === 'under100k') {
        maxPrice = 100000;
      } else if (currentFilters.priceRange === '100k-300k') {
        minPrice = 100000;
        maxPrice = 300000;
      } else if (currentFilters.priceRange === '300k-500k') {
        minPrice = 300000;
        maxPrice = 500000;
      } else if (currentFilters.priceRange === '500kplus') {
        minPrice = 500000;
      }

      const apiParams: any = {
        type: currentFilters.type === 'all' ? undefined : currentFilters.type,
        city: currentFilters.city || undefined,
        property_type: currentFilters.property_type === 'any' ? undefined : currentFilters.property_type,
        min_beds: currentFilters.min_beds === 'any' ? undefined : Number.parseInt(currentFilters.min_beds),
        min_price: minPrice,
        max_price: maxPrice,
        search: currentFilters.search || undefined,
        page: pageNum,
        limit: 8
      };

      const res = await realEstateApi.getListings(apiParams);

      setListings(res.listings || []);
      setHasMore(res.has_more);
      setTotal(res.total);
      setPage(pageNum);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced Effect for live search (Location / Keyword)
  useEffect(() => {
    const isTextSearch = filters.city?.length > 0 || filters.search?.length > 0;
    const timeout = setTimeout(() => {
      fetchListings(1, filters);
    }, isTextSearch ? 500 : 0); // 500ms debounce for typing, immediate for dropdowns

    return () => clearTimeout(timeout);
  }, [filters, fetchListings]);

  const updateFilters = (newFilters: any) => {
    setFilters((prev: any) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const goToPage = (pageNum: number) => {
    if (!loading) {
      fetchListings(pageNum, filters);
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
    refresh: () => fetchListings(page, filters)
  };
}
