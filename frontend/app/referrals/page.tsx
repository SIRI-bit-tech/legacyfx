'use client';

import { DashboardLayout } from '../dashboard-layout';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export default function ReferralsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferralStats();
  }, []);

  const loadReferralStats = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.REFERRALS.STATS);
      setStats(res);
    } catch (err) {
      console.error('Failed to load referral stats:', err);
      // Set default stats on error
      setStats({
        referral_code: 'LEGACY_TRADER_123',
        total_referrals: 0,
        active_referrals: 0,
        total_earnings: 0,
        referral_link: ''
      });
    } finally {
      setLoading(false);
    }
  };

  const referralCode = 'LEGACY_TRADER_123';
  const referralLink = `https://legacyfx.com/signup?ref=${referralCode}`;

  return (
    <DashboardLayout>
      <div className="p-4 md:p-10 max-w-5xl mx-auto">
        <header className="mb-12 text-center">
          <div className="w-20 h-20 bg-color-primary/10 text-color-primary rounded-full flex items-center justify-center text-4xl mb-6 mx-auto border border-color-primary/20">
             <i className="pi pi-users"></i>
          </div>
          <h1 className="text-4xl font-black text-text-primary mb-3">Earn with Friends</h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">Invite other professional traders to Legacy FX and earn life-time commissions on every trade they execute.</p>
        </header>

        {/* Share Section */}
        <div className="bg-bg-secondary border border-color-border p-8 rounded-3xl shadow-2xl mb-12 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-5">
              <i className="pi pi-megaphone text-[120px]"></i>
           </div>
           
           <h3 className="text-xl font-bold text-text-primary mb-6">Your Invitation Link</h3>
           <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 bg-bg-tertiary border border-color-border rounded-2xl px-6 py-4 flex items-center justify-between group">
                 <code className="text-color-primary font-mono text-sm break-all">{referralLink}</code>
                 <button 
                  onClick={() => navigator.clipboard.writeText(referralLink)}
                  className="text-text-tertiary hover:text-text-primary p-2 transition"
                 >
                    <i className="pi pi-copy"></i>
                 </button>
              </div>
              <button className="bg-color-primary hover:bg-color-primary-hover text-bg-primary px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition shadow-lg shadow-color-primary/20">
                 Share Now
              </button>
           </div>
           <p className="text-xs text-text-tertiary font-bold uppercase flex items-center gap-2">
              <i className="pi pi-info-circle"></i> Commissions are paid out daily in USDT
           </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
           {[
             { label: 'Total Referrals', value: stats?.referral_count || '0', icon: 'pi-user-plus', color: 'text-color-primary' },
             { label: 'Active Traders', value: '0', icon: 'pi-chart-line', color: 'text-color-success' },
             { label: 'Total Earnings', value: '$0.00', icon: 'pi-dollar', color: 'text-color-warning' },
           ].map((s, i) => (
             <div key={i} className="bg-bg-secondary border border-color-border p-8 rounded-2xl flex flex-col items-center text-center shadow-xl">
                <div className={`w-12 h-12 rounded-xl bg-bg-tertiary flex items-center justify-center text-xl mb-4 ${s.color}`}>
                   <i className={`pi ${s.icon}`}></i>
                </div>
                <p className="text-[10px] text-text-tertiary font-black uppercase tracking-widest mb-1">{s.label}</p>
                <p className="text-3xl font-black text-text-primary tracking-tight">{s.value}</p>
             </div>
           ))}
        </div>

        {/* How it Works */}
        <div className="space-y-8">
           <h2 className="text-2xl font-black text-text-primary text-center">Three Steps to Reward</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: 1, title: 'Send Invite', desc: 'Copy your unique link and share it with your network or social media channels.' },
                { step: 2, title: 'Registration', desc: 'Your referrals sign up and pass our institutional KYC verification process.' },
                { step: 3, title: 'Earn Lifetime', desc: 'Receive up to 40% of their trading fees as a rebate directly to your wallet.' },
              ].map((item) => (
                <div key={item.step} className="text-center group">
                   <div className="w-12 h-12 rounded-full border-2 border-color-border flex items-center justify-center font-black text-text-tertiary text-xl mb-4 mx-auto group-hover:border-color-primary group-hover:text-color-primary transition-all">
                      {item.step}
                   </div>
                   <h4 className="font-bold text-text-primary mb-2">{item.title}</h4>
                   <p className="text-xs text-text-tertiary leading-relaxed px-4">{item.desc}</p>
                </div>
              ))}
           </div>
        </div>

        {/* leaderboard Link */}
        <div className="mt-20 border-t border-color-border pt-12 flex flex-col md:flex-row items-center justify-between gap-6 px-4">
           <div>
              <h4 className="text-lg font-bold text-text-primary">Global Affiliate Program</h4>
              <p className="text-sm text-text-tertiary">Join our top 1% affiliates earning over $100k monthly.</p>
           </div>
           <button className="bg-bg-tertiary hover:bg-bg-primary border border-color-border text-text-primary px-8 py-3 rounded-2xl font-black text-xs uppercase transition tracking-widest">
              Join Elite Affiliates <i className="pi pi-chevron-right ml-2 text-[10px]"></i>
           </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
