// Status badge component for order status
interface StatusBadgeProps {
  status: 'open' | 'filled' | 'cancelled' | 'partial' | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();
  
  const getStatusColor = () => {
    switch (normalizedStatus) {
      case 'open':
        return 'bg-color-info/10 text-color-info border-color-info/30';
      case 'filled':
        return 'bg-color-success/10 text-color-success border-color-success/30';
      case 'cancelled':
        return 'bg-color-danger/10 text-color-danger border-color-danger/30';
      case 'partial':
        return 'bg-color-warning/10 text-color-warning border-color-warning/30';
      default:
        return 'bg-text-tertiary/10 text-text-tertiary border-text-tertiary/30';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor()}`}
    >
      {status}
    </span>
  );
}
