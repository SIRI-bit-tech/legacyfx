// Referral API service
import { api } from '@/lib/api';

export const referralsApi = {
  getStats: () => api.get('/referrals/stats'),
  
  getReferredUsers: (params: { page?: number; limit?: number; status?: string }) => 
    api.get('/referrals/referred-users', { params }),
  
  getCommissions: (params: { page?: number; limit?: number; status?: string }) =>
    api.get('/referrals/commissions', { params }),
  
  getPayouts: async (params: { page?: number; limit?: number }) => {
    const response = await api.get('/referrals/payouts', { params });
    return {
      ...response,
      payouts: (response.payouts || []).map((payout: any) => ({
        ...payout,
        amount: Number(payout.total_amount),
        created_at: payout.payout_date,
        transaction_hash: null
      }))
    };
  },
  
  getLeaderboard: () => api.get('/referrals/leaderboard'),
};
