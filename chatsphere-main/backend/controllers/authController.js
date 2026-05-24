import bcrypt from 'bcryptjs';
import { body } from 'express-validator';
import { Op } from 'sequelize';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/jwt.js';
import { uploadBuffer } from '../config/cloudinary.js';
import { createNotification } from '../services/notificationService.js';
import { User } from '../models/index.js';

const toSafeUser = (user) => ({
  id: user.id,
  fullName: user.fullName,
  username: user.username,
  email: user.email,
  phoneNumber: user.phoneNumber,
  avatar: user.avatar,
  bio: user.bio,
  status: user.status,
  isOnline: user.isOnline,
  lastSeenAt: user.lastSeenAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

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

    const user = await User.create({ fullName, username, email: normalizedEmail, phoneNumber, password: hashedPassword, bio, avatar: avatarUrl || null });
    const token = signToken({ id: user.id });
    await createNotification({ userId: user.id, type: 'welcome', title: 'Welcome to ChatSphere', body: 'Your account is ready' });

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    console.log('[auth] cookie set', {
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax'
    });
    return res.status(201).json({ token, user: toSafeUser(user) });
  } catch (error) {
    console.error('register error', error);
    return res.status(500).json({ success: false, message: error.message || 'Registration failed' });
  }
});

export const login = asyncHandler(async (req, res) => {
  try {
    const { identifier, password } = req.body;
    console.log('login body', req.body);
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Missing credentials' });
    }
    const user = await User.findOne({ where: { [Op.or]: [{ email: identifier }, { phoneNumber: identifier }] } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken({ id: user.id });
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    console.log('[auth] cookie set', {
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax'
    });
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