'use client';

import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import Image from 'next/image';
import Link from 'next/link';

export default function InvestingPage() {
  return (
    <main className="min-h-screen bg-[#0B0E11] text-text-primary selection:bg-color-primary/30 selection:text-color-primary">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-color-primary/10 to-transparent pointer-events-none" />
        <div className="max-w-[1200px] mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight">Intelligent Wealth Management</h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-10">Grow your capital with high-yield staking, real estate tokenization, and managed crypto portfolios tailored for long-term investors.</p>
          <div className="relative w-full max-w-[1000px] h-[400px] md:h-[600px] mx-auto rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(240,185,11,0.15)] border border-[#2B3139]">
            <Image 
              src="/images/investing.png" 
              alt="Investing Portfolio Interface" 
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
          <h2 className="text-3xl font-display font-bold text-text-primary mb-6">High-Yield Staking & Savings</h2>
          <p className="mb-4">Put your idle assets to work. Prime Meridian Markets offers competitive Annual Percentage Yields (APY) on major stablecoins like USDT and USDC, as well as native staking for Proof-of-Stake protocols including Ethereum (ETH), Solana (SOL), and Polkadot (DOT).</p>
          <p className="mb-8">Our auto-compounding feature automatically reinvests your daily rewards, exponentially growing your digital wealth over time. You have the flexibility to choose between fixed-term lockups for maximum yields or flexible terms for instant liquidity.</p>
          <div className="relative w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(240,185,11,0.1)] border border-[#2B3139] mb-4">
            <Image src="/images/investing_staking.png" alt="High-Yield Staking Interface" fill className="object-cover" />
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-display font-bold text-text-primary mb-6">Real Estate Tokenization</h2>
          <p className="mb-4">Gain fractional ownership of high-value, income-producing real estate across the globe. Through our tokenized real estate portal, you can invest in commercial properties, luxury residential developments, and industrial logistics centers with minimal capital requirements.</p>
          <p className="mb-8">Enjoy monthly dividend payouts derived directly from tenant rental income, distributed automatically to your wallet in stablecoins. Real estate tokens also benefit from historical capital appreciation, offering a perfect hedge against fiat inflation.</p>
          <div className="relative w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(240,185,11,0.1)] border border-[#2B3139] mb-4">
            <Image src="/images/investing_realestate.png" alt="Real Estate Tokenization" fill className="object-cover" />
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-display font-bold text-text-primary mb-6">Managed Portfolios & Copy Trading</h2>
          <p className="mb-4">Not an expert trader? Not a problem. Explore our meticulously curated Crypto Indices, designed by veteran financial analysts to give you diversified exposure to the entire blockchain ecosystem with a single click (e.g., Top 10 DeFi Tokens, Layer-1 Infrastructure Index).</p>
          <p>Alternatively, browse our transparent Copy Trading leaderboard to find profitable master traders. You can mirror their precise trades automatically in real-time, benefiting from their expertise while maintaining full custody of your funds.</p>
        </div>
        
        <div className="pt-8 text-center">
          <Link href="/signup" className="inline-block bg-color-primary hover:bg-color-primary-hover text-bg-primary px-8 py-4 rounded-md font-bold text-lg transition-all shadow-[0_0_20px_rgba(240,185,11,0.3)] hover:scale-105">
            Start Investing Now
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
