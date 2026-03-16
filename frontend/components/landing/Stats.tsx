'use client';

import LogoTicker from './LogoTicker';

const stats = [
  { value: '250K+', label: 'Active Traders', sub: 'Global Userbase' },
  { value: '$50B+', label: 'Trading Volume', sub: 'Monthly Average' },
  { value: '100+', label: 'Cryptocurrencies', sub: 'Institutional Pairs' },
  { value: '24/7', label: 'Availability', sub: 'Dedicated Concierge' },
];

export default function Stats() {
  return (
    <section className="py-24 bg-[#0B0E11] relative overflow-hidden">
      {/* Decorative lines */}
      <div className="absolute inset-0 opacity-10 pointer-events-none hidden md:block">
        <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-[#F0B90B] to-transparent" />
        <div className="absolute top-0 left-2/4 w-[1px] h-full bg-gradient-to-b from-transparent via-[#F0B90B] to-transparent" />
        <div className="absolute top-0 left-3/4 w-[1px] h-full bg-gradient-to-b from-transparent via-[#F0B90B] to-transparent" />
      </div>

      <div className="max-w-[1440px] mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl font-bold text-text-primary mb-4 tracking-tight">Trusted by Institutional Partners</h2>
          <p className="text-text-secondary">Unrivaled reliability for the world&apos;s most demanding traders.</p>
        </div>

        <LogoTicker />

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-y-12 gap-x-4 md:gap-12">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center group">
              <div className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-color-primary mb-2 group-hover:scale-110 transition-transform duration-500 tracking-tight text-center">
                {stat.value}
              </div>
              <div className="text-text-primary font-semibold tracking-widest uppercase text-[10px] md:text-xs mb-1 text-center whitespace-nowrap">
                {stat.label}
              </div>
              <div className="text-text-tertiary text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-center whitespace-nowrap">
                {stat.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
