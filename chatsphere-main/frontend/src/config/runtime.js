const normalizeUrl = (value) => (typeof value === 'string' ? value.replace(/\/+$/, '') : '');

export const getApiBaseUrl = () => normalizeUrl(import.meta.env.VITE_API_URL);

export const getSocketUrl = () => normalizeUrl(import.meta.env.VITE_SOCKET_URL);
