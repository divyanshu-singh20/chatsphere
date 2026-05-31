import bcrypt from 'bcryptjs';
import { body } from 'express-validator';
import { Op } from 'sequelize';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/jwt.js';
import { uploadBuffer } from '../config/cloudinary.js';
import { User } from '../models/index.js';
import { getIO } from '../socket/index.js';
import SocketManager from '../socket/manager.js';
import presenceService from '../services/presenceService.js';

export const toSafeUser = (user) => ({
  id: user.id,
  fullName: user.fullName,
  username: user.username,
  email: user.email,
  phoneNumber: user.phoneNumber,
  role: user.role,
  status: user.status,
  avatar: user.avatar,
  bio: user.bio,
  isOnline: user.isOnline,
  lastSeenAt: user.lastSeenAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const getLoginRejectionMessage = (user) => {
  if (user.role === 'admin') return 'Use admin login';
  if (user.status === 'pending') return 'Your account is pending admin approval';
  if (user.status === 'rejected') return 'Your account was rejected';
  if (user.status === 'blocked') return 'Your account has been blocked';
  return 'Account is not available';
};

const normalizeIdentifier = (value) => String(value || '').trim().toLowerCase();

export const registerRules = [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('username').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
];

export const loginRules = [
  body('identifier').notEmpty().withMessage('Email or phone is required'),
  body('password').notEmpty().withMessage('Password is required')
];

export const register = asyncHandler(async (req, res) => {
  try {
    const { fullName, username, email, phoneNumber, password, bio } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!fullName || !username || !email || !phoneNumber || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const emailExists = await User.findOne({ where: { email: normalizedEmail } });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const usernameExists = await User.findOne({ where: { username } });
    if (usernameExists) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    const phoneExists = await User.findOne({ where: { phoneNumber } });
    if (phoneExists) {
      return res.status(400).json({ success: false, message: 'Phone number already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    let avatarUrl = '';
    if (req.file) {
      try {
        avatarUrl = await uploadBuffer(req.file.buffer, req.file.mimetype, 'chatsphere/avatars');
      } catch (err) {
        console.warn('avatar upload failed', err.message || err);
      }
    }

    const user = await User.create({
      fullName,
      username,
      email: normalizedEmail,
      phoneNumber,
      password: hashedPassword,
      bio,
      avatar: avatarUrl || null,
      role: 'user',
      status: 'pending'
    });

    const io = getIO();
    if (io) {
      const payload = { user: toSafeUser(user), userId: user.id, status: 'pending', message: 'New user registered' };
      io.to('admins').emit('pending-user-added', payload);
      io.to('admins').emit('user:registered', payload);
    }

    return res.status(201).json({
      success: true,
      message: 'Registration submitted. Wait for admin approval.',
      user: toSafeUser(user)
    });
  } catch (error) {
    console.error('register error', error);
    return res.status(500).json({ success: false, message: error.message || 'Registration failed' });
  }
});

export const login = asyncHandler(async (req, res) => {
  try {
    const { identifier, password } = req.body;
    console.log('[auth][login] incoming', {
      identifier,
      passwordProvided: !!password,
      nodeEnv: process.env.NODE_ENV || 'development'
    });

    if (!identifier || !password) {
      console.log('[auth][login] rejected: missing credentials');
      return res.status(400).json({ success: false, message: 'Missing credentials' });
    }

    const normalizedIdentifier = normalizeIdentifier(identifier);
    console.log('[auth][login] normalized identifier', normalizedIdentifier);

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: normalizedIdentifier },
          { phoneNumber: String(identifier).trim() },
          { username: String(identifier).trim() }
        ]
      }
    });
    console.log('[auth][login] db lookup result', user ? {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status,
      hasPassword: !!user.password
    } : null);

    if (!user) {
      console.log('[auth][login] rejected: user not found');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Use admin login' });
    }

    if (user.status !== 'approved') {
      console.log('[auth][login] rejected: user not approved', { role: user.role, status: user.status });
      return res.status(403).json({ success: false, message: getLoginRejectionMessage(user) });
    }

    const match = await bcrypt.compare(password, user.password);
    console.log('[auth][login] password compare result', { userId: user.id, match });
    if (!match) {
      console.log('[auth][login] rejected: password mismatch');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken({ id: user.id });
    console.log('[auth][login] token generation status', { userId: user.id, tokenGenerated: !!token });

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    console.debug('[auth][login] marking user online', { userId: user.id });
    User.update({ isOnline: true, lastSeenAt: null }, { where: { id: user.id } }).catch(() => {});
    try {
      await presenceService.setOnline(user.id);
      const io = getIO();
      if (io) {
        const onlineUsers = await presenceService.getOnlineUsers();
        io.emit('user:online', { userId: user.id, lastSeenAt: null });
        io.emit('online-users', onlineUsers);
        console.debug('[auth][login] emitted presence', { userId: user.id, onlineUsers });
      }
    } catch (err) {
      console.warn('[auth][login] presence broadcast failed', err?.message || err);
    }
    console.log('[auth][login] success', { userId: user.id, role: user.role });
    return res.json({ token, user: toSafeUser(user) });
  } catch (error) {
    console.error('login error', error);
    return res.status(500).json({ success: false, message: error.message || 'Login failed' });
  }
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: toSafeUser(req.user) });
});

export const logout = asyncHandler(async (req, res) => {
  if (req.user?.id) {
    await User.update(
      { isOnline: false, lastSeenAt: new Date() },
      { where: { id: req.user.id } }
    ).catch(() => {});
  }

  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction
  });
  res.json({ message: 'Logged out' });
});