'use client';

import { WagmiProvider, createConfig } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';
import { ReactNode } from 'react';

// Prevent MetaMask SDK from throwing "indexedDB is not defined" during SSR
if (typeof window === 'undefined' && !(global as any).indexedDB) {
  (global as any).indexedDB = {
    open: () => ({ onupgradeneeded: null, onsuccess: null, onerror: null }),
  };
}

const config = createConfig(
  getDefaultConfig({
    // Your WalletConnect Project ID
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",

    // Required App Information
    appName: "Prime Meridian Markets",

    // Optional App Information
    appDescription: "Institutional Digital Asset Exchange",
    appUrl: "https://primemeridianmarkets.com",
    appIcon: "https://primemeridianmarkets.com/logo.png",

    chains: [mainnet, polygon, optimism, arbitrum],
    ssr: true,
  }),
);

const queryClient = new QueryClient();

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider mode="dark">
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
