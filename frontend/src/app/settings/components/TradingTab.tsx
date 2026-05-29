'use client';

import { User } from '@/global';

interface TradingTabProps {
   user: User | null;
   updating: boolean;
   updateSuccess: boolean;
   updateError: string | null;
   onUpdate: (e: React.FormEvent<HTMLFormElement>) => void;
}

export const TradingTab = ({ user, updating, updateSuccess, updateError, onUpdate }: TradingTabProps) => {
   return (
      <div className="space-y-8 animate-in fade-in duration-300">
         <form onSubmit={onUpdate} className="space-y-8">
            <div className="bg-bg-secondary border border-color-border rounded-3xl p-8 shadow-xl">
               <h3 className="text-xl font-bold text-text-primary mb-6">Terminal Defaults</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label htmlFor="default_order_type" className="text-[10px] font-black uppercase text-text-tertiary tracking-widest pl-1">Default Order Type</label>
                     <select id="default_order_type" name="default_order_type" defaultValue={user?.default_order_type || 'MARKET'} className="w-full bg-bg-tertiary border border-color-border rounded-xl px-4 py-3 text-text-primary outline-none focus:border-color-primary appearance-none">
                        <option value="MARKET">Market Order</option>
                        <option value="LIMIT">Limit Order</option>
                        <option value="STOP">Stop Order</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label htmlFor="default_lot_size" className="text-[10px] font-black uppercase text-text-tertiary tracking-widest pl-1">Default Lot Size</label>
                     <input id="default_lot_size" name="default_lot_size" type="number" step="0.01" defaultValue={user?.default_lot_size || 0.01} className="w-full bg-bg-tertiary border border-color-border rounded-xl px-4 py-3 text-text-primary outline-none focus:border-color-primary" />
                  </div>
                  <div className="space-y-2">
                     <label htmlFor="slippage_tolerance" className="text-[10px] font-black uppercase text-text-tertiary tracking-widest pl-1">Slippage Tolerance (%)</label>
                     <input id="slippage_tolerance" name="slippage_tolerance" type="number" step="0.1" defaultValue={user?.slippage_tolerance || 0.5} className="w-full bg-bg-tertiary border border-color-border rounded-xl px-4 py-3 text-text-primary outline-none focus:border-color-primary" />
                  </div>
                  <div className="space-y-2">
                     <label htmlFor="default_leverage" className="text-[10px] font-black uppercase text-text-tertiary tracking-widest pl-1">Default Leverage</label>
                     <select id="default_leverage" name="default_leverage" defaultValue={user?.default_leverage || 100} className="w-full bg-bg-tertiary border border-color-border rounded-xl px-4 py-3 text-text-primary outline-none focus:border-color-primary appearance-none">
                        <option value="1">1:1 (No Leverage)</option>
                        <option value="10">1:10</option>
                        <option value="50">1:50</option>
                        <option value="100">1:100</option>
                        <option value="500">1:500</option>
                     </select>
                  </div>
               </div>
            </div>

            <div className="bg-bg-secondary border border-color-border rounded-3xl p-8 shadow-xl">
               <h3 className="text-xl font-bold text-text-primary mb-6">Execution Strategy</h3>
               <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-2xl border border-color-border">
                     <label htmlFor="one_click_trading" className="cursor-pointer flex-1">
                        <p className="font-bold text-text-primary">One-Click Trading</p>
                        <p className="text-xs text-text-tertiary">Execute trades instantly without confirmation popups.</p>
                     </label>
                     <div className="flex items-center">
                        <input id="one_click_trading" name="one_click_trading" type="checkbox" defaultChecked={user?.one_click_trading} className="w-6 h-6 rounded-lg accent-color-primary cursor-pointer" />
                     </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-2xl border border-color-border">
                     <label htmlFor="confirmation_dialogs" className="cursor-pointer flex-1">
                        <p className="font-bold text-text-primary">Confirmation Dialogs</p>
                        <p className="text-xs text-text-tertiary">Show a summary before finalizing any market action.</p>
                     </label>
                     <div className="flex items-center">
                        <input id="confirmation_dialogs" name="confirmation_dialogs" type="checkbox" defaultChecked={user?.confirmation_dialogs} className="w-6 h-6 rounded-lg accent-color-primary cursor-pointer" />
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-4">
               <button
                  type="submit"
                  disabled={updating}
                  className="bg-color-primary hover:bg-color-primary/90 disabled:bg-color-primary/50 text-bg-primary px-8 py-3 rounded-xl font-black text-xs uppercase transition tracking-widest shadow-xl shadow-color-primary/10"
               >
                  {updating ? 'Saving Preferences...' : 'Apply Trading Settings'}
               </button>
               {updateSuccess && (
                  <span className="text-color-success text-sm font-bold flex items-center gap-2 animate-in slide-in-from-left duration-300">
                     <i className="pi pi-check-circle"></i> Preferences Synchronized
                  </span>
               )}
               {updateError && (
                  <span className="text-color-danger text-sm font-bold flex items-center gap-2 animate-in slide-in-from-left duration-300">
                     <i className="pi pi-exclamation-circle"></i> {updateError}
                  </span>
               )}
            </div>
         </form>
      </div>
   );
};
