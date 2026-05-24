import axios from 'axios';
import { getApiBaseUrl } from '../config/runtime';

const normalizedApiBaseUrl = getApiBaseUrl();

if (!normalizedApiBaseUrl) {
  throw new Error('VITE_API_URL is required');
}

const apiBaseUrl = normalizedApiBaseUrl.endsWith('/api')
  ? normalizedApiBaseUrl
  : `${normalizedApiBaseUrl}/api`;

/**
 * =========================
 * ENV CHECK
 * =========================
 */
if (!apiBaseUrl) {
  console.error('[api] VITE_API_URL is missing in .env');
}

/**
 * =========================
 * AXIOS INSTANCE
 * =========================
 */
const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
});

/**
 * =========================
 * REQUEST INTERCEPTOR
 * =========================
 */
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('chatsphere_token') ||
      localStorage.getItem('token');

    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`
      };
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * =========================
 * RESPONSE INTERCEPTOR
 * =========================
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    /**
     * logout on 401
     */
    if (status === 401) {
      localStorage.removeItem('chatsphere_token');
      localStorage.removeItem('chatsphere_user');
      localStorage.removeItem('token');
    }

    /**
     * network error fix
     */
    if (!error?.response) {
      console.error('[api] Network error - backend not reachable');
    }

    return Promise.reject(error);
  }
);

export default api;