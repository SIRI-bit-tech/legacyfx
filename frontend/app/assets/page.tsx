import { DashboardLayout } from '../dashboard-layout';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export default function AssetsPage() {
  const [holdings, setHoldings] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.TRADES.PORTFOLIO);
      setPortfolio(res);
      setHoldings(res.holdings || []);
    } catch (err) {
      console.error('Failed to load assets:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <i className="pi pi-spin pi-spinner text-4xl text-color-primary"></i>
        </div>
      </DashboardLayout>
    );
  }


  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">My Assets</h1>
            <p className="text-text-secondary">Overview of all your holdings and their current market performance.</p>
          </div>
          <div className="flex gap-3">
             <button className="bg-bg-secondary border border-color-border px-6 py-2.5 rounded-lg text-text-primary font-bold flex items-center gap-2 hover:bg-bg-tertiary transition">
                <i className="pi pi-download"></i> Export CSV
             </button>
             <button className="bg-color-primary text-bg-primary px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-color-primary-hover transition">
                <i className="pi pi-plus"></i> Buy Assets
             </button>
          </div>
        </header>

        {/* Portfolio Summary Card */}
        <div className="bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-color-border p-8 rounded-3xl mb-12 flex flex-col md:flex-row items-center gap-12 shadow-2xl overflow-hidden relative">
           <div className="absolute top-0 right-0 w-64 h-64 bg-color-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
           
           <div className="flex-1 space-y-2">
              <p className="text-sm font-black text-text-tertiary uppercase tracking-widest">Total Net Worth</p>
              <h2 className="text-5xl font-black text-text-primary tracking-tight">${(portfolio?.total_value || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
              <div className={`flex items-center gap-2 font-bold ${portfolio?.total_pnl >= 0 ? 'text-color-success' : 'text-color-danger'}`}>
                 <i className={`pi ${portfolio?.total_pnl >= 0 ? 'pi-arrow-up-right' : 'pi-arrow-down-right'}`}></i>
                 <span>{portfolio?.total_pnl >= 0 ? '+' : ''}{(portfolio?.total_pnl || 0).toFixed(2)}% Past 24h</span>
              </div>
           </div>

           <div className="w-full md:w-auto flex flex-wrap gap-8">
              <div>
                 <p className="text-[10px] text-text-tertiary font-bold uppercase mb-1">Trading Balance</p>
                 <p className="text-xl font-bold text-text-primary">${(portfolio?.total_value - (portfolio?.holdings?.reduce((acc: number, h: any) => acc + h.value, 0) || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
              <div>
                 <p className="text-[10px] text-text-tertiary font-bold uppercase mb-1">Positions Count</p>
                 <p className="text-xl font-bold text-text-primary">{holdings.length}</p>
              </div>
              <div>
                 <p className="text-[10px] text-text-tertiary font-bold uppercase mb-1">Cold Storage</p>
                 <p className="text-xl font-bold text-color-primary">$0.00</p>
              </div>
           </div>
        </div>

        {/* Asset List */}
        <div className="bg-bg-secondary border border-color-border rounded-2xl overflow-hidden shadow-xl">
           <div className="p-6 border-b border-color-border flex justify-between items-center">
              <h3 className="font-bold text-lg">Portfolio Breakdown</h3>
              <div className="relative">
                 <i className="pi pi-search absolute left-3 top-2.5 text-text-tertiary text-sm"></i>
                 <input type="text" placeholder="Search assets" className="bg-bg-tertiary border border-color-border rounded-lg pl-9 py-2 text-sm focus:border-color-primary outline-none" />
              </div>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-bg-tertiary/50 text-text-tertiary text-[10px] uppercase font-bold tracking-widest">
                       <th className="px-6 py-4">Asset</th>
                       <th className="px-6 py-4">Balance</th>
                       <th className="px-6 py-4 text-right">Market Price</th>
                       <th className="px-6 py-4 text-right">24h Change</th>
                       <th className="px-6 py-4 text-right">USD Value</th>
                       <th className="px-6 py-4"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-color-border">
                    {holdings.map((asset: any) => (
                       <tr key={asset.symbol} className="hover:bg-bg-tertiary/30 transition-colors group">
                          <td className="px-6 py-5">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center font-black text-xs text-text-primary border border-color-border group-hover:border-color-primary/50 transition">
                                   {asset.symbol.substring(0,2)}
                                </div>
                                <div>
                                   <p className="font-bold text-text-primary">{asset.symbol}</p>
                                   <p className="text-[10px] text-text-tertiary font-bold">{asset.symbol}/USDT</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-5">
                             <p className="font-mono text-sm text-text-primary">{asset.quantity.toFixed(6)}</p>
                          </td>
                          <td className="px-6 py-5 text-right">
                             <p className="font-mono text-sm text-text-primary">${asset.current_price.toLocaleString()}</p>
                          </td>
                          <td className="px-6 py-5 text-right">
                             <span className={`text-xs font-bold px-2 py-1 rounded-full ${asset.pnl_percentage >= 0 ? 'bg-color-success/10 text-color-success' : 'bg-color-danger/10 text-color-danger'}`}>
                                {asset.pnl_percentage >= 0 ? '+' : ''}{asset.pnl_percentage.toFixed(2)}%
                             </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                             <p className="font-mono text-sm font-bold text-text-primary">${asset.value.toLocaleString()}</p>
                          </td>
                          <td className="px-6 py-5 text-right">
                             <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 text-text-tertiary hover:text-color-primary"><i className="pi pi-sync"></i></button>
                                <button className="p-2 text-text-tertiary hover:text-color-danger"><i className="pi pi-minus-circle"></i></button>
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
