'use client';

import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import Image from 'next/image';
import Link from 'next/link';

export default function InstitutionalPage() {
  return (
    <main className="min-h-screen bg-[#0B0E11] text-text-primary selection:bg-color-primary/30 selection:text-color-primary">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-color-primary/10 to-transparent pointer-events-none" />
        <div className="max-w-[1200px] mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight">Institutional Prime Brokerage</h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-10">Bespoke liquidity, military-grade custody, and dedicated OTC trading desks for hedge funds, family offices, and market makers.</p>
          <div className="relative w-full max-w-[1000px] h-[400px] md:h-[600px] mx-auto rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(240,185,11,0.15)] border border-[#2B3139]">
            <Image 
              src="/images/institutional.png" 
              alt="Institutional Cold Storage Vault" 
              fill 
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 px-6 max-w-[800px] mx-auto space-y-12 text-text-secondary leading-relaxed">
        <div>
          <h2 className="text-3xl font-display font-bold text-text-primary mb-6">Military-Grade Custody & Cold Storage</h2>
          <p className="mb-4">Asset security is the cornerstone of our institutional offering. Prime Meridian Markets utilizes a geographically distributed network of air-gapped, multi-signature cold wallets to store 98% of institutional assets offline.</p>
          <p>Our custody infrastructure eliminates single points of failure. Transactions require strict quorum approvals across multiple secure facilities globally. Additionally, institutional funds are fully segregated and backed 1:1, verifiable via cryptographic proof-of-reserves.</p>
        </div>

        <div>
          <h2 className="text-3xl font-display font-bold text-text-primary mb-6">Over-The-Counter (OTC) Trading Desk</h2>
          <p className="mb-4">Execute large block trades without moving the market. Our premier OTC desk provides institutions with deep, off-book liquidity, offering highly competitive quotes for trades exceeding $100,000.</p>
          <p className="mb-8">Our dedicated OTC dealers operate 24/7, providing white-glove service and instantaneous settlement. Say goodbye to slippage and unpredictable order book spreads. With Prime Meridian Markets OTC, the price you are quoted is exactly the price you pay.</p>
          <div className="relative w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(240,185,11,0.1)] border border-[#2B3139] mb-4">
            <Image src="/images/institutional_otc.png" alt="Institutional OTC Trading Desk" fill className="object-cover" />
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-display font-bold text-text-primary mb-6">FIX API and Colocation Services</h2>
          <p className="mb-4">Built for High-Frequency Trading (HFT) firms, our industry-standard FIX API ensures direct, sub-millisecond access to our core matching engine. Execute complex algorithmic strategies with absolute confidence in our system architecture.</p>
          <p className="mb-8">For ultimate performance, we offer VIP colocation services at our primary data centers. Host your trading algorithms mere feet away from our servers, achieving the lowest possible latency in the digital asset space.</p>
          <div className="relative w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(240,185,11,0.1)] border border-[#2B3139] mb-4">
            <Image src="/images/institutional_server.png" alt="High-Frequency Trading Colocation Servers" fill className="object-cover" />
          </div>
        </div>
        
        <div className="pt-8 text-center">
          <a href="mailto:institutional@primemeridianmarkets.com" className="inline-block bg-color-primary hover:bg-color-primary-hover text-bg-primary px-8 py-4 rounded-md font-bold text-lg transition-all shadow-[0_0_20px_rgba(240,185,11,0.3)] hover:scale-105">
            Contact Institutional Sales
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
