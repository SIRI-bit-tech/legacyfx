// Admin metric card for overview stats
'use client';

export function AdminCard({
  label,
  value,
  sub,
  loading = false,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  loading?: boolean;
  icon?: string;
}) {
  return (
    <div className="bg-bg-secondary border border-color-border rounded-xl p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-text-tertiary text-xs font-bold uppercase tracking-widest">{label}</p>
        {icon && <span className="text-text-tertiary text-lg">{icon}</span>}
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-7 w-3/4 bg-bg-tertiary rounded animate-pulse" />
          {sub !== undefined && <div className="h-3.5 w-1/2 bg-bg-tertiary rounded animate-pulse" />}
        </div>
      ) : (
        <>
          <p className="text-2xl font-black text-text-primary font-mono">{value}</p>
          {sub && <p className="text-text-tertiary text-xs mt-1">{sub}</p>}
        </>
      )}
    </div>
  );
}
