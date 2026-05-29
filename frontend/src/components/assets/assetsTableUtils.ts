// Utilities for exporting and formatting Assets balances

import type { AssetRow } from './assetsTypes';

export function formatNumber(value: number, decimals = 6) {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function csvEscape(value: string) {
  const v = value ?? '';
  if (v.includes('"') || v.includes(',') || v.includes('\n')) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function exportAssetsCsv({
  userId,
  datePart,
  rows,
}: {
  userId: string;
  datePart: string; // yyyy-mm-dd
  rows: AssetRow[];
}) {
  const header = [
    'Asset',
    'Ticker',
    'Balance',
    'Available',
    'In Orders',
    'Market Price',
    '24H Change',
    'USD Value',
    'Export Date',
  ];

  const exportDate = new Date();

  const lines = [
    header.join(','),
    ...rows.map((a) =>
      [
        csvEscape(a.name),
        csvEscape(a.symbol),
        csvEscape(a.total.toString()),
        csvEscape(a.available.toString()),
        csvEscape(a.inOrders.toString()),
        csvEscape(a.price.toString()),
        csvEscape(a.change24h.toString()),
        csvEscape(a.usdValue.toString()),
        csvEscape(exportDate.toISOString()),
      ].join(',')
    ),
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const filename = `assets_${userId}_${datePart}.csv`;
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

