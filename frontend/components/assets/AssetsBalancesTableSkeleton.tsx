// Skeleton table body for Assets balances
'use client';

export function AssetsBalancesTableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-bg-tertiary/50 text-text-tertiary text-[10px] uppercase font-bold tracking-widest">
            <th className="px-6 py-4">Asset</th>
            <th className="px-6 py-4 text-right">Total</th>
            <th className="px-6 py-4 text-right">Available</th>
            <th className="px-6 py-4 text-right">In orders</th>
            <th className="px-6 py-4 text-right">Value (USD)</th>
            <th className="px-6 py-4">Allocation</th>
            <th className="px-6 py-4 text-right" />
          </tr>
        </thead>
        <tbody className="divide-y divide-color-border/30">
          {Array.from({ length: 6 }).map((_, idx) => (
            <tr key={idx} className="hover:bg-bg-tertiary/20 transition-colors">
              {Array.from({ length: 7 }).map((__, jdx) => (
                <td key={jdx} className={`px-6 py-5 ${jdx === 0 ? '' : 'text-right'}`}>
                  <div className="h-4 bg-bg-tertiary/50 rounded animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

