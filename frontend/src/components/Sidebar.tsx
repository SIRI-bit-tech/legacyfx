'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: 'pi pi-home' },
  { name: 'Markets', href: '/markets', icon: 'pi pi-globe' },
  { name: 'Trade', href: '/trade', icon: 'pi pi-sync' },
  { name: 'Assets', href: '/assets', icon: 'pi pi-wallet' },
  { name: 'Deposit', href: '/deposit', icon: 'pi pi-plus-circle' },
  { name: 'Withdraw', href: '/withdraw', icon: 'pi pi-minus-circle' },
  { name: 'Transactions', href: '/transactions', icon: 'pi pi-history' },
  { name: 'Mining', href: '/mining', icon: 'pi pi-bolt' },
  { name: 'Stake', href: '/stake', icon: 'pi pi-database' },
  { name: 'Cold Storage', href: '/cold-storage', icon: 'pi pi-lock' },
  { name: 'Copy Trading', href: '/copy-trading', icon: 'pi pi-users' },
  { name: 'Signals', href: '/signals', icon: 'pi pi-wifi' },
  { name: 'Real Estate', href: '/real-estate', icon: 'pi pi-building' },
  { name: 'Referrals', href: '/referrals', icon: 'pi pi-user-plus' },
  { name: 'Subscribe', href: '/subscribe', icon: 'pi pi-star' },
  { name: 'Connect Wallet', href: '/connect-wallet', icon: 'pi pi-link' },
  { name: 'Support', href: '/support', icon: 'pi pi-comment' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const featureTiers: Record<string, string[]> = {
    'Mining': ['PRO', 'ELITE', 'LEGACY_MASTER'],
    'Stake': ['ELITE', 'LEGACY_MASTER'],
    'Cold Storage': ['ELITE', 'LEGACY_MASTER'],
    'Copy Trading': ['LEGACY_MASTER'],
    'Signals': ['LEGACY_MASTER'],
    'Real Estate': ['LEGACY_MASTER'],
  };

  const isLocked = (name: string) => {
    const required = featureTiers[name];
    if (!required) return false;
    return !required.includes(user?.tier || 'BASIC');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] w-10 h-10 bg-color-primary text-bg-primary rounded-xl flex items-center justify-center shadow-lg"
      >
        <i className={`pi ${isMobileMenuOpen ? 'pi-times' : 'pi-bars'} text-lg`}></i>
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-[50]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky lg:top-0 w-64 bg-bg-secondary border-r border-color-border h-screen flex flex-col z-[55] transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
      {/* Logo */}
      <div className="p-8 border-b border-color-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-color-primary flex items-center justify-center text-bg-primary shadow-lg shadow-color-primary/20">
           <i className="pi pi-bolt font-black"></i>
        </div>
        <h1 className="font-display text-xl font-black text-text-primary tracking-tighter">LEGACY<span className="text-color-primary">FX</span></h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navigation.map((item) => {
          const locked = isLocked(item.name);
          return (
            <Link
              key={item.href}
              href={locked ? '/subscribe' : item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group ${
                isActive(item.href)
                  ? 'bg-color-primary/10 text-color-primary font-bold border border-color-primary/10'
                  : 'text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary'
              } ${locked ? 'opacity-80' : ''}`}
            >
              <div className="relative">
                <i className={`${item.icon} ${isActive(item.href) ? 'text-color-primary' : 'text-text-tertiary group-hover:text-text-primary'} transition-colors`} style={{ fontSize: '1rem' }}></i>
                {locked && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-bg-secondary rounded-full flex items-center justify-center shadow-sm">
                    <i className="pi pi-lock text-[8px] text-text-tertiary"></i>
                  </div>
                )}
              </div>
              <span className={`text-xs font-black uppercase tracking-wider ${locked ? 'text-text-tertiary' : ''}`}>
                {item.name}
              </span>
              {locked && <i className="pi pi-lock ml-auto text-[10px] text-text-tertiary/50"></i>}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-color-border space-y-2 bg-bg-tertiary/20">
        <div className="px-4 py-2 flex items-center gap-3 mb-2">
           <div className="w-8 h-8 rounded-full bg-bg-tertiary border border-color-border flex items-center justify-center text-[10px] font-black uppercase text-text-primary">
              {user?.username?.substring(0,2) || 'TR'}
           </div>
           <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-text-primary truncate">{user?.username || 'Trader'}</p>
              <p className="text-[10px] text-text-tertiary font-bold truncate">{user?.email || 'verified'}</p>
           </div>
        </div>

        <Link
          href="/settings"
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
            isActive('/settings')
              ? 'bg-color-primary/10 text-color-primary font-bold'
              : 'text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary'
          }`}
        >
          <i className="pi pi-cog" style={{ fontSize: '1rem' }}></i>
          <span className="text-xs font-black uppercase tracking-wider">Settings</span>
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-color-danger hover:bg-color-danger/10 transition-all font-black uppercase tracking-wider text-xs text-left"
        >
          <i className="pi pi-sign-out" style={{ fontSize: '1rem' }}></i>
          <span>Logout</span>
        </button>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
      </aside>
    </>
  );
}
