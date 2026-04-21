'use client';

import { DashboardLayout } from '../dashboard-layout';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function SubscribePage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);

  const plans = [
    { 
      id: 'plan_basic',
      name: 'Starter', 
      price: 'Free', 
      tier: 'BASIC',
      features: ['Multi-asset Dashboard', 'Market Data', 'Basic Wallet'], 
      recommended: false,
      icon: 'pi-user'
    },
    { 
      id: 'plan_pro',
      name: 'Pro Trader', 
      price: '$250', 
      tier: 'PRO',
      features: ['Unlock Mining', 'Priority Support', 'Reduced Fees'], 
      recommended: false, 
      icon: 'pi-bolt'
    },
    { 
      id: 'plan_elite',
      name: 'Elite VIP', 
      price: '$750', 
      tier: 'ELITE',
      features: ['Unlock Mining', 'Unlock Stake', 'Unlock Cold Storage', 'Zero Trading Fees'], 
      recommended: true,
      icon: 'pi-star-fill'
    },
    { 
      id: 'plan_legacy',
      name: 'Legacy Master', 
      price: '$1,500', 
      tier: 'LEGACY_MASTER',
      features: ['Unlock ALL Features', 'Copy Trading', 'Premium Signals', 'Real Estate Access', 'VIP Concierge'], 
      recommended: false,
      icon: 'pi-crown'
    },
  ];

  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      try {
        const info = await api.get('/subscriptions/info');
        if (mounted) setAdminInfo(info);
        
        // Fetch user's current subscription
        const sub = await api.get('/subscriptions/my-subscription');
        if (mounted) setCurrentSubscription(sub);
        
        // Refresh user data to get latest tier
        await refreshUser();
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };
    fetchData();
    
    return () => {
      mounted = false;
    };
  }, [refreshUser]);

  // Poll for subscription updates every 30 seconds if there's a pending subscription
  useEffect(() => {
    let mounted = true;
    
    if (currentSubscription?.status === 'PENDING') {
      const interval = setInterval(async () => {
        try {
          const sub = await api.get('/subscriptions/my-subscription');
          if (!mounted) return;
          
          setCurrentSubscription(sub);
          
          // If subscription status changed, refresh user data
          if (sub.status !== 'PENDING') {
            await refreshUser();
            
            // Show success message if approved
            if (sub.status === 'ACTIVE' && mounted) {
              setSuccessMessage(`Congratulations! Your ${sub.plan_name || 'subscription'} has been approved and is now active!`);
            }
          }
        } catch (err) {
          console.error("Failed to poll subscription status", err);
        }
      }, 30000); // 30 seconds

      return () => {
        mounted = false;
        clearInterval(interval);
      };
    }
  }, [currentSubscription?.status, refreshUser]);

  const handleUpgradeClick = (plan: any) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    try {
      const response = await api.post('/subscriptions/subscribe', { plan_id: selectedPlan.id });
      setSuccessMessage(response.message || "Your payment is pending. You will be notified once the payment is confirmed, and an email will be sent to you.");
      setShowPaymentModal(false);
      
      // Refresh subscription status and user data
      const sub = await api.get('/subscriptions/my-subscription');
      setCurrentSubscription(sub);
      await refreshUser();
    } catch (err: any) {
      alert(err.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const getPlanStatus = (plan: any) => {
    if (!user) return null;
    
    // Check if user has pending subscription for THIS specific plan tier
    if (currentSubscription?.status === 'PENDING' && currentSubscription?.plan_tier === plan.tier) {
      return 'PENDING';
    }
    
    // Check if user has active subscription for this plan tier
    if (currentSubscription?.status === 'ACTIVE' && currentSubscription?.plan_tier === plan.tier) {
      return 'ACTIVE';
    }
    
    // Check if user has ANY pending subscription (to disable other plans)
    if (currentSubscription?.status === 'PENDING') {
      return 'DISABLED';
    }
    
    // For BASIC plan: only show "Current Plan" if it's actually the user's tier
    if (plan.tier === 'BASIC') {
      if (user.tier === 'BASIC') {
        return 'CURRENT';
      }
    }
    
    // For higher tiers: show "Current Plan" if user has that tier
    if (user.tier === plan.tier && user.tier !== 'BASIC') {
      return 'CURRENT';
    }
    
    return 'AVAILABLE';
  };

  const getButtonText = (plan: any) => {
    const status = getPlanStatus(plan);
    
    if (status === 'ACTIVE') return 'Current Plan';
    if (status === 'PENDING') return 'Payment Pending';
    if (status === 'CURRENT') return 'Current Plan';
    if (status === 'DISABLED') return `Upgrade to ${plan.tier.replace('_', ' ')}`;
    
    return `Upgrade to ${plan.tier.replace('_', ' ')}`;
  };

  const isButtonDisabled = (plan: any) => {
    const status = getPlanStatus(plan);
    return status === 'ACTIVE' || status === 'PENDING' || status === 'DISABLED' || status === 'CURRENT';
  };

  const shouldShowButton = (plan: any) => {
    const status = getPlanStatus(plan);
    // Always show buttons for all valid statuses
    return status !== null;
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-12 max-w-7xl mx-auto min-h-full flex flex-col items-center">
        {successMessage && (
          <div className="w-full max-w-2xl mb-8 p-4 rounded-xl bg-color-success/10 border border-color-success/20 text-color-success font-bold text-center">
            {successMessage}
          </div>
        )}

        <header className="text-center mb-16 max-w-3xl">
          <div className="inline-block px-4 py-1.5 rounded-full bg-color-primary/10 border border-color-primary/20 text-color-primary text-[10px] uppercase font-black tracking-widest mb-4">
            Memberships & Tiers
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-text-primary mb-6">Elevate Your Trading Experience</h1>
          <p className="text-text-secondary text-lg mb-4">Choose a plan that matches your goals. Get access to advanced signals, lower fees, and premium brokerage features.</p>
          
          {currentSubscription?.status === 'PENDING' && (
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="animate-pulse flex items-center gap-2 text-yellow-500 text-sm font-bold">
                <i className="pi pi-spin pi-spinner"></i>
                Payment pending approval...
              </div>
              <button
                onClick={async () => {
                  try {
                    const sub = await api.get('/subscriptions/my-subscription');
                    setCurrentSubscription(sub);
                    await refreshUser();
                    
                    if (sub.status === 'ACTIVE') {
                      setSuccessMessage(`Congratulations! Your ${sub.plan_name || 'subscription'} has been approved and is now active!`);
                    }
                  } catch (err) {
                    console.error("Failed to refresh", err);
                  }
                }}
                className="px-3 py-1 bg-color-primary text-bg-primary rounded-lg text-xs font-bold hover:opacity-90 transition"
              >
                Check Status
              </button>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
          {plans.map((plan) => {
            const status = getPlanStatus(plan);
            
            return (
              <div 
                key={plan.name} 
                className={`relative bg-bg-secondary border rounded-3xl p-8 flex flex-col transition-all duration-300 hover:scale-[1.02] ${
                  plan.recommended 
                    ? 'border-color-primary shadow-2xl shadow-color-primary/10 ring-1 ring-color-primary' 
                    : 'border-color-border hover:border-color-primary/30'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-color-primary text-bg-primary px-6 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">
                    Most Popular
                  </div>
                )}
                
                {status === 'ACTIVE' && (
                  <div className="absolute -top-4 right-4 bg-color-success text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">
                    Active
                  </div>
                )}
                
                {status === 'PENDING' && (
                  <div className="absolute -top-4 right-4 bg-yellow-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg animate-pulse">
                    Pending
                  </div>
                )}

                <div className="mb-8">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6 ${plan.recommended ? 'bg-color-primary text-bg-primary' : 'bg-bg-tertiary text-color-primary'}`}>
                    <i className={`pi ${plan.icon}`}></i>
                  </div>
                  <h3 className="text-2xl font-bold text-text-primary mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                     <span className="text-3xl font-black text-color-primary">{plan.price}</span>
                     {plan.price !== 'Free' && <span className="text-text-tertiary text-sm font-bold">LIFETIME</span>}
                  </div>
                </div>

                <div className="flex-1 space-y-4 mb-10">
                   <p className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Included Features</p>
                   {plan.features.map((feature) => (
                     <div key={feature} className="flex items-start gap-3">
                        <i className="pi pi-check-circle text-color-success mt-0.5 shrink-0"></i>
                        <span className="text-sm text-text-secondary leading-tight">{feature}</span>
                     </div>
                   ))}
                </div>

                {shouldShowButton(plan) && (
                  <button 
                    onClick={() => !isButtonDisabled(plan) && handleUpgradeClick(plan)}
                    disabled={isButtonDisabled(plan)}
                    className={`w-full py-4 rounded-xl font-black transition-all shadow-lg ${
                      isButtonDisabled(plan)
                        ? 'bg-bg-tertiary text-text-tertiary cursor-not-allowed'
                        : plan.recommended 
                          ? 'bg-color-primary text-bg-primary hover:bg-color-primary-hover shadow-color-primary/20' 
                          : 'bg-bg-tertiary text-text-primary hover:bg-color-primary hover:text-bg-primary'
                    }`}
                  >
                    {getButtonText(plan)}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal for Payment Details */}
        {showPaymentModal && selectedPlan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg-primary/95 backdrop-blur-sm">
            <div className="bg-bg-secondary w-full max-w-md rounded-3xl border border-color-border p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-text-primary mb-2">Upgrade to {selectedPlan.name}</h2>
              <p className="text-text-secondary text-sm mb-6">Complete your payment of <span className="text-color-primary font-bold">{selectedPlan.price}</span> to the wallet address below.</p>
              
              <div className="space-y-4 mb-8 bg-bg-tertiary p-6 rounded-2xl border border-color-border">
                {adminInfo?.subscription_wallet_qr && (
                  <div className="flex flex-col items-center justify-center pb-4 mb-4 border-b border-color-border/30">
                    <div className="bg-white p-2 rounded-xl mb-2">
                       <img src={adminInfo.subscription_wallet_qr} alt="Payment QR" className="w-32 h-32 object-contain" />
                    </div>
                    <p className="text-[9px] text-text-tertiary uppercase font-black">Scan to pay</p>
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-black uppercase text-text-tertiary block mb-1">Official Payment Address</span>
                  <p className="text-xs font-mono text-text-primary break-all bg-bg-secondary p-3 rounded-lg border border-color-border border-dashed">
                    {adminInfo?.subscription_wallet_address || 'Fetching...'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-text-tertiary block mb-1">Network / Wallet ID</span>
                  <p className="text-xs font-bold text-color-primary">
                    {adminInfo?.subscription_wallet_id || 'Fetching...'}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-3 rounded-xl bg-bg-tertiary text-text-primary font-bold hover:bg-bg-elevated transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmPayment}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-color-primary text-bg-primary font-black hover:bg-color-primary-hover transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <i className="pi pi-spin pi-spinner"></i> : "I've made payment"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
