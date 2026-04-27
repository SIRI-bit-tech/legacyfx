import { api } from '@/lib/api';

export const realEstateApi = {
  getListings: async (filters: any) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.type) params.append('type', filters.type);
    if (filters.city) params.append('city', filters.city);
    if (filters.property_type) params.append('property_type', filters.property_type);
    if (filters.min_beds) params.append('min_beds', filters.min_beds.toString());
    if (filters.min_price) params.append('min_price', filters.min_price.toString());
    if (filters.max_price) params.append('max_price', filters.max_price.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/real-estate/listings?${queryString}` : '/real-estate/listings';
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
