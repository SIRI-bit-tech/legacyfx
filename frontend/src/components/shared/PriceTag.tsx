// Price display component with color based on direction
interface PriceTagProps {
  value: number;
  previousValue?: number;
  decimals?: number;
  prefix?: string;
}

export function PriceTag({ value, previousValue, decimals = 2, prefix = '$' }: PriceTagProps) {
  const getColor = () => {
    if (previousValue === undefined) return 'text-text-primary';
    if (value > previousValue) return 'text-color-success';
    if (value < previousValue) return 'text-color-danger';
    return 'text-text-primary';
  };

  return (
    <span className={`font-mono font-bold ${getColor()}`}>
      {prefix}{value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  );
}
