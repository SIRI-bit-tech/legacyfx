'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminTable, TableColumn } from '@/components/admin/AdminTable';
import { AdminModal } from '@/components/admin/AdminModal';
import { adminApi } from '@/lib/adminApi';
import { toast } from 'react-hot-toast';
import {
  Eye,
  CheckCircle,
  XCircle,
  User as UserIcon,
  ExternalLink
} from 'lucide-react';

interface PendingKYC {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

interface UserDocument {
  id: string;
  document_type: string;
  cloudinary_url: string;
  uploaded_at: string;
}

export default function AdminKYCPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingKYC[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PendingKYC | null>(null);
  const [userDocuments, setUserDocuments] = useState<UserDocument[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchPending = async () => {
    try {
      const res = await adminApi.get<PendingKYC[]>('/admin/kyc/pending');
      setPendingUsers(res);
    } catch (err) {
      console.error('Admin Fetch Pending KYC Error:', err);
      toast.error('Failed to fetch pending KYC');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleViewDocs = async (user: PendingKYC) => {
    setSelectedUser(user);
    setLoading(true);
    try {
      const res = await adminApi.get<UserDocument[]>(`/admin/kyc/user/${user.id}/documents`);
      setUserDocuments(res);
      setModalOpen(true);
    } catch (err) {
      console.error('Admin View Documents Error:', err);
      toast.error('Failed to fetch user documents');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (status: 'VERIFIED' | 'REJECTED') => {
    if (!selectedUser) return;
    if (status === 'REJECTED' && !rejectionReason) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      await adminApi.post(`/admin/kyc/${selectedUser.id}/verify`, {
        status,
        reason: status === 'REJECTED' ? rejectionReason : null
      });
      toast.success(`User KYC ${status.toLowerCase()}!`);
      setModalOpen(false);
      fetchPending();
    } catch (err) {
      console.error('Admin KYC Verify Error:', err);
      toast.error('Failed to update KYC status');
    } finally {
      setProcessing(false);
    }
  };

  const columns: TableColumn<PendingKYC>[] = [
    {
      key: 'user',
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-color-primary/10 flex items-center justify-center text-color-primary">
            <UserIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium text-text-primary">{u.username}</div>
            <div className="text-xs text-text-tertiary">{u.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'date',
      header: 'Submitted At',
      render: (u) => <span className="text-sm text-text-tertiary">{new Date(u.created_at).toLocaleDateString()}</span>
    },
    {
      key: 'action',
      header: 'Action',
      render: (u) => (
        <button
          onClick={() => handleViewDocs(u)}
          className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 bg-color-primary/10 text-color-primary rounded-lg hover:bg-color-primary/20 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Review Documents
        </button>
      )
    }
  ];

  return (
    <AdminAuthGuard>
      <AdminLayout title="KYC Management">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">KYC Management</h1>
          <p className="text-text-tertiary text-sm">Review and verify user identity documents.</p>
        </div>

        <AdminTable
          columns={columns}
          data={pendingUsers}
          loading={loading}
          emptyMessage="No pending KYC requests found."
        />

        <AdminModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`Review Documents: ${selectedUser?.username}`}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {userDocuments.map((doc) => (
                <div key={doc.id} className="border border-color-border rounded-xl p-4 bg-bg-tertiary">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-text-primary flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-color-primary" />
                      {doc.document_type.replace('_', ' ')}
                    </span>
                    <a
                      href={doc.cloudinary_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-color-primary flex items-center gap-1 hover:underline"
                    >
                      Open Full Size <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="aspect-video w-full relative bg-black rounded-lg overflow-hidden group">
                    <img
                      src={doc.cloudinary_url}
                      alt={doc.document_type}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-color-border">
              <label 
                htmlFor="rejectionReason"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Rejection Reason (only required if rejecting)
              </label>
              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Photo is blurry, expired document..."
                className="w-full bg-bg-primary border border-color-border rounded-xl px-4 py-3 text-text-primary focus:border-color-primary outline-none transition-colors mb-4 text-sm min-h-[100px]"
              />

              <div className="flex gap-4">
                <button
                  onClick={() => handleVerify('REJECTED')}
                  disabled={processing}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-color-danger/10 text-color-danger border border-color-danger/20 rounded-xl font-bold hover:bg-color-danger/20 transition-all disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  Reject
                </button>
                <button
                  onClick={() => handleVerify('VERIFIED')}
                  disabled={processing}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-color-success/10 text-color-success border border-color-success/20 rounded-xl font-bold hover:bg-color-success/20 transition-all disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve User
                </button>
              </div>
            </div>
          </div>
        </AdminModal>
      </AdminLayout>
    </AdminAuthGuard>
  );
}
