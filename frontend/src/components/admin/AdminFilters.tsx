// Reusable admin filter bar — stacks vertically on mobile
'use client';

export type FilterField = {
  key: string;
  type: 'search' | 'select';
  placeholder?: string;
  options?: { label: string; value: string }[];
};

export function AdminFilters({
  fields,
  values,
  onChange,
}: {
  fields: FilterField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
      {fields.map((field) =>
        field.type === 'search' ? (
          <div key={field.key} className="relative flex-1 min-w-[180px]">
            <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-xs pointer-events-none" />
            <input
              type="text"
              value={values[field.key] ?? ''}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder ?? 'Search...'}
              className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-color-primary transition"
            />
          </div>
        ) : (
          <select
            key={field.key}
            value={values[field.key] ?? ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            className="bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-color-primary transition min-w-[130px]"
          >
            <option value="">{field.placeholder ?? 'All'}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )
      )}
    </div>
  );
}
