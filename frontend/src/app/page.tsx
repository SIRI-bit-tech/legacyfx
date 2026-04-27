'use client';

import Navbar from '../components/landing/Navbar';
import TickerTape from '../components/landing/TickerTape';
import Hero from '../components/landing/Hero';
import MarketOverview from '../components/landing/MarketOverview';
import Stats from '../components/landing/Stats';
import InstitutionalGrade from '../components/landing/InstitutionalGrade';
import MobileApp from '../components/landing/MobileApp';
import Footer from '../components/landing/Footer';
import SocialProof from '../components/landing/SocialProof';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B0E11] selection:bg-color-primary/30 selection:text-color-primary overflow-x-hidden">
      {/* Dynamic Social Proof Notifications */}
      <SocialProof />

      {/* Premium Navigation and Market Ticker */}
      <Navbar />
      <TickerTape />

      <div className="relative">
        {/* Main Content Sections */}
        <Hero />
        
        {/* Market Data & Overview with TradingView Widgets */}
        <MarketOverview />

        {/* User-specific Stats preserve original data with premium UI */}
        <Stats />

        {/* Institutional-grade features and services */}
        <InstitutionalGrade />

        {/* Mobile ecosystem presentation */}
        <MobileApp />

        {/* Final CTA and Global Footer */}
        <section className="py-32 bg-gradient-to-b from-transparent to-color-primary/10">
          <div className="max-w-[1440px] mx-auto px-6 text-center">
            <h2 className="font-display text-4xl md:text-6xl font-bold text-text-primary mb-8 tracking-tight px-4">
              Ready to claim your legacy?
            </h2>
            <p className="text-text-secondary text-xl mb-12 max-w-xl mx-auto">
              Join the world&apos;s most sophisticated digital asset ecosystem. 
              Account setup takes less than 2 minutes.
            </p>
            <div className="flex justify-center">
              <a 
                href="/signup" 
                className="bg-color-primary hover:bg-color-primary-hover text-bg-primary px-12 py-5 rounded-md font-bold text-lg transition-all shadow-[0_0_40px_-10px_rgba(240,185,11,0.5)]"
              >
                Get Started Today
              </a>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
