import React, { useState } from 'react';

interface PropertyFiltersProps {
  filters: any;
  onChange: (newFilters: any) => void;
}

// Helper for label and input group
const FilterGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
    <label className="text-[10px] text-text-tertiary uppercase font-bold tracking-[0.06em] ml-1">
      {label}
    </label>
    {children}
  </div>
);

export const PropertyFilters: React.FC<PropertyFiltersProps> = ({ filters, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // INCREASED HEIGHT and fixed vertical centering (42px)
  const controlBase = "w-full h-[42px] bg-bg-secondary border border-border-light rounded-xl px-3 text-[13px] text-text-primary focus:outline-none focus:border-color-primary transition-all duration-200 shadow-sm";

  const content = (
    <div className={`${isExpanded ? 'flex' : 'hidden md:flex'} flex-wrap items-end gap-[14px]`}>
      <FilterGroup label="Type">
        <select 
          className={controlBase}
          value={filters.type || 'all'}
          onChange={(e) => onChange({ type: e.target.value })}
        >
          <option value="all">All types</option>
          <option value="sale">For sale</option>
          <option value="rent">For rent</option>
        </select>
      </FilterGroup>

      <FilterGroup label="Location">
        <div className="relative">
          <input 
            type="text"
            className={`${controlBase} pl-9`}
            placeholder="City, State..."
            value={filters.city || ''}
            onChange={(e) => onChange({ city: e.target.value })}
          />
          <i className="pi pi-map-marker absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] text-text-tertiary"></i>
        </div>
      </FilterGroup>

      <FilterGroup label="Price Range">
        <select 
          className={controlBase}
          value={filters.priceRange || 'any'}
          onChange={(e) => onChange({ priceRange: e.target.value })}
        >
          <option value="any">Any price</option>
          <option value="under100k">Under $100K</option>
          <option value="100k-300k">$100K–$300K</option>
          <option value="300k-500k">$300K–$500K</option>
          <option value="500kplus">$500K+</option>
        </select>
      </FilterGroup>

      <FilterGroup label="Prop Type">
        <select 
          className={controlBase}
          value={filters.property_type || 'any'}
          onChange={(e) => onChange({ property_type: e.target.value })}
        >
          <option value="any">Any</option>
          <option value="Apartment">Apartment</option>
          <option value="House">House</option>
          <option value="Commercial">Commercial</option>
          <option value="Land">Land</option>
        </select>
      </FilterGroup>

      <FilterGroup label="Beds">
        <select 
          className={controlBase}
          value={filters.min_beds || 'any'}
          onChange={(e) => onChange({ min_beds: e.target.value })}
        >
          <option value="any">Any</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
          <option value="4">4+</option>
        </select>
      </FilterGroup>

      <div className="w-[1px] bg-border-light h-[32px] mx-1 self-center hidden lg:block opacity-20" />

      <div className="flex-[2] min-w-[200px]">
        <FilterGroup label="Broad Search">
          <div className="relative">
            <input 
              type="text"
              className={`${controlBase} pl-10`}
              placeholder="Search by keyword, address..."
              value={filters.search || ''}
              onChange={(e) => onChange({ search: e.target.value })}
            />
            <i className="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-[13px] text-text-tertiary"></i>
          </div>
        </FilterGroup>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-bg-primary border border-white/[0.04] rounded-2xl p-5 mb-8 shadow-xl">
      <div className="md:hidden mb-4">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full h-[42px] bg-bg-secondary border border-border-light rounded-xl px-4 text-[14px] text-text-secondary font-bold flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <i className="pi pi-sliders-h text-[12px]"></i> Advanced Filters
          </span>
          <i className={`pi pi-chevron-${isExpanded ? 'up' : 'down'} text-[10px]`}></i>
        </button>
      </div>
      {content}
    </div>
  );
};
