'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminTable, TableColumn } from '@/components/admin/AdminTable';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { ConfirmModal, PromptModal } from '@/components/admin/AdminModal';
import { adminSubscriptionsApi } from '@/lib/adminApi';
import { toast } from 'sonner';

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [promptModal, setPromptModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await adminSubscriptionsApi.list();
      setSubscriptions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (id: string) => {
    setPromptModal({ isOpen: true, id });
  };

  const handleApproveConfirm = async (days: string) => {
    if (!promptModal.id) return;
    
    // Strict validation: only positive integers allowed
    if (!/^\d+$/.test(days.trim())) {
      alert('Invalid duration: Please enter a positive number (e.g., 30, 60, 90)');
      return;
    }
    
    const daysNum = Number.parseInt(days.trim(), 10);
    
    // Reject zero or negative values (though regex should prevent this)
    if (daysNum <= 0) {
      alert('Invalid duration: Duration must be greater than 0 days');
      return;
    }

    setProcessing(promptModal.id);
    setPromptModal({ isOpen: false, id: null });
    
    try {
      await adminSubscriptionsApi.approve(promptModal.id, daysNum);
      setSubscriptions(prev => prev.filter(s => s.id !== promptModal.id));
      toast.success("Subscription approved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to approve");
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = (id: string) => {
    setConfirmModal({ isOpen: true, id });
  };

  const handleDeclineConfirm = async () => {
    if (!confirmModal.id) return;

    setProcessing(confirmModal.id);
    setConfirmModal({ isOpen: false, id: null });
    
    try {
      await adminSubscriptionsApi.decline(confirmModal.id);
      setSubscriptions(prev => prev.filter(s => s.id !== confirmModal.id));
      toast.success("Subscription declined.");
    } catch (err: any) {
      toast.error(err.message || "Failed to decline");
    } finally {
      setProcessing(null);
    }
  };

  const columns: TableColumn<any>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (s) => (
        <span className="text-text-secondary text-xs">
          {new Date(s.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'user',
      header: 'User Email',
      render: (s) => (
        <span className="font-bold text-text-primary">{s.user_email}</span>
      ),
    },
    {
      key: 'plan',
      header: 'Requested Plan',
      render: (s) => (
        <span className="text-color-primary font-black uppercase text-[10px] bg-color-primary/10 px-2 py-1 rounded">
          {s.plan_name}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      render: (s) => (
        <span className="font-bold text-text-primary">${s.price}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => <AdminBadge status={s.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (s) => (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => handleApprove(s.id)}
            disabled={processing === s.id}
            className="px-4 py-2 bg-color-success text-bg-primary rounded-lg text-[10px] font-black uppercase hover:opacity-90 transition disabled:opacity-50"
          >
            {processing === s.id ? 'Processing...' : 'Approve'}
          </button>
          <button
            onClick={() => handleDecline(s.id)}
            disabled={processing === s.id}
            className="px-4 py-2 bg-color-danger text-bg-primary rounded-lg text-[10px] font-black uppercase hover:opacity-90 transition disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <AdminAuthGuard>
      <AdminLayout title="Subscription Requests">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <p className="text-text-secondary text-sm">
            Verify and approve user plan upgrades after manual payment confirmation.
          </p>
          <button
            onClick={loadSubscriptions}
            className="bg-bg-secondary border border-color-border px-4 py-2 rounded-lg hover:bg-bg-tertiary transition flex items-center gap-2 text-text-primary font-bold text-xs self-start md:self-auto"
          >
            <i className="pi pi-refresh text-[10px]" />
            Refresh
          </button>
        </div>

        {/* Subscriptions Table */}
        <div className="bg-bg-secondary p-1 rounded-xl shadow-sm overflow-hidden">
          <AdminTable
            columns={columns}
            data={subscriptions}
            loading={loading}
            emptyMessage="No pending subscription requests."
          />
        </div>

        {/* Modals */}
        <PromptModal
          isOpen={promptModal.isOpen}
          onClose={() => setPromptModal({ isOpen: false, id: null })}
          onConfirm={handleApproveConfirm}
          title="Subscription Duration"
          message="Enter subscription duration in days:"
          defaultValue="30"
          placeholder="Number of days"
          confirmText="Approve"
          loading={processing !== null}
        />

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, id: null })}
          onConfirm={handleDeclineConfirm}
          title="Decline Subscription"
          message="Are you sure you want to decline this subscription?"
          confirmText="Decline"
          loading={processing !== null}
        />
      </AdminLayout>
    </AdminAuthGuard>
  );
}
