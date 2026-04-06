'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '../dashboard-layout';
import { useSignals, SignalFilters } from '@/hooks/useSignals';
import { useSignalStats } from '@/hooks/useSignalStats';
import { SignalCard } from '@/components/signals/SignalCard';
import { SignalStats } from '@/components/signals/SignalStats';
import { SignalFiltersComponent } from '@/components/signals/SignalFilters';
import { Pagination } from '@/components/shared/Pagination';
import { api } from '@/lib/api';

export default function SignalsPage() {
  const [filters, setFilters] = useState<SignalFilters>({
    asset_type: 'all',
    signal_type: 'all',
    timeframe: '4H'
  });
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  const { signals, total, loading, error, refresh: refreshSignals } = useSignals(filters, page, 12);
  const { stats, loading: statsLoading, refresh: refreshStats } = useSignalStats();

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshMsg(null);
    try {
      const result = await api.post('/signals/refresh');
      setRefreshMsg(result.message);
      await refreshSignals();
      await refreshStats();
    } catch (err: any) {
      setRefreshMsg(err.message || 'Failed to refresh signals');
    } finally {
      setRefreshing(false);
      setTimeout(() => setRefreshMsg(null), 5000);
    }
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="bg-color-danger/5 border border-color-danger/20 rounded-2xl p-12 text-center text-color-danger">
          <i className="pi pi-exclamation-triangle text-3xl mb-4 block"></i>
          <p className="font-bold">Failed to connect to signal node</p>
          <p className="text-sm opacity-70 mt-1">{error}</p>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((id) => (
            <div key={`sig-skel-${id}`} className="bg-bg-secondary border border-color-border/30 rounded-xl h-[300px] animate-pulse"></div>
          ))}
        </div>
      );
    }

    if (signals.length === 0) {
      return (
        <div className="bg-bg-secondary/50 border border-color-border/30 rounded-2xl p-20 text-center">
          <div className="w-16 h-16 bg-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-6 border border-color-border/20 shadow-inner">
            <i className="pi pi-search text-2xl text-text-tertiary"></i>
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">No signals found</h3>
          <p className="text-sm text-text-tertiary max-w-sm mx-auto">
            We couldn't find any active signals matching your current filters. Try adjusting your timeframe or asset class.
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {signals.map((signal) => (
            <SignalCard key={signal.id || signal.symbol} signal={signal} />
          ))}
        </div>

          <div className="flex justify-center mt-12 pb-12">
            <Pagination
              page={page}
              totalPages={Math.ceil(total / 12)}
              onPageChange={setPage}
            />
          </div>

      </>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-[1400px] mx-auto min-h-screen">
        {/* Page Header */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-black text-text-primary tracking-tight mb-1">Market Signals</h1>
              <p className="text-text-tertiary text-sm max-w-2xl font-medium">
                Automated high-frequency technical analysis powered by Twelve Data.
                Our algorithms scan across {total || 22}+ pairs for optimal entries.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {refreshMsg && (
                <span className={`text-[10px] font-medium px-2 py-1 rounded ${refreshMsg.includes('error') || refreshMsg.includes('Failed') ? 'text-color-danger bg-color-danger/10' : 'text-color-success bg-color-success/10'}`}>
                  {refreshMsg}
                </span>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-3 py-1.5 rounded-lg bg-bg-secondary border border-color-border/40 text-[10px] font-bold text-text-primary uppercase tracking-widest hover:bg-bg-tertiary transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <i className={`pi ${refreshing ? 'pi-spin pi-spinner' : 'pi-refresh'} text-[9px]`}></i>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <div className="px-3 py-1.5 rounded-lg bg-bg-secondary border border-color-border/40 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-color-success shadow-[0_0_8px_rgba(22,163,74,0.6)]"></span>
                <span className="text-[10px] text-text-primary font-bold uppercase tracking-widest">System Operational</span>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Dashboard */}
        <SignalStats stats={stats} loading={statsLoading} />

        {/* Filter Section */}
        <div className="mt-8">
          <SignalFiltersComponent filters={filters} setFilters={(f) => { setFilters(f); setPage(1); }} />
        </div>

        {/* Signals Content */}
        <div className="mt-8">
          {renderContent()}
        </div>
      </div>
    </DashboardLayout>
  );
}
