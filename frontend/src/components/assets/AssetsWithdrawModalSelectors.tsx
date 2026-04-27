// Selector fields for Assets Withdraw modal
'use client';

function getBaseAssetSymbol(symbol: string) {
  const clean = (symbol || '').replace(/[-/]/g, '').toUpperCase().trim();
  const quotes = ['USDT', 'USDC', 'USD'];
  for (const q of quotes) {
    if (clean.endsWith(q) && clean.length > q.length) return clean.slice(0, -q.length);
  }
  return clean;
}

export function AssetsWithdrawModalSelectors({
  assetSymbol,
  onChangeAsset,
  assetOptions,
  network,
  onChangeNetwork,
  networksForAsset,
}: {
  assetSymbol: string;
  onChangeAsset: (next: string) => void;
  assetOptions: Array<{ symbol: string; name: string }>;
  network: string;
  onChangeNetwork: (next: string) => void;
  networksForAsset: string[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-bg-tertiary border border-color-border p-4 rounded-lg">
        <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Asset</label>
        <select
          value={assetSymbol}
          onChange={(e) => onChangeAsset(e.target.value)}
          className="w-full bg-bg-primary border border-color-border rounded px-3 py-2 text-sm focus:outline-none focus:border-color-primary"
        >
          {assetOptions.map((a) => (
            <option key={a.symbol} value={a.symbol}>
              {a.name} ({getBaseAssetSymbol(a.symbol)})
            </option>
          ))}
        </select>
      </div>

      <div className="bg-bg-tertiary border border-color-border p-4 rounded-lg">
        <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Network</label>
        <select
          value={network}
          onChange={(e) => onChangeNetwork(e.target.value)}
          disabled={networksForAsset.length === 0}
          className="w-full bg-bg-primary border border-color-border rounded px-3 py-2 text-sm focus:outline-none focus:border-color-primary disabled:opacity-50"
        >
          {networksForAsset.length === 0 ? <option value="">No networks</option> : null}
          {networksForAsset.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

