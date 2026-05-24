const normalizeOrigin = (origin = '') =>
  typeof origin === 'string' ? origin.replace(/\/+$/, '') : '';

export const getClientOrigins = () => {
  const rawOrigins = [process.env.CLIENT_URL, process.env.CLIENT_URLS]
    .filter(Boolean)
    .flatMap((value) => String(value).split(','))
    .map((value) => normalizeOrigin(value.trim()))
    .filter(Boolean);

  return Array.from(new Set(rawOrigins));
};

export const isAllowedClientOrigin = (origin) => {
  const allowedOrigins = getClientOrigins();
  return allowedOrigins.includes(normalizeOrigin(origin));
};

export const getSocketCorsOrigins = () => getClientOrigins();
