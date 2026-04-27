// Reusable admin table with loading skeletons, empty state, and horizontal scroll
'use client';

export type TableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
};

export function AdminTable<T extends { id?: string }>({
  columns,
  data,
  loading,
  emptyMessage = 'No data found.',
  keyExtractor,
}: {
  columns: TableColumn<T>[];
  data: T[];
  loading: boolean;
  emptyMessage?: string;
  keyExtractor?: (row: T, i: number) => string;
}) {
  return (
    <div className="overflow-x-auto w-full rounded-xl border border-color-border">
      <table className="w-full text-sm text-left min-w-[600px]">
        <thead>
          <tr className="bg-bg-tertiary/50 text-text-tertiary text-[10px] uppercase font-black tracking-widest border-b border-color-border">
            {columns.map((col) => (
              <th key={col.key} className={`px-4 py-3 whitespace-nowrap ${col.className ?? ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-color-border/30">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 bg-bg-tertiary/50 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-text-tertiary font-bold">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={keyExtractor ? keyExtractor(row, i) : row.id ?? i}
                className="hover:bg-bg-tertiary/20 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 whitespace-nowrap ${col.className ?? ''}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
