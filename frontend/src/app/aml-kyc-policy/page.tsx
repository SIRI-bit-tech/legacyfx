'use client';

import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

export default function AmlKycPolicy() {
  return (
    <main className="min-h-screen bg-[#0B0E11] text-text-primary selection:bg-color-primary/30 selection:text-color-primary">
      <Navbar />
      <div className="max-w-[800px] mx-auto px-6 py-32">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-12 tracking-tight">AML & KYC Policy</h1>
        
        <div className="space-y-8 text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Introduction</h2>
            <p>Prime Meridian Markets strictly adheres to global Anti-Money Laundering (AML) and Counter-Terrorism Financing (CTF) guidelines. To maintain a secure financial environment and comply with international regulations, we have implemented a comprehensive Know Your Customer (KYC) protocol.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Know Your Customer (KYC) Requirements</h2>
            <p className="mb-4">Before engaging in fiat deposits, substantial crypto transfers, or margin trading, users must complete identity verification. Required documentation typically includes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Proof of Identity:</strong> A valid, government-issued passport, national ID card, or driver's license.</li>
              <li><strong>Proof of Residence:</strong> A recent utility bill, bank statement, or tax document dated within the last 3 months, clearly showing your name and residential address.</li>
              <li><strong>Liveness Check:</strong> A facial biometric scan or selfie holding the identity document to ensure physical presence.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Anti-Money Laundering (AML) Measures</h2>
            <p className="mb-4">Our compliance team utilizes advanced analytics and blockchain forensics to monitor all transactions. Our AML measures include:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Continuous monitoring of deposits and withdrawals against global sanction lists (OFAC, UN, EU).</li>
              <li>Blockchain analysis to trace crypto funds originating from mixers, darknet markets, or known ransomware addresses.</li>
              <li>Reporting of suspicious transactions (STRs) to the relevant financial intelligence units.</li>
              <li>Prohibiting third-party payments—all funding sources must match the verified name on the account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Enhanced Due Diligence (EDD)</h2>
            <p>For high-net-worth clients, institutional accounts, or users transacting exceptionally large volumes, we may require Enhanced Due Diligence. This includes requesting a Proof of Funds (PoF) or Source of Wealth declaration to legally justify the capital being traded on the platform.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Sanctioned Jurisdictions</h2>
            <p>Prime Meridian Markets does not provide services to residents of comprehensive sanctioned jurisdictions, including but not limited to North Korea, Iran, Syria, and specific regions of Ukraine. We reserve the right to decline or close accounts from high-risk jurisdictions at our sole compliance discretion.</p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
