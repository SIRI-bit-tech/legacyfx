'use client';

interface TwoFAModalProps {
   show: boolean;
   onClose: () => void;
   setupData: any;
   twoFACode: string;
   setTwoFACode: (code: string) => void;
   onEnable: () => void;
}

export const TwoFAModal = ({
   show,
   onClose,
   setupData,
   twoFACode,
   setTwoFACode,
   onEnable
}: TwoFAModalProps) => {
   if (!show) return null;

   return (
      <div className="fixed inset-0 bg-bg-primary/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
         <div className="bg-bg-secondary border border-color-border rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-text-primary">Setup 2FA Protection</h3>
               <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
                  <i className="pi pi-times"></i>
               </button>
            </div>

            <div className="space-y-6">
               <div className="bg-white p-4 rounded-2xl flex justify-center shadow-inner">
                  {setupData?.qr_code && (
                     <img src={setupData.qr_code} alt="2FA QR Code" className="w-48 h-48" />
                  )}
               </div>

               <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-text-tertiary tracking-widest text-center">Secret Key</p>
                  <p className="bg-bg-tertiary p-3 rounded-xl border border-color-border font-mono text-xs text-center text-color-primary select-all">
                     {setupData?.secret}
                  </p>
                  <p className="text-[10px] text-text-tertiary text-center">Scan the QR code or enter the secret manually into your authenticator app.</p>
               </div>

               <div className="space-y-1">
                  <label htmlFor="two_fa_code_input" className="text-[10px] font-black uppercase text-text-tertiary tracking-widest pl-1">Verification Code</label>
                  <input
                     id="two_fa_code_input"
                     type="text"
                     value={twoFACode}
                     onChange={(e) => setTwoFACode(e.target.value)}
                     placeholder="000000"
                     className="w-full bg-bg-tertiary border border-color-border rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-[1em] text-color-primary outline-none focus:border-color-primary"
                  />
               </div>

               <button
                  onClick={onEnable}
                  className="w-full bg-color-primary text-bg-primary py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-color-primary/20 hover:bg-color-primary/90 transition"
               >
                  Verify & Enable
               </button>
            </div>
         </div>
      </div>
   );
};
