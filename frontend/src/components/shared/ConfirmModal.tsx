// Reusable confirmation modal component
'use client';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Yes',
  cancelText = 'No',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-bg-secondary border border-color-border rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-color-border">
          <h3 className="text-lg font-bold text-text-primary">{title}</h3>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-text-secondary">{message}</p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-bg-tertiary/20 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-lg font-bold text-sm bg-color-danger hover:bg-color-danger/80 text-white transition shadow-lg"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 rounded-lg font-bold text-sm bg-color-warning hover:bg-color-warning/90 text-bg-primary transition shadow-lg"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
