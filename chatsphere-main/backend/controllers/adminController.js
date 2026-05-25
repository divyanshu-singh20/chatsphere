import bcrypt from 'bcryptjs';
import { body } from 'express-validator';
import { Op } from 'sequelize';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/jwt.js';
import { createNotification } from '../services/notificationService.js';
import { emitToUser } from '../socket/manager.js';
import { forceUserOffline, getIO } from '../socket/index.js';
import { User } from '../models/index.js';
import { toSafeUser } from './authController.js';

const adminLoginFailure = 'Invalid admin credentials';

export const adminLoginRules = [
  body('identifier').notEmpty().withMessage('Admin email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const normalizeIdentifier = (value) => String(value || '').trim().toLowerCase();
const allowedStatuses = new Set(['pending', 'approved', 'rejected', 'blocked']);

const normalizeStatusFilter = (value) => {
  const status = String(value || '').trim().toLowerCase();
  return allowedStatuses.has(status) ? status : null;
};

const setAuthCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

const getStatusMessage = (status) => {
  if (status === 'approved') return 'User approved';
  if (status === 'rejected') return 'User rejected';
  if (status === 'blocked') return 'User blocked';
  return 'User updated';
};

const notifyStatusChange = async (user, status, messageOverride) => {
  const message = messageOverride || getStatusMessage(status);

  await createNotification({
    userId: user.id,
    type: 'account',
    title: `Account ${status}`,
    body: status === 'approved'
      ? 'Your account has been approved. You can now log in.'
      : status === 'rejected'
        ? 'Your account was rejected by an admin.'
        : status === 'blocked'
          ? 'Your account has been blocked by an admin.'
          : 'Your account has been updated by an admin.',
    meta: { status }
  }).catch(() => {});

  emitToUser(user.id, 'account:status-changed', {
    userId: user.id,
    status,
    message
  });

  const io = getIO();
  if (io) {
    io.emit('account:status-changed', {
      userId: user.id,
      status,
      message
    });
  }

  if (status === 'blocked') {
    await forceUserOffline(user.id);
  }
};

export const adminLogin = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ success: false, message: 'Missing credentials' });
  }

  const normalizedIdentifier = normalizeIdentifier(identifier);
  const user = await User.findOne({
    where: {
      role: 'admin',
      [Op.or]: [
        { email: normalizedIdentifier },
        { username: String(identifier).trim() },
        { phoneNumber: String(identifier).trim() }
      ]
    }
  });

  if (!user) {
    return res.status(401).json({ success: false, message: adminLoginFailure });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ success: false, message: adminLoginFailure });
  }

  if (user.status !== 'approved') {
    return res.status(403).json({ success: false, message: 'Admin account is not active' });
  }

  const token = signToken({ id: user.id, role: user.role });
  setAuthCookie(res, token);

  return res.json({ token, user: toSafeUser(user) });
});

export const adminDashboard = asyncHandler(async (req, res) => {
  const [totalUsers, pendingUsers, approvedUsers, rejectedUsers, blockedUsers] = await Promise.all([
    User.count({ where: { role: 'user' } }),
    User.count({ where: { role: 'user', status: 'pending' } }),
    User.count({ where: { role: 'user', status: 'approved' } }),
    User.count({ where: { role: 'user', status: 'rejected' } }),
    User.count({ where: { role: 'user', status: 'blocked' } })
  ]);

  const recentUsers = await User.findAll({
    where: { role: 'user' },
    order: [['createdAt', 'DESC']],
    limit: 12
  });

  const pendingList = recentUsers.filter((user) => user.status === 'pending').map(toSafeUser);

  return res.json({
    dashboard: {
      totalUsers,
      pendingUsers,
      approvedUsers,
      rejectedUsers,
      blockedUsers,
      recentUsers: recentUsers.map(toSafeUser),
      pendingList
    }
  });
});

export const adminUsers = asyncHandler(async (req, res) => {
  const statusFilter = normalizeStatusFilter(req.query.status);
  const where = { role: 'user' };

  if (statusFilter) {
    where.status = statusFilter;
  }

  const users = await User.findAll({
    where,
    order: [['createdAt', 'DESC']]
  });

  return res.json({
    users: users.map(toSafeUser)
  });
});

export const pendingUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll({
    where: { role: 'user', status: 'pending' },
    order: [['createdAt', 'ASC']]
  });

  return res.json({ users: users.map(toSafeUser) });
});

const updateUserStatus = async (req, res, status, messageOverride) => {
  const user = await User.findByPk(req.params.id);

  if (!user || user.isDeleted) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (user.role === 'admin') {
    return res.status(400).json({ success: false, message: 'Admin accounts cannot be modified here' });
  }

  await user.update({
    status,
    isOnline: false,
    lastSeenAt: new Date()
  });

  await notifyStatusChange(user, status, messageOverride);

  return res.json({
    success: true,
    message: messageOverride || getStatusMessage(status),
    user: toSafeUser(user)
  });
};

export const approveUser = asyncHandler(async (req, res) => updateUserStatus(req, res, 'approved'));
export const unblockUser = asyncHandler(async (req, res) => updateUserStatus(req, res, 'approved', 'User unblocked'));
export const rejectUser = asyncHandler(async (req, res) => updateUserStatus(req, res, 'rejected'));
export const blockUser = asyncHandler(async (req, res) => updateUserStatus(req, res, 'blocked'));
