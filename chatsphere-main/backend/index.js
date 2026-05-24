import 'dotenv/config';
import http from 'http';
import net from 'net';
import app from './app.js';
import { sequelize } from './models/index.js';
import { initSocket } from './socket/index.js';
import { getCorsDebugSummary } from './config/origins.js';

const BASE_PORT = Number(process.env.PORT);
const isProduction = String(process.env.NODE_ENV || '').toLowerCase() === 'production';

if (!Number.isInteger(BASE_PORT) || BASE_PORT <= 0) {
  throw new Error('PORT must be provided by process.env.PORT');
}

const server = http.createServer(app);

const isPortAvailable = (port) => new Promise((resolve) => {
  const tester = net.createServer()
    .once('error', () => resolve(false))
    .once('listening', () => tester.close(() => resolve(true)))
    .listen(port, '0.0.0.0');
});

const findAvailablePort = async (startPort, retries = 5) => {
  let port = startPort;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const available = await isPortAvailable(port);
    if (available) return port;
    console.warn(`⚠️ Port ${port} is busy, trying ${port + 1}...`);
    port += 1;
  }

  return port;
};

const logStartupDiagnostics = (port) => {
  const corsSummary = getCorsDebugSummary();

  console.log('[startup][server]', {
    nodeEnv: process.env.NODE_ENV || 'development',
    activePort: port,
    backendUrl: process.env.RENDER_EXTERNAL_URL || null,
    apiUrl: process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL.replace(/\/+$/, '')}/api` : null,
    socketUrl: process.env.RENDER_EXTERNAL_URL || null,
    clientUrl: process.env.CLIENT_URL || null,
    allowedOrigins: corsSummary.exactOrigins,
    allowedPatterns: corsSummary.patternOrigins,
    socketCorsOrigins: corsSummary,
    dbHost: process.env.MYSQL_HOST || null
  });
};

/**
 * =========================
 * SOCKET INIT
 * =========================
 */
initSocket(server);

/**
 * =========================
 * START SERVER
 * =========================
 */
const start = async () => {
  try {
    console.log('🔄 Connecting to database...');

    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    await sequelize.sync({ alter: false });
    console.log('✅ Models synced');

    const port = isProduction ? BASE_PORT : await findAvailablePort(BASE_PORT);

    if (isProduction && port !== BASE_PORT) {
      console.warn('[startup][server] production port mismatch detected', { BASE_PORT, port });
    }

    logStartupDiagnostics(port);

    server.listen(port, '0.0.0.0', () => {
      console.log(`🚀 ChatSphere server running on port ${port}`);
    });

  } catch (err) {
    console.error('❌ Server startup error:', err);

    console.log('⚠️ Server not started due to DB error');
    process.exit(1);
  }
};

start();

/**
 * =========================
 * ERROR HANDLING
 * =========================
 */
server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

/**
 * =========================
 * GRACEFUL SHUTDOWN
 * =========================
 */
const shutdown = async (signal) => {
  console.log(`⚠️ Received ${signal}. Shutting down...`);

  try {
    await new Promise((res) => server.close(res));
    await sequelize.close();
    console.log('✅ Cleanup done');
  } catch (err) {
    console.error('Shutdown error:', err);
  }

  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));