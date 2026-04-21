'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="bg-bg-secondary border-b border-color-border px-4 lg:px-8 py-3 lg:py-5 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      <div className="flex-1 flex items-center gap-2 lg:gap-4">
        <div className="relative group flex-1 max-w-xs lg:max-w-md hidden sm:block">
           <i className="pi pi-search absolute left-3 lg:left-4 top-2.5 lg:top-3 text-text-tertiary group-focus-within:text-color-primary transition-colors text-sm lg:text-base"></i>
           <input
             type="text"
             placeholder="Search..."
             className="w-full px-8 lg:px-5 py-2 lg:py-2.5 pl-9 lg:pl-12 bg-bg-tertiary border border-color-border rounded-xl text-text-secondary placeholder-text-tertiary focus:text-text-primary focus:border-color-primary focus:outline-none transition-all shadow-inner text-sm lg:text-base"
           />
        </div>
        
        {/* Mobile Search Button */}
        <button className="sm:hidden w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-bg-tertiary border border-color-border flex items-center justify-center text-text-secondary hover:text-color-primary transition-all">
          <i className="pi pi-search text-sm"></i>
        </button>
      </div>

      <div className="flex items-center gap-8">
        {/* Support Links */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6 text-xs font-black uppercase tracking-widest text-text-tertiary">
           <a href="/support" className="hover:text-color-primary transition-colors flex items-center gap-1 lg:gap-2">
              <i className="pi pi-question-circle text-xs lg:text-sm"></i>
              <span className="hidden lg:inline">Support</span>
           </a>
           <a href="/signals" className="hover:text-color-primary transition-colors flex items-center gap-1 lg:gap-2">
              <i className="pi pi-bolt text-xs lg:text-sm"></i>
              <span className="hidden lg:inline">Live Feed</span>
           </a>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-bg-tertiary border border-color-border flex items-center justify-center text-text-secondary hover:text-color-primary hover:border-color-primary transition-all group"
          >
            <i className="pi pi-bell group-hover:animate-swing text-sm lg:text-base"></i>
            <span className="absolute top-1.5 lg:top-2 right-1.5 lg:right-2 w-1.5 lg:w-2 h-1.5 lg:h-2 bg-color-danger rounded-full border-2 border-bg-secondary"></span>
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 lg:right-0 mt-2 lg:mt-4 w-80 lg:w-96 bg-bg-secondary border border-color-border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200 max-h-[32rem]">
              <div className="p-5 border-b border-color-border flex justify-between items-center bg-bg-tertiary/20">
                <h3 className="font-black text-xs uppercase tracking-widest text-text-primary">Market Alerts</h3>
                <button className="text-[10px] text-color-primary font-bold hover:underline">Mark all read</button>
              </div>
              <div className="max-h-[32rem] overflow-y-auto">
                <div className="p-5 hover:bg-bg-tertiary cursor-pointer transition-colors border-b border-color-border/30 group">
                  <div className="flex justify-between items-start mb-1">
                     <p className="text-text-primary font-bold text-sm group-hover:text-color-primary">Buy order filled</p>
                     <span className="text-[10px] text-text-tertiary">2m ago</span>
                  </div>
                  <p className="text-text-secondary text-xs">Exchanged 0.524 BTC at market price of $65,241.20</p>
                </div>
                <div className="p-5 hover:bg-bg-tertiary cursor-pointer transition-colors border-b border-color-border/30 group">
                  <div className="flex justify-between items-start mb-1">
                     <p className="text-text-primary font-bold text-sm group-hover:text-color-primary">Security Alert</p>
                     <span className="text-[10px] text-text-tertiary">1h ago</span>
                  </div>
                  <p className="text-text-secondary text-xs">New device login detected from Singapore (IP: 103.xxx)</p>
                </div>
                <div className="p-8 text-center">
                   <p className="text-text-tertiary text-xs italic uppercase font-bold">No older notifications</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-2 lg:gap-4 pl-4 lg:pl-8 border-l border-color-border">
          <div className="text-right hidden sm:block">
            <p className="text-text-primary font-black text-xs uppercase tracking-tight">
              {user?.username || 'Trader'}
            </p>
            <div className="flex items-center justify-end gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-color-success"></span>
               <span className="text-text-tertiary text-[9px] font-black uppercase tracking-tighter hidden lg:inline">Verified Elite</span>
            </div>
          </div>
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-color-primary text-bg-primary flex items-center justify-center font-black text-xs lg:text-sm shadow-lg shadow-color-primary/20">
            {user?.username?.charAt(0).toUpperCase() || 'T'}
          </div>
        </div>
      </div>
    </header>
  );
}
