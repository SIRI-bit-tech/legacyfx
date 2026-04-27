'use client';

import { useEffect, useState } from 'react';

interface AlertModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  type?: 'info' | 'success' | 'error' | 'warning';
}

export function AlertModal({
  isOpen,
  title,
  message,
  onClose,
  type = 'info',
}: AlertModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  const icons = {
    info: 'pi-info-circle text-color-info',
    success: 'pi-check-circle text-color-success',
    error: 'pi-exclamation-circle text-color-danger',
    warning: 'pi-exclamation-triangle text-color-warning',
  };

  const bgColors = {
    info: 'bg-color-info/10 border-color-info/20',
    success: 'bg-color-success/10 border-color-success/20',
    error: 'bg-color-danger/10 border-color-danger/20',
    warning: 'bg-color-warning/10 border-color-warning/20',
  };

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

          <button
            onClick={onClose}
            className="w-full py-4 rounded-xl font-bold text-sm bg-color-primary hover:bg-color-primary/90 text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-color-primary/20"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}
