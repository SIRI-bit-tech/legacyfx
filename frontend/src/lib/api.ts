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

// Token management function
const setToken = (token: string | null) => {
    if (typeof window !== 'undefined') {
        if (token) {
            localStorage.setItem('access_token', token);
        } else {
            localStorage.removeItem('access_token');
        }
    }
};

// Interceptor to add auth token
axiosInstance.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor to handle errors globally and extract data
axiosInstance.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const message = error.response?.data?.detail || error.message || 'An unexpected error occurred';
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
