// Metric card used on the Assets page
'use client';

import React from 'react';

export function AssetsMetricCard({
  label,
  value,
  subLabel,
  subLabelTone = 'neutral',
  icon,
}: {
  label: string;
  value: string;
  subLabel: string;
  subLabelTone?: 'success' | 'danger' | 'neutral';
  icon?: React.ReactNode;
}) {
  const toneClass =
    subLabelTone === 'success'
      ? 'text-color-success'
      : subLabelTone === 'danger'
        ? 'text-color-danger'
        : 'text-text-tertiary';

  return (
    <div className="bg-bg-secondary border border-color-border rounded-2xl p-6 hover:border-color-primary/30 transition shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">{label}</p>
        {icon ? <div className="text-color-primary">{icon}</div> : null}
      </div>
      <p className="font-mono text-3xl font-bold text-text-primary tracking-tight">{value}</p>
      <p className={`text-[10px] font-bold mt-3 ${toneClass}`}>{subLabel}</p>
    </div>
  );
}

