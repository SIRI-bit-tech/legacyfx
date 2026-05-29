import React from 'react';

interface PropertyCardProps {
  property: any;
  onInvest: (p: any) => void;
  onDetails: (p: any) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onInvest, onDetails }) => {
  const isForRent = property.type === 'For Rent';
  
  return (
    <div className="bg-bg-primary border border-color-border/50 rounded-lg overflow-hidden flex flex-col transition-all hover:border-color-primary/30 shadow-subtle">
      {/* Image Area */}
      <div className="h-[140px] bg-bg-secondary relative overflow-hidden">
        {property.images && property.images.length > 0 ? (
          <img 
            src={property.images[0]} 
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-10 h-10 rounded-md bg-bg-tertiary flex items-center justify-center text-text-tertiary border border-color-border">
              <i className="pi pi-building text-lg"></i>
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-[10px] left-[10px]">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
            isForRent ? 'bg-color-info/20 text-color-info border border-color-info/30' : 'bg-color-primary text-bg-primary'
          }`}>
            {property.type}
          </span>
        </div>

        {property.estimated_roi && (
          <div className="absolute top-[10px] right-[10px]">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-color-success/20 text-color-success border border-color-success/30">
              ROI {property.estimated_roi}%
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-[0.875rem] flex flex-col flex-1">
        <div className="flex items-baseline gap-1 mb-0.5">
          <span className="text-[16px] font-medium text-text-primary">
            ${property.price.toLocaleString()}
          </span>
          {isForRent && (
            <span className="text-[11px] text-text-tertiary">/mo</span>
          )}
        </div>

        <h3 className="text-[12px] font-medium text-text-primary truncate mb-0.5">
          {property.title}
        </h3>
        <p className="text-[11px] text-text-tertiary mb-[10px] truncate">
          {property.city}, {property.state}
        </p>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-[6px] py-2 border-y border-color-border/40 mb-[10px]">
          <div className="text-center">
            <p className="text-[12px] font-medium text-text-primary">{property.bedrooms || '-'}</p>
            <p className="text-[10px] text-text-tertiary leading-none mt-0.5">Beds</p>
          </div>
          <div className="text-center border-x border-color-border/30">
            <p className="text-[12px] font-medium text-text-primary">{property.bathrooms || '-'}</p>
            <p className="text-[10px] text-text-tertiary leading-none mt-0.5">Baths</p>
          </div>
          <div className="text-center">
            <p className="text-[12px] font-medium text-text-primary">
              {property.area_sqft ? Math.round(property.area_sqft).toLocaleString() : '-'}
            </p>
            <p className="text-[10px] text-text-tertiary leading-none mt-0.5">Sqft</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-[6px] mt-auto">
          <button 
            onClick={() => onDetails(property)}
            className="px-3 py-1.5 rounded-md text-[11px] font-medium border border-color-border/60 text-text-secondary hover:bg-bg-tertiary transition"
          >
            Details
          </button>
          <button 
            onClick={() => onInvest(property)}
            className="flex-1 py-1.5 rounded-md text-[11px] font-bold bg-color-primary text-bg-primary hover:opacity-90 transition shadow-sm"
          >
            {isForRent ? 'Rent' : 'Invest'}
          </button>
        </div>
      </div>
    </div>
  );
};
