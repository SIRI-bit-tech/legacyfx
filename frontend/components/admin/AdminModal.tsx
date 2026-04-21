// Reusable admin modal — full screen on mobile, centered card on desktop
'use client';

import { useEffect, useState } from 'react';

export function AdminModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`bg-bg-secondary border border-color-border w-full ${sizeClass} sm:rounded-xl rounded-t-xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-color-border shrink-0">
          <h2 className="text-base font-bold text-text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-tertiary transition text-text-secondary hover:text-text-primary"
          >
            <i className="pi pi-times text-sm" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">{children}</div>
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false
}: ConfirmModalProps) {
  const handleConfirm = () => {
    if (!loading) {
      onConfirm();
    }
  };

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <p className="text-text-secondary">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-3 bg-color-danger text-bg-primary rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50 text-sm uppercase"
          >
            {loading ? 'Processing...' : confirmText}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 bg-bg-tertiary border border-color-border text-text-primary rounded-lg font-bold hover:bg-bg-primary transition disabled:opacity-50 text-sm uppercase"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </AdminModal>
  );
}

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  message: string;
  defaultValue?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export function PromptModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  defaultValue = "",
  placeholder = "",
  confirmText = "OK",
  cancelText = "Cancel",
  loading = false
}: PromptModalProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleConfirm = () => {
    if (!loading) {
      onConfirm(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleConfirm();
  };

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-text-secondary">{message}</p>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-bg-primary border border-color-border rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-color-primary"
          autoFocus
        />
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-color-primary text-bg-primary rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50 text-sm uppercase"
          >
            {loading ? 'Processing...' : confirmText}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 bg-bg-tertiary border border-color-border text-text-primary rounded-lg font-bold hover:bg-bg-primary transition disabled:opacity-50 text-sm uppercase"
          >
            {cancelText}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
