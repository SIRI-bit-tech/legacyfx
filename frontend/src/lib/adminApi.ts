// Admin API client — uses admin_token stored separately from user token
import { API_BASE_URL } from '@/constants';

const ADMIN_TOKEN_KEY = 'admin_token';

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  // Also set a secure cookie for server-side access (middleware)
  if (typeof document !== 'undefined') {
    document.cookie = `${ADMIN_TOKEN_KEY}=${token}; path=/; max-age=86400; SameSite=Lax`;
  }
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  if (typeof document !== 'undefined') {
    document.cookie = `${ADMIN_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err?.detail || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const adminApi = {
  get: <T>(path: string) => adminFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    adminFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    adminFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    adminFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => adminFetch<T>(path, { method: 'DELETE' }),
};

// --- Typed API helpers ---

export const adminAuthApi = {
  login: (email: string, password: string) =>
    adminApi.post<{ access_token: string; admin: { id: string; email: string; name: string; status: string } }>(
      '/admin/auth/login', { email, password }
    ),
  register: (data: { name: string; email: string; password: string; adminCode: string }) =>
    adminApi.post<{ message: string }>('/admin/auth/register', {
      name: data.name,
      email: data.email,
      password: data.password,
      admin_code: data.adminCode
    }),
};

export const adminStatsApi = {
  getStats: () => adminApi.get<{
    total_users: number;
    total_deposited: number;
    pending_deposits: number;
    pending_withdrawals: number;
    system_status: string;
  }>('/admin/stats'),
};

export const adminUsersApi = {
  list: (params?: string) => adminApi.get<{ id: string; email: string; tier: string; status: string }[]>(
    `/admin/users${params ? `?${params}` : ''}`
  ),
  updateStatus: (id: string, status: string) =>
    adminApi.patch(`/admin/users/${id}/status`, { status }),
};

export const adminDepositsApi = {
  list: () => adminApi.get<any[]>('/admin/deposits'),
  approve: (id: string) => adminApi.post(`/admin/deposits/${id}/approve`),
  reject: (id: string) => adminApi.post(`/admin/deposits/${id}/reject`),
};

export const adminWithdrawalsApi = {
  list: () => adminApi.get<any[]>('/admin/withdrawals'),
  approve: (id: string) => adminApi.post(`/admin/withdrawals/${id}/approve`),
  reject: (id: string) => adminApi.post(`/admin/withdrawals/${id}/reject`),
};

export const adminDepositAddressesApi = {
  list: () => adminApi.get<any[]>('/admin/deposit-addresses'),
  create: (body: unknown) => adminApi.post('/admin/deposit-addresses', body),
  update: (id: string, body: unknown) => adminApi.put(`/admin/deposit-addresses/${id}`, body),
  delete: (id: string) => adminApi.delete(`/admin/deposit-addresses/${id}`),
  toggle: (id: string, is_active: boolean) =>
    adminApi.patch(`/admin/deposit-addresses/${id}`, { is_active }),
};

export const adminMiningApi = {
  listSubscriptions: () => adminApi.get<any[]>('/admin/mining/subscriptions'),
  approve: (id: string) => adminApi.post(`/admin/mining/subscriptions/${id}/approve`),
};

export const adminAssetsApi = {
  list: () => adminApi.get<any[]>('/admin/assets'),
  add: (body: unknown) => adminApi.post('/admin/assets', body),
  toggle: (id: string, is_enabled: boolean) => adminApi.patch(`/admin/assets/${id}/toggle`, { is_enabled }),
};

export const adminSettingsApi = {
  get: () => adminApi.get<any>('/admin/settings'),
  update: (body: unknown) => adminApi.patch('/admin/settings', body),
  updateMining: (wallet_id: string, qr_code_url?: string) => 
    adminApi.post('/admin/mining/settings', { wallet_id, qr_code_url }),
};

export const adminStakingApi = {
  listPools: () => adminApi.get<any[]>('/staking/pools'),
  createPool: (body: unknown) => adminApi.post('/staking/admin/pools', body),
  updatePool: (id: string, body: unknown) => adminApi.put(`/staking/admin/pools/${id}`, body),
  listAllStakes: () => adminApi.get<any[]>('/admin/staking/all-stakes'),
};

export const adminSubscriptionsApi = {
  list: (status: string = "PENDING") => adminApi.get<any[]>(`/admin/subscriptions?status=${status}`),
  approve: (id: string, days: number = 30) => adminApi.post(`/admin/subscriptions/${id}/approve?days=${days}`),
  decline: (id: string) => adminApi.post(`/admin/subscriptions/${id}/decline`),
};
