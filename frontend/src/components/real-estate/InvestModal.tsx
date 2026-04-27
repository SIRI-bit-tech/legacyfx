import React, { useState, useEffect } from 'react';

interface InvestModalProps {
  property: any;
  userBalance: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, tokens: number) => Promise<boolean>;
  loading: boolean;
}

export const InvestModal: React.FC<InvestModalProps> = ({ 
  property, 
  userBalance, 
  isOpen, 
  onClose,
  onConfirm,
  loading
}) => {
  const [amount, setAmount] = useState<string>('500');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !property) return null;

  const TOKEN_PRICE = 1; // $1 per token for simplicity
  const tokens = parseFloat(amount) / TOKEN_PRICE;
  const isValid = parseFloat(amount) >= 100 && parseFloat(amount) <= userBalance;

  const handleConfirm = async () => {
    if (!isValid) return;
    const success = await onConfirm(parseFloat(amount), Math.floor(tokens));
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-bg-primary w-full max-w-md rounded-xl overflow-hidden shadow-2xl border border-color-border/60">
        <div className="p-4 border-b border-color-border flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-text-primary">Fractional Investment</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary"><i className="pi pi-times"></i></button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-6 p-3 bg-bg-secondary rounded-lg border border-color-border/40">
            <div className="w-12 h-12 bg-bg-tertiary rounded overflow-hidden flex-shrink-0">
              {property.images?.[0] ? <img src={property.images[0]} className="w-full h-full object-cover" /> : null}
            </div>
            <div>
              <p className="text-[13px] font-medium text-text-primary truncate">{property.title}</p>
              <p className="text-[11px] text-text-tertiary">ROI: {property.estimated_roi}% p.a.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[11px] uppercase tracking-wider text-text-tertiary mb-1.5 font-medium">
                <span>Investment Amount</span>
                <span>Balance: ${userBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-text-tertiary">$</span>
                <input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-[44px] bg-bg-secondary border border-color-border rounded-lg pl-7 pr-4 text-[15px] text-text-primary focus:border-color-primary outline-none transition"
                  placeholder="Minimum $100"
                />
              </div>
            </div>

            <div className="p-4 bg-bg-secondary/40 rounded-lg border border-color-border/30 space-y-2">
              <div className="flex justify-between text-[13px]">
                <span className="text-text-tertiary">Tokens to receive</span>
                <span className="text-text-primary font-medium">{tokens.toLocaleString()} RE-TOKENS</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-text-tertiary">Ownership share</span>
                <span className="text-text-primary font-medium">{(tokens / 1000000).toFixed(6)}%</span>
              </div>
              <div className="pt-2 border-t border-color-border/30 flex justify-between text-[13px]">
                <span className="text-text-primary">Total Investment</span>
                <span className="text-color-primary font-bold">${parseFloat(amount || '0').toLocaleString()}</span>
              </div>
            </div>

            {parseFloat(amount) > userBalance && (
              <p className="text-[11px] text-color-error flex items-center gap-1">
                <i className="pi pi-exclamation-circle"></i> Insufficient balance
              </p>
            )}

            <button 
              onClick={handleConfirm}
              disabled={loading || !isValid}
              className="w-full py-3 bg-color-primary text-bg-primary font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition shadow-lg text-[14px] flex items-center justify-center gap-2"
            >
              {loading ? <i className="pi pi-spin pi-spinner"></i> : null}
              Confirm Investment
            </button>

            <p className="text-[10px] text-text-tertiary text-center px-4 leading-normal">
              By confirming, you agree to the fractional ownership terms and risk disclosure. Funds will be deducted from your account balance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
