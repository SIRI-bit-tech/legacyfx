'use client';

import { User } from '@/global';

interface GeneralTabProps {
   user: User | null;
   updating: boolean;
   updateSuccess: boolean;
   updateError: string | null;
   onUpdate: (e: React.FormEvent<HTMLFormElement>) => void;
}

export const GeneralTab = ({ user, updating, updateSuccess, updateError, onUpdate }: GeneralTabProps) => {
   return (
      <div className="space-y-8 animate-in fade-in duration-300">
         <form onSubmit={onUpdate} className="space-y-8">
            <div className="bg-bg-secondary border border-color-border rounded-3xl p-8 shadow-xl">
               <h3 className="text-xl font-bold text-text-primary mb-6">Personal Identity</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label htmlFor="first_name" className="text-[10px] font-black uppercase text-text-tertiary tracking-widest pl-1">First Name</label>
                     <input id="first_name" name="first_name" type="text" defaultValue={user?.first_name || ''} className="w-full bg-bg-tertiary border border-color-border rounded-xl px-4 py-3 text-text-primary focus:border-color-primary outline-none" />
                  </div>
                  <div className="space-y-2">
                     <label htmlFor="last_name" className="text-[10px] font-black uppercase text-text-tertiary tracking-widest pl-1">Last Name</label>
                     <input id="last_name" name="last_name" type="text" defaultValue={user?.last_name || ''} className="w-full bg-bg-tertiary border border-color-border rounded-xl px-4 py-3 text-text-primary focus:border-color-primary outline-none" />
                  </div>
                  <div className="space-y-2">
                     <label htmlFor="phone" className="text-[10px] font-black uppercase text-text-tertiary tracking-widest pl-1">Contact Number</label>
                     <input id="phone" name="phone" type="tel" defaultValue={user?.phone || ''} className="w-full bg-bg-tertiary border border-color-border rounded-xl px-4 py-3 text-text-primary focus:border-color-primary outline-none" />
                  </div>
                  <div className="space-y-2">
                     <label htmlFor="date_of_birth" className="text-[10px] font-black uppercase text-text-tertiary tracking-widest pl-1">Date of Birth</label>
                     <input id="date_of_birth" name="date_of_birth" type="date" defaultValue={user?.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : ''} className="w-full bg-bg-tertiary border border-color-border rounded-xl px-4 py-3 text-text-primary focus:border-color-primary outline-none" />
                  </div>
               </div>
            </div>

            <div className="bg-bg-secondary border border-color-border rounded-3xl p-8 shadow-xl">
               <h3 className="text-xl font-bold text-text-primary mb-6">Institutional Profile</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label htmlFor="username" className="text-[10px] font-black uppercase text-text-tertiary tracking-widest pl-1">Display Alias (Username)</label>
                     <input id="username" name="username" type="text" defaultValue={user?.username || ''} className="w-full bg-bg-tertiary border border-color-border rounded-xl px-4 py-3 text-text-primary focus:border-color-primary outline-none" />
                  </div>
                  <div className="space-y-2">
                     <label htmlFor="account_type" className="text-[10px] font-black uppercase text-text-tertiary tracking-widest pl-1">Account Category</label>
                     <div className="relative">
                        <select id="account_type" name="account_type" defaultValue={user?.account_type || 'INDIVIDUAL'} className="w-full bg-bg-tertiary border border-color-border rounded-xl px-4 py-3 text-text-primary appearance-none outline-none focus:border-color-primary">
                           <option value="INDIVIDUAL">Individual Account</option>
                           <option value="JOINT">Joint Account</option>
                           <option value="CORPORATE">Corporate / Institutional</option>
                        </select>
                        <i className="pi pi-chevron-down absolute right-4 top-4 text-text-tertiary pointer-events-none"></i>
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
                  {updating ? 'Saving Changes...' : 'Synchronize Profile'}
               </button>
               {updateSuccess && (
                  <span className="text-color-success text-sm font-bold flex items-center gap-2 animate-in slide-in-from-left duration-300">
                     <i className="pi pi-check-circle"></i> Profile Updated Successfully
                  </span>
               )}
               {updateError && (
                  <span className="text-color-danger text-sm font-bold flex items-center gap-2 animate-in slide-in-from-left duration-300">
                     <i className="pi pi-exclamation-circle"></i> {updateError}
                  </span>
               )}
            </div>
         </form>

         <div className="bg-bg-secondary border border-color-border rounded-3xl p-8 shadow-xl">
            <h3 className="text-xl font-bold text-text-primary mb-6">Regional Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label htmlFor="base-currency" className="text-[10px] font-black uppercase text-text-tertiary tracking-widest pl-1">Base Currency</label>
                  <div className="relative">
                     <select id="base-currency" className="w-full bg-bg-tertiary border border-color-border rounded-xl px-4 py-3 text-text-primary appearance-none outline-none focus:border-color-primary">
                        <option>US Dollar (USD)</option>
                        <option>Euro (EUR)</option>
                        <option>Bitcoin (BTC)</option>
                     </select>
                     <i className="pi pi-chevron-down absolute right-4 top-4 text-text-tertiary pointer-events-none"></i>
                  </div>
               </div>
               <div className="space-y-2">
                  <label htmlFor="timezone" className="text-[10px] font-black uppercase text-text-tertiary tracking-widest pl-1">Timezone</label>
                  <div className="relative">
                     <select id="timezone" className="w-full bg-bg-tertiary border border-color-border rounded-xl px-4 py-3 text-text-primary appearance-none outline-none focus:border-color-primary">
                        <option>UTC+00:00 (Greenwich)</option>
                        <option>UTC-05:00 (Eastern)</option>
                        <option>UTC+01:00 (London)</option>
                     </select>
                     <i className="pi pi-chevron-down absolute right-4 top-4 text-text-tertiary pointer-events-none"></i>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};
