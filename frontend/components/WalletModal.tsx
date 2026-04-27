'use client';

import { useState, useEffect } from 'react';
import { useConnect, useAccount, useDisconnect } from 'wagmi';
import { AlertModal } from './shared/AlertModal';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { connect, connectors, isPending } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info', title: string = 'Notice') => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Sync with backend when account is connected
  useEffect(() => {
    if (isConnected && address) {
      const syncWithBackend = async () => {
        try {
          const response = await fetch('/api/v1/wallets/connect', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify({
              address: address,
              asset_symbol: 'ETH',
              wallet_type: 'CRYPTO'
            })
          });
          
          if (response.ok) {
            showAlert('Wallet connected and synced successfully!', 'success', 'Success');
            setTimeout(onClose, 2000);
          } else {
            // Even if backend fails, the wallet is connected to the frontend
            console.error('Failed to sync wallet with backend');
          }
        } catch (error) {
          console.error('Backend sync error:', error);
        }
      };
      
      syncWithBackend();
    }
  }, [isConnected, address, onClose]);

  const handleConnect = async (walletId: string) => {
    // Map our UI IDs to Wagmi connector IDs
    const connectorMap: Record<string, string> = {
      'metamask': 'io.metamask',
      'walletconnect': 'walletConnect',
      'coinbase': 'coinbaseWalletSDK',
      'trust': 'trust'
    };

    const targetId = connectorMap[walletId];
    const connector = connectors.find(c => c.id === targetId || c.name.toLowerCase().includes(walletId));

    if (connector) {
      try {
        connect({ connector });
      } catch (error) {
        console.error('Connection error:', error);
        showAlert('Failed to initiate connection. Please try again.', 'error', 'Error');
      }
    } else {
      if (walletId === 'metamask') {
        showAlert('MetaMask not detected. Please install the extension.', 'warning', 'Extension Missing');
      } else {
        showAlert(`Connector for ${walletId} not found.`, 'error', 'Error');
      }
    }
  };

  const wallets = [
    {
      id: 'metamask',
      name: 'MetaMask',
      description: 'Most popular browser wallet',
      icon: '🦊',
      color: 'orange'
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      description: 'Connect any mobile wallet',
      icon: '📱',
      color: 'blue'
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      description: 'Simple and secure',
      icon: '💙',
      color: 'blue'
    },
    {
      id: 'trust',
      name: 'Trust Wallet',
      description: 'Mobile multi-chain wallet',
      icon: '🔒',
      color: 'green'
    }
  ];

  if (!isOpen && !alertConfig.isOpen) return null;

  return (
    <>
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 ${!isOpen ? 'hidden' : ''}`}>
        <div className="bg-bg-secondary rounded-2xl p-6 w-full max-w-md mx-4 border border-color-border shadow-2xl animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-primary">
              {isConnected ? 'Wallet Linked' : 'Connect Wallet'}
            </h2>
            <button
              onClick={onClose}
              className="text-text-tertiary hover:text-text-primary transition-colors"
            >
              <i className="pi pi-times text-xl"></i>
            </button>
          </div>

          {isConnected ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-color-success/10 text-color-success rounded-full flex items-center justify-center mx-auto mb-4 border border-color-success/20">
                <i className="pi pi-check text-2xl"></i>
              </div>
              <p className="text-text-primary font-bold mb-1">Connected Address</p>
              <p className="text-text-tertiary text-xs font-mono mb-6 break-all bg-bg-tertiary p-2 rounded-lg">
                {address}
              </p>
              <button
                onClick={() => disconnect()}
                className="w-full py-3 bg-color-danger/10 text-color-danger border border-color-danger/20 rounded-xl font-bold hover:bg-color-danger/20 transition-all text-sm"
              >
                Disconnect Wallet
              </button>
            </div>
          ) : (
            <>
              {/* Wallet Options */}
              <div className="space-y-3">
                {wallets.map((wallet) => (
                  <button
                    key={wallet.id}
                    onClick={() => handleConnect(wallet.id)}
                    disabled={isPending}
                    className="w-full flex items-center gap-4 p-4 bg-bg-tertiary hover:bg-bg-primary border border-color-border rounded-xl transition-all hover:border-color-primary disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-transform group-hover:scale-110 ${
                      wallet.color === 'orange' ? 'bg-orange-100' :
                      wallet.color === 'blue' ? 'bg-blue-100' :
                      'bg-green-100'
                    }`}>
                      {wallet.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-text-primary">{wallet.name}</h3>
                      <p className="text-sm text-text-secondary">{wallet.description}</p>
                    </div>
                    <i className="pi pi-chevron-right text-text-tertiary group-hover:text-color-primary transition-colors"></i>
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-xs text-text-tertiary">
                  By connecting a wallet, you agree to our <span className="text-color-primary cursor-pointer hover:underline">Terms of Service</span>
                </p>
              </div>
            </>
          )}

          {/* Loading Overlay */}
          {isPending && (
            <div className="absolute inset-0 bg-bg-secondary/90 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <i className="pi pi-spin pi-spinner text-4xl text-color-primary mb-3"></i>
                <p className="text-text-primary font-medium tracking-tight">Opening Wallet...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertModal 
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={closeAlert}
      />
    </>
  );
}
