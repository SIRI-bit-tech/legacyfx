'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#0B0E11]/80 backdrop-blur-md border-b border-[#2B3139]">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-8">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <span className="text-xl md:text-2xl font-display font-bold text-color-primary group-hover:text-color-primary-hover transition-colors">
              Legacy FX
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-text-secondary">
            <Link href="#markets" className="hover:text-text-primary transition-colors">Markets</Link>
            <Link href="#trading" className="hover:text-text-primary transition-colors">Investing</Link>
            <Link href="#institutional" className="hover:text-text-primary transition-colors">Institutional</Link>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <Link 
            href="/login" 
            className="hidden sm:block text-sm font-semibold text-text-primary hover:text-color-primary transition-colors px-2 md:px-4 py-2"
          >
            Log In
          </Link>
          <Link 
            href="/signup" 
            className="bg-color-primary hover:bg-color-primary-hover text-bg-primary px-3 md:px-5 py-2 rounded-md font-semibold text-xs md:text-sm transition-all shadow-[0_0_20px_-5px_rgba(240,185,11,0.3)] hover:scale-105 active:scale-95 whitespace-nowrap"
          >
            Open Account
          </Link>
        </div>
      </div>
    </nav>
  );
}
