<<<<<<< Updated upstream
import { useState, useEffect, useCallback } from 'react';
=======
import { useState, useEffect, useCallback, useRef } from 'react';
>>>>>>> Stashed changes
import { realEstateApi } from '@/services/real-estate/api';

export function useRealEstateListings(initialFilters: any = {}) {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  
<<<<<<< Updated upstream
  // Set explicit defaults for filters to ensure select boxes have a value
=======
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
  const fetchListings = useCallback(async (pageNum: number) => {
=======
  // Fetch logic
  const fetchListings = useCallback(async (pageNum: number, currentFilters: any) => {
>>>>>>> Stashed changes
    setLoading(true);
    setError(null);
    try {
      const res = await realEstateApi.getListings({
<<<<<<< Updated upstream
        ...filters,
=======
        ...currentFilters,
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
  }, [filters]);

  useEffect(() => {
    fetchListings(1);
=======
  }, []);

  // Debounced Effect for live search (Location / Keyword)
  useEffect(() => {
    const isTextSearch = filters.city?.length > 0 || filters.search?.length > 0;
    const timeout = setTimeout(() => {
      fetchListings(1, filters);
    }, isTextSearch ? 500 : 0); // 500ms debounce for typing, immediate for dropdowns

    return () => clearTimeout(timeout);
>>>>>>> Stashed changes
  }, [filters, fetchListings]);

  const updateFilters = (newFilters: any) => {
    setFilters((prev: any) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const goToPage = (pageNum: number) => {
    if (!loading) {
<<<<<<< Updated upstream
      fetchListings(pageNum);
=======
      fetchListings(pageNum, filters);
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    refresh: () => fetchListings(page) 
=======
    refresh: () => fetchListings(page, filters) 
>>>>>>> Stashed changes
  };
}
