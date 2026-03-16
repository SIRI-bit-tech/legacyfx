'use client';

const partners = [
  { name: 'OANDA', icon: 'pi-chart-line' },
  { name: 'crunchbase', icon: 'pi-database' },
  { name: 'Bitcoin.com', icon: 'pi-bitcoin' },
  { name: 'OKX', icon: 'pi-wallet' },
  { name: 'Bitstamp', icon: 'pi-shield' },
  { name: 'Ledger', icon: 'pi-lock' },
  { name: 'Binance', icon: 'pi-verified' },
  { name: 'Coinbase', icon: 'pi-link' },
];

export default function LogoTicker() {
  // Duplicate the list to create a seamless loop
  const displayPartners = [...partners, ...partners];

  return (
    <div className="w-full py-12 overflow-hidden relative">
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#0B0E11] to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#0B0E11] to-transparent z-10" />
      
      <div className="flex animate-marquee whitespace-nowrap">
        {displayPartners.map((partner, i) => (
          <div 
            key={i} 
            className="flex items-center gap-3 px-12 opacity-40 hover:opacity-100 transition-opacity duration-300 group cursor-default"
          >
            <i className={`pi ${partner.icon} text-2xl text-text-secondary group-hover:text-color-primary transition-colors`} />
            <span className="text-xl font-bold text-text-primary tracking-tight font-display">
              {partner.name === 'crunchbase' ? partner.name : partner.name.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
