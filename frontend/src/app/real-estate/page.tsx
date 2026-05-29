'use client';

import { useState } from 'react';
import { DashboardLayout } from '../dashboard-layout';
import { RealEstateMetrics } from '@/components/real-estate/RealEstateMetrics';
import { PropertyFilters } from '@/components/real-estate/PropertyFilters';
import { PropertyGrid } from '@/components/real-estate/PropertyGrid';
import { PortfolioTable } from '@/components/real-estate/PortfolioTable';
import { PropertyDetailModal } from '@/components/real-estate/PropertyDetailModal';
import { InvestModal } from '@/components/real-estate/InvestModal';
import { useRealEstateListings } from '@/hooks/real-estate/useRealEstateListings';
import { useRealEstatePortfolio } from '@/hooks/real-estate/useRealEstatePortfolio';
import { useRealEstateInvest } from '@/hooks/real-estate/useRealEstateInvest';
import { useAuth } from '@/hooks/useAuth';

export default function RealEstatePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'marketplace' | 'portfolio'>('marketplace');
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isInvestOpen, setIsInvestOpen] = useState(false);
  
  // Custom Hooks
  const { 
    listings, loading: listingsLoading, error: listingsError, 
    filters, updateFilters, goToPage, page, total, hasMore, refresh: refreshListings 
  } = useRealEstateListings();
  
  const { 
    investments, metrics, loading: portfolioLoading, refresh: refreshPortfolio 
  } = useRealEstatePortfolio();
  
  const { 
    invest, exit, loading: actionLoading, error: actionError 
  } = useRealEstateInvest();

  const [exitingId, setExitingId] = useState<string | null>(null);

  // Handlers
  const handleOpenDetails = (property: any) => {
    setSelectedProperty(property);
    setIsDetailOpen(true);
  };

  const handleOpenInvest = (property: any) => {
    setSelectedProperty(property);
    setIsInvestOpen(true);
  };

  const handleInvestConfirm = async (amount: number, tokens: number) => {
    if (!selectedProperty) return false;
    const success = await invest(selectedProperty.id, amount, tokens);
    if (success) {
      refreshPortfolio();
      refreshListings();
    }
    return success;
  };

  const handleExit = async (investmentId: string) => {
    setExitingId(investmentId);
    const success = await exit(investmentId);
    if (success) {
      refreshPortfolio();
      refreshListings();
    }
    setExitingId(null);
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-text-primary tracking-tight">Real Estate</h1>
            <p className="text-[14px] text-text-tertiary">Fractional property investment and rental yields</p>
          </div>
          
          <div className="flex bg-bg-secondary p-1 rounded-lg border border-color-border/60">
            <button 
              onClick={() => setActiveTab('marketplace')}
              className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                activeTab === 'marketplace' 
                  ? 'bg-bg-primary text-text-primary shadow-sm border border-color-border/40' 
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Marketplace
            </button>
            <button 
              onClick={() => setActiveTab('portfolio')}
              className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                activeTab === 'portfolio' 
                  ? 'bg-bg-primary text-text-primary shadow-sm border border-color-border/40' 
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              My Portfolio
            </button>
          </div>
        </div>

        {/* Metrics Overview */}
        <RealEstateMetrics 
          metrics={metrics} 
          loading={portfolioLoading}
        />

        {/* Content Area */}
        <div className="space-y-4">
          {activeTab === 'marketplace' ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-text-primary uppercase tracking-wider">Properties for Sale</h2>
              </div>
              
              <PropertyFilters 
                filters={filters} 
                onChange={updateFilters} 
              />
              
              {listingsError && (
                <div className="p-4 bg-color-error/10 border border-color-error/20 rounded-lg text-color-error text-[13px]">
                  <i className="pi pi-exclamation-triangle mr-2"></i>
                  {listingsError}
                </div>
              )}

              <PropertyGrid 
                listings={listings}
                loading={listingsLoading}
                page={page}
                total={total}
                hasMore={hasMore}
                onPageChange={goToPage}
                onInvest={handleOpenInvest}
                onDetails={handleOpenDetails}
              />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-text-primary uppercase tracking-wider">Your Holdings</h2>
              </div>
              
              <PortfolioTable 
                investments={investments}
                loading={portfolioLoading}
                onExit={handleExit}
                exitingId={exitingId}
              />
            </>
          )}
        </div>

        {/* Action Error Toast (Simple) */}
        {actionError && (
          <div className="fixed bottom-6 right-6 z-[100] p-4 bg-bg-primary border border-color-error/40 rounded-xl shadow-2xl max-w-sm animate-slide-in">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-color-error/10 flex items-center justify-center text-color-error shrink-0">
                <i className="pi pi-exclamation-circle"></i>
              </div>
              <p className="text-[13px] text-text-primary py-1">{actionError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <PropertyDetailModal 
        property={selectedProperty}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onInvest={(p) => {
          setIsDetailOpen(false);
          handleOpenInvest(p);
        }}
      />

      <InvestModal 
        property={selectedProperty}
        userBalance={user?.account_balance || 0}
        isOpen={isInvestOpen}
        onClose={() => setIsInvestOpen(false)}
        onConfirm={handleInvestConfirm}
        loading={actionLoading}
      />
    </DashboardLayout>
  );
}
