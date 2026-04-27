'use client';

import { useState } from 'react';

interface LockToggleProps {
  isLocked: boolean;
  onToggle: (newState: boolean) => void;
  loading?: boolean;
}

export function LockToggle({ isLocked, onToggle, loading = false }: LockToggleProps) {
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    setShowModal(true);
  };

  const handleConfirm = () => {
    setShowModal(false);
    onToggle(!isLocked);
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  const warningText = isLocked
    ? '🔓 Unlocking will allow withdrawals from your cold storage.'
    : '🔒 Locking vault provides enhanced security but prevents emergency withdrawals.';

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`${
          isLocked ? 'bg-success hover:opacity-80' : 'bg-danger hover:opacity-80'
        } text-white font-semibold py-2 px-6 rounded transition disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading ? 'Processing...' : (isLocked ? 'Unlock Vault' : 'Lock Vault')}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-secondary border border-color-border rounded-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-text-primary mb-2">
              {isLocked ? 'Unlock Vault?' : 'Lock Vault?'}
            </h3>
            <p className="text-text-secondary text-sm mb-4">{warningText}</p>
            {isLocked && (
              <div className="bg-warning bg-opacity-20 border border-warning rounded p-3 mb-4">
                <p className="text-warning text-xs">
                  ⚠️ After unlocking, you have 24 hours to withdraw before automatic re-lock.
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 bg-bg-tertiary hover:bg-opacity-80 text-text-primary font-semibold py-2 px-4 rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className={`flex-1 ${
                  isLocked ? 'bg-success hover:opacity-80' : 'bg-danger hover:opacity-80'
                } text-white font-semibold py-2 px-4 rounded transition disabled:opacity-50`}
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
