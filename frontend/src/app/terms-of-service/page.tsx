'use client';

import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-[#0B0E11] text-text-primary selection:bg-color-primary/30 selection:text-color-primary">
      <Navbar />
      <div className="max-w-[800px] mx-auto px-6 py-32">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-12 tracking-tight">Terms of Service</h1>
        
        <div className="space-y-8 text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">1. Eligibility</h2>
            <p>To open an account with Prime Meridian Markets, you must be at least 18 years of age and possess the legal capacity to enter into a binding contract. You may not use our services if you are a resident of any jurisdiction subject to comprehensive international sanctions or where the use of our platform would violate local law. It is your responsibility to ensure that trading digital assets is legal in your jurisdiction.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">2. Account Responsibilities & KYC/AML</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials, including your password and Two-Factor Authentication (2FA) codes. You must provide accurate, current, and complete information during the registration process and submit to our full Know Your Customer (KYC) and Anti-Money Laundering (AML) verification procedures before depositing funds or trading.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">3. Accepted Instruments</h2>
            <p>Prime Meridian Markets offers trading across multiple asset classes, including Cryptocurrency, Forex, Equities (Stocks), and Real Estate tokens. Furthermore, we provide institutional Cold Storage services for long-term asset holding. We reserve the right to add, modify, or delist any trading instrument at our sole discretion without prior notice.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">4. Risk Disclosure</h2>
            <p>Trading financial instruments, particularly those involving leverage or digital assets, carries a high level of risk and may not be suitable for all investors. Market volatility can be extreme, and you may sustain a total loss of your initial capital. You should carefully consider your investment objectives, level of experience, and risk appetite. By using this platform, you acknowledge and accept these risks.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">5. Deposit and Withdrawal Rules</h2>
            <p>All deposits must originate from accounts or wallets registered in your exact name. Third-party deposits are strictly prohibited and will be rejected. Withdrawals will only be processed to verified addresses or bank accounts. We reserve the right to delay withdrawals for security audits, particularly for large or anomalous transactions.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">6. Fee Structure</h2>
            <p>By executing trades or utilizing our services, you agree to pay all applicable fees as outlined on our Fee Schedule page. These may include maker/taker fees, network withdrawal fees, overnight financing rates (for leveraged positions), and cold storage custody fees. We reserve the right to adjust our fee structure at any time.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">7. Platform Usage Rules</h2>
            <p>You agree to use the platform fairly and lawfully. Any form of market manipulation, spoofing, wash trading, or exploitation of pricing latencies is strictly prohibited. The use of unauthorized automated trading bots, API abuse, or attempts to disrupt the matching engine infrastructure will result in immediate account termination.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">8. Account Suspension and Termination</h2>
            <p>We reserve the right to suspend, freeze, or terminate your account at any time if we suspect you are in violation of these Terms, involved in illegal activities, failing KYC/AML checks, or posing a security risk to the platform. In the event of account closure, you will be permitted to withdraw your remaining legitimate funds, subject to regulatory clearance.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">9. Dispute Resolution and Governing Law</h2>
            <p>Any disputes arising out of or relating to these Terms shall be resolved through binding arbitration rather than in court, except that you may assert claims in small claims court if they qualify. These Terms are governed by the laws of the jurisdiction in which Prime Meridian Markets Global is registered, without regard to its conflict of law principles.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">10. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Prime Meridian Markets and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or use, arising out of your use of the platform. The platform is provided on an "as is" and "as available" basis without warranties of any kind.</p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
