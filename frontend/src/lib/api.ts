import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { API_BASE_URL } from '@/constants';

/**
 * Typed API client interface
 * Provides type-safe HTTP methods and token management
 */
export interface ApiClient {
    get<T = any>(url: string, config?: any): Promise<T>;
    post<T = any>(url: string, data?: any, config?: any): Promise<T>;
    put<T = any>(url: string, data?: any, config?: any): Promise<T>;
    delete<T = any>(url: string, config?: any): Promise<T>;
    patch<T = any>(url: string, data?: any, config?: any): Promise<T>;
    setToken: (token: string | null) => void;
}

// The API_BASE_URL handles the '/api' or '/api/v1' part centrally
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

let accessToken: string | null = null;
if (typeof window !== 'undefined') {
    accessToken = localStorage.getItem('access_token');
}
if (!accessToken && typeof document !== 'undefined') {
    const match = document.cookie.match(new RegExp('(^| )access_token=([^;]+)'));
    if (match) {
        accessToken = match[2];
        if (typeof window !== 'undefined') localStorage.setItem('access_token', accessToken);
    }
}

// Token management function
const setToken = (token: string | null) => {
    accessToken = token;
    if (typeof window !== 'undefined') {
        if (token) {
            localStorage.setItem('access_token', token);
        } else {
            localStorage.removeItem('access_token');
        }
    }
    if (typeof document !== 'undefined') {
        if (token) {
            document.cookie = `access_token=${token}; path=/; max-age=86400; SameSite=Lax`;
        } else {
            document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
        }
    }
};

// Interceptor to add auth token
axiosInstance.interceptors.request.use((config) => {
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Add flag to prevent infinite loops and hold requests
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Interceptor to handle errors globally and extract data
axiosInstance.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        const originalRequest = error.config;
        
        // Handle 401 Unauthorized for token refresh
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/refresh') {
            
            if (isRefreshing) {
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return axiosInstance(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // The refresh token is in an HttpOnly cookie, so we must send credentials
                const res: any = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
                const newAccessToken = res.data.access_token;
                
                setToken(newAccessToken);
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                
                processQueue(null, newAccessToken);
                
                // Return the original request execution
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                setToken(null);
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        let message = 'An unexpected error occurred';
        if (error.response?.data?.detail) {
            const detail = error.response.data.detail;
            if (typeof detail === 'string') {
                message = detail;
            } else if (Array.isArray(detail)) {
                message = detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
            } else {
                message = JSON.stringify(detail);
            }
        } else if (error.message) {
            message = error.message;
        }
        return Promise.reject(new Error(message));
    }
);

// Create typed API client wrapper (no any casts needed)
export const api: ApiClient = {
    get: (url, config) => axiosInstance.get(url, config),
    post: (url, data, config) => axiosInstance.post(url, data, config),
    put: (url, data, config) => axiosInstance.put(url, data, config),
    delete: (url, config) => axiosInstance.delete(url, config),
    patch: (url, data, config) => axiosInstance.patch(url, data, config),
    setToken,
};

export default api;
