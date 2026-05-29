import React from 'react';
import { PropertyCard } from './PropertyCard';

interface PropertyGridProps {
  listings: any[];
  loading: boolean;
  page: number;
  total: number;
  hasMore: boolean;
  onPageChange: (pageNum: number) => void;
  onInvest: (p: any) => void;
  onDetails: (p: any) => void;
}

const SkeletonRow = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[14px] mb-5">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-bg-primary border border-color-border/40 rounded-lg overflow-hidden animate-pulse">
        <div className="h-[140px] bg-bg-secondary" />
        <div className="p-[0.875rem]">
          <div className="h-4 bg-bg-secondary rounded w-1/3 mb-2" />
          <div className="h-3 bg-bg-secondary rounded w-2/3 mb-1" />
          <div className="h-8 bg-bg-secondary rounded w-full mb-3" />
          <div className="flex gap-2">
            <div className="h-8 bg-bg-secondary rounded w-full" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const PropertyGrid: React.FC<PropertyGridProps> = ({ 
  listings, 
  loading, 
  page, 
  total,
  hasMore,
  onPageChange,
  onInvest,
  onDetails
}) => {
  if (loading && listings.length === 0) {
    return (
      <div className="space-y-4 mb-8">
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-bg-secondary flex items-center justify-center mb-4 text-text-tertiary">
          <i className="pi pi-building text-3xl"></i>
        </div>
        <h3 className="text-[15px] font-medium text-text-primary mb-1">No properties found</h3>
        <p className="text-[13px] text-text-tertiary max-w-[280px]">
          Try adjusting your search filters to find more properties.
        </p>
      </div>
    );
  }

  const hasPrev = page > 1;
  const totalPages = Math.ceil(total / 8);

  return (
    <div className="mb-12">
      {/* 4 Top, 4 Bottom Pattern (8 properties) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[14px]">
        {listings.map((property) => (
          <PropertyCard 
            key={property.id} 
            property={property} 
            onInvest={onInvest}
            onDetails={onDetails}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {(hasPrev || hasMore) && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-10 px-1 border-t border-color-border/20 pt-6">
          <span className="text-[12px] text-text-tertiary font-medium order-2 md:order-1">
            Displaying {listings.length} properties (Page {page} of {totalPages || 1})
          </span>
          <div className="flex items-center gap-3 order-1 md:order-2">
            <button 
              onClick={() => onPageChange(page - 1)}
              disabled={!hasPrev || loading}
              className={`px-4 py-2 rounded-lg border border-color-border/60 text-[12px] font-bold transition-all flex items-center gap-2 ${
                !hasPrev || loading 
                  ? 'opacity-40 cursor-not-allowed bg-transparent text-text-tertiary' 
                  : 'bg-bg-secondary text-text-primary hover:bg-bg-primary hover:shadow-lg'
              }`}
            >
              <i className="pi pi-chevron-left text-[10px]"></i>
              PREV
            </button>
            <button 
              onClick={() => onPageChange(page + 1)}
              disabled={!hasMore || loading}
              className={`px-4 py-2 rounded-lg border border-color-border/60 text-[12px] font-bold transition-all flex items-center gap-2 ${
                !hasMore || loading 
                  ? 'opacity-40 cursor-not-allowed bg-transparent text-text-tertiary' 
                  : 'bg-bg-secondary text-text-primary hover:bg-bg-primary hover:shadow-lg'
              }`}
            >
              NEXT
              {loading ? <i className="pi pi-spin pi-spinner text-[10px]"></i> : <i className="pi pi-chevron-right text-[10px]"></i>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
