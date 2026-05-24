import { Op } from 'sequelize';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createNotification } from '../services/notificationService.js';
import { forceLogoutUser } from '../socket/index.js';
import { normalizeAccountStatus, normalizeRole } from '../utils/accountAccess.js';
import { User } from '../models/index.js';

const safeAdminUser = (user) => ({
  id: user.id,
  fullName: user.fullName,
  username: user.username,
  email: user.email,
  phoneNumber: user.phoneNumber,
  avatar: user.avatar,
  bio: user.bio,
  about: user.about,
  status: normalizeAccountStatus(user.status),
  role: normalizeRole(user.role),
  isOnline: user.isOnline,
  lastSeenAt: user.lastSeenAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const notifyModerationChange = async ({ actor, target, nextStatus }) => {
  if (!target?.id) return;

  const title = nextStatus === 'approved' ? 'Account approved' : nextStatus === 'blocked' ? 'Account blocked' : 'Account status updated';
  const body = nextStatus === 'approved'
    ? 'Your account has been approved. You can now sign in.'
    : nextStatus === 'blocked'
      ? 'Your account has been blocked by an admin.'
      : 'Your account approval status has been reset to pending.';

  await createNotification({
    userId: target.id,
    type: 'account-status',
    title,
    body,
    meta: {
      nextStatus,
      targetUserId: target.id,
      targetUsername: target.username || null,
      actorUserId: actor?.id || null,
      actorUsername: actor?.username || null
    }
  }).catch(() => {});
};

const updateAccountStatus = async (req, res, nextStatus) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid user id' });
  }

  const user = await User.findByPk(userId);
  if (!user || user.isDeleted) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  user.status = nextStatus;
  await user.save();

  await notifyModerationChange({ actor: req.user, target: user, nextStatus });

  if (nextStatus === 'blocked') {
    forceLogoutUser(user.id, {
      reason: 'blocked-by-admin',
      message: 'Your account was blocked by an admin.'
    });
  }

  return res.json({ success: true, user: safeAdminUser(user) });
};

export const listUsers = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const status = String(req.query.status || '').trim().toLowerCase();

  const where = { isDeleted: false };

  if (q) {
    where[Op.or] = [
      { fullName: { [Op.like]: `%${q}%` } },
      { username: { [Op.like]: `%${q}%` } },
      { email: { [Op.like]: `%${q}%` } },
      { phoneNumber: { [Op.like]: `%${q}%` } }
    ];
  }

  if (['pending', 'approved', 'blocked'].includes(status)) {
    where.status = status;
  }

  const users = await User.findAll({
    where,
    order: [['createdAt', 'DESC']]
  });

  res.json({ users: users.map(safeAdminUser) });
});

export const approveUser = asyncHandler(async (req, res) => updateAccountStatus(req, res, 'approved'));

export const blockUser = asyncHandler(async (req, res) => updateAccountStatus(req, res, 'blocked'));

export const setPendingUser = asyncHandler(async (req, res) => updateAccountStatus(req, res, 'pending'));
