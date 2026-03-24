// Admin reusable badge component for status/type labels
'use client';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'primary';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success: 'bg-color-success/10 text-color-success border-color-success/20',
  danger: 'bg-color-danger/10 text-color-danger border-color-danger/20',
  warning: 'bg-color-warning/10 text-color-warning border-color-warning/20',
  info: 'bg-color-info/10 text-color-info border-color-info/20',
  neutral: 'bg-bg-tertiary text-text-tertiary border-color-border',
  primary: 'bg-color-primary/10 text-color-primary border-color-primary/20',
};

function statusToVariant(status: string): BadgeVariant {
  const s = status.toLowerCase().replace(/_/g, '');
  if (['confirmed', 'active', 'filled', 'completed', 'approved'].some((v) => s.includes(v))) return 'success';
  if (['failed', 'rejected', 'suspended', 'cancelled'].some((v) => s.includes(v))) return 'danger';
  if (['pending', 'processing', 'awaiting', 'unverified'].some((v) => s.includes(v))) return 'warning';
  if (['buy', 'deposit'].some((v) => s.includes(v))) return 'success';
  if (['sell', 'withdraw'].some((v) => s.includes(v))) return 'danger';
  if (['trade'].some((v) => s.includes(v))) return 'info';
  return 'neutral';
}

export function AdminBadge({
  status,
  variant,
  className = '',
}: {
  status: string;
  variant?: BadgeVariant;
  className?: string;
}) {
  const resolvedVariant = variant ?? statusToVariant(status);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${VARIANT_CLASSES[resolvedVariant]} ${className}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
