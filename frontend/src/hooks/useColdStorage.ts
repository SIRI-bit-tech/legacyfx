'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

interface Asset {
    asset_symbol: string;
    balance: number;
    usd_value: number;
}

interface Vault {
    id: string;
    user_id: string;
    total_balance_usd: number;
    is_locked: boolean;
    last_withdrawal_at: string | null;
    created_at: string;
    assets: Asset[];
}

interface Transaction {
    id: string;
    transaction_type: string;
    asset_symbol: string;
    amount: number;
    usd_amount: number | null;
    vault_balance_after: number;
    created_at: string;
}

export function useColdStorage() {
    const [vault, setVault] = useState<Vault | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState(0);

    // Fetch vault data
    const fetchVault = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(API_ENDPOINTS.COLD_STORAGE.VAULT);
            // Handle both response.data and direct response formats
            const vaultData = response?.data ? response.data : response;
            if (vaultData) {
                setVault(vaultData);
            } else {
                setError('No vault data received');
            }
        } catch (err: any) {
            console.error('Vault fetch error:', err);
            const message = err.message || 'Failed to fetch vault data';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch transactions
    const fetchTransactions = useCallback(async (page: number = 1, limit: number = 10) => {
        try {
            const response = await api.get(API_ENDPOINTS.COLD_STORAGE.TRANSACTIONS, {
                params: { page, limit }
            });
            // Handle both response.data and direct response formats
            const txData = response?.data ? response.data : response;
            if (txData) {
                setTransactions(txData.transactions || []);
                setTotalPages(txData.total_pages || 0);
            }
        } catch (err: any) {
            console.error('Failed to fetch transactions:', err);
        }
    }, []);

    // Deposit to vault
    const depositToVault = useCallback(async (assetSymbol: string, amount: number) => {
        try {
            setError(null);
            const response = await api.post(API_ENDPOINTS.COLD_STORAGE.DEPOSIT, {
                asset_symbol: assetSymbol,
                amount
            });
            // Refresh vault after deposit
            await fetchVault();
            await fetchTransactions();
            return response;
        } catch (err: any) {
            const message = err.message || 'Failed to deposit';
            setError(message);
            throw new Error(message);
        }
    }, [fetchVault, fetchTransactions]);

    // Withdraw from vault
    const withdrawFromVault = useCallback(async (assetSymbol: string, amount: number) => {
        try {
            setError(null);
            const response = await api.post(API_ENDPOINTS.COLD_STORAGE.WITHDRAW, {
                asset_symbol: assetSymbol,
                amount
            });
            // Refresh vault after withdrawal
            await fetchVault();
            await fetchTransactions();
            return response;
        } catch (err: any) {
            const message = err.message || 'Failed to withdraw';
            setError(message);
            throw new Error(message);
        }
    }, [fetchVault, fetchTransactions]);

    // Toggle lock
    const toggleLock = useCallback(async (isLocked: boolean) => {
        try {
            setError(null);
            const response = await api.post(API_ENDPOINTS.COLD_STORAGE.TOGGLE_LOCK, {
                is_locked: isLocked
            });
            // Refresh vault after toggle
            await fetchVault();
            return response;
        } catch (err: any) {
            const message = err.message || 'Failed to toggle lock';
            setError(message);
            throw new Error(message);
        }
    }, [fetchVault]);

    // Initial load
    useEffect(() => {
        fetchVault();
        fetchTransactions();
    }, [fetchVault, fetchTransactions]);

    return {
        vault,
        transactions,
        loading,
        error,
        totalPages,
        depositToVault,
        withdrawFromVault,
        toggleLock,
        fetchVault,
        fetchTransactions,
        setError
    };
}
