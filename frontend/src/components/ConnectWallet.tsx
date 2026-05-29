import { ConnectKitButton } from 'connectkit';

export default function ConnectWallet() {
  return (
    <div className="p-4">
      <ConnectKitButton.Custom>
        {({ isConnected, isConnecting, show, hide, address, ensName, chain }) => {
          return (
            <button
              onClick={show}
              className="bg-color-primary hover:bg-color-primary/90 disabled:opacity-50 text-bg-primary font-black py-4 px-8 rounded-2xl transition-all flex items-center gap-3 shadow-2xl shadow-color-primary/20 group"
            >
              {isConnecting ? (
                <>
                  <i className="pi pi-spin pi-spinner text-lg"></i>
                  <span className="tracking-tight uppercase text-xs">Connecting...</span>
                </>
              ) : isConnected ? (
                <>
                  <i className="pi pi-check-circle text-lg"></i>
                  <span className="tracking-tight uppercase text-xs">
                    {ensName ?? `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                  </span>
                </>
              ) : (
                <>
                  <i className="pi pi-wallet text-lg group-hover:scale-110 transition-transform"></i>
                  <span className="tracking-tight uppercase text-xs">Connect External Wallet</span>
                </>
              )}
            </button>
          );
        }}
      </ConnectKitButton.Custom>
      
      <div className="mt-8 space-y-3">
        <div className="flex items-center gap-2 text-text-secondary">
          <i className="pi pi-info-circle text-color-info"></i>
          <p className="text-sm font-medium italic">Securely link your self-custody wallet.</p>
        </div>
        <div className="flex gap-4">
          {['MetaMask', 'WalletConnect', 'Coinbase'].map(w => (
            <span key={w} className="text-[10px] text-text-tertiary font-black uppercase tracking-tighter border border-color-border px-2 py-1 rounded-md">
              {w}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
