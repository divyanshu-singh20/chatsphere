// import express from 'express';
// import cors from 'cors';
// import helmet from 'helmet';
// import cookieParser from 'cookie-parser';
// import rateLimit from 'express-rate-limit';

// import authRoutes from './routes/authRoutes.js';
// import userRoutes from './routes/userRoutes.js';
// import chatRoutes from './routes/chatRoutes.js';
// import messageRoutes from './routes/messageRoutes.js';
// import groupRoutes from './routes/groupRoutes.js';
// import notificationRoutes from './routes/notificationRoutes.js';
// import callRoutes from './routes/callRoutes.js';

// import { errorHandler, notFound } from './middleware/errorHandler.js';

// const app = express();

// app.set('trust proxy', 1);

// const EXACT_ALLOWED_ORIGINS = [
//   'http://localhost:5173',
//   'https://chatsphere-frontend-self.vercel.app'
// ];

// /**
//  * CORS ORIGIN MATCHERS
//  */
// const normalizeOrigin = (origin) => origin.replace(/\/+$/, '');

// const allowedOrigins = Array.from(
//   new Set([
//     ...EXACT_ALLOWED_ORIGINS
//   ])
// );

// const isAllowedOrigin = (origin) => {
//   const normalized = normalizeOrigin(origin);
//   if (allowedOrigins.includes(normalized)) return true;
//   return false;
// };

// const corsOptions = {
//   origin(origin, callback) {
//     console.log('[CORS REQUEST]', origin);

//     if (!origin) return callback(null, true);

//     if (isAllowedOrigin(origin)) {
//       return callback(null, true);
//     }

//     console.log('[CORS BLOCKED]', origin);
//     return callback(new Error('Not allowed by CORS'), false);
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   optionsSuccessStatus: 204
// };

// /**
//  * CORS
//  */
// app.use(cors(corsOptions));
// app.options('*', cors(corsOptions));

// app.use(helmet({ crossOriginResourcePolicy: false }));
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());

// app.use(rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 500
// }));

// app.use((req, res, next) => {
//   console.log(req.method, req.originalUrl);
//   next();
// });

// /**
//  * ROUTES
//  */
// app.get('/', (req, res) => {
//   res.json({ success: true, message: 'ChatSphere API Running' });
// });

// app.get('/api/health', (req, res) => {
//   res.json({ success: true });
// });

// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/chats', chatRoutes);
// app.use('/api/messages', messageRoutes);
// app.use('/api/groups', groupRoutes);
// app.use('/api/notifications', notificationRoutes);
// app.use('/api/calls', callRoutes);

// /**
//  * ERROR HANDLERS
//  */
// app.use(notFound);
// app.use(errorHandler);

// export default app;



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

import { errorHandler, notFound } from './middleware/errorHandler.js';
import { getClientOrigins, isAllowedClientOrigin } from './config/origins.js';

const app = express();

app.set('trust proxy', 1);

/**
 * =========================
 * ALLOWED ORIGINS
 * =========================
 */
const allowedOrigins = getClientOrigins();

if (!allowedOrigins.length) {
  console.warn('[CORS] No CLIENT_URL configured; cross-origin requests will be blocked until env is set');
}

const isAllowedOrigin = (origin) => {
  return isAllowedClientOrigin(origin);
};

/**
 * =========================
 * CORS CONFIG (FIXED)
 * =========================
 */
const corsOptions = {
  origin(origin, callback) {
    console.log('[CORS REQUEST]', origin);

    // allow Postman / server-to-server
    if (!origin) return callback(null, true);

    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    console.log('[CORS BLOCKED]', origin);

    // IMPORTANT FIX: do NOT throw error (prevents preflight crash)
    return callback(null, false);
  },

  credentials: true,

  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  allowedHeaders: ['Content-Type', 'Authorization'],

  optionsSuccessStatus: 204
};

/**
 * =========================
 * GLOBAL MIDDLEWARE
 * =========================
 */

// MUST: allow credentials before cors
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(helmet({ crossOriginResourcePolicy: false }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500
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
  res.json({ success: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/calls', callRoutes);

/**
 * =========================
 * ERROR HANDLERS
 * =========================
 */
app.use(notFound);
app.use(errorHandler);

export default app;