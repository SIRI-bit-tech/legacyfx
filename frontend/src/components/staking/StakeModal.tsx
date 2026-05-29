"use client";

import { useState } from "react";
import { COLORS } from "@/constants";
import api from "@/lib/api";

interface StakeModalProps {
  isOpen: boolean;
  poolId: string;
  assetSymbol: string;
  minStake: number;
  apy: number;
  capacityPct: number | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const StakeModal: React.FC<StakeModalProps> = ({
  isOpen,
  poolId,
  assetSymbol,
  minStake,
  apy,
  capacityPct,
  onClose,
  onSuccess,
}) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStake = async () => {
    try {
      setError(null);
      setLoading(true);

      const stakeAmount = parseFloat(amount);
      if (!stakeAmount || stakeAmount < minStake) {
        setError(`Minimum stake amount is ${minStake} ${assetSymbol}`);
        return;
      }

      const response = await api.post("/api/v1/staking/stakes", {
        pool_id: poolId,
        amount: stakeAmount,
      });

      if (response.success) {
        setAmount("");
        onSuccess?.();
        onClose();
      } else {
        setError(response.message || "Failed to stake");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stake");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-lg p-6 max-w-md w-full m-4"
        onClick={(e) => e.stopPropagation()}
        style={{ borderColor: COLORS.border, borderWidth: 1 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>
            Stake {assetSymbol}
          </h3>
          <button
            onClick={onClose}
            className="text-2xl"
            style={{ color: COLORS.textSecondary }}
          >
            ×
          </button>
        </div>

        {/* Info Box */}
        <div
          className="p-3 rounded mb-4"
          style={{ backgroundColor: "rgba(24, 144, 255, 0.1)" }}
        >
          <p className="text-xs mb-2" style={{ color: COLORS.textSecondary }}>
            APY: <span style={{ color: COLORS.success }}>{apy.toFixed(1)}%</span>
          </p>
          {capacityPct !== null && (
            <p className="text-xs" style={{ color: COLORS.textSecondary }}>
              Pool: <span style={{ color: COLORS.textPrimary }}>{(100 - capacityPct).toFixed(1)}%</span> available
            </p>
          )}
        </div>

        {/* Input */}
        <div className="mb-6">
          <label
            className="block text-sm font-semibold mb-2"
            style={{ color: COLORS.textPrimary }}
          >
            Amount to Stake
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Min: ${minStake} ${assetSymbol}`}
            className="w-full px-4 py-2 rounded bg-gray-800 border"
            style={{
              borderColor: COLORS.border,
              color: COLORS.textPrimary,
            }}
            disabled={loading}
          />
          <p className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>
            Minimum: {minStake.toLocaleString()} {assetSymbol}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="p-3 rounded mb-4"
            style={{ backgroundColor: "rgba(246, 70, 93, 0.1)" }}
          >
            <p className="text-sm" style={{ color: COLORS.danger }}>
              {error}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2 rounded font-semibold"
            style={{
              backgroundColor: COLORS.border,
              color: COLORS.textPrimary,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleStake}
            disabled={loading || !amount}
            className="flex-1 py-2 rounded font-semibold"
            style={{
              backgroundColor: amount ? COLORS.primary : COLORS.bgSecondary,
              color: COLORS.textPrimary,
              cursor: amount && !loading ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "Staking..." : "Stake"}
          </button>
        </div>
      </div>
    </div>
  );
};
