import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;
const DEV_FALLBACK = 'chatsphere-dev-secret';

if (!SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('[jwt] Missing required env var JWT_SECRET in production');
}

const getSecret = () => SECRET || DEV_FALLBACK;

export const signToken = (payload) => jwt.sign(payload, getSecret(), {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
});

export const verifyToken = (token) => jwt.verify(token, getSecret());