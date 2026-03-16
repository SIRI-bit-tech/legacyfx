/**
 * Global TypeScript type definitions
 */

export interface User {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
  kyc_status: string;
  created_at: string;
}

export interface Account {
  id: string;
  account_type: string;
  name: string;
  currency: string;
  balance: number;
  created_at: string;
}

export interface Trade {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  entry_price: number;
  exit_price?: number;
  pnl?: number;
  status: string;
  created_at: string;
}

export interface Market {
  id: string;
  symbol: string;
  name: string;
  price: number;
  market_cap?: number;
  change_24h: number;
  volume_24h: number;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user?: User;
  token?: string;
  loading: boolean;
  error?: string;
}


export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  status: number;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

