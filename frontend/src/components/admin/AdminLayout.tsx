// Admin layout component — sidebar + header + main content
'use client';

import { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

export function AdminLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg-primary flex">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area — offset by sidebar width on desktop */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60">
        <AdminHeader title={title} onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
