'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export default function StakingPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [stakeAmount, setStakeAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadStakingData();
  }, []);

  const loadStakingData = async () => {
    try {
      const [productsRes, positionsRes] = await Promise.all([
        api.get(API_ENDPOINTS.STAKING.PRODUCTS).catch(() => []),
        api.get(API_ENDPOINTS.STAKING.POSITIONS).catch(() => [])
      ]);
      setProducts(productsRes || []);
      setPositions(positionsRes || []);
      setError('');
    } catch (err) {
      setError('Failed to load staking data');
    } finally {
      setLoading(false);
    }
  };

  const handleStake = async () => {
    if (!selectedProduct || stakeAmount <= 0) {
      setError('Please select a product and amount');
      return;
    }
    try {
      setSubmitting(true);
      await api.post(API_ENDPOINTS.STAKING.STAKE, {
        product_id: selectedProduct.id,
        amount: stakeAmount
      });
      setStakeAmount(0);
      setSelectedProduct(null);
      setError('');
      await loadStakingData();
    } catch (err: any) {
      setError('Staking failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnstake = async (positionId: string) => {
    try {
      setSubmitting(true);
      await api.post(API_ENDPOINTS.STAKING.UNSTAKE(positionId));
      setError('');
      await loadStakingData();
    } catch (err: any) {
      setError('Unstaking failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <main className="min-h-screen bg-bg-primary flex items-center justify-center">
      <p className="text-text-primary">Loading staking products...</p>
    </main>
  );

  const totalStaked = positions.reduce((sum, p) => sum + (p.amount_staked || 0), 0);
  const totalRewards = positions.reduce((sum, p) => sum + (p.rewards_earned || 0), 0);

  return (
    <main className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="font-display text-5xl font-bold text-text-primary mb-8">Staking</h1>

        {error && <div className="bg-color-danger bg-opacity-20 border border-color-danger text-color-danger px-4 py-3 rounded mb-6">{error}</div>}

        {/* Staking Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-bg-secondary border border-color-border rounded-lg p-6">
            <p className="text-text-secondary text-sm mb-2">Total Staked</p>
            <p className="font-mono text-3xl font-bold text-color-primary">${totalStaked.toFixed(2)}</p>
          </div>
          <div className="bg-bg-secondary border border-color-border rounded-lg p-6">
            <p className="text-text-secondary text-sm mb-2">Total Rewards</p>
            <p className="font-mono text-3xl font-bold text-color-success">${totalRewards.toFixed(2)}</p>
          </div>
          <div className="bg-bg-secondary border border-color-border rounded-lg p-6">
            <p className="text-text-secondary text-sm mb-2">Active Positions</p>
            <p className="font-mono text-3xl font-bold text-text-primary">{positions.length}</p>
          </div>
        </div>

        {/* Staking Products */}
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
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-mono font-bold text-color-primary mb-1">{product.asset_symbol}</p>
                    <p className="text-text-secondary text-sm">{product.is_flexible ? 'Flexible' : `${product.lock_period_days} days lock`}</p>
                  </div>
                  <p className="font-mono text-2xl font-bold text-color-success">{(product.apy || 0).toFixed(2)}%</p>
                </div>
                <p className="text-text-secondary text-sm">Min: ${(product.min_amount || 0).toFixed(2)}</p>
              </div>
            ))}
          </div>

          {selectedProduct && (
            <div className="mt-8 p-6 bg-bg-primary rounded-lg border border-color-border">
              <h3 className="font-display text-xl font-bold text-text-primary mb-4">Stake {selectedProduct.asset_symbol}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(parseFloat(e.target.value))}
                  className="px-4 py-3 bg-bg-secondary border border-color-border rounded text-text-primary"
                />
                <button
                  onClick={handleStake}
                  disabled={submitting}
                  className="px-6 py-3 bg-color-success hover:opacity-90 text-bg-primary font-semibold rounded transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Stake'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Active Positions */}
        {positions.length > 0 && (
          <div className="bg-bg-secondary border border-color-border rounded-lg p-8">
            <h2 className="font-display text-2xl font-bold text-text-primary mb-6">Active Positions</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-color-border">
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">Asset</th>
                    <th className="text-right py-3 px-4 text-text-secondary font-semibold">Staked</th>
                    <th className="text-right py-3 px-4 text-text-secondary font-semibold">APY</th>
                    <th className="text-right py-3 px-4 text-text-secondary font-semibold">Rewards</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">Unlock Date</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos: any) => (
                    <tr key={pos.id} className="border-b border-color-border hover:bg-bg-tertiary">
                      <td className="py-4 px-4 font-mono font-bold text-color-primary">{pos.asset_symbol}</td>
                      <td className="py-4 px-4 text-right font-mono text-text-primary">${(pos.amount_staked || 0).toFixed(2)}</td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-color-success">{(pos.apy || 0).toFixed(2)}%</td>
                      <td className="py-4 px-4 text-right font-mono text-text-primary">${(pos.rewards_earned || 0).toFixed(2)}</td>
                      <td className="py-4 px-4 text-text-secondary text-sm">
                        {pos.unlock_date ? new Date(pos.unlock_date).toLocaleDateString() : 'Flexible'}
                      </td>
                      <td className="py-4 px-4">
                        {pos.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleUnstake(pos.id)}
                            disabled={submitting}
                            className="text-color-danger hover:text-color-danger-hover font-semibold text-sm disabled:opacity-50"
                          >
                            Unstake
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
