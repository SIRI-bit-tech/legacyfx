import { api } from '@/lib/api';

export const realEstateApi = {
  getListings: async (filters: any) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.type) params.append('type', filters.type);
    if (filters.minPrice) params.append('min_price', filters.minPrice.toString());
    if (filters.maxPrice) params.append('max_price', filters.maxPrice.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const endpoint = `/real-estate/listings${queryString ? `?${queryString}` : ''}`;
    return api.get(endpoint);
  },
  
  getProperty: (id: string) => 
    api.get(`/real-estate/listings/${id}`),
  
  getPortfolio: async () => {
    return api.get('/real-estate/portfolio');
  },

  getMetrics: async () => {
    return api.get('/real-estate/metrics');
  },
  
  invest: (data: { property_id: string; amount: number; tokens: number }) => 
    api.post('/real-estate/invest', data),
  
  exit: (investmentId: string) => 
    api.post(`/real-estate/exit/${investmentId}`),
  
  getTransactions: (page: number = 1, limit: number = 10) => {
    return api.get(`/real-estate/transactions?page=${page}&limit=${limit}`);
  },
};
