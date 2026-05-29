'use client';

import { User } from '@/global';

interface SecurityTabProps {
   user: User | null;
   loginHistory: any[];
   trustedDevices: any[];
   onRemoveDevice: (id: string) => void;
   onChangePassword: (e: React.FormEvent<HTMLFormElement>) => void;
   onSetup2FA: () => void;
   onDisable2FA: () => void;
   onDeleteAccount: () => void;
}

export const SecurityTab = ({
   user,
   loginHistory = [],
   trustedDevices = [],
   onRemoveDevice,
   onChangePassword,
   onSetup2FA,
   onDisable2FA,
   onDeleteAccount
}: SecurityTabProps) => {
   return (
      <div className="space-y-8 animate-in fade-in duration-300">
         <div className="bg-bg-secondary border border-color-border rounded-3xl p-8 shadow-xl">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-text-primary">Two-Factor Authentication</h3>
               {user?.two_fa_enabled ? (
                  <span className="bg-color-success/10 text-color-success px-3 py-1 rounded-full text-[10px] font-black uppercase border border-color-success/20">Active</span>
               ) : (
                  <span className="bg-bg-tertiary text-text-tertiary px-3 py-1 rounded-full text-[10px] font-black uppercase border border-color-border">Disabled</span>
               )}
            </div>
            <p className="text-sm text-text-secondary mb-8 leading-relaxed">Secure your account with an extra layer of defense. Codes from Google Authenticator or Authy will be required for logins and withdrawals.</p>

            {user?.two_fa_enabled ? (
               <button onClick={onDisable2FA} className="bg-bg-tertiary border border-color-border text-text-primary px-8 py-3 rounded-xl font-black text-xs uppercase transition tracking-widest hover:border-color-danger hover:text-color-danger">
                  Disable Security Layer
               </button>
            ) : (
               <button onClick={onSetup2FA} className="bg-color-primary text-bg-primary px-8 py-3 rounded-xl font-black text-xs uppercase transition tracking-widest shadow-lg shadow-color-primary/20">
                  Setup 2FA Protection
               </button>
            )}
         </div>

         <div className="bg-bg-secondary border border-color-border rounded-3xl p-8 shadow-xl">
            <h3 className="text-xl font-bold text-text-primary mb-6">Account Password</h3>
            <form onSubmit={onChangePassword} className="space-y-4 max-w-md">
               <div className="space-y-1">
                  <label htmlFor="current_password" className="text-[10px] font-black uppercase text-text-tertiary tracking-widest pl-1">Current Password</label>
                  <input id="current_password" name="current_password" type="password" required className="w-full bg-bg-tertiary border border-color-border rounded-xl px-4 py-3 outline-none focus:border-color-primary" />
               </div>
               <div className="space-y-1">
                  <label htmlFor="new_password" className="text-[10px] font-black uppercase text-text-tertiary tracking-widest pl-1">New Password</label>
                  <input id="new_password" name="new_password" type="password" required className="w-full bg-bg-tertiary border border-color-border rounded-xl px-4 py-3 outline-none focus:border-color-primary" />
               </div>
               <div className="space-y-1">
                  <label htmlFor="confirm_password" className="text-[10px] font-black uppercase text-text-tertiary tracking-widest pl-1">Confirm New Password</label>
                  <input id="confirm_password" name="confirm_password" type="password" required className="w-full bg-bg-tertiary border border-color-border rounded-xl px-4 py-3 outline-none focus:border-color-primary" />
               </div>
               <button type="submit" className="bg-color-primary text-bg-primary px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-color-primary/90 transition shadow-lg shadow-color-primary/10">Update Password</button>
            </form>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-bg-secondary border border-color-border rounded-3xl p-8 shadow-xl overflow-hidden flex flex-col">
               <h3 className="text-xl font-bold text-text-primary mb-6">Login History</h3>
               <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                  {loginHistory.map((login, idx) => (
                     <div key={login.id || `${login.ip_address}-${login.created_at}`} className="flex items-center justify-between p-4 bg-bg-tertiary rounded-2xl border border-color-border/50">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-bg-secondary flex items-center justify-center text-text-tertiary">
                              <i className={`pi pi-${login.device_type === 'mobile' ? 'mobile' : 'desktop'} text-lg`}></i>
                           </div>
                           <div>
                              <p className="font-bold text-sm text-text-primary">{login.browser} on {login.os}</p>
                              <p className="text-[10px] text-text-tertiary font-black uppercase">{login.ip_address} • {new Date(login.created_at).toLocaleString()}</p>
                           </div>
                        </div>
                        {idx === 0 && <span className="text-[10px] font-black uppercase text-color-primary bg-color-primary/10 px-2 py-1 rounded-md">Current</span>}
                     </div>
                  ))}
                  {loginHistory.length === 0 && <p className="text-center text-text-tertiary py-4">No recent activity found.</p>}
               </div>
            </div>

            <div className="bg-bg-secondary border border-color-border rounded-3xl p-8 shadow-xl overflow-hidden flex flex-col">
               <h3 className="text-xl font-bold text-text-primary mb-6">Trusted Devices</h3>
               <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                  {trustedDevices.map((device) => (
                     <div key={device.id} className="flex items-center justify-between p-4 bg-bg-tertiary rounded-2xl border border-color-border/50">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-bg-secondary flex items-center justify-center text-text-tertiary">
                              <i className={`pi pi-${device.device_name.toLowerCase().includes('phone') ? 'mobile' : 'desktop'} text-lg`}></i>
                           </div>
                           <div>
                              <p className="font-bold text-sm text-text-primary">{device.device_name}</p>
                              <p className="text-[10px] text-text-tertiary font-black uppercase">Last used: {new Date(device.last_used).toLocaleDateString()}</p>
                           </div>
                        </div>
                        <button onClick={() => onRemoveDevice(device.id)} className="text-color-danger hover:underline text-[10px] font-black uppercase tracking-widest">Revoke Access</button>
                     </div>
                  ))}
                  {trustedDevices.length === 0 && <p className="text-center text-text-tertiary py-4">No devices currently remembered.</p>}
               </div>
            </div>
         </div>

         <div className="bg-color-danger/5 border border-color-danger/20 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-4 mb-6">
               <div className="w-12 h-12 rounded-2xl bg-color-danger/10 flex items-center justify-center text-color-danger">
                  <i className="pi pi-exclamation-triangle text-2xl"></i>
               </div>
               <div>
                  <h3 className="text-xl font-bold text-text-primary">Danger Zone</h3>
                  <p className="text-sm text-text-tertiary">Irreversible account actions</p>
               </div>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-bg-secondary border border-color-danger/10 rounded-2xl">
               <div className="space-y-1">
                  <p className="font-bold text-text-primary">Delete Institutional Account</p>
                  <p className="text-xs text-text-secondary">Permanently remove all assets, trade history, and compliance records. This action cannot be undone.</p>
               </div>
               <button 
                 onClick={onDeleteAccount}
                 className="bg-color-danger/10 text-color-danger border border-color-danger/20 px-8 py-3 rounded-xl font-black text-xs uppercase transition tracking-widest hover:bg-color-danger hover:text-white"
               >
                  Terminate Account
               </button>
            </div>
         </div>
      </div>
   );
};
