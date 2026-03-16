'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#0B0E11] border-t border-[#2B3139] pt-20 pb-10 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
          <div className="md:col-span-4">
            <Link href="/" className="inline-block mb-6">
              <span className="text-2xl font-display font-bold text-color-primary">Legacy FX</span>
            </Link>
            <p className="text-text-secondary max-w-xs leading-relaxed mb-8">
              The premier choice for institutional digital asset management. 
              Secure, liquid, and technologically advanced.
            </p>
            <div className="flex gap-4">
              {['twitter', 'telegram', 'discord', 'linkedin'].map((social) => (
                <a key={social} href="#" className="w-10 h-10 rounded-full border border-[#2B3139] flex items-center justify-center text-text-secondary hover:text-color-primary hover:border-color-primary transition-all">
                  <i className={`pi pi-${social}`} />
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-text-primary font-bold mb-6 text-sm uppercase tracking-widest">Platform</h4>
            <ul className="space-y-4 text-sm text-text-secondary">
              <li><Link href="#markets" className="hover:text-color-primary transition-colors">Markets</Link></li>
              <li><Link href="#trading" className="hover:text-color-primary transition-colors">Spot Trading</Link></li>
              <li><Link href="#institutional" className="hover:text-color-primary transition-colors">Institutional</Link></li>
              <li><Link href="#" className="hover:text-color-primary transition-colors">API Docs</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-text-primary font-bold mb-6 text-sm uppercase tracking-widest">Company</h4>
            <ul className="space-y-4 text-sm text-text-secondary">
              <li><Link href="#" className="hover:text-color-primary transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-color-primary transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-color-primary transition-colors">Support</Link></li>
              <li><Link href="#" className="hover:text-color-primary transition-colors">Verification</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-text-primary font-bold mb-6 text-sm uppercase tracking-widest">Global Reach</h4>
            <div className="p-6 bg-[#161A1E] border border-[#2B3139] rounded-xl">
              <p className="text-text-secondary text-sm mb-4 leading-relaxed">
                Connect with our global network of institutional partners and liquidity providers.
              </p>
              <button className="text-color-primary text-sm font-bold flex items-center group">
                Request Partnerships
                <i className="pi pi-arrow-right ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-[#2B3139] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-text-tertiary text-xs tracking-wide">
            &copy; {new Date().getFullYear()} Legacy FX Global Limited. All rights reserved.
          </div>
          <div className="flex gap-8 text-xs text-text-tertiary uppercase tracking-widest">
            <Link href="#" className="hover:text-text-secondary">Privacy Policy</Link>
            <Link href="#" className="hover:text-text-secondary">Terms of Service</Link>
            <Link href="#" className="hover:text-text-secondary">Security Disclosure</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
