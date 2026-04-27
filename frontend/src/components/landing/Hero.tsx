'use client';

import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative pt-20 pb-32 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-color-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-color-primary/20 bg-color-primary/5 text-color-primary text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-8 max-w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-color-primary animate-pulse shrink-0" />
            <span className="truncate">Institutional Grade Infrastructure</span>
          </div>
          
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-text-primary mb-8 leading-[1.1]">
            The Gold Standard of <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-color-primary via-[#FBDA61] to-color-primary tracking-wide">
              Digital{" "}Assets.
            </span>
          </h1>
          
          <p className="text-text-secondary text-xl md:text-2xl mb-12 max-w-2xl leading-relaxed">
            Experience unrivaled performance with our institutional-grade matching engine 
            and ultra-secure cold storage architecture. Designed for the elite.
          </p>

          <div className="flex flex-col sm:flex-row gap-6">
            <Link 
              href="/signup" 
              className="bg-color-primary hover:bg-color-primary-hover text-bg-primary px-10 py-5 rounded-md font-bold text-lg transition-all shadow-[0_0_30px_-5px_rgba(240,185,11,0.4)] flex items-center justify-center group"
            >
              Start Trading Now
              <i className="pi pi-arrow-right ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/login" 
              className="border border-[#2B3139] hover:bg-bg-secondary text-text-primary px-10 py-5 rounded-md font-bold text-lg transition-all flex items-center justify-center"
            >
              Institutional Login
            </Link>
          </div>

          <div className="mt-20 flex flex-wrap items-center gap-8 md:gap-12 text-text-tertiary">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] md:text-sm font-medium uppercase tracking-widest">Latency</span>
              <span className="text-lg md:text-xl font-mono text-text-secondary font-bold">{"<"} 1.2ms</span>
            </div>
            <div className="hidden sm:block h-8 w-[1px] bg-[#2B3139]" />
            <div className="flex flex-col gap-1">
              <span className="text-[10px] md:text-sm font-medium uppercase tracking-widest">SLA</span>
              <span className="text-lg md:text-xl font-mono text-text-secondary font-bold">99.998%</span>
            </div>
            <div className="hidden sm:block h-8 w-[1px] bg-[#2B3139]" />
            <div className="flex flex-col gap-1">
              <span className="text-[10px] md:text-sm font-medium uppercase tracking-widest">Assets</span>
              <span className="text-lg md:text-xl font-mono text-text-secondary font-bold">350+</span>
            </div>
          </div>

          {/* Platform Video Showcase */}
          <div className="mt-16 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-color-primary/20 to-blue-500/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-[#0B0E11] border border-[#2B3139] rounded-xl overflow-hidden shadow-2xl">
              <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700"
              >
                <source src="/widgets-main-video.a3d7152108cd9db92d6c.webm" type="video/webm" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E11] via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
