// Admin user details drawer — full screen on mobile, right-side panel on desktop
'use client';

import { AdminBadge } from './AdminBadge';
import { AdminModal } from './AdminModal';

export function UserDrawer({
  user,
  isOpen,
  onClose,
  onUpdateStatus,
}: {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  if (!user) return null;

  const isSuspended = user.status === 'suspended';

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title="User Details" size="lg">
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4 border-b border-color-border pb-6">
          <div className="w-16 h-16 rounded-full bg-color-primary/10 border border-color-primary/20 flex items-center justify-center text-color-primary text-2xl font-black">
            {user.email[0].toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">{user.email}</h3>
            <p className="text-text-tertiary text-xs font-mono">{user.id}</p>
            <div className="flex gap-2 mt-2">
              <AdminBadge status={user.tier} />
              <AdminBadge status={user.status} />
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-bg-tertiary/30 p-3 rounded-lg border border-color-border/50">
            <p className="text-[10px] text-text-tertiary uppercase font-black mb-1">Total Balance</p>
            <p className="text-xl font-black text-text-primary font-mono">$0.00</p>
          </div>
          <div className="bg-bg-tertiary/30 p-3 rounded-lg border border-color-border/50">
            <p className="text-[10px] text-text-tertiary uppercase font-black mb-1">Joined Date</p>
            <p className="text-sm font-bold text-text-secondary">Oct 24, 2023</p>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-color-border space-y-3">
          <p className="text-[10px] text-text-tertiary uppercase font-black mb-1">Administrative Actions</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => onUpdateStatus(user.id, isSuspended ? 'active' : 'suspended')}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${
                isSuspended
                  ? 'bg-color-success text-bg-primary hover:bg-color-success/90'
                  : 'bg-color-danger/10 text-color-danger border border-color-danger/30 hover:bg-color-danger/20'
              }`}
            >
              {isSuspended ? 'Lift Suspension' : 'Suspend Account'}
            </button>
            <button className="flex-1 py-2 rounded-lg bg-bg-tertiary text-text-primary text-sm font-bold hover:bg-bg-elevated transition border border-color-border">
              Reset Password
            </button>
          </div>
        </div>
      </div>
    </AdminModal>
  );
}
