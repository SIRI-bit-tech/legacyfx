// Reusable pagination component
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-color-border bg-bg-tertiary/20">
      <div className="text-xs text-text-tertiary">
        Page {page} of {totalPages}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrev}
          className="px-3 py-1.5 text-xs font-bold rounded bg-bg-tertiary hover:bg-bg-tertiary/70 text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <i className="pi pi-chevron-left"></i> Prev
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
          className="px-3 py-1.5 text-xs font-bold rounded bg-bg-tertiary hover:bg-bg-tertiary/70 text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Next <i className="pi pi-chevron-right"></i>
        </button>
      </div>
    </div>
  );
}
