'use client';

import { User } from '@/global';

interface ComplianceTabProps {
   user: User | null;
   updating: boolean;
   updateSuccess: boolean;
   updateError: string | null;
   onUpdate: (e: React.FormEvent<HTMLFormElement>) => void;
   getKYCLabel: (status?: string) => string;
   getKYCStatusClass: (status?: string) => string;
}

export const ComplianceTab = ({
   user,
   updating,
   updateSuccess,
   updateError,
   onUpdate,
   getKYCLabel,
   getKYCStatusClass
}: ComplianceTabProps) => {
   return (
      <div className="space-y-8 animate-in fade-in duration-300">
         <form onSubmit={onUpdate} className="space-y-8">
            <div className="bg-bg-secondary border border-color-border rounded-3xl p-8 shadow-xl">
               <h3 className="text-xl font-bold text-text-primary mb-6">Legal & Compliance</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-2xl border border-color-border">
                        <div>
                           <p className="text-[10px] font-black uppercase text-text-tertiary tracking-widest mb-1">KYC Status</p>
                           <p className="font-bold text-text-primary">{user?.kyc_status || 'NOT_STARTED'}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getKYCStatusClass(user?.kyc_status)}`}>
                           {getKYCLabel(user?.kyc_status)}
                        </span>
                     </div>

                     <div className="space-y-2">
                        <label htmlFor="tax_residency" className="text-[10px] font-black uppercase text-text-tertiary tracking-widest pl-1">Tax Residency</label>
                        <select id="tax_residency" name="tax_residency" defaultValue={user?.tax_residency || ''} className="w-full bg-bg-tertiary border border-color-border rounded-xl px-4 py-3 text-text-primary outline-none focus:border-color-primary appearance-none">
                           <option value="">Select Country</option>
                           <option value="US">United States</option>
                           <option value="GB">United Kingdom</option>
                           <option value="EU">European Union</option>
                           <option value="OTHER">Other</option>
                        </select>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-2xl border border-color-border">
                        <label htmlFor="data_sharing_enabled" className="cursor-pointer flex-1">
                           <p className="font-bold text-text-primary">Privacy Policy Settings</p>
                           <p className="text-xs text-text-tertiary">Allow anonymous data sharing for platform optimization.</p>
                        </label>
                        <div className="flex items-center">
                           <input id="data_sharing_enabled" name="data_sharing_enabled" type="checkbox" defaultChecked={user?.data_sharing_enabled} className="w-6 h-6 rounded-lg accent-color-primary cursor-pointer" />
                        </div>
                     </div>

                     <div className="p-4 bg-bg-tertiary rounded-2xl border border-color-border space-y-3">
                        <p className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Legal Documents</p>
                        <div className="flex flex-wrap gap-3">
                           <button type="button" className="text-xs font-bold text-color-primary hover:underline flex items-center gap-2">
                              <i className="pi pi-file-pdf"></i> Terms & Conditions
                           </button>
                           <button type="button" className="text-xs font-bold text-color-primary hover:underline flex items-center gap-2">
                              <i className="pi pi-lock"></i> Privacy Policy
                           </button>
                           <button type="button" className="text-xs font-bold text-color-primary hover:underline flex items-center gap-2">
                              <i className="pi pi-info-circle"></i> Regulatory Disclosures
                           </button>
                        </div>
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
                  {updating ? 'Saving Changes...' : 'Update Compliance Data'}
               </button>
               {updateSuccess && (
                  <span className="text-color-success text-sm font-bold flex items-center gap-2 animate-in slide-in-from-left duration-300">
                     <i className="pi pi-check-circle"></i> Compliance Records Updated
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
