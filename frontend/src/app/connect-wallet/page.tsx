'use client';

import { DashboardLayout } from '../dashboard-layout';
import ConnectWallet from '../../components/ConnectWallet';

export default function ConnectWalletPage() {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-12 max-w-4xl mx-auto min-h-full flex flex-col items-center">
        <header className="text-center mb-16">
          <div className="w-20 h-20 rounded-3xl bg-color-primary/10 text-color-primary flex items-center justify-center text-4xl mb-6 mx-auto border border-color-primary/20 shadow-2xl shadow-color-primary/5">
             <i className="pi pi-link"></i>
          </div>
          <h1 className="text-4xl font-black text-text-primary mb-4 tracking-tight">External Wallet Hub</h1>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">Link your decentralized identity to Legacy FX. Unlock institutional-grade liquidity directly from your self-custody wallet.</p>
        </header>

        <div className="w-full max-w-md">
          <div className="bg-bg-secondary border border-color-border rounded-3xl p-2 shadow-2xl overflow-hidden">
             <ConnectWallet />
          </div>
        </div>

        <div className="mt-16 p-8 bg-bg-tertiary/30 border border-color-border rounded-3xl w-full text-center">
           <h4 className="text-text-primary font-bold mb-8 flex items-center justify-center gap-2 tracking-tight">
              <i className="pi pi-shield text-color-success"></i>
              Why secure your wallet with Legacy FX?
           </h4>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { title: 'Direct Deposits', icon: 'pi-download', desc: 'Instant liquidity transfer' },
                { title: 'NFT Portfolio', icon: 'pi-image', desc: 'Manage digital collectibles' },
                { title: 'Gasless Swaps', icon: 'pi-bolt', desc: 'Optimized execution' },
              ].map((f, i) => (
                <div key={i} className="space-y-3">
                   <div className="w-12 h-12 bg-bg-primary rounded-2xl flex items-center justify-center mx-auto border border-color-border">
                      <i className={`pi ${f.icon} text-lg text-color-primary`}></i>
                   </div>
                   <p className="text-[10px] font-black text-text-primary uppercase tracking-widest">{f.title}</p>
                   <p className="text-xs text-text-tertiary">{f.desc}</p>
                </div>
              ))}
           </div>
        </div>

        <p className="mt-12 text-[10px] text-text-tertiary font-bold uppercase tracking-tighter">
          Powered by WalletConnect & Institutional Protocols
        </p>
      </div>
    </DashboardLayout>
  );
}
