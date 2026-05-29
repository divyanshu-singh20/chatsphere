import axios from 'axios';
import { getApiBaseUrl } from '../config/runtime';

const normalizedApiBaseUrl = getApiBaseUrl();

console.info('[runtime] API URL', normalizedApiBaseUrl);

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
    const requestUrl = error?.config?.url || error?.request?.responseURL || null;

    /**
     * logout on 401
     */
    if (status === 401) {
      console.warn('[api][response] clearing auth after 401', { requestUrl });
      localStorage.removeItem('chatsphere_token');
      localStorage.removeItem('chatsphere_user');
      localStorage.removeItem('token');
    }

    if (status && status >= 400) {
      console.warn('[api][response] error', { status, requestUrl });
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