// Admin deposit addresses page — manage wallet addresses for user deposits
'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminTable, TableColumn } from '@/components/admin/AdminTable';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { DepositAddressModal } from '@/components/admin/DepositAddressModal';
import { ConfirmModal } from '@/components/admin/AdminModal';
import { adminDepositAddressesApi } from '@/lib/adminApi';
import { toast } from 'sonner';

export default function AdminDepositAddressesPage() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminDepositAddressesApi.list();
      setAddresses(res);
    } catch (err) {
      console.error('Failed to fetch addresses', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleSave = async (data: any) => {
    if (editingAddress) {
      await adminDepositAddressesApi.update(editingAddress.id, data);
    } else {
      await adminDepositAddressesApi.create(data);
    }
    await fetchAddresses();
  };

  const handleDelete = (id: string) => {
    setConfirmModal({ isOpen: true, id });
  };

  const handleDeleteConfirm = async () => {
    if (!confirmModal.id) return;
    
    try {
      await adminDepositAddressesApi.delete(confirmModal.id);
      await fetchAddresses();
      toast.success('Address deleted successfully');
    } catch (err) {
      toast.error('Failed to delete address');
    } finally {
      setConfirmModal({ isOpen: false, id: null });
    }
  };

  const columns: TableColumn<any>[] = [
    { key: 'asset', header: 'Asset', render: (a) => <span className="font-bold text-text-primary">{a.asset}</span> },
    { key: 'network', header: 'Network', render: (a) => <span className="text-text-secondary text-xs">{a.network}</span> },
    {
      key: 'address',
      header: 'Address',
      render: (a) => (
        <div className="flex items-center gap-2">
          <code className="text-[10px] bg-bg-tertiary px-1.5 py-0.5 rounded text-text-tertiary font-mono truncate max-w-[120px]">
            {a.address}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(a.address);
              toast.success('Address copied!');
            }}
            className="text-text-tertiary hover:text-color-primary transition"
          >
            <i className="pi pi-copy text-[10px]" />
          </button>
        </div>
      ),
    },
    { key: 'min', header: 'Min Deposit', render: (a) => <span className="text-xs text-text-primary font-mono">{a.min_deposit || a.minDeposit || 0}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (a) => <AdminBadge status={a.is_active ? 'Active' : 'Inactive'} />,
    },
    {
      key: 'actions',
      header: '',
      render: (a) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => {
              setEditingAddress(a);
              setModalOpen(true);
            }}
            className="p-1.5 text-text-tertiary hover:text-color-primary transition"
            title="Edit"
          >
            <i className="pi pi-pencil text-xs" />
          </button>
          <button
            onClick={() => handleDelete(a.id)}
            className="p-1.5 text-text-tertiary hover:text-color-danger transition"
            title="Delete"
          >
            <i className="pi pi-trash text-xs" />
          </button>
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <AdminAuthGuard>
      <AdminLayout title="Deposit Addresses">
        <div className="flex items-center justify-between mb-6">
          <p className="text-text-secondary text-sm">Configure wallet addresses for user deposits.</p>
          <button
            onClick={() => {
              setEditingAddress(null);
              setModalOpen(true);
            }}
            className="bg-color-primary text-bg-primary px-4 py-2 rounded-lg text-xs font-bold hover:bg-color-primary-hover transition flex items-center gap-2"
          >
            <i className="pi pi-plus text-[10px]" />
            Add Address
          </button>
        </div>

        <div className="bg-bg-secondary p-1 rounded-xl shadow-sm">
          <AdminTable
            columns={columns}
            data={addresses}
            loading={loading}
            emptyMessage="No deposit addresses configured."
          />
        </div>

        <DepositAddressModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          initialData={editingAddress}
        />

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, id: null })}
          onConfirm={handleDeleteConfirm}
          title="Delete Deposit Address"
          message="Are you sure you want to delete this deposit address?"
          confirmText="Delete"
        />
      </AdminLayout>
    </AdminAuthGuard>
  );
}
