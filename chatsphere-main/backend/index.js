import 'dotenv/config';
import http from 'http';
import net from 'net';
import app from './app.js';
import { sequelize } from './models/index.js';
import { initSocket } from './socket/index.js';

const BASE_PORT = Number(process.env.PORT || 5000);

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

    const port = await findAvailablePort(BASE_PORT);

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