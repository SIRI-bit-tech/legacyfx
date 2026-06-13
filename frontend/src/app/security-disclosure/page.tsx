'use client';

import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

export default function SecurityDisclosure() {
  return (
    <main className="min-h-screen bg-[#0B0E11] text-text-primary selection:bg-color-primary/30 selection:text-color-primary">
      <Navbar />
      <div className="max-w-[800px] mx-auto px-6 py-32">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-12 tracking-tight">Security & Vulnerability Disclosure</h1>
        
        <div className="space-y-8 text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">1. How We Protect You</h2>
            <p className="mb-4">Prime Meridian Markets employs institutional-grade security architecture to safeguard your data and assets:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Cold Storage:</strong> 98% of all digital assets are held in geographically distributed, air-gapped cold wallets requiring multi-signature authorization.</li>
              <li><strong>Encryption:</strong> All data in transit is encrypted using TLS 1.3. Data at rest (including KYC documents) is encrypted using AES-256.</li>
              <li><strong>Access Control:</strong> Mandatory Two-Factor Authentication (2FA) via Authenticator apps, IP whitelisting, and strict withdrawal address whitelisting.</li>
              <li><strong>Real-time Monitoring:</strong> Our matching engine and wallets are monitored 24/7 by AI-driven anomaly detection systems.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">2. Responsible Disclosure Policy</h2>
            <p>We highly value the work of the cybersecurity research community. If you discover a security vulnerability in our platform, we ask that you report it to us immediately and responsibly. We ask that you do not publicly disclose the issue until we have had a reasonable opportunity to investigate and patch the vulnerability.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">3. Our Commitments</h2>
            <p className="mb-4">If you report a vulnerability in accordance with this policy, we commit to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Acknowledge</strong> receipt of your report within 48 hours.</li>
              <li><strong>Investigate</strong> the issue promptly and confirm the existence of the vulnerability.</li>
              <li><strong>Provide</strong> an estimated timeline for remediation.</li>
              <li><strong>Not pursue</strong> civil or criminal legal action against you, provided you comply with our disclosure guidelines and do not exploit the vulnerability.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">4. Bug Bounty Scope</h2>
            <p className="mb-4">We offer bug bounties for severe, exploitable vulnerabilities. In-scope assets include our primary web application, matching engine API, and mobile apps. Eligible vulnerabilities include:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Remote Code Execution (RCE)</li>
              <li>SQL Injection (SQLi)</li>
              <li>Cross-Site Scripting (XSS)</li>
              <li>Authentication bypass or authorization flaws</li>
              <li>Cryptographic weaknesses in wallet handling</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">5. Out of Scope</h2>
            <p className="mb-4">The following activities and vulnerabilities are strictly out of scope and do not qualify for a bounty:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Distributed Denial of Service (DDoS) attacks.</li>
              <li>Social engineering (phishing, vishing) of our employees or users.</li>
              <li>Physical attacks against our facilities or data centers.</li>
              <li>Spamming or flooding our APIs.</li>
              <li>Vulnerabilities requiring the user to use outdated or unsupported browsers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">6. Contact Method</h2>
            <p>Please submit all security reports via encrypted email to: <a href="mailto:security@primemeridianmarkets.com" className="text-color-primary hover:underline">security@primemeridianmarkets.com</a>. Include detailed steps to reproduce the issue, proof of concept code, and the potential impact.</p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
