// Simple graceful shutdown and heartbeat helpers

export function setupGracefulShutdown({ server, io, onShutdown } = {}) {
  const shutdown = async () => {
    console.log('[shutdown] closing HTTP server and sockets');
    try {
      if (io && io.close) io.close();
    } catch (err) {
      console.warn('[shutdown] io.close error', err.message || err);
    }

    try {
      if (server && server.close) server.close();
    } catch (err) {
      console.warn('[shutdown] server.close error', err.message || err);
    }

    if (typeof onShutdown === 'function') await onShutdown();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export default { setupGracefulShutdown };
