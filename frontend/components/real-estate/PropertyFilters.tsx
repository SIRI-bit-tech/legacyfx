import React, { useState } from 'react';

interface PropertyFiltersProps {
  filters: any;
  onChange: (newFilters: any) => void;
}

export const PropertyFilters: React.FC<PropertyFiltersProps> = ({ filters, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const FilterGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-text-tertiary uppercase font-bold tracking-[0.05em]">
        {label}
      </label>
      {children}
    </div>
  );

  // Simplified and fixed classes to prevent clipping
  const controlClass = "h-[36px] bg-bg-secondary border border-border-light rounded-md px-3 text-[12px] text-text-primary focus:outline-none focus:border-color-primary transition min-w-[130px]";

  const content = (
    <div className={`${isExpanded ? 'flex' : 'hidden md:flex'} flex-wrap items-end gap-[12px]`}>
      <FilterGroup label="Type">
        <select 
          className={controlClass}
          value={filters.type || 'all'}
          onChange={(e) => onChange({ type: e.target.value })}
        >
          <option value="all">All types</option>
          <option value="sale">For sale</option>
          <option value="rent">For rent</option>
        </select>
      </FilterGroup>

      <FilterGroup label="Location">
        <input 
          type="text"
          className={`${controlClass} w-[160px]`}
          placeholder="City, State..."
          value={filters.city || ''}
          onChange={(e) => onChange({ city: e.target.value })}
        />
      </FilterGroup>

      <FilterGroup label="Price range">
        <select 
          className={controlClass}
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

      <FilterGroup label="Property type">
        <select 
          className={controlClass}
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

      <FilterGroup label="Bedrooms">
        <select 
          className={controlClass}
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

      <div className="w-[1px] bg-border-light h-[36px] mx-1 self-end hidden lg:block opacity-30" />

      <FilterGroup label="Search">
        <div className="relative">
          <input 
            type="text"
            className={`${controlClass} w-[180px] pl-[34px]`}
            placeholder="Search properties..."
            value={filters.search || ''}
            onChange={(e) => onChange({ search: e.target.value })}
          />
          <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-text-tertiary"></i>
        </div>
      </FilterGroup>
    </div>
  );

  return (
    <div className="w-full bg-bg-primary border border-border/60 rounded-xl p-4 mb-6 shadow-sm">
      <div className="md:hidden mb-2">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full h-[36px] bg-bg-secondary border border-border-light rounded-lg px-3 text-[13px] text-text-secondary font-medium flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <i className="pi pi-filter text-[11px]"></i>
            Filters
          </span>
          <i className={`pi pi-chevron-${isExpanded ? 'up' : 'down'} text-[10px]`}></i>
        </button>
      </div>
      {content}
    </div>
  );
};
