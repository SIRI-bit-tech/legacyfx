// Open orders component displaying user's active orders
'use client';

import { useOpenOrders } from '@/hooks/useOpenOrders';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { toDisplay } from '@/utils/symbolFormat';
import { useState } from 'react';

export function OpenOrders() {
  const { orders, loading, error, cancelOrder } = useOpenOrders();
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; orderId: string | null }>({
    isOpen: false,
    orderId: null,
  });

  const handleCancelClick = (orderId: string) => {
    setConfirmModal({ isOpen: true, orderId });
  };

  const handleConfirmCancel = async () => {
    if (!confirmModal.orderId) return;

    setCancelling(confirmModal.orderId);
    setConfirmModal({ isOpen: false, orderId: null });
    
    const success = await cancelOrder(confirmModal.orderId);
    setCancelling(null);

    if (!success) {
      // Could add a toast notification here instead
      console.error('Failed to cancel order');
    }
  };

  const handleCancelModal = () => {
    setConfirmModal({ isOpen: false, orderId: null });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-text-tertiary text-sm">
          <i className="pi pi-spin pi-spinner mr-2"></i>
          Loading orders...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-color-danger text-sm">
          <i className="pi pi-exclamation-circle mr-2"></i>
          {error}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return <EmptyState message="No open orders found" icon="pi-list" />;
  }

  return (
    <div className="flex-1 overflow-auto">
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        onConfirm={handleConfirmCancel}
        onCancel={handleCancelModal}
        confirmText="Yes, Cancel"
        cancelText="No, Keep"
      />
      
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-bg-tertiary/50 border-b border-color-border">
          <tr>
            <th className="text-left py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
              Pair
            </th>
            <th className="text-left py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
              Type
            </th>
            <th className="text-left py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
              Side
            </th>
            <th className="text-right py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
              Price
            </th>
            <th className="text-right py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
              Amount
            </th>
            <th className="text-right py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
              Filled
            </th>
            <th className="text-center py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
              Status
            </th>
            <th className="text-left py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
              Date
            </th>
            <th className="text-center py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-color-border/30">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-bg-tertiary/30 transition-colors">
              <td className="py-3 px-4 font-bold text-text-primary">
                {toDisplay(order.symbol)}
              </td>
              <td className="py-3 px-4 text-text-secondary uppercase text-[10px] font-bold">
                {order.type}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`font-bold ${
                    order.side === 'BUY' ? 'text-color-success' : 'text-color-danger'
                  }`}
                >
                  {order.side}
                </span>
              </td>
              <td className="py-3 px-4 text-right font-mono text-text-primary">
                ${order.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="py-3 px-4 text-right font-mono text-text-secondary">
                {order.quantity.toFixed(4)}
              </td>
              <td className="py-3 px-4 text-right font-mono text-text-secondary">
                {order.filled.toFixed(4)} ({((order.filled / order.quantity) * 100).toFixed(0)}%)
              </td>
              <td className="py-3 px-4 text-center">
                <StatusBadge status={order.status} />
              </td>
              <td className="py-3 px-4 text-text-tertiary text-[10px]">
                {new Date(order.created_at).toLocaleString()}
              </td>
              <td className="py-3 px-4 text-center">
                <button
                  onClick={() => handleCancelClick(order.id)}
                  disabled={cancelling === order.id}
                  className="text-color-danger hover:text-color-danger/80 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] font-bold uppercase tracking-wider"
                >
                  {cancelling === order.id ? (
                    <i className="pi pi-spin pi-spinner"></i>
                  ) : (
                    'Cancel'
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
