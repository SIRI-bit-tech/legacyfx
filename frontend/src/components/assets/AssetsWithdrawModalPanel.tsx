// Form panel for Assets Withdraw modal
'use client';

export function AssetsWithdrawModalPanel({
  availableBalance,
  baseAssetSymbol,
  networkFeeEstimate,
  destinationAddress,
  onChangeDestination,
  amount,
  onChangeAmount,
  onMax,
  onSubmit,
  submitting,
  error,
  submittedMessage,
}: {
  availableBalance: number;
  baseAssetSymbol: string;
  networkFeeEstimate: number;
  destinationAddress: string;
  onChangeDestination: (next: string) => void;
  amount: string;
  onChangeAmount: (next: string) => void;
  onMax: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
  submittedMessage: string | null;
}) {
  return (
    <div className="p-6 space-y-6">
      <div className="bg-bg-tertiary border border-color-border p-4 rounded-lg space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-text-tertiary text-[10px] font-bold uppercase tracking-widest">Available</div>
            <div className="font-mono font-bold text-text-primary">
              {availableBalance.toFixed(8)} {baseAssetSymbol}
            </div>
          </div>
          <div>
            <div className="text-text-tertiary text-[10px] font-bold uppercase tracking-widest">Estimated fee</div>
            <div className="font-mono font-bold text-text-primary">
              {networkFeeEstimate} {baseAssetSymbol}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest">
            Destination wallet address
          </label>
          <input
            type="text"
            value={destinationAddress}
            onChange={(e) => onChangeDestination(e.target.value)}
            placeholder="Paste destination address"
            className="w-full bg-bg-primary border border-color-border rounded px-3 py-2 text-sm focus:outline-none focus:border-color-primary"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center gap-3">
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest">Amount</label>
            <button type="button" onClick={onMax} className="text-color-primary hover:underline text-xs font-bold">
              MAX
            </button>
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => onChangeAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-bg-primary border border-color-border rounded px-3 py-2 text-sm focus:outline-none focus:border-color-primary"
          />
        </div>
      </div>

      {error ? <div className="text-color-danger text-sm font-bold">{error}</div> : null}
      {submittedMessage ? (
        <div className="p-4 bg-color-warning/10 border border-color-warning/20 rounded-lg text-text-primary text-sm font-bold">
          {submittedMessage}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="w-full bg-color-primary hover:bg-color-primary-hover text-bg-primary py-4 rounded-lg font-bold text-lg transition shadow-lg shadow-color-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <span className="inline-flex items-center gap-2 justify-center">
            <i className="pi pi-spin pi-spinner" /> Requesting...
          </span>
        ) : (
          'Request Withdrawal'
        )}
      </button>
    </div>
  );
}

