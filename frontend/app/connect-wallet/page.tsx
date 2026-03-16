'use client';

import { DashboardLayout } from '../dashboard-layout';
import { useState } from 'react';

export default function ConnectWalletPage() {
  const wallets = [
    { name: 'MetaMask', icon: 'pi-wallet', desc: 'Secure browser extension wallet.', popular: true },
    { name: 'WalletConnect', icon: 'pi-sync', desc: 'Connect with any mobile app wallet.', popular: true },
    { name: 'Trust Wallet', icon: 'pi-shield', desc: 'Secure mobile non-custodial wallet.', popular: false },
    { name: 'Coinbase Wallet', icon: 'pi-bitcoin', desc: 'Easy way to manage dApps and tokens.', popular: false },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-12 max-w-4xl mx-auto min-h-full flex flex-col items-center">
        <header className="text-center mb-16">
          <div className="w-20 h-20 rounded-3xl bg-color-primary/10 text-color-primary flex items-center justify-center text-4xl mb-6 mx-auto border border-color-primary/20 shadow-2xl shadow-color-primary/5">
             <i className="pi pi-link"></i>
          </div>
          <h1 className="text-4xl font-black text-text-primary mb-4 tracking-tight">Connect External Wallet</h1>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">Seamlessly link your self-custody wallets to Legacy FX. Deposit, withdraw, and participate in Web3 markets directly.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
           {wallets.map((wallet) => (
             <button 
              key={wallet.name}
              className="bg-bg-secondary border border-color-border p-6 rounded-2xl flex items-center gap-6 text-left hover:border-color-primary hover:bg-bg-tertiary transition group shadow-lg"
             >
                <div className="w-16 h-16 rounded-xl bg-bg-tertiary flex items-center justify-center text-3xl text-text-tertiary group-hover:text-color-primary transition border border-color-border">
                   <i className={`pi ${wallet.icon}`}></i>
                </div>
                <div className="flex-1">
                   <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-text-primary text-lg">{wallet.name}</h3>
                      {wallet.popular && (
                        <span className="bg-color-success/10 text-color-success text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase border border-color-success/20">Popular</span>
                      )}
                   </div>
                   <p className="text-xs text-text-secondary">{wallet.desc}</p>
                </div>
                <i className="pi pi-angle-right text-text-tertiary group-hover:translate-x-1 transition-transform"></i>
             </button>
           ))}
        </div>

        <div className="mt-16 p-8 bg-bg-tertiary/30 border border-color-border rounded-3xl w-full text-center">
           <h4 className="text-text-primary font-bold mb-4 flex items-center justify-center gap-2">
              <i className="pi pi-info-circle text-color-info"></i>
              Why connect your wallet?
           </h4>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'Direct Deposits', icon: 'pi-download' },
                { title: 'NFT Portfolio', icon: 'pi-image' },
                { title: 'Gasless Swaps', icon: 'pi-bolt' },
              ].map((f, i) => (
                <div key={i} className="space-y-2">
                   <i className={`pi ${f.icon} text-lg text-text-secondary`}></i>
                   <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">{f.title}</p>
                </div>
              ))}
           </div>
        </div>

        <p className="mt-12 text-xs text-text-tertiary italic">
          By connecting your wallet, you agree to our Terms of Web3 Interaction.
        </p>
      </div>
    </DashboardLayout>
  );
}
