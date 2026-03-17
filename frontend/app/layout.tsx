import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-body',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Legacy FX | Institutional Digital Asset Exchange & Matching Engine',
  description: 'Trade cryptocurrencies with institutional-grade tools on Legacy FX. Experience under 1.2ms latency, deep liquidity, and Swiss-grade custodial security. Access 350+ assets including Bitcoin, Ethereum, and Equity Indices.',
  keywords: 'crypto exchange, digital assets, bitcoin trading, institutional crypto, cryptocurrency matching engine, ethereum, high frequency trading, secure crypto storage, Legacy FX, blockchain finance',
  authors: [{ name: 'Legacy FX Global' }],
  openGraph: {
    title: 'Legacy FX | Institutional Digital Asset Exchange',
    description: 'The gold standard of digital asset trading. High-performance matching engine and ultra-secure cold storage.',
    url: 'https://legacyfx.com',
    siteName: 'Legacy FX',
    images: [
      {
        url: '/og-image.png', // Fallback to a placeholder or user can add this later
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Legacy FX | Institutional Digital Asset Exchange',
    description: 'Experience unrivaled performance with our institutional-grade matching engine.',
    creator: '@legacyfx',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0B0E11',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={`${cormorant.variable} ${outfit.variable} ${jetbrainsMono.variable}`}>
      <head>
        <meta charSet="UTF-8" />
        <link rel="stylesheet" href="https://unpkg.com/primeicons/primeicons.css" />
      </head>
      <body className="bg-bg-primary text-text-primary font-body antialiased">
        {children}
      </body>
    </html>
  );
}
