'use client';

import { useEffect, useState } from 'react';

interface AlertModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'success' | 'error' | 'warning' | 'danger';
}

export function AlertModal({
  isOpen,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
}: AlertModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const icons = {
    info: 'pi-info-circle text-color-info',
    success: 'pi-check-circle text-color-success',
    error: 'pi-exclamation-circle text-color-danger',
    warning: 'pi-exclamation-triangle text-color-warning',
    danger: 'pi-exclamation-triangle text-color-danger',
  };

  const bgColors = {
    info: 'bg-color-info/10 border-color-info/20',
    success: 'bg-color-success/10 border-color-success/20',
    error: 'bg-color-danger/10 border-color-danger/20',
    warning: 'bg-color-warning/10 border-color-warning/20',
    danger: 'bg-color-danger/10 border-color-danger/20',
  };

  const isDanger = type === 'danger';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-bg-secondary border border-color-border rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 text-center">
          {/* Icon */}
          <div className={`w-20 h-20 rounded-full ${bgColors[type]} flex items-center justify-center text-4xl mb-6 mx-auto border shadow-inner`}>
            <i className={`pi ${icons[type]}`}></i>
          </div>

          {title && (
            <h3 className="text-xl font-black text-text-primary mb-2 tracking-tight">
              {title}
            </h3>
          )}
          
          <p className="text-text-secondary leading-relaxed mb-8">
            {message}
          </p>

          {onConfirm ? (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-4 rounded-xl font-bold text-sm bg-bg-tertiary border border-color-border text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {cancelText}
              </button>
              <button
                onClick={() => { onConfirm(); onClose(); }}
                className={`flex-1 py-4 rounded-xl font-bold text-sm transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg ${
                  isDanger
                    ? 'bg-color-danger hover:bg-color-danger/80 text-white shadow-color-danger/20'
                    : 'bg-color-primary hover:bg-color-primary/90 text-white shadow-color-primary/20'
                }`}
              >
                {confirmText}
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-4 rounded-xl font-bold text-sm bg-color-primary hover:bg-color-primary/90 text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-color-primary/20"
            >
              Acknowledge
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
