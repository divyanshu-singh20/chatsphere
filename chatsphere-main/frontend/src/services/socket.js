import { io } from 'socket.io-client';
import { getSocketUrl } from '../config/runtime';

const SOCKET_STORE_KEY = '__CHATSPHERE_SOCKET_SINGLETON__';
const SOCKET_DEBUG = import.meta.env.DEV || import.meta.env.VITE_ENABLE_SOCKET_DEBUG === 'true';

const summarizeSocketPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return payload ?? null;
  }

  return {
    callId: payload.callId || null,
    chatId: payload.chatId || null,
    targetUserId: payload.targetUserId || payload.calleeId || payload.toUserId || null,
    fromUserId: payload.fromUserId || payload.callerId || null,
    type: payload.type || null,
    reason: payload.reason || null,
    hasOffer: !!payload.offer,
    offerType: payload.offer?.type || null,
    offerSdpLength: typeof payload.offer?.sdp === 'string' ? payload.offer.sdp.length : 0,
    hasAnswer: !!payload.answer,
    answerType: payload.answer?.type || null,
    answerSdpLength: typeof payload.answer?.sdp === 'string' ? payload.answer.sdp.length : 0,
    candidate: payload.candidate?.candidate || null,
    sdpMid: payload.candidate?.sdpMid ?? null,
    sdpMLineIndex: payload.candidate?.sdpMLineIndex ?? null
  };
};

const getSocketStore = () => {
  const globalStore = globalThis;

  if (!globalStore[SOCKET_STORE_KEY]) {
    globalStore[SOCKET_STORE_KEY] = {
      socket: null,
      url: null
    };
  }

  return globalStore[SOCKET_STORE_KEY];
};

const resolveSocketUrl = () => {
  const explicit = getSocketUrl();
  console.info('[runtime] Socket URL', explicit);
  if (!explicit) {
    throw new Error('VITE_SOCKET_URL is required');
  }

  return explicit;
};

const attachBaseListeners = (socket) => {
  const rawEmit = socket.emit.bind(socket);

  socket.emit = (event, ...args) => {
    if (SOCKET_DEBUG) {
      console.debug('[socket][emit]', {
        event,
        payload: summarizeSocketPayload(args[0]),
        hasAck: typeof args[1] === 'function'
      });
    }

    return rawEmit(event, ...args);
  };

  socket.onAny((event, ...args) => {
    if (!SOCKET_DEBUG) return;

    console.debug('[socket][receive]', {
      event,
      payload: summarizeSocketPayload(args[0])
    });
  });

  socket.on('connect', () => {
    console.log('[socket] connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[socket] disconnected', { reason });
  });

  socket.on('reconnect_attempt', (attempt) => {
    console.log('[socket][reconnect-start]', { attempt });
  });

  socket.on('reconnect', (attempt) => {
    console.log('[socket][reconnect-success]', { attempt, id: socket.id });
  });

  socket.on('reconnect_error', (err) => {
    console.warn('[socket][reconnect-failure]', { message: err?.message || String(err) });
  });

  socket.on('connect_error', (err) => {
    console.warn('[socket][connect-error]', { message: err.message });
  });
};

export const getSocket = () => {
  const store = getSocketStore();

  if (!store.socket) {
    store.url = resolveSocketUrl();
    store.socket = io(store.url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: false,
      withCredentials: true
    });

    attachBaseListeners(store.socket);
  }

  return store.socket;
};

export const ensureSocketConnected = (authToken) => {
  const socket = getSocket();

  if (authToken) {
    socket.auth = { token: authToken };
  }

  if (socket.connected || socket.active) {
    return socket;
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const disconnectSocket = () => {
  const store = getSocketStore();

  if (store.socket) {
    store.socket.removeAllListeners();
    store.socket.disconnect();
    store.socket = null;
    store.url = null;
  }
};
