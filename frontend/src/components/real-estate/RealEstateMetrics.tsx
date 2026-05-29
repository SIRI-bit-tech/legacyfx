import React from 'react';

interface MetricProps {
  label: string;
  value: string | number;
  subLabel?: string;
  subValue?: string;
  subColor?: string;
  loading?: boolean;
}

const MetricCard: React.FC<MetricProps> = ({ label, value, subLabel, subValue, subColor, loading }) => (
  <div className="bg-bg-secondary rounded-lg p-[0.875rem] flex flex-col">
    <span className="text-[11px] text-text-tertiary uppercase tracking-[0.04em] mb-1.5 leading-none">
      {label}
    </span>
    <span className="text-[20px] font-medium text-text-primary leading-tight">
      {loading ? '--' : value}
    </span>
    {(subLabel || subValue) && (
      <span className={`text-[11px] mt-1 ${subColor || 'text-text-tertiary'}`}>
        {subLabel} {subValue}
      </span>
    )}
  </div>
);

interface RealEstateMetricsProps {
  metrics: {
    totalValue: number;
    activeCount: number;
    monthlyIncome: number;
    avgRoi: number;
  };
  loading?: boolean;
}

export const RealEstateMetrics: React.FC<RealEstateMetricsProps> = ({ metrics, loading }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-[10px] mb-5">
      <MetricCard 
        label="Total balance"
        value={`$${metrics.totalValue.toLocaleString()}`}
        subLabel="+ $0.00"
        subColor="text-color-success"
        loading={loading}
      />
      <MetricCard 
        label="Active investments"
        value={metrics.activeCount}
        subLabel={`Across ${metrics.activeCount} properties`}
        loading={loading}
      />
      <MetricCard 
        label="Monthly income"
        value={`$${metrics.monthlyIncome.toLocaleString()}`}
        subLabel="Rental yield"
        subColor="text-color-success"
        loading={loading}
      />
      <MetricCard 
        label="Avg. ROI"
        value={`${Number(metrics.avgRoi || 0).toFixed(1)}%`}
        subLabel="Annualised return"
        subColor="text-color-primary"
        loading={loading}
      />
    </div>
  );
};
