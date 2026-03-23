// Page header for the Assets route
'use client';

export function AssetsPageHeader({
  onDeposit,
  onWithdraw,
  onTransfer,
}: {
  onDeposit: () => void;
  onWithdraw: () => void;
  onTransfer: () => void;
}) {
  return (
    <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <h1 className="text-4xl font-black text-text-primary mb-2">Assets</h1>
        <p className="text-text-secondary max-w-xl">
          All your balances, deposits and withdrawals in one place
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onDeposit}
          className="bg-color-primary text-bg-primary px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-color-primary-hover transition shadow-lg shadow-color-primary/10"
        >
          <i className="pi pi-plus" /> + Deposit
        </button>
        <button
          type="button"
          onClick={onWithdraw}
          className="bg-bg-secondary border border-color-border px-6 py-2.5 rounded-lg text-text-primary font-bold flex items-center gap-2 hover:bg-bg-tertiary transition"
        >
          Withdraw
        </button>
        <button
          type="button"
          onClick={onTransfer}
          className="bg-bg-secondary border border-color-border px-6 py-2.5 rounded-lg text-text-primary font-bold flex items-center gap-2 hover:bg-bg-tertiary transition"
        >
          Transfer
        </button>
      </div>
    </header>
  );
}

