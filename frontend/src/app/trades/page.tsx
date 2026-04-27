'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export default function TradesPage() {
  const [trades, setTrades] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [symbol, setSymbol] = useState('BTC');
  const [quantity, setQuantity] = useState(1);
  const [tradeType, setTradeType] = useState('BUY');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tradesRes, portfolioRes, pricesRes] = await Promise.all([
        api.get(`${API_ENDPOINTS.TRADES.HISTORY}?page=1&limit=50`).catch(() => []),
        api.get(API_ENDPOINTS.TRADES.PORTFOLIO).catch(() => null),
        api.get(API_ENDPOINTS.MARKETS.PRICES).catch(() => [])
      ]);
      setTrades(tradesRes || []);
      setPortfolio(portfolioRes);
      setPrices(pricesRes || []);
      setError('');
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleTrade = async () => {
    if (!symbol || quantity <= 0) {
      setError('Please fill in all fields');
      return;
    }
    try {
      setSubmitting(true);
      const endpoint = API_ENDPOINTS.TRADES.CREATE;
      await api.post(endpoint, { symbol, quantity, trade_type: tradeType });
      setSymbol('BTC');
      setQuantity(1);
      setError('');
      await loadData();
    } catch (err: any) {
      setError('Trade failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <main className="min-h-screen bg-bg-primary flex items-center justify-center">
      <p className="text-text-primary">Loading...</p>
    </main>
  );

  return (
    <main className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="font-display text-5xl font-bold text-text-primary mb-8">Trading Terminal</h1>

        {error && <div className="bg-color-danger bg-opacity-20 border border-color-danger text-color-danger px-4 py-3 rounded mb-6">{error}</div>}

        {/* Portfolio */}
        {portfolio && (
          <div className="bg-bg-secondary border border-color-border rounded-lg p-8 mb-8">
            <h2 className="font-display text-2xl font-bold text-text-primary mb-6">Portfolio</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-text-secondary text-sm mb-2">Total Value</p>
                <p className="font-mono text-3xl font-bold text-color-primary">${portfolio.total_value?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-text-secondary text-sm mb-2">Total P&L</p>
                <p className={`font-mono text-3xl font-bold ${portfolio.total_pnl >= 0 ? 'text-color-success' : 'text-color-danger'}`}>
                  ${portfolio.total_pnl?.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-text-secondary text-sm mb-2">Holdings</p>
                <p className="font-mono text-3xl font-bold text-text-primary">{portfolio.holdings?.length || 0}</p>
              </div>
              <div>
                <p className="text-text-secondary text-sm mb-2">Return %</p>
                <p className={`font-mono text-3xl font-bold ${portfolio.total_pnl_percentage >= 0 ? 'text-color-success' : 'text-color-danger'}`}>
                  {portfolio.total_pnl_percentage?.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Place Trade */}
        <div className="bg-bg-secondary border border-color-border rounded-lg p-8 mb-8">
          <h2 className="font-display text-2xl font-bold text-text-primary mb-6">Place Trade</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Symbol (BTC, ETH...)"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="px-4 py-3 bg-bg-primary border border-color-border rounded text-text-primary placeholder-text-tertiary"
            />
            <input
              type="number"
              step="0.0001"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value))}
              className="px-4 py-3 bg-bg-primary border border-color-border rounded text-text-primary placeholder-text-tertiary"
            />
            <select
              value={tradeType}
              onChange={(e) => setTradeType(e.target.value)}
              className="px-4 py-3 bg-bg-primary border border-color-border rounded text-text-primary"
            >
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
            </select>
            <button
              onClick={handleTrade}
              disabled={submitting}
              className="px-6 py-3 bg-color-primary hover:bg-color-primary-hover text-bg-primary font-semibold rounded transition-colors disabled:opacity-50 md:col-span-2"
            >
              {submitting ? 'Processing...' : 'Place Trade'}
            </button>
          </div>
        </div>

        {/* Holdings */}
        {portfolio?.holdings && portfolio.holdings.length > 0 && (
          <div className="bg-bg-secondary border border-color-border rounded-lg p-8 mb-8">
            <h2 className="font-display text-2xl font-bold text-text-primary mb-6">Holdings</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-color-border">
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">Symbol</th>
                    <th className="text-right py-3 px-4 text-text-secondary font-semibold">Qty</th>
                    <th className="text-right py-3 px-4 text-text-secondary font-semibold">Entry</th>
                    <th className="text-right py-3 px-4 text-text-secondary font-semibold">Current</th>
                    <th className="text-right py-3 px-4 text-text-secondary font-semibold">Value</th>
                    <th className="text-right py-3 px-4 text-text-secondary font-semibold">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.holdings.map((h: any, i: number) => (
                    <tr key={i} className="border-b border-color-border hover:bg-bg-tertiary">
                      <td className="py-4 px-4 font-mono font-bold text-color-primary">{h.symbol}</td>
                      <td className="py-4 px-4 text-right font-mono text-text-primary">{h.quantity.toFixed(4)}</td>
                      <td className="py-4 px-4 text-right font-mono text-text-secondary">${h.entry_price.toFixed(2)}</td>
                      <td className="py-4 px-4 text-right font-mono text-text-primary">${h.current_price.toFixed(2)}</td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-text-primary">${h.value.toFixed(2)}</td>
                      <td className={`py-4 px-4 text-right font-mono font-bold ${h.pnl >= 0 ? 'text-color-success' : 'text-color-danger'}`}>
                        {h.pnl >= 0 ? '+' : ''}{h.pnl_percentage.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Prices */}
        {prices.length > 0 && (
          <div className="bg-bg-secondary border border-color-border rounded-lg p-8 mb-8">
            <h2 className="font-display text-2xl font-bold text-text-primary mb-6">Market Prices</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {prices.map((p: any) => (
                <div key={p.symbol} className="bg-bg-primary border border-color-border rounded p-4">
                  <p className="font-mono font-bold text-color-primary mb-2">{p.symbol}</p>
                  <p className="font-mono text-lg font-bold text-text-primary">${p.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        <div className="bg-bg-secondary border border-color-border rounded-lg p-8">
          <h2 className="font-display text-2xl font-bold text-text-primary mb-6">Trade History</h2>
          {trades.length === 0 ? (
            <p className="text-text-secondary">No trades yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-color-border">
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">Date</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">Symbol</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">Type</th>
                    <th className="text-right py-3 px-4 text-text-secondary font-semibold">Qty</th>
                    <th className="text-right py-3 px-4 text-text-secondary font-semibold">Price</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t: any) => (
                    <tr key={t.id} className="border-b border-color-border hover:bg-bg-tertiary">
                      <td className="py-4 px-4 text-text-secondary">{new Date(t.created_at).toLocaleDateString()}</td>
                      <td className="py-4 px-4 font-mono font-bold text-color-primary">{t.symbol}</td>
                      <td className={`py-4 px-4 font-semibold ${t.trade_type === 'BUY' ? 'text-color-success' : 'text-color-danger'}`}>
                        {t.trade_type}
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-text-primary">{t.quantity.toFixed(4)}</td>
                      <td className="py-4 px-4 text-right font-mono text-text-secondary">${t.entry_price.toFixed(2)}</td>
                      <td className="py-4 px-4">
                        <span className="text-xs font-semibold px-3 py-1 rounded bg-color-success bg-opacity-20 text-color-success">
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
