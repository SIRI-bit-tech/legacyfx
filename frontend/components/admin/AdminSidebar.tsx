// Admin sidebar — fixed on desktop, slide-in drawer on mobile
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: 'pi-th-large', exact: true },
  { href: '/admin/users', label: 'Users', icon: 'pi-users' },
  { href: '/admin/deposits', label: 'Deposits', icon: 'pi-arrow-down-left' },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: 'pi-arrow-up-right' },
  { href: '/admin/transactions', label: 'Transactions', icon: 'pi-list' },
  { href: '/admin/assets', label: 'Assets & Prices', icon: 'pi-chart-bar' },
  { href: '/admin/deposit-addresses', label: 'Deposit Addresses', icon: 'pi-wallet' },
  { href: '/admin/orders', label: 'Orders', icon: 'pi-receipt' },
  { href: '/admin/staking', label: 'Staking', icon: 'pi-money-bill' },
  { href: '/admin/mining', label: 'Mining', icon: 'pi-server' },
  { href: '/admin/settings', label: 'Settings', icon: 'pi-cog' },
];

export function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { logout } = useAdminAuth();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Branding */}
      <div className="px-5 py-5 border-b border-color-border shrink-0">
        <span className="text-xl font-black text-color-primary tracking-tight">LegacyFX</span>
        <p className="text-text-tertiary text-[10px] uppercase tracking-widest font-bold mt-0.5">Admin Portal</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors ${
              isActive(item.href, item.exact)
                ? 'bg-color-primary/10 text-color-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
            }`}
          >
            <i className={`pi ${item.icon} text-sm w-4 text-center`} />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-color-border shrink-0">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-color-danger hover:bg-color-danger/10 transition-colors"
        >
          <i className="pi pi-sign-out text-sm w-4 text-center" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-bg-secondary border-r border-color-border h-full fixed left-0 top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile drawer backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-bg-secondary border-r border-color-border flex flex-col transition-transform duration-200 lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
