/**
 * API and configuration constants
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    SESSION: "/auth/session",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    VERIFY_EMAIL: "/auth/verify-email",
    RESEND_EMAIL: "/auth/resend-verification-email",
    TWO_FA_ENABLE: "/auth/2fa/enable",
    TWO_FA_VERIFY: "/auth/2fa/verify",
    TWO_FA_DISABLE: "/auth/2fa/disable",
  },
  ACCOUNTS: {
    LIST: "/accounts",
    GET: (id: string) => `/accounts/${id}`,
    CREATE: "/accounts",
    UPDATE: (id: string) => `/accounts/${id}`,
    BALANCE: (id: string) => `/accounts/${id}/balance`,
    TRANSACTIONS: (id: string) => `/accounts/${id}/transactions`,
  },
  MARKETS: {
    PRICES: "/markets/prices",
    PRICE: (symbol: string) => `/markets/prices/${symbol}`,
    OVERVIEW: "/markets/global-stats",
    PAIRS: "/markets/pairs",
  },
  TRADES: {
    CREATE: "/trading/orders",
    HISTORY: "/trading/history",
    GET: (id: string) => `/trading/${id}`,
    PORTFOLIO: "/trading/portfolio",
  },
  COPY_TRADING: {
    MASTER_TRADERS: "/copy-trading/master-traders",
    SEARCH_TRADERS: "/copy-trading/search-traders",
    START: "/copy-trading/start",
    STOP: "/copy-trading/stop",
    STATUS: (id: string) => `/copy-trading/status/${id}`,
    HISTORY: (id: string) => `/copy-trading/history/${id}`,
  },
  WALLETS: {
    LIST: "/wallets",
    GET: (id: string) => `/wallets/${id}`,
    DEPOSIT: "/wallets/deposit",
    WITHDRAW: "/wallets/withdraw",
    WITHDRAW_HISTORY: "/wallets/withdraw/history",
    DEPOSIT_HISTORY: "/wallets/deposit/history",
    COLD_STORAGE: "/wallets/cold-storage",
    COLD_STORAGE_VIEW: "/wallets/cold-storage",
    CONNECT: "/wallets/connect",
    CONNECTED: "/wallets/connected",
  },
  NOTIFICATIONS: {
    LIST: "/notifications",
    READ: (id: string) => `/notifications/${id}/read`,
    READ_ALL: "/notifications/read-all",
    SETTINGS: "/notifications/settings",
    UPDATE_SETTINGS: "/notifications/settings",
    DELETE: (id: string) => `/notifications/${id}`,
  },
  STAKING: {
    POOLS: "/staking/pools",
    STAKE: "/staking/stakes",
    POSITIONS: "/staking/stakes",
    UNSTAKE: (id: string) => `/staking/stakes/${id}`,
    REWARDS: "/staking/rewards",
    POOL_DETAILS: (id: string) => `/staking/pools/${id}`,
    STATS: "/staking/stats",
    REWARDS_CLAIM: "/staking/rewards/claim",
    SCHEDULE: "/staking/schedule",
  },
  INVESTMENTS: {
    PRODUCTS: "/investments/products",
    INVEST: "/investments/invest",
    ACTIVE: "/investments/my-investments",
    HISTORY: "/investments/history",
    REDEEM: (id: string) => `/investments/${id}/redeem`,
    GET: (id: string) => `/investments/${id}`,
  },
  MINING: {
    PLANS: "/mining/plans",
    SUBSCRIBE: "/mining/subscribe",
    ACTIVE: "/mining/my-mining",
    EARNINGS: "/mining/earnings",
    CANCEL: (id: string) => `/mining/${id}/cancel`,
    STATS: "/mining/stats",
    STATS_ALL: "/mining/stats/all",
  },
  SIGNALS: {
    LIST: "/signals",
    GET: (id: string) => `/signals/${id}`,
    FOLLOW: (id: string) => `/signals/${id}/follow`,
    HISTORY: "/signals/history",
    SUBSCRIBE: "/signals/subscribe",
  },
  REFERRALS: {
    CODE: "/referrals/code",
    STATS: "/referrals/stats",
    HISTORY: "/referrals/history",
    CLAIM: "/referrals/claim",
    LEADERBOARD: "/referrals/leaderboard",
  },
  DEPOSITS: {
    REQUEST: "/deposits/request",
    HISTORY: "/deposits/history",
    CONFIRM: (id: string) => `/deposits/${id}/confirm`,
  },
  COLD_STORAGE: {
    VAULT: "/cold-storage/vault",
    DEPOSIT: "/cold-storage/deposit",
    WITHDRAW: "/cold-storage/withdraw",
    TOGGLE_LOCK: "/cold-storage/toggle-lock",
    TRANSACTIONS: "/cold-storage/transactions",
  },
  ACTIVITY: {
    LIST: "/transactions",
  },
};

export const COLORS = {
  // Background
  bgPrimary: "#1E2329",
  bgSecondary: "#181A20",
  bgTertiary: "#2B2F36",
  bgElevated: "#0B0E11",

  // Primary Yellow
  primary: "#FCD535",
  primaryAlt: "#F3BA2F",
  primaryHover: "#F0B90B",

  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "#848E9C",
  textTertiary: "#474D57",

  // Status
  success: "#0ECB81",
  danger: "#F6465D",
  warning: "#F37B24",
  info: "#1890FF",

  // Borders
  border: "#2B2F36",
  borderLight: "#363C45",
};

export const TRADING_PAIRS = [
  "BTC/USDT",
  "ETH/USDT",
  "BNB/USDT",
  "ADA/USDT",
  "SOL/USDT",
  "XRP/USDT",
  "DOGE/USDT",
  "AVAX/USDT",
];

export const CHART_CONFIG = {
  height: 400,
  layout: {
    background: { color: "#1E2329" },
  },
  grid: {
    vertLines: { color: "#2B2F36" },
    horzLines: { color: "#2B2F36" },
  },
};
