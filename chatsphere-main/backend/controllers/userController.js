import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadBuffer } from '../config/cloudinary.js';
import { BlockedUser, StarredMessage, User } from '../models/index.js';

const safeUser = (user) => ({
  id: user.id,
  fullName: user.fullName,
  username: user.username,
  email: user.email,
  phoneNumber: user.phoneNumber,
  avatar: user.avatar,
  bio: user.bio,
  about: user.about,
  status: user.status,
  isOnline: user.isOnline,
  lastSeenAt: user.lastSeenAt
});

const chatListUser = (user) => ({
  id: user.id,
  fullName: user.fullName,
  username: user.username,
  avatar: user.avatar,
  status: user.status,
  isOnline: user.isOnline,
  lastSeenAt: user.lastSeenAt
});

export const getProfile = asyncHandler(async (req, res) => {
  res.json({ user: safeUser(req.user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, bio, about, status } = req.body;
  if (fullName) req.user.fullName = fullName;
  if (bio !== undefined) req.user.bio = bio;
  if (about !== undefined) req.user.about = about;
  if (status !== undefined) req.user.status = status;
  if (req.file) {
    req.user.avatar = await uploadBuffer(req.file.buffer, req.file.mimetype, 'chatsphere/avatars');
  }
  await req.user.save();
  res.json({ user: safeUser(req.user) });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!(await bcrypt.compare(currentPassword, req.user.password))) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }
  req.user.password = await bcrypt.hash(newPassword, 12);
  await req.user.save();
  res.json({ message: 'Password changed' });
});

export const searchUsers = asyncHandler(async (req, res) => {
  const q = req.query.q || '';
  const users = await User.findAll({
    where: {
      role: 'user',
      status: 'approved',
      isDeleted: false,
      [Op.or]: [
        { fullName: { [Op.like]: `%${q}%` } },
        { username: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } }
      ]
    },
    limit: 20,
    attributes: ['id', 'fullName', 'username', 'avatar', 'status', 'isOnline', 'lastSeenAt'],
    order: [['createdAt', 'DESC']]
  });
  res.json({ users: users.map(chatListUser) });
});

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll({
    where: {
      role: 'user',
      status: 'approved',
      isDeleted: false
    },
    attributes: ['id', 'fullName', 'username', 'avatar', 'status', 'isOnline', 'lastSeenAt'],
    order: [['fullName', 'ASC']]
  });
  // Exclude current user from list
  const filtered = users.filter((u) => u.id !== req.user.id);
  res.json({ users: filtered.map(chatListUser) });
});

export const blockUser = asyncHandler(async (req, res) => {
  const blockedId = Number(req.params.userId);
  await BlockedUser.findOrCreate({ where: { blockerId: req.user.id, blockedId } });
  res.json({ message: 'User blocked' });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  req.user.isDeleted = true;
  await req.user.save();
  res.json({ message: 'Account deleted' });
});
