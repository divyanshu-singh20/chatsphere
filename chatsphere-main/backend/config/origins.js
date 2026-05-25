const normalizeOrigin = (origin = '') =>
  typeof origin === 'string' ? origin.trim().replace(/\/+$/, '') : '';

const splitValues = (value) =>
  String(value || '')
    .split(',')
    .map((entry) => normalizeOrigin(entry))
    .filter(Boolean);

const toPatternRegExp = (pattern) => {
  const normalizedPattern = normalizeOrigin(pattern);
  if (!normalizedPattern) return null;

  const escaped = normalizedPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^.]+');

  return new RegExp(`^${escaped}$`, 'i');
};

const isDevelopment = () => String(process.env.NODE_ENV || 'development').toLowerCase() !== 'production';

const isLocalhostOrigin = (origin) => {
  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) return false;

  try {
    const parsed = new URL(normalizedOrigin);
    return ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
  } catch {
    return false;
  }
};

const isVercelOrigin = (origin) => {
  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) return false;

  try {
    const parsed = new URL(normalizedOrigin);
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
};

const getConfig = () => {
  const exactOrigins = Array.from(
    new Set([
      ...splitValues(process.env.CLIENT_URL),
      ...splitValues(process.env.CLIENT_URLS)
    ])
  );

  const patternOrigins = Array.from(
    new Set([
      ...splitValues(process.env.CLIENT_ORIGIN_PATTERNS),
      'https://*.vercel.app'
    ])
  );

  return {
    nodeEnv: String(process.env.NODE_ENV || 'development'),
    exactOrigins,
    patternOrigins,
    allowLocalhost: isDevelopment()
  };
};

export const getCorsDebugSummary = () => {
  const config = getConfig();

  return {
    nodeEnv: config.nodeEnv,
    exactOrigins: config.exactOrigins,
    patternOrigins: config.patternOrigins,
    allowLocalhost: config.allowLocalhost,
    allowNoOrigin: true,
    allowVercelAppSubdomains: true
  };
};

export const getClientOrigins = () => getConfig().exactOrigins;

export const isAllowedClientOrigin = (origin) => {
  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) return false;

  const config = getConfig();

  if (config.exactOrigins.includes(normalizedOrigin)) return true;
  if (isLocalhostOrigin(normalizedOrigin)) return true;
  if (isVercelOrigin(normalizedOrigin)) return true;

  return config.patternOrigins.some((pattern) => {
    const matcher = toPatternRegExp(pattern);
    return matcher ? matcher.test(normalizedOrigin) : false;
  });
};

export const getSocketCorsOrigins = () => getCorsDebugSummary();
