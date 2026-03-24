// Empty state for Assets balances table
'use client';

export function AssetsBalancesEmptyState({
  onDeposit,
  defaultAssetSymbol,
}: {
  onDeposit: (assetSymbol: string) => void;
  defaultAssetSymbol: string;
}) {
  return (
    <div className="p-10 text-center">
      <p className="text-text-secondary font-bold mb-6">No assets yet. Deposit or buy your first asset.</p>
      <button
        type="button"
        onClick={() => onDeposit(defaultAssetSymbol)}
        className="bg-color-primary text-bg-primary px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-color-primary-hover transition shadow-lg shadow-color-primary/10 mx-auto"
      >
        <i className="pi pi-plus" /> Deposit
      </button>
    </div>
  );
}

