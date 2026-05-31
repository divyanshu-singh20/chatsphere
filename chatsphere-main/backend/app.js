import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import callRoutes from './routes/callRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import debugRoutes from './routes/debugRoutes.js';

import { errorHandler, notFound } from './middleware/errorHandler.js';
import { getCorsDebugSummary, isAllowedClientOrigin } from './config/origins.js';

const app = express();

app.set('trust proxy', 1);

const corsDebugSummary = getCorsDebugSummary();

console.log('[startup][cors]', {
  nodeEnv: corsDebugSummary.nodeEnv,
  allowedOrigins: corsDebugSummary.exactOrigins,
  allowedPatterns: corsDebugSummary.patternOrigins,
  allowLocalhost: corsDebugSummary.allowLocalhost,
  allowNoOrigin: corsDebugSummary.allowNoOrigin,
  allowVercelAppSubdomains: corsDebugSummary.allowVercelAppSubdomains
});

const corsOptions = {
  origin(origin, callback) {
    console.log('[CORS REQUEST]', origin);

    if (!origin) return callback(null, true);

    if (isAllowedClientOrigin(origin)) {
      return callback(null, true);
    }

    console.log('[CORS BLOCKED]', origin);
    return callback(null, false);
  },

  credentials: true,

  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],

  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(helmet({ crossOriginResourcePolicy: false }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    skip: (req) => req.method === 'OPTIONS'
  })
);

app.use((req, res, next) => {
  console.log(req.method, req.originalUrl);
  next();
});

/**
 * =========================
 * ROUTES
 * =========================
 */
app.get('/', (req, res) => {
  res.json({ success: true, message: 'ChatSphere API Running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/debug', debugRoutes);

/**
 * =========================
 * ERROR HANDLERS
 * =========================
 */
app.use(notFound);
app.use(errorHandler);

export default app;