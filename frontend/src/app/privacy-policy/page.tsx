'use client';

import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-[#0B0E11] text-text-primary selection:bg-color-primary/30 selection:text-color-primary">
      <Navbar />
      <div className="max-w-[800px] mx-auto px-6 py-32">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-12 tracking-tight">Privacy Policy</h1>
        
        <div className="space-y-8 text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">1. What Data We Collect and Why</h2>
            <p className="mb-4">We collect personal data to provide a secure and legally compliant digital asset trading environment. This includes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Identity Data:</strong> Full name, date of birth, government-issued ID (for KYC/AML compliance).</li>
              <li><strong>Contact Data:</strong> Email address, physical address, phone number (for account security and communication).</li>
              <li><strong>Financial Data:</strong> Bank account details, crypto wallet addresses, transaction history (to process deposits, trades, and withdrawals).</li>
              <li><strong>Technical Data:</strong> IP address, device information, browser type, log data (to prevent fraud and ensure platform security).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">2. Legal Basis for Processing (GDPR Compliance)</h2>
            <p className="mb-4">We process your data under the following legal bases:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Contractual Necessity:</strong> To fulfill our Terms of Service (e.g., executing trades).</li>
              <li><strong>Legal Obligation:</strong> To comply with international Anti-Money Laundering (AML) and Counter-Terrorism Financing (CTF) laws.</li>
              <li><strong>Legitimate Interest:</strong> To protect the platform against fraud, maintain security, and improve our services.</li>
              <li><strong>Consent:</strong> For marketing communications and non-essential cookies (which you can withdraw at any time).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">3. Data Retention</h2>
            <p>We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy. Due to financial regulations, we are legally required to retain KYC data and transaction history for a minimum of five (5) years after account closure. Once the retention period expires, your data is securely deleted or anonymized.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">4. Third-Party Data Sharing</h2>
            <p className="mb-4">We do not sell your data. We only share data with trusted third parties necessary for our operations:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Identity Verification (KYC) Providers:</strong> To verify your identity and check against global watchlists.</li>
              <li><strong>Payment Processors & Banks:</strong> To facilitate fiat deposits and withdrawals.</li>
              <li><strong>Law Enforcement:</strong> When legally compelled by a valid court order or regulatory authority.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">5. Your User Rights</h2>
            <p className="mb-4">Under the GDPR and global privacy standards, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Deletion ("Right to be Forgotten"):</strong> Request deletion of your data (subject to our legal retention obligations).</li>
              <li><strong>Data Portability:</strong> Receive your data in a structured, machine-readable format.</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests.</li>
            </ul>
            <p className="mt-4">To exercise these rights, contact privacy@primemeridianmarkets.com.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">6. Cookie Policy</h2>
            <p>We use essential cookies to maintain your active session, enforce security (such as CSRF protection), and remember your preferences. We also use analytics cookies to understand platform usage and improve our services. You can manage cookie preferences through your browser settings, but disabling essential cookies may prevent the platform from functioning properly.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">7. Data Breach Notification</h2>
            <p>In the unlikely event of a data breach that compromises your personal information, we are committed to notifying affected users and the relevant supervisory authorities within 72 hours of becoming aware of the breach. We will provide details on the nature of the breach, the data affected, and the steps we are taking to mitigate any risks.</p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
