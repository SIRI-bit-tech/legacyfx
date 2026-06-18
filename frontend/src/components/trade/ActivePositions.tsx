'use client';

import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { toDisplay } from '@/utils/symbolFormat';
import { useState } from 'react';
import { api } from '@/lib/api';

interface Position {
  id: string;
  symbol: string;
  side: string;
  entry_price: number;
  quantity: number;
  take_profit: number | null;
  stop_loss: number | null;
  is_open: boolean;
  created_at: string;
}

interface Props {
  positions: Position[];
  mutatePositions: () => void;
  mutateFunds: () => void;
}

export function ActivePositions({ positions, mutatePositions, mutateFunds }: Props) {
  const [closing, setClosing] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; positionId: string | null }>({
    isOpen: false,
    positionId: null,
  });

  const handleCloseClick = (positionId: string) => {
    setConfirmModal({ isOpen: true, positionId });
  };

  const handleConfirmClose = async () => {
    if (!confirmModal.positionId) return;

    const id = confirmModal.positionId;
    setClosing(id);
    setConfirmModal({ isOpen: false, positionId: null });
    
    try {
      await api.post(`/trading/positions/${id}/close`);
      mutatePositions();
      mutateFunds();
    } catch (error) {
      console.error('Failed to close position', error);
    } finally {
      setClosing(null);
    }
  };

  const handleCancelModal = () => {
    setConfirmModal({ isOpen: false, positionId: null });
  };

  if (!positions || positions.length === 0) {
    return <EmptyState message="No active positions found" icon="pi-list" />;
  }

  return (
    <div className="flex-1 overflow-auto">
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Close Position"
        message="Are you sure you want to close this position? It will be executed at the current market price."
        onConfirm={handleConfirmClose}
        onCancel={handleCancelModal}
        confirmText="Yes, Close Position"
        cancelText="No, Keep Open"
      />
      
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-bg-tertiary/50 border-b border-color-border">
          <tr>
            <th className="text-left py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
              Pair
            </th>
            <th className="text-left py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
              Side
            </th>
            <th className="text-right py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
              Entry Price
            </th>
            <th className="text-right py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
              Amount
            </th>
            <th className="text-right py-2 px-4 text-text-tertiary font-bold uppercase text-[10px] tracking-wider">
              TP / SL
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
          {positions.map((pos) => (
            <tr key={pos.id} className="hover:bg-bg-tertiary/30 transition-colors">
              <td className="py-3 px-4 font-bold text-text-primary">
                {toDisplay(pos.symbol)}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`font-bold ${
                    pos.side === 'BUY' ? 'text-color-success' : 'text-color-danger'
                  }`}
                >
                  {pos.side}
                </span>
              </td>
              <td className="py-3 px-4 text-right font-mono text-text-primary">
                ${pos.entry_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="py-3 px-4 text-right font-mono text-text-secondary">
                <div className="flex flex-col items-end">
                  <span className="font-bold text-text-primary">{pos.quantity.toFixed(4)}</span>
                  <span className="text-[10px]">${(pos.quantity * pos.entry_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </td>
              <td className="py-3 px-4 text-right font-mono text-text-secondary">
                <div className="flex flex-col items-end">
                  <span className="text-color-success">{pos.take_profit ? `$${pos.take_profit.toLocaleString()}` : '-'}</span>
                  <span className="text-color-danger">{pos.stop_loss ? `$${pos.stop_loss.toLocaleString()}` : '-'}</span>
                </div>
              </td>
              <td className="py-3 px-4 text-text-tertiary text-[10px]">
                {new Date(pos.created_at).toLocaleString()}
              </td>
              <td className="py-3 px-4 text-center">
                <button
                  onClick={() => handleCloseClick(pos.id)}
                  disabled={closing === pos.id}
                  className="bg-color-danger/20 hover:bg-color-danger/30 text-color-danger px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {closing === pos.id ? (
                    <i className="pi pi-spin pi-spinner"></i>
                  ) : (
                    'Close'
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
