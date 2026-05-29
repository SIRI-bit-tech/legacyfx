'use client';

export default function MobileApp() {
  return (
    <section className="py-24 bg-[#0B0E11] overflow-hidden relative">
      <div className="max-w-[1440px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-6 rounded">
            Mobile Access
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-text-primary mb-8 tracking-tight">
            The Market. <br />In Your Pocket.
          </h2>
          <p className="text-text-secondary text-lg mb-10 leading-relaxed max-w-lg">
            Monitor markets, execute trades, and manage your cold storage vault from anywhere in the world with our biometric-secured mobile terminal.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <button className="flex items-center gap-3 bg-[#161A1E] border border-[#2B3139] px-6 py-3 rounded-lg hover:border-text-primary transition-colors group">
              <i className="pi pi-apple text-2xl" />
              <div className="text-left">
                <div className="text-[10px] uppercase text-text-tertiary">Download on</div>
                <div className="text-sm font-bold">App Store</div>
              </div>
            </button>
            <button className="flex items-center gap-3 bg-[#161A1E] border border-[#2B3139] px-6 py-3 rounded-lg hover:border-text-primary transition-colors group">
              <i className="pi pi-play text-2xl" />
              <div className="text-left">
                <div className="text-[10px] uppercase text-text-tertiary">Get it on</div>
                <div className="text-sm font-bold">Google Play</div>
              </div>
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative z-10 bg-gradient-to-tr from-[#161A1E] to-[#2B3139] p-4 rounded-[40px] border border-[#3E434B] shadow-2xl max-w-[320px] mx-auto rotate-3 hover:rotate-0 transition-transform duration-700">
             <div className="bg-[#0B0E11] rounded-[32px] overflow-hidden aspect-[9/19] flex flex-col items-center justify-center p-8 text-center">
                <i className="pi pi-chart-bar text-color-primary text-4xl mb-6 opacity-50" />
                <p className="text-text-tertiary text-xs">Live Terminal Interface</p>
             </div>
          </div>
          {/* Floating UI Elements */}
          <div className="absolute top-20 -right-4 bg-green-500/10 border border-green-500/20 backdrop-blur-xl p-4 rounded-xl z-20 hidden md:block animate-bounce shadow-xl">
            <div className="text-green-500 font-bold text-sm">+12.42%</div>
            <div className="text-[10px] text-text-tertiary">BTC Profit</div>
          </div>
        </div>
      </div>
    </section>
  );
}
