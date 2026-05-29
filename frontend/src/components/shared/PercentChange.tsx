// Percentage change display with arrow icon and color
interface PercentChangeProps {
  value: number;
  showArrow?: boolean;
  showSign?: boolean;
}

export function PercentChange({ value, showArrow = true, showSign = true }: PercentChangeProps) {
  const isPositive = value >= 0;
  const color = isPositive ? 'text-color-success' : 'text-color-danger';
  const arrow = isPositive ? 'pi-arrow-up' : 'pi-arrow-down';

  return (
    <span className={`inline-flex items-center gap-1 font-mono font-bold ${color}`}>
      {showArrow && <i className={`pi ${arrow} text-[10px]`}></i>}
      {showSign && (isPositive ? '+' : '')}{value.toFixed(2)}%
    </span>
  );
}
