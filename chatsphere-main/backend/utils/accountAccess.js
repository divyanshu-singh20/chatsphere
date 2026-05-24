const allowedStatuses = new Set(['pending', 'approved', 'blocked']);
const allowedRoles = new Set(['user', 'admin']);

export const normalizeAccountStatus = (status) => {
  const value = String(status || '').trim().toLowerCase();
  if (allowedStatuses.has(value)) return value;
  return 'approved';
};

export const normalizeRole = (role) => {
  const value = String(role || '').trim().toLowerCase();
  if (allowedRoles.has(value)) return value;
  return 'user';
};

export const isAccountPending = (status) => normalizeAccountStatus(status) === 'pending';

export const isAccountBlocked = (status) => normalizeAccountStatus(status) === 'blocked';

export const isAccountApproved = (status) => normalizeAccountStatus(status) === 'approved';

export const getAccountAccessMessage = (status) => {
  const normalized = normalizeAccountStatus(status);
  if (normalized === 'pending') return 'Account waiting for admin approval';
  if (normalized === 'blocked') return 'Account blocked by admin';
  return 'Account approved';
};
