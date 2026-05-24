import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || (window?.location?.origin + '/api');

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor: attach auth token if present
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

// Response interceptor: basic error handling and optional refresh logic placeholder
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (err.response && err.response.status === 401 && !originalRequest._retry) {
      // Placeholder: refresh token flow can be implemented here
      originalRequest._retry = true;
      // const refreshToken = localStorage.getItem('refreshToken');
      // if (refreshToken) { await refresh and retry }
    }
    return Promise.reject(err);
  }
);

export default api;
