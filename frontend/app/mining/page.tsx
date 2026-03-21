'use client';

import { DashboardLayout } from '../dashboard-layout';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';
import { Zap, Server } from 'lucide-react';
import { MultiCoinStatsCard } from '@/components/mining/MultiCoinStatsCard';
import { ActiveMinerCard } from '@/components/mining/ActiveMinerCard';
import { MiningPlanCard } from '@/components/mining/MiningPlanCard';
import { SubscribeModal } from '@/components/mining/SubscribeModal';

export default function MiningPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [myMining, setMyMining] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadMiningData();
  }, []);

  const loadMiningData = async () => {
    try {
      const [plansRes, myRes] = await Promise.all([
        api.get(API_ENDPOINTS.MINING.PLANS).catch(() => []),
        api.get(API_ENDPOINTS.MINING.ACTIVE).catch(() => []),
      ]);
      setPlans(plansRes || []);
      setMyMining(myRes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanClick = (plan: any) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleSubscribeConfirm = async () => {
    if (!selectedPlan) return null;
    try {
      const result = await api.post(API_ENDPOINTS.MINING.SUBSCRIBE, { plan_id: selectedPlan.id });
      // Refresh local list to show the pending one
      loadMiningData();
      // Clear selected plan and close modal after successful subscription
      setSelectedPlan(null);
      setIsModalOpen(false);
      return result;
    } catch (err) {
      throw err;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-12">
        <header>
          <h1 className="text-4xl font-black text-text-primary mb-3">Multi-Coin Cloud Mining</h1>
          <p className="text-text-secondary text-lg max-w-2xl">
            Lease institutional-grade hardware power and start mining multiple cryptocurrencies with real-time network integration.
          </p>
        </header>

        {/* Multi-Coin Live Network Stats */}
        <MultiCoinStatsCard initialCoin="BTC" />

        {/* User's Active/Pending Miners */}
        {myMining.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-3">
              <Zap size={20} className="text-primary" />
              <span>My Mining Power</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myMining.map(sub => <ActiveMinerCard key={sub.id} sub={sub} />)}
            </div>
          </section>
        )}

        {/* Available Plans */}
        <section>
          <h2 className="text-xl font-bold text-text-primary mb-8 flex items-center gap-3">
            <Server size={20} className="text-primary" />
            <span>Available Mining Plans</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map(plan => (
              <MiningPlanCard 
                key={plan.id} 
                plan={plan} 
                onSubscribe={() => handlePlanClick(plan)}
              />
            ))}
            
            {/* Custom Plan Placeholder */}
            <div className="bg-card/20 border border-dashed border-border rounded-3xl p-8 flex flex-col items-center justify-center text-center opacity-70 hover:opacity-100 transition cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center text-2xl mb-4">
                <Server />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">Custom Package</h3>
              <p className="text-xs text-text-secondary">Tailor hashrate and duration for large enterprise allocations.</p>
            </div>
          </div>
        </section>

        {selectedPlan && (
          <SubscribeModal
            plan={selectedPlan}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedPlan(null);
            }}
            onConfirm={handleSubscribeConfirm}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
