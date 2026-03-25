import React from 'react';

interface PropertyDetailModalProps {
  property: any;
  isOpen: boolean;
  onClose: () => void;
  onInvest: (p: any) => void;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({ 
  property, 
  isOpen, 
  onClose,
  onInvest
}) => {
  if (!isOpen || !property) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
      <div className="bg-bg-primary w-full max-w-2xl max-h-[90vh] rounded-xl overflow-hidden shadow-2xl flex flex-col border border-color-border/60">
        {/* Header */}
        <div className="p-4 border-b border-color-border flex items-center justify-between">
          <div>
            <h2 className="text-[17px] font-bold text-text-primary leading-tight">{property.title}</h2>
            <p className="text-[12px] text-text-tertiary">{property.city}, {property.state}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center hover:bg-bg-tertiary transition text-text-secondary"
          >
            <i className="pi pi-times"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Images */}
            <div className="space-y-3">
              <div className="aspect-video bg-bg-secondary rounded-lg overflow-hidden border border-color-border">
                {property.images && property.images.length > 0 ? (
                  <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                    <i className="pi pi-image text-4xl"></i>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(property.images || []).slice(1, 4).map((img: string, i: number) => (
                  <div key={i} className="aspect-square bg-bg-secondary rounded-md overflow-hidden border border-color-border">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Key Facts */}
            <div className="space-y-4">
              <div className="p-4 bg-bg-secondary/50 rounded-lg border border-color-border/40">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[12px] text-text-tertiary">List Price</span>
                  <span className="text-[24px] font-bold text-text-primary">${property.price.toLocaleString()}</span>
                </div>
                {property.estimated_roi && (
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-text-secondary">Expected ROI</span>
                    <span className="text-color-success font-semibold">{property.estimated_roi}% p.a.</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-bg-secondary/30 rounded-md border border-color-border/30">
                  <p className="text-[11px] text-text-tertiary uppercase truncate">Type</p>
                  <p className="text-[13px] text-text-primary font-medium">{property.property_type || 'Single Family'}</p>
                </div>
                <div className="p-3 bg-bg-secondary/30 rounded-md border border-color-border/30">
                  <p className="text-[11px] text-text-tertiary uppercase truncate">Status</p>
                  <p className="text-[13px] text-text-primary font-medium">{property.type}</p>
                </div>
                <div className="p-3 bg-bg-secondary/30 rounded-md border border-color-border/30">
                  <p className="text-[11px] text-text-tertiary uppercase truncate">Bedrooms</p>
                  <p className="text-[13px] text-text-primary font-medium">{property.bedrooms || '-'}</p>
                </div>
                <div className="p-3 bg-bg-secondary/30 rounded-md border border-color-border/30">
                  <p className="text-[11px] text-text-tertiary uppercase truncate">Bathrooms</p>
                  <p className="text-[13px] text-text-primary font-medium">{property.bathrooms || '-'}</p>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={() => onInvest(property)}
                  className="w-full py-3 bg-color-primary text-bg-primary font-bold rounded-lg hover:opacity-90 transition shadow-lg text-[14px]"
                >
                  Invest in Property
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-[15px] font-bold text-text-primary mb-3">About this property</h3>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              This property offers a unique investment opportunity within the {property.city} market. 
              {property.type === 'For Rent' 
                ? ' With steady rental demand in this area, expected yields remain strong for long-term fractional holders.' 
                : ' Strategically located with significant potential for capital appreciation over the coming years.'} 
              All financial projections are based on current market data and historical performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
