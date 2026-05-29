// Admin header — hamburger on mobile, page title, admin badge
'use client';

import { getAdminToken } from '@/lib/adminApi';

export function AdminHeader({
  title,
  onMenuToggle,
}: {
  title: string;
  onMenuToggle: () => void;
}) {
  return (
    <header className="h-14 bg-bg-secondary border-b border-color-border flex items-center justify-between px-4 shrink-0 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label="Toggle navigation"
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-bg-tertiary transition text-text-secondary"
        >
          <i className="pi pi-bars" />
        </button>
        <h2 className="text-sm font-bold text-text-primary truncate">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-color-primary/10 text-color-primary border-color-primary/20">
          Admin
        </span>
        <div className="w-8 h-8 rounded-full bg-bg-tertiary border border-color-border flex items-center justify-center">
          <i className="pi pi-user text-text-secondary text-xs" />
        </div>
      </div>
    </header>
  );
}
