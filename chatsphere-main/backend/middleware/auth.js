import { verifyToken } from '../utils/jwt.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/index.js';
import { getAccountAccessMessage, isAccountBlocked, isAccountPending, normalizeAccountStatus, normalizeRole } from '../utils/accountAccess.js';

export const protect = asyncHandler(async (req, res, next) => {
  try {
    console.log('protect middleware auth header:', req.headers && (req.headers.authorization || req.headers.Authorization));
    let token = null;
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    if (!token && req.cookies?.token) token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      console.error('token verify error', err.message || err);
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const user = await User.findByPk(decoded.id);
    if (!user || user.isDeleted) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const normalizedStatus = normalizeAccountStatus(user.status);
    const normalizedRole = normalizeRole(user.role);

    if (isAccountPending(normalizedStatus)) {
      return res.status(403).json({ success: false, message: getAccountAccessMessage('pending') });
    }

    if (isAccountBlocked(normalizedStatus)) {
      return res.status(403).json({ success: false, message: getAccountAccessMessage('blocked') });
    }

    user.status = normalizedStatus;
    user.role = normalizedRole;

    req.user = user;
    next();
  } catch (error) {
    console.error('protect middleware error', error);
    return res.status(500).json({ success: false, message: 'Auth middleware error' });
  }
});