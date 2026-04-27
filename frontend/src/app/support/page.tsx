'use client';

import { DashboardLayout } from '../dashboard-layout';
import { useState } from 'react';

export default function SupportPage() {
  const categories = [
    { title: 'Trading & Markets', icon: 'pi-chart-line', desc: 'Questions about orders, fees, and market availability.' },
    { title: 'Account & KYC', icon: 'pi-user', desc: 'Manage your profile, verification levels, and security.' },
    { title: 'Wallets & Transfers', icon: 'pi-wallet', desc: 'Help with deposits, withdrawals, and cold storage.' },
    { title: 'Institutional API', icon: 'pi-code', desc: 'Documentation for automated trading and webhooks.' },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-12 max-w-5xl mx-auto flex flex-col items-center">
        <header className="text-center mb-16 max-w-2xl">
          <h1 className="text-4xl font-black text-text-primary mb-4 tracking-tight">Concierge Support</h1>
          <p className="text-text-secondary text-lg">Our dedicated team is available 24/7 to assist with your institutional trading and asset management needs.</p>
        </header>

        {/* Search */}
        <div className="w-full max-w-2xl bg-bg-secondary border border-color-border p-2 rounded-2xl shadow-2xl mb-16">
           <div className="relative">
              <i className="pi pi-search absolute left-6 top-5 text-text-tertiary"></i>
              <input 
                type="text" 
                placeholder="Search for answers..." 
                className="w-full bg-transparent border-none focus:ring-0 text-lg py-4 pl-16 pr-6 outline-none text-text-primary"
              />
           </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-20">
           {categories.map((cat) => (
             <button key={cat.title} className="bg-bg-secondary border border-color-border p-8 rounded-3xl text-left hover:border-color-primary/50 transition group hover:bg-bg-tertiary">
                <div className="w-14 h-14 rounded-2xl bg-bg-tertiary flex items-center justify-center text-2xl text-text-tertiary group-hover:text-color-primary transition border border-color-border mb-6">
                   <i className={`pi ${cat.icon}`}></i>
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2 tracking-tight">{cat.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{cat.desc}</p>
             </button>
           ))}
        </div>

        {/* Live Contact Options */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { title: 'Live Chat', icon: 'pi-comments', label: 'Average wait: 2m', color: 'text-color-success' },
             { title: 'Priority Email', icon: 'pi-envelope', label: 'Response within 1h', color: 'text-color-info' },
             { title: 'Phone Concierge', icon: 'pi-phone', label: 'Elite Members Only', color: 'text-color-primary' },
           ].map((opt) => (
             <div key={opt.title} className="bg-bg-secondary border border-color-border p-8 rounded-3xl flex flex-col items-center text-center shadow-xl">
                <i className={`pi ${opt.icon} text-3xl mb-4 ${opt.color}`}></i>
                <h4 className="font-bold text-text-primary mb-1">{opt.title}</h4>
                <p className="text-[10px] text-text-tertiary font-black uppercase tracking-widest">{opt.label}</p>
             </div>
           ))}
        </div>

        {/* FAQ Preview */}
        <div className="mt-24 w-full border-t border-color-border pt-16">
           <h2 className="text-2xl font-black text-text-primary mb-10 text-center">Frequently Asked Questions</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {[
                { q: 'How long do withdrawals take?', a: 'Standard withdrawals are processed within 1-4 hours. Institutional cold storage takes 24h.' },
                { q: 'Is Legacy FX regulated?', a: 'Legacy FX operates under global financial compliance standards across 150+ countries.' },
                { q: 'What are the trading fees?', a: 'Fees vary by Tier level, ranging from 0.1% to 0% for our Elite members.' },
                { q: 'Can I connect a hardware wallet?', a: 'Yes, Ledger and Trezor are supported via our Web3 integration module.' },
              ].map((faq, i) => (
                <div key={i} className="space-y-2">
                   <h5 className="font-bold text-text-primary flex items-center gap-2">
                      <i className="pi pi-question-circle text-color-primary"></i> {faq.q}
                   </h5>
                   <p className="text-sm text-text-secondary leading-relaxed pl-6">{faq.a}</p>
                </div>
              ))}
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
