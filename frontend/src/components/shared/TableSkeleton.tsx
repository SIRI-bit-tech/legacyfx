// Loading skeleton for tables
interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export function TableSkeleton({ rows = 5, cols = 6 }: TableSkeletonProps) {
  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            {Array.from({ length: cols }).map((_, j) => (
              <div
                key={j}
                className="h-4 bg-bg-tertiary/50 rounded flex-1"
                style={{ animationDelay: `${i * 50}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
