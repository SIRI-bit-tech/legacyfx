// Transactions API helper for Assets page recent list

import { api } from '@/lib/api';

export type RecentTransaction = {
  type: 'deposit' | 'withdraw' | 'trade';
  asset: string;
  amount: number;
  status: string;
  network: string;
  date: string;
  txHash: string;
};

export async function fetchRecentTransactions({
  userId,
  limit,
}: {
  userId: string;
  limit: number;
}): Promise<{ transactions: RecentTransaction[] }> {
  return api.get(`/transactions/recent?userId=${encodeURIComponent(userId)}&limit=${encodeURIComponent(limit)}`);
}

