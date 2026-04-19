// Referral API service
import { api } from '@/lib/api';

export const referralsApi = {
  getStats: () => api.get('/referrals/stats'),
  
  getReferredUsers: (params: { page?: number; limit?: number; status?: string }) => 
    api.get('/referrals/referred-users', { params }),
  
  getCommissions: (params: { page?: number; limit?: number; status?: string }) =>
    api.get('/referrals/commissions', { params }),
  
  getPayouts: (params: { page?: number; limit?: number }) =>
    api.get('/referrals/payouts', { params }),
  
  getLeaderboard: () => api.get('/referrals/leaderboard'),
};
