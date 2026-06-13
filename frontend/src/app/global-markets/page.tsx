'use client';

import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import Image from 'next/image';
import Link from 'next/link';

export default function GlobalMarketsPage() {
  return (
    <main className="min-h-screen bg-[#0B0E11] text-text-primary selection:bg-color-primary/30 selection:text-color-primary">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-color-primary/10 to-transparent pointer-events-none" />
        <div className="max-w-[1200px] mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight">Global Markets at Your Fingertips</h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-10">Access 350+ digital assets, forex pairs, and equity indices with deep liquidity and ultra-low latency execution.</p>
          <div className="relative w-full max-w-[1000px] h-[400px] md:h-[600px] mx-auto rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(240,185,11,0.15)] border border-[#2B3139]">
            <Image 
              src="/images/markets.png" 
              alt="Markets Overview Dashboard" 
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
          <h2 className="text-3xl font-display font-bold text-text-primary mb-6">Deep Liquidity and Unmatched Execution</h2>
          <p className="mb-4">Prime Meridian Markets connects directly with top-tier liquidity providers to ensure that your large-block trades are executed with zero to minimal slippage. Our matching engine is built in C++ and handles millions of requests per second, achieving a median latency of under 1.2 milliseconds.</p>
          <p className="mb-8">Whether you are trading high-frequency crypto pairs like BTC/USD or exploring emerging DeFi tokens, our order book remains robust and stable even during extreme market volatility events.</p>
          <div className="relative w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(240,185,11,0.1)] border border-[#2B3139] mb-4">
            <Image src="/images/markets_assets.png" alt="Multi-Asset Ecosystem" fill className="object-cover" />
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-display font-bold text-text-primary mb-6">Advanced Charting and Real-Time Data</h2>
          <p className="mb-4">We integrate native TradingView charts directly into the platform, providing you with over 100+ technical indicators, drawing tools, and multi-timeframe analysis. Our WebSocket feeds deliver real-time tick data without artificial delays or rate limiting for institutional accounts.</p>
          <p className="mb-8">Analyze market depth, historical volume profiles, and utilize advanced order types (such as Iceberg, Fill-or-Kill, and Post-Only) to execute your precise trading strategies.</p>
          <div className="relative w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(240,185,11,0.1)] border border-[#2B3139] mb-4">
            <Image src="/images/markets_chart.png" alt="Advanced Trading Charts" fill className="object-cover" />
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-display font-bold text-text-primary mb-6">Multi-Asset Ecosystem</h2>
          <p className="mb-4">Diversify your portfolio without leaving the platform. In addition to Spot and Futures cryptocurrency trading, we offer tokenized access to global stock indices, commodities, and select forex pairs. Cross-margin capabilities allow you to use your existing crypto holdings as collateral to trade traditional markets.</p>
          <p>We continuously vet and add new assets to our platform, ensuring they meet strict regulatory and liquidity requirements before being offered to our clients.</p>
        </div>
        
        <div className="pt-8 text-center">
          <Link href="/signup" className="inline-block bg-color-primary hover:bg-color-primary-hover text-bg-primary px-8 py-4 rounded-md font-bold text-lg transition-all shadow-[0_0_20px_rgba(240,185,11,0.3)] hover:scale-105">
            Start Trading Now
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
