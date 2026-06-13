import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  preload: false,
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-body',
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  preload: false,
});

// Deployment-aware URL configuration
const getDeploymentUrl = () => {
  const url = process.env.NEXT_PUBLIC_DEPLOYMENT_URL ||
    process.env.VERCEL_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://primemeridianmarkets.com' : 'http://localhost:3000');

  return url.startsWith('http') ? url : `https://${url}`;
};

const deploymentUrl = getDeploymentUrl();

export const metadata: Metadata = {
  metadataBase: new URL(deploymentUrl),
  title: 'Prime Meridian Markets | Institutional Digital Asset Exchange & Matching Engine',
  description: 'Trade cryptocurrencies with institutional-grade tools on Prime Meridian Markets. Experience under 1.2ms latency, deep liquidity, and Swiss-grade custodial security. Access 350+ assets including Bitcoin, Ethereum, and Equity Indices.',
  keywords: 'crypto exchange, buy bitcoin, institutional digital assets, cryptocurrency trading, prime meridian markets, low latency matching engine, crypto investing, defi staking, real estate crypto, copy trading, cold storage security, ethereum trading, crypto brokerage',
  authors: [{ name: 'Prime Meridian Markets Global' }],
  openGraph: {
    title: 'Prime Meridian Markets | Institutional Digital Asset Exchange',
    description: 'The gold standard of digital asset trading. High-performance matching engine and ultra-secure cold storage.',
    url: deploymentUrl,
    siteName: 'Prime Meridian Markets',
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
    title: 'Prime Meridian Markets | Institutional Digital Asset Exchange',
    description: 'Experience unrivaled performance with our institutional-grade matching engine.',
    creator: '@primemeridianmarkets',
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

import { AuthProvider } from '@/context/AuthContext';
import { Web3Provider } from '@/components/Web3Provider';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${cormorant.variable} ${outfit.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <meta charSet="UTF-8" />
        <link rel="stylesheet" href="https://unpkg.com/primeicons/primeicons.css" />
      </head>
      <body className="bg-bg-primary text-text-primary font-body antialiased">
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <AuthProvider>
          <Web3Provider>
            {children}
          </Web3Provider>
        </AuthProvider>
      </body>
    </html>
  );
}
