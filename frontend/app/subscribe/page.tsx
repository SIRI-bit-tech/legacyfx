'use client';

import { DashboardLayout } from '../dashboard-layout';
import { useState } from 'react';

export default function SubscribePage() {
  const plans = [
    { 
      name: 'Starter', 
      price: 'Free', 
      tier: 'BASIC',
      features: ['Basic Trading', 'standard Support', 'Email Signals'], 
      recommended: false,
      icon: 'pi-user'
    },
    { 
      name: 'Pro Trader', 
      price: '$499/mo', 
      tier: 'SILVER',
      features: ['Priority Execution', '24/7 Support', 'Premium AI Signals', 'Reduced Fees (20%)'], 
      recommended: false, 
      icon: 'pi-bolt'
    },
    { 
      name: 'Elite VIP', 
      price: '$1,999/mo', 
      tier: 'GOLD',
      features: ['Institutional Liquidity', 'Personal Account Manager', 'Insider Signals', 'Zero Trading Fees', 'Exclusive Real Estate Access'], 
      recommended: true,
      icon: 'pi-star-fill'
    },
    { 
      name: 'Legacy Master', 
      price: '$4,999/mo', 
      tier: 'PLATINUM',
      features: ['All VIP Features', 'Private Jet Concierge Stubs', 'Annual Gala invites', 'Unlimited Copy Trading', 'Custom Portfolio Management'], 
      recommended: false,
      icon: 'pi-crown'
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-12 max-w-7xl mx-auto min-h-full flex flex-col items-center">
        <header className="text-center mb-16 max-w-3xl">
          <div className="inline-block px-4 py-1.5 rounded-full bg-color-primary/10 border border-color-primary/20 text-color-primary text-[10px] uppercase font-black tracking-widest mb-4">
            Memberships & Tiers
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-text-primary mb-6">Elevate Your Trading Experience</h1>
          <p className="text-text-secondary text-lg">Choose a plan that matches your goals. Get access to advanced signals, lower fees, and premium brokerage features.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
          {plans.map((plan) => (
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

              <div className="mb-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6 ${plan.recommended ? 'bg-color-primary text-bg-primary' : 'bg-bg-tertiary text-color-primary'}`}>
                  <i className={`pi ${plan.icon}`}></i>
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                   <span className="text-3xl font-black text-color-primary">{plan.price.split('/')[0]}</span>
                   {plan.price !== 'Free' && <span className="text-text-tertiary text-sm font-bold">/MO</span>}
                </div>
              </div>

              <div className="flex-1 space-y-4 mb-10">
                 <p className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Included Features</p>
                 {plan.features.map((feature, i) => (
                   <div key={i} className="flex items-start gap-3">
                      <i className="pi pi-check-circle text-color-success mt-0.5 shrink-0"></i>
                      <span className="text-sm text-text-secondary leading-tight">{feature}</span>
                   </div>
                 ))}
              </div>

              <button className={`w-full py-4 rounded-xl font-black transition-all shadow-lg ${
                plan.recommended 
                  ? 'bg-color-primary text-bg-primary hover:bg-color-primary-hover shadow-color-primary/20' 
                  : 'bg-bg-tertiary text-text-primary hover:bg-color-primary hover:text-bg-primary'
              }`}>
                {plan.price === 'Free' ? 'Current Plan' : `Upgrade to ${plan.tier}`}
              </button>
            </div>
          ))}
        </div>

        {/* Feature Comparison Link */}
        <div className="mt-20 text-center">
           <p className="text-text-tertiary text-sm mb-4">Need a custom enterprise solution?</p>
           <button className="text-color-primary font-bold flex items-center gap-2 mx-auto hover:underline p-2">
              Contact Sales <i className="pi pi-arrow-right"></i>
           </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
