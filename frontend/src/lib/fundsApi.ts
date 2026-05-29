// Funds API helpers for Assets Deposit/Withdraw modals

import { api } from '@/lib/api';

export type DepositAddressResponse = {
  address: string;
  qrCodeUrl: string;
  minDeposit: number;
  fee: number;
  network: string;
};

export async function fetchDepositAddress({
  userId,
  asset,
  network,
}: {
  userId: string;
  asset: string;
  network: string;
}): Promise<DepositAddressResponse> {
  const params = new URLSearchParams({
    userId,
    asset,
    network,
  });

  return api.get(`/funds/deposit-address?${params.toString()}`);
}

export async function requestWithdrawal({
  asset,
  network,
  address,
  amount,
}: {
  userId?: string;
  asset: string;
  network: string;
  address: string;
  amount: number;
}) {
  return api.post('/withdrawals/request', {
    asset_symbol: asset,
    amount,
    destination_address: address,
    blockchain_network: network,
  });
}

