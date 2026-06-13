'use client';

import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

export default function RiskWarning() {
  return (
    <main className="min-h-screen bg-[#0B0E11] text-text-primary selection:bg-color-primary/30 selection:text-color-primary">
      <Navbar />
      <div className="max-w-[800px] mx-auto px-6 py-32">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-12 tracking-tight">Risk Warning</h1>
        
        <div className="space-y-8 text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">High Risk Investment Warning</h2>
            <p>Trading foreign exchange (Forex), cryptocurrencies, and other financial instruments on margin carries a high level of risk and may not be suitable for all investors. The high degree of leverage can work against you as well as for you. Before deciding to trade any such leveraged products, you should carefully consider your investment objectives, level of experience, and risk appetite.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Possibility of Total Loss</h2>
            <p>There is a substantial possibility that you could sustain a loss of some or all of your initial investment. Therefore, you should not invest money that you cannot afford to lose. You should be aware of all the risks associated with trading on margin and seek advice from an independent financial advisor if you have any doubts.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Market Volatility and Cryptocurrencies</h2>
            <p>Cryptocurrency markets are decentralized, largely unregulated, and exceptionally volatile. Prices can fluctuate wildly on any given day. Due to these price fluctuations, your holdings may significantly increase or decrease in value at any given moment. Prime Meridian Markets does not guarantee the stability, liquidity, or continuous availability of any specific digital asset.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Execution Risks</h2>
            <p>While we pride ourselves on an ultra-low latency matching engine, internet-based trading systems involve inherent risks. These include, but are not limited to, the failure of hardware, software, and internet connections. Prime Meridian Markets is not responsible for communication failures, latency, or delays experienced when trading via the internet.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">No Investment Advice</h2>
            <p>Any opinions, news, research, analyses, prices, signals, or other information contained on this website are provided as general market commentary and do not constitute investment advice. Prime Meridian Markets will not accept liability for any loss or damage, including without limitation to, any loss of profit, which may arise directly or indirectly from the use of or reliance on such information.</p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
