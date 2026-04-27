// Hook for handling referral real-time notifications
import { useEffect } from 'react';
import { useAbly } from '@/hooks/useAbly';
import { toast } from 'react-hot-toast';

export const useReferralNotifications = (userId: string) => {
  useAbly(`referrals:${userId}`, (message: any) => {
    const data = message.data;
    
    switch (message.name) {
      case 'new_signup':
        toast.success('New referral! Someone signed up via your link', {
          duration: 5000,
          icon: '🎉',
        });
        break;
      
      case 'activation':
        toast.success('Referral activated! They made their first deposit', {
          duration: 5000,
          icon: '✅',
        });
        break;
      
      case 'commission_earned':
        toast.success(`Commission earned: +$${data.amount?.toFixed(2)} USDT`, {
          duration: 5000,
          icon: '💰',
        });
        break;
      
      case 'payout_completed':
        toast.success(`Payout received: $${data.amount?.toFixed(2)} credited to your balance`, {
          duration: 6000,
          icon: '💸',
        });
        break;
      
      case 'tier_upgraded':
        toast.success(`Tier upgraded! You're now Tier ${data.new_tier}`, {
          duration: 6000,
          icon: '🚀',
        });
        break;
    }
  });
};
