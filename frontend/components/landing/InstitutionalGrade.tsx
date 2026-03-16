'use client';

const features = [
  {
    icon: 'pi-bolt',
    title: 'Ultra-Low Latency',
    desc: 'Our enterprise matching engine executes orders in under 1.2ms, providing a competitive edge for high-frequency strategies.'
  },
  {
    icon: 'pi-shield',
    title: 'Custodial Perfection',
    desc: 'Assets are kept in multisig cold storage structures with geographic distribution and Swiss-grade physical security.'
  },
  {
    icon: 'pi-copy',
    title: 'Institutional Mirroring',
    desc: 'Access exclusive copy-trading streams from tier-1 institutional desks and systematic treasury managers.'
  },
  {
    icon: 'pi-chart-line',
    title: 'Deep Liquidity',
    desc: 'Consolidated order books across global exchanges ensure minimal slippage even for the largest block trades.'
  }
];

export default function InstitutionalGrade() {
  return (
    <section id="institutional" className="py-24 bg-[#0B0E11] border-t border-[#2B3139]">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="font-display text-4xl font-bold text-text-primary mb-4 tracking-tight">Designed for Sophistication</h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Beyond standard trading—Legacy FX provides the infrastructure needed to manage complex digital asset portfolios with precision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="group p-8 bg-[#161A1E] border border-[#2B3139] rounded-xl hover:border-color-primary/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-color-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <i className={`pi ${feature.icon} text-color-primary text-xl`} />
              </div>
              <h3 className="font-display text-2xl font-bold text-text-primary mb-4">{feature.title}</h3>
              <p className="text-text-secondary leading-relaxed tracking-wide">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
