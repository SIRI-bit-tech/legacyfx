'use client';

import { DashboardLayout } from '../dashboard-layout';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('General');

  const tabs = ['General', 'Security', 'Notifications', 'Verification', 'API'];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-10 max-w-5xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-text-primary mb-2 tracking-tight">Account Settings</h1>
          <p className="text-text-secondary">Manage your institutional profile, security protocols, and platform preferences.</p>
        </header>

        <div className="flex flex-col md:flex-row gap-12">
           {/* Vertical Tabs */}
           <div className="md:w-64 space-y-2">
              {tabs.map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`w-full text-left px-6 py-3 rounded-xl font-bold transition-all text-sm flex items-center justify-between ${
                    activeTab === tab 
                      ? 'bg-color-primary text-bg-primary shadow-lg shadow-color-primary/10' 
                      : 'text-text-tertiary hover:text-text-primary hover:bg-bg-secondary'
                  }`}
                >
                   {tab}
                   {activeTab === tab && <i className="pi pi-chevron-right text-[10px]"></i>}
                </button>
              ))}
           </div>

           {/* Content Area */}
           <div className="flex-1 space-y-8">
              {activeTab === 'General' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                   <div className="bg-bg-secondary border border-color-border rounded-3xl p-8 shadow-xl">
                      <h3 className="text-xl font-bold text-text-primary mb-6">Personal Profile</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-text-tertiary tracking-widest pl-1">Full Name</label>
                            <input type="text" defaultValue={user?.username || 'Trader'} className="w-full bg-bg-tertiary border border-color-border rounded-xl px-4 py-3 text-text-primary focus:border-color-primary outline-none" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-text-tertiary tracking-widest pl-1">Email Address</label>
                            <input type="email" defaultValue={user?.email || 'user@legacyfx.com'} readOnly className="w-full bg-bg-tertiary/50 border border-color-border rounded-xl px-4 py-3 text-text-tertiary outline-none cursor-not-allowed" />
                         </div>
                      </div>
                      <button className="mt-8 bg-color-primary hover:bg-color-primary-hover text-bg-primary px-8 py-3 rounded-xl font-black text-xs uppercase transition tracking-widest">
                         Save Changes
                      </button>
                   </div>

                   <div className="bg-bg-secondary border border-color-border rounded-3xl p-8 shadow-xl">
                      <h3 className="text-xl font-bold text-text-primary mb-6">Regional Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-text-tertiary tracking-widest pl-1">Base Currency</label>
                            <div className="relative">
                               <select className="w-full bg-bg-tertiary border border-color-border rounded-xl px-4 py-3 text-text-primary appearance-none outline-none focus:border-color-primary">
                                  <option>US Dollar (USD)</option>
                                  <option>Euro (EUR)</option>
                                  <option>Bitcoin (BTC)</option>
                               </select>
                               <i className="pi pi-chevron-down absolute right-4 top-4 text-text-tertiary pointer-events-none"></i>
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-text-tertiary tracking-widest pl-1">Timezone</label>
                            <div className="relative">
                               <select className="w-full bg-bg-tertiary border border-color-border rounded-xl px-4 py-3 text-text-primary appearance-none outline-none focus:border-color-primary">
                                  <option>UTC+00:00 (Greenwich)</option>
                                  <option>UTC-05:00 (Eastern)</option>
                                  <option>UTC+08:00 (Singapore)</option>
                               </select>
                               <i className="pi pi-chevron-down absolute right-4 top-4 text-text-tertiary pointer-events-none"></i>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'Security' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                   <div className="bg-bg-secondary border border-color-border rounded-3xl p-8 shadow-xl">
                      <div className="flex justify-between items-center mb-6">
                         <h3 className="text-xl font-bold text-text-primary">Two-Factor Authentication</h3>
                         <span className="bg-color-success/10 text-color-success px-3 py-1 rounded-full text-[10px] font-black uppercase border border-color-success/20">Enabled</span>
                      </div>
                      <p className="text-sm text-text-secondary mb-8 leading-relaxed">Secure your account with an extra layer of defense. Codes from Google Authenticator or Authy will be required for logins and withdrawals.</p>
                      <button className="bg-bg-tertiary border border-color-border text-text-primary px-8 py-3 rounded-xl font-black text-xs uppercase transition tracking-widest hover:border-color-danger hover:text-color-danger">
                         Disable 2FA
                      </button>
                   </div>

                   <div className="bg-bg-secondary border border-color-border rounded-3xl p-8 shadow-xl">
                      <h3 className="text-xl font-bold text-text-primary mb-6">Account Password</h3>
                      <div className="space-y-4 max-w-md">
                         <input type="password" placeholder="Current Password" className="w-full bg-bg-tertiary border border-color-border rounded-xl px-4 py-3 outline-none focus:border-color-primary" />
                         <input type="password" placeholder="New Password" className="w-full bg-bg-tertiary border border-color-border rounded-xl px-4 py-3 outline-none focus:border-color-primary" />
                         <input type="password" placeholder="Confirm New Password" className="w-full bg-bg-tertiary border border-color-border rounded-xl px-4 py-3 outline-none focus:border-color-primary" />
                         <button className="bg-color-primary text-bg-primary px-8 py-3 rounded-xl font-black text-xs uppercase transition tracking-widest shadow-lg shadow-color-primary/10">
                            Update Password
                         </button>
                      </div>
                   </div>
                </div>
              )}
              
              {/* Other tabs can be implemented as needed, using placeholders for now */}
              {(activeTab !== 'General' && activeTab !== 'Security') && (
                <div className="bg-bg-secondary border border-color-border rounded-3xl p-20 text-center animate-in fade-in duration-300 shadow-xl">
                   <i className="pi pi-lock text-5xl text-bg-tertiary mb-6 block"></i>
                   <h3 className="text-xl font-bold text-text-primary mb-2">{activeTab} Controls Under Review</h3>
                   <p className="text-sm text-text-secondary">Please contact your account manager for manual {activeTab.toLowerCase()} adjustments.</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
