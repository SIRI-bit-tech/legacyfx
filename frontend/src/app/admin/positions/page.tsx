'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminTable, TableColumn } from '@/components/admin/AdminTable';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { ConfirmModal } from '@/components/admin/AdminModal';
import { adminApi } from '@/lib/adminApi';
import { toast } from 'sonner';

export default function AdminPositionsPage() {
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  const fetchPositions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get<any[]>('/admin/positions').catch(() => []);
      setPositions(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPositions();
    // Poll every 10 seconds to keep live PNL somewhat updated for the admin
    const interval = setInterval(fetchPositions, 10000);
    return () => clearInterval(interval);
  }, [fetchPositions]);

  const handleClose = (id: string) => {
    setConfirmModal({ isOpen: true, id });
  };

  const handleCloseConfirm = async () => {
    if (!confirmModal.id) return;
    
    try {
      const res = await adminApi.patch<{ pnl: number }>(`/admin/positions/${confirmModal.id}/close`);
      await fetchPositions();
      toast.success(`Position closed! Final PNL: $${res.pnl.toFixed(2)}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to close position');
    } finally {
      setConfirmModal({ isOpen: false, id: null });
    }
  };

  const columns: TableColumn<any>[] = [
    { key: 'user', header: 'User', render: (p) => <span className="font-bold text-text-primary text-xs truncate max-w-[120px] inline-block">{p.user_email || 'Unknown'}</span> },
    { key: 'symbol', header: 'Symbol', render: (p) => <span className="text-xs font-black text-text-primary">{p.symbol}</span> },
    { key: 'side', header: 'Side', render: (p) => <AdminBadge status={p.side} variant={p.side === 'BUY' ? 'success' : 'danger'} /> },
    { key: 'leverage', header: 'Lev.', render: (p) => <span className="text-text-tertiary text-[10px] font-bold">{p.leverage}x</span> },
    { key: 'entry', header: 'Entry', render: (p) => <span className="font-mono text-xs text-text-secondary">${p.entry_price.toLocaleString(undefined, {minimumFractionDigits: 2})}</span> },
    { key: 'current', header: 'Current', render: (p) => <span className="font-mono text-xs text-text-primary">${p.current_price.toLocaleString(undefined, {minimumFractionDigits: 2})}</span> },
    { key: 'margin', header: 'Margin', render: (p) => <span className="font-mono text-xs text-text-secondary">${p.margin.toLocaleString(undefined, {minimumFractionDigits: 2})}</span> },
    { 
      key: 'pnl', 
      header: 'Live PNL', 
      render: (p) => (
        <div className="flex flex-col">
          <span className={`font-mono text-xs font-bold ${p.pnl >= 0 ? 'text-color-success' : 'text-color-danger'}`}>
            {p.pnl >= 0 ? '+' : ''}${p.pnl.toLocaleString(undefined, {minimumFractionDigits: 2})}
          </span>
          <span className={`text-[9px] ${p.pnl_percent >= 0 ? 'text-color-success/70' : 'text-color-danger/70'}`}>
            {p.pnl_percent >= 0 ? '+' : ''}{p.pnl_percent.toFixed(2)}%
          </span>
        </div>
      ) 
    },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <button
          onClick={() => handleClose(p.id)}
          className="bg-color-danger/10 text-color-danger hover:bg-color-danger/20 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition"
        >
          Force Close
        </button>
      ),
      className: 'text-right'
    }
  ];

  return (
    <AdminAuthGuard>
      <AdminLayout title="Live Positions">
        <div className="bg-bg-secondary p-1 rounded-xl shadow-sm">
          <AdminTable
            columns={columns}
            data={positions}
            loading={loading}
            emptyMessage="No live positions right now."
          />
        </div>

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, id: null })}
          onConfirm={handleCloseConfirm}
          title="Force Close Position"
          message="Are you sure you want to forcefully close this active position? The current PNL will be permanently realized against the user's trading balance."
          confirmText="Yes, Close Position"
        />
      </AdminLayout>
    </AdminAuthGuard>
  );
}
