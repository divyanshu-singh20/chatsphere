import { verifyToken } from '../utils/jwt.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/index.js';

export const protect = asyncHandler(async (req, res, next) => {
  try {
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

    if (user.role !== 'admin' && user.status !== 'approved') {
      const reason = user.status === 'pending'
        ? 'Your account is pending approval'
        : user.status === 'rejected'
          ? 'Your account was rejected'
          : 'Your account has been blocked';

      return res.status(403).json({ success: false, message: reason });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('protect middleware error', error);
    return res.status(500).json({ success: false, message: 'Auth middleware error' });
  }
});