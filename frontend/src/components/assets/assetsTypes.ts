// Shared types for Assets page components

export type AssetRow = {
  symbol: string;
  name: string;
  total: number;
  available: number;
  inOrders: number;
  price: number;
  change24h: number;
  usdValue: number;
  allocationPercent: number; // 0..100
};

