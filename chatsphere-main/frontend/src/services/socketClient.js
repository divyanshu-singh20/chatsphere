import { io } from 'socket.io-client';
import { getSocketUrl } from '../config/runtime';

let socket = null;
let urlCache = null;

export function initSocket(url = undefined, opts = {}) {
  if (!url) url = getSocketUrl();
  console.info('[runtime] Socket URL', url);
  if (!url) throw new Error('VITE_SOCKET_URL is required');
  // Avoid re-init with different url
  if (socket && url === urlCache) return socket;
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  urlCache = url;
  socket = io(url, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    autoConnect: true,
    ...opts,
  });

  // Basic logging
  socket.on('connect', () => console.debug('[socket] connected', socket.id));
  socket.on('disconnect', (reason) => console.debug('[socket] disconnected', reason));
  socket.on('connect_error', (err) => console.debug('[socket] connect_error', err));

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export default { initSocket, getSocket, disconnectSocket };
