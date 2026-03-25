import React from 'react';

interface PortfolioTableProps {
  investments: any[];
  loading: boolean;
  onExit: (investmentId: string) => void;
  exitingId: string | null;
}

export const PortfolioTable: React.FC<PortfolioTableProps> = ({ 
  investments, 
  loading, 
  onExit,
  exitingId 
}) => {
  if (loading && investments.length === 0) {
    return (
      <div className="w-full space-y-2 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-bg-secondary rounded-lg" />
        ))}
      </div>
    );
  }

  if (investments.length === 0) {
    return (
      <div className="bg-bg-secondary/30 border border-color-border/40 rounded-xl py-12 flex flex-col items-center justify-center text-center px-4">
        <div className="w-12 h-12 rounded-full bg-bg-tertiary flex items-center justify-center mb-3 text-text-tertiary">
          <i className="pi pi-briefcase text-xl"></i>
        </div>
        <p className="text-[14px] text-text-secondary font-medium">No active investments</p>
        <p className="text-[12px] text-text-tertiary">Your real estate investments will appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-primary border border-color-border/50 rounded-xl overflow-hidden shadow-subtle">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg-secondary/50 border-b border-color-border/50">
              <th className="px-5 py-3 text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Property</th>
              <th className="px-5 py-3 text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Invested</th>
              <th className="px-5 py-3 text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Value</th>
              <th className="px-5 py-3 text-[11px] font-bold text-text-tertiary uppercase tracking-wider">ROI</th>
              <th className="px-5 py-3 text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Monthly Income</th>
              <th className="px-5 py-3 text-[11px] font-bold text-text-tertiary uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-color-border/30">
            {investments.map((inv) => (
              <tr key={inv.id} className="hover:bg-bg-secondary/20 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-bg-secondary overflow-hidden border border-color-border/40">
                      <div className="w-full h-full bg-color-primary/10 flex items-center justify-center text-color-primary">
                        <i className="pi pi-building text-xs"></i>
                      </div>
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-text-primary line-clamp-1">{inv.title}</p>
                      <p className="text-[11px] text-text-tertiary">{inv.location}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p className="text-[13px] text-text-primary">${inv.amount_invested.toLocaleString()}</p>
                  <p className="text-[10px] text-text-tertiary">{inv.tokens.toLocaleString()} RE-TOKENS</p>
                </td>
                <td className="px-5 py-4">
                  <p className="text-[13px] text-text-primary font-medium">${inv.current_value.toLocaleString()}</p>
                  <p className="text-[10px] text-color-success">+0.0%</p>
                </td>
                <td className="px-5 py-4">
                  <span className="text-[12px] font-medium text-color-success">{inv.roi}%</span>
                </td>
                <td className="px-5 py-4">
                  <p className="text-[13px] text-text-primary">${inv.monthly_income.toLocaleString()}</p>
                  <p className="text-[10px] text-text-tertiary">Est. Yield</p>
                </td>
                <td className="px-5 py-4 text-right">
                  <button 
                    onClick={() => onExit(inv.id)}
                    disabled={exitingId === inv.id}
                    className="px-3 py-1.5 rounded bg-bg-secondary border border-color-border/60 text-[11px] font-medium text-text-secondary hover:text-color-error hover:border-color-error/30 transition-all flex items-center gap-2 justify-center ml-auto"
                  >
                    {exitingId === inv.id ? <i className="pi pi-spin pi-spinner"></i> : 'Exit Position'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
