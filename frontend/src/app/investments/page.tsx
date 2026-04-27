'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export default function InvestmentsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [investAmount, setInvestAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInvestmentData();
  }, []);

  const loadInvestmentData = async () => {
    try {
      const [productsRes, positionsRes] = await Promise.all([
        api.get(API_ENDPOINTS.INVESTMENTS.PRODUCTS).catch(() => []),
        api.get(API_ENDPOINTS.INVESTMENTS.ACTIVE).catch(() => [])
      ]);
      setProducts(productsRes || []);
      setPositions(positionsRes || []);
      setError('');
    } catch (err) {
      setError('Failed to load investments');
    } finally {
      setLoading(false);
    }
  };

  const handleInvest = async () => {
    if (!selectedProduct || investAmount <= 0) {
      setError('Please select a product and amount');
      return;
    }
    try {
      setSubmitting(true);
      await api.post(API_ENDPOINTS.INVESTMENTS.INVEST, {
        product_id: selectedProduct.id,
        amount: investAmount
      });
      setInvestAmount(0);
      setSelectedProduct(null);
      setError('');
      await loadInvestmentData();
    } catch (err: any) {
      setError('Investment failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRedeem = async (positionId: string) => {
    try {
      setSubmitting(true);
      await api.post(API_ENDPOINTS.INVESTMENTS.REDEEM(positionId));
      setError('');
      await loadInvestmentData();
    } catch (err: any) {
      setError('Redemption failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <main className="min-h-screen bg-bg-primary flex items-center justify-center">
      <p className="text-text-primary">Loading investments...</p>
    </main>
  );

  const totalInvested = positions.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalReturns = positions.reduce((sum, p) => sum + (p.returns_earned || 0), 0);

  return (
    <main className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="font-display text-5xl font-bold text-text-primary mb-8">Investments</h1>

        {error && <div className="bg-color-danger bg-opacity-20 border border-color-danger text-color-danger px-4 py-3 rounded mb-6">{error}</div>}

        {/* Investment Summary */}
        {positions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-bg-secondary border border-color-border rounded-lg p-6">
              <p className="text-text-secondary text-sm mb-2">Total Invested</p>
              <p className="font-mono text-3xl font-bold text-color-primary">${totalInvested.toFixed(2)}</p>
            </div>
            <div className="bg-bg-secondary border border-color-border rounded-lg p-6">
              <p className="text-text-secondary text-sm mb-2">Total Returns</p>
              <p className="font-mono text-3xl font-bold text-color-success">${totalReturns.toFixed(2)}</p>
            </div>
            <div className="bg-bg-secondary border border-color-border rounded-lg p-6">
              <p className="text-text-secondary text-sm mb-2">Active Positions</p>
              <p className="font-mono text-3xl font-bold text-text-primary">{positions.length}</p>
            </div>
          </div>
        )}

        {/* Investment Products */}
        <div className="bg-bg-secondary border border-color-border rounded-lg p-8 mb-8">
          <h2 className="font-display text-2xl font-bold text-text-primary mb-6">Available Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map((product: any) => (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className={`border rounded-lg p-6 cursor-pointer transition-all ${
                  selectedProduct?.id === product.id
                    ? 'border-color-primary bg-bg-tertiary'
                    : 'border-color-border hover:border-color-primary'
                }`}
              >
                <h3 className="font-display text-lg font-bold text-text-primary mb-2">{product.name}</h3>
                <p className="text-text-secondary text-sm mb-4">{product.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">APY</span>
                    <span className="font-mono text-color-success font-bold">{(product.apy || 0).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Duration</span>
                    <span className="font-mono text-text-primary">{product.duration_days || '--'} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Min</span>
                    <span className="font-mono text-text-primary">${(product.min_investment || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedProduct && (
            <div className="mt-8 p-6 bg-bg-primary rounded-lg border border-color-border">
              <h3 className="font-display text-xl font-bold text-text-primary mb-4">Invest in {selectedProduct.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(parseFloat(e.target.value))}
                  className="px-4 py-3 bg-bg-secondary border border-color-border rounded text-text-primary"
                />
                <button
                  onClick={handleInvest}
                  disabled={submitting}
                  className="px-6 py-3 bg-color-success hover:opacity-90 text-bg-primary font-semibold rounded transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Invest'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Active Investments */}
        {positions.length > 0 && (
          <div className="bg-bg-secondary border border-color-border rounded-lg p-8">
            <h2 className="font-display text-2xl font-bold text-text-primary mb-6">Active Investments</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-color-border">
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">Product</th>
                    <th className="text-right py-3 px-4 text-text-secondary font-semibold">Invested</th>
                    <th className="text-right py-3 px-4 text-text-secondary font-semibold">Returns</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">Maturity</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos: any) => (
                    <tr key={pos.id} className="border-b border-color-border hover:bg-bg-tertiary">
                      <td className="py-4 px-4 font-mono font-bold text-color-primary">{pos.product_name || 'Product'}</td>
                      <td className="py-4 px-4 text-right font-mono text-text-primary">${(pos.amount || 0).toFixed(2)}</td>
                      <td className="py-4 px-4 text-right font-mono text-color-success font-bold">${(pos.returns_earned || 0).toFixed(2)}</td>
                      <td className="py-4 px-4 text-text-secondary text-sm">
                        {pos.maturity_date ? new Date(pos.maturity_date).toLocaleDateString() : 'Active'}
                      </td>
                      <td className="py-4 px-4">
                        {pos.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleRedeem(pos.id)}
                            disabled={submitting}
                            className="text-color-primary hover:text-color-primary-hover font-semibold text-sm disabled:opacity-50"
                          >
                            Redeem
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
