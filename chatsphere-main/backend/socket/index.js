import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/index.js';
import SocketManager from './manager.js';
import presenceService from '../services/presenceService.js';
import {
  createCallRecord,
  updateCallRecord,
  toSafeUser,
  getActiveCallId,
  sanitizeSessionDescription,
  sanitizeIceCandidate
} from '../services/callService.js';
import { createAndBroadcastMessage } from '../services/messageService.js';
import { getSocketCorsOrigins } from '../config/origins.js';

let io = null;
const onlineUsers = new Map();

export const getIO = () => io;

export const getSocketIdForUser = (userId) => {
  const targetUserId = normalizeUserId(userId);
  if (!targetUserId) return null;

  const primary = onlineUsers.get(targetUserId);
  if (primary && io?.sockets?.sockets?.has(primary)) {
    return primary;
  }

  return getActiveSocketIds(targetUserId)[0] || null;
};

const normalizeUserId = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const normalizeChatId = (value) => {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getActiveSocketIds = (userId) => {
  const socketIds = SocketManager.getSocketsForUser(userId);
  const liveSocketIds = [];

  socketIds.forEach((socketId) => {
    if (io?.sockets?.sockets?.has(socketId)) {
      liveSocketIds.push(socketId);
      return;
    }

    SocketManager.unregisterUserSocket(userId, socketId);
    if (onlineUsers.get(userId) === socketId) {
      onlineUsers.delete(userId);
    }

    console.log('[socket] stale socket pruned', { userId, socketId });
  });

  return liveSocketIds;
};

const emitToUserSafely = (userId, event, payload) => {
  const targetUserId = normalizeUserId(userId);
  if (!targetUserId) return { delivered: false, socketIds: [] };
  const result = { delivered: false, socketIds: [] };

  const targetSocketId = pickTargetSocketId(targetUserId);
  if (!targetSocketId) {
    console.warn('[socket] emitToUserSafely: no target socket', { userId: targetUserId, event });
    return result;
  }

  try {
    io.to(targetSocketId).emit(event, payload);
    result.delivered = true;
    result.socketIds.push(targetSocketId);
    console.debug('[socket] emitToUserSafely', { event, to: targetSocketId, userId: targetUserId, summary: { callId: payload?.callId || null, chatId: payload?.chatId || null } });
  } catch (err) {
    console.error('[socket] emitToUserSafely failed', { event, to: targetSocketId, userId: targetUserId, error: err?.message || err });
  }

  return result;
};

const pickTargetSocketId = (userId) => {
  const targetUserId = normalizeUserId(userId);
  if (!targetUserId) return null;
  // Prefer the primary socket id if it's live
  const primary = onlineUsers.get(targetUserId);
  const activeSockets = getActiveSocketIds(targetUserId);

  if (primary && io?.sockets?.sockets?.has(primary) && activeSockets.includes(primary)) {
    return primary;
  }

  if (activeSockets.length > 0) {
    // promote first active socket as primary
    const chosen = activeSockets[0];
    onlineUsers.set(targetUserId, chosen);
    console.debug('[socket] pickTargetSocketId: promoted active socket to primary', { userId: targetUserId, chosen, activeSockets });
    return chosen;
  }

  console.debug('[socket] pickTargetSocketId: no active socket found', { userId: targetUserId, primary, activeSockets });
  return null;
};

const toPlainCallSignal = (payload = {}) => ({
  targetUserId: normalizeUserId(payload.targetUserId || payload.calleeId || payload.toUserId),
  chatId: normalizeChatId(payload.chatId),
  callId: typeof payload.callId === 'string' && payload.callId.trim() ? payload.callId.trim() : null,
  type: payload.type === 'video' ? 'video' : 'voice',
  reason: typeof payload.reason === 'string' && payload.reason.trim() ? payload.reason.trim() : null,
  offer: sanitizeSessionDescription(payload.offer),
  answer: sanitizeSessionDescription(payload.answer),
  candidate: sanitizeIceCandidate(payload.candidate)
});

const logCallEvent = (event, details) => {
  console.log(`[call] ${event}`, details);
};

export const initSocket = (server) => {
  if (io) return io;

  io = new Server(server, {
    cors: {
      origin: getSocketCorsOrigins(),
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 20000,
    connectTimeout: 45000
  });

  SocketManager.init(io);

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) return next(new Error('Unauthorized'));

      const decoded = verifyToken(token);
      const user = await User.findByPk(decoded.id);

      if (!user) return next(new Error('Unauthorized'));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = Number(socket.user.id);
    const userSnapshot = toSafeUser(socket.user);

    console.log('[socket] connected:', userId);
    SocketManager.registerUserSocket(userId, socket.id);
    const previousSocketId = onlineUsers.get(userId);
    onlineUsers.set(userId, socket.id);

    // Log current online user socket state for debugging
    try {
      const socketsForUser = SocketManager.getSocketsForUser(userId);
      console.debug('[socket] user-sockets', { userId, socketId: socket.id, previousSocketId, socketsForUser, primary: onlineUsers.get(userId) });
    } catch (err) {
      console.warn('[socket] user-sockets debug failed', { userId, error: err?.message || err });
    }

    if (previousSocketId && previousSocketId !== socket.id) {
      console.log('[socket] reconnect', {
        userId,
        previousSocketId,
        socketId: socket.id
      });
    }

    socket.join(`user:${userId}`);

    User.update({ isOnline: true, lastSeenAt: null }, { where: { id: userId } }).catch(() => {});
    presenceService.setOnline(userId).catch(() => {});

    io.emit('user:online', { userId, lastSeenAt: null });
    io.emit('online-users', SocketManager.getOnlineUserIds());

    const handleCallOffer = async (payload = {}, ack) => {
      try {
        const signal = toPlainCallSignal(payload);
        const targetUserId = signal.targetUserId;

        if (!targetUserId) {
          logCallEvent('offer rejected', { fromUserId: userId, reason: 'missing target user' });
          if (typeof ack === 'function') ack({ ok: false, error: 'Missing target user' });
          return;
        }

        if (!signal.offer) {
          logCallEvent('offer rejected', {
            fromUserId: userId,
            toUserId: targetUserId,
            chatId: signal.chatId,
            reason: 'invalid offer payload'
          });
          if (typeof ack === 'function') ack({ ok: false, error: 'Invalid offer payload' });
          return;
        }

        const targetSocketId = pickTargetSocketId(targetUserId);
        if (!targetSocketId) {
          // debug: show current onlineUsers and sockets for target
          try {
            console.debug('[socket][offer] target-lookup-failed', {
              fromUserId: userId,
              toUserId: targetUserId,
              onlineUsersMapPrimary: onlineUsers.get(targetUserId) || null,
              socketsForUser: SocketManager.getSocketsForUser(targetUserId)
            });
          } catch (err) {
            console.warn('[socket][offer] target-lookup-debug-failed', { err: err?.message || err });
          }
          logCallEvent('offer dropped', {
            fromUserId: userId,
            toUserId: targetUserId,
            chatId: signal.chatId,
            reason: 'target offline'
          });
          if (typeof ack === 'function') ack({ ok: false, error: 'Target user is offline' });
          return;
        }

        const call = await createCallRecord({
          callerId: userId,
          calleeId: targetUserId,
          chatId: signal.chatId,
          type: signal.type,
          signalingData: {
            offer: signal.offer,
            initiatedBy: userId
          }
        });

        try {
          const logPath = path.join(process.cwd(), 'backend', 'logs');
          if (!fs.existsSync(logPath)) fs.mkdirSync(logPath, { recursive: true });
          const line = JSON.stringify({
            ts: new Date().toISOString(),
            event: 'offer_received',
            fromUserId: userId,
            toUserId: targetUserId,
            callId: call.id,
            targetSocketIdCandidate: targetSocketId
          }) + '\n';
          fs.appendFileSync(path.join(logPath, 'socket-debug.log'), line);
        } catch (err) {
          console.warn('[socket] file-log-failed', { err: err?.message || err });
        }

        const safeCaller = userSnapshot;
        const offerPayload = {
          callId: call.id,
          chatId: signal.chatId,
          type: signal.type,
          fromUserId: userId,
          fromUser: safeCaller,
          offer: signal.offer
        };

        const delivered = emitToUserSafely(targetUserId, 'call:offer', offerPayload).delivered;
        emitToUserSafely(targetUserId, 'call:incoming', offerPayload);
        emitToUserSafely(targetUserId, 'call-invite', offerPayload);

        logCallEvent('offer received', {
          callId: call.id,
          fromUserId: userId,
          toUserId: targetUserId,
          chatId: signal.chatId,
          type: signal.type,
          offerSdpLength: signal.offer.sdp.length,
          delivered
        });

        if (typeof ack === 'function') {
          ack({ ok: true, callId: call.id, delivered });
        }
      } catch (error) {
        console.error('[call] offer relay failed', {
          fromUserId: userId,
          error: error.message || error
        });
        if (typeof ack === 'function') {
          ack({ ok: false, error: 'Failed to initiate call' });
        }
      }
    };

    socket.on('call:offer', handleCallOffer);
    socket.on('call:initiate', handleCallOffer);

    socket.on('call:answer', async (payload = {}) => {
      try {
        const signal = toPlainCallSignal(payload);
        const targetUserId = signal.targetUserId;
        const callId = signal.callId || getActiveCallId(targetUserId, userId, signal.chatId) || null;
        const answer = signal.answer;

        logCallEvent('answer received', {
          callId,
          fromUserId: userId,
          toUserId: targetUserId,
          chatId: signal.chatId,
          answerType: answer?.type || null,
          sdpLength: answer?.sdp?.length || 0
        });

        if (!targetUserId) {
          console.warn('[call] answer dropped: missing target user', { callId, fromUserId: userId });
          return;
        }

        if (!answer) {
          console.warn('[call] answer dropped: invalid payload', {
            callId,
            fromUserId: userId,
            toUserId: targetUserId,
            chatId: signal.chatId
          });
          return;
        }

        const targetSocketId = pickTargetSocketId(targetUserId);
        if (!targetSocketId) {
          console.warn('[call] answer dropped: target offline', {
            callId,
            fromUserId: userId,
            toUserId: targetUserId,
            chatId: signal.chatId
          });
          return;
        }

        await updateCallRecord({
          callId,
          callerId: targetUserId,
          calleeId: userId,
          chatId: signal.chatId,
          status: 'accepted',
          signalingData: {
            answer
          }
        });

        const answerPayload = {
          callId,
          chatId: signal.chatId,
          answer
        };

        logCallEvent('answer relay', {
          callId,
          fromUserId: userId,
          toUserId: targetUserId,
          chatId: signal.chatId,
          targetSocketIds: getActiveSocketIds(targetUserId)
        });

        emitToUserSafely(targetUserId, 'call:answer', answerPayload);
        emitToUserSafely(targetUserId, 'call:accepted', answerPayload);
      } catch (error) {
        console.error('[call] answer relay failed', {
          fromUserId: userId,
          error: error.message || error
        });
      }
    });

    const handleIceCandidate = (payload = {}) => {
      const signal = toPlainCallSignal(payload);
      const targetUserId = signal.targetUserId;

      if (!targetUserId || !signal.candidate) {
        console.warn('[call] ice candidate dropped', {
          fromUserId: userId,
          toUserId: targetUserId || null,
          chatId: signal.chatId,
          reason: 'invalid payload'
        });
        return;
      }

      const targetSocketId = pickTargetSocketId(targetUserId);
      if (!targetSocketId) {
        console.warn('[call] ice candidate dropped', {
          fromUserId: userId,
          toUserId: targetUserId,
          chatId: signal.chatId,
          reason: 'target offline'
        });
        return;
      }

      const icePayload = {
        callId: signal.callId,
        chatId: signal.chatId,
        candidate: signal.candidate
      };

      logCallEvent('ice candidate received', {
        fromUserId: userId,
        toUserId: targetUserId,
        chatId: signal.chatId,
        callId: icePayload.callId,
        candidate: signal.candidate.candidate
      });

      emitToUserSafely(targetUserId, 'call:ice-candidate', icePayload);
    };

    socket.on('call:ice-candidate', handleIceCandidate);

    const handleCallReject = async (payload = {}) => {
      const signal = toPlainCallSignal(payload);
      const targetUserId = signal.targetUserId;
      const callId = signal.callId || getActiveCallId(targetUserId, userId, signal.chatId) || null;

      if (!targetUserId) {
        console.warn('[call] reject dropped: missing target user', { fromUserId: userId, callId });
        return;
      }

      const targetSocketId = pickTargetSocketId(targetUserId);
      if (!targetSocketId) {
        console.warn('[call] reject dropped: target offline', {
          fromUserId: userId,
          toUserId: targetUserId,
          chatId: signal.chatId,
          callId
        });
      }

      await updateCallRecord({
        callId,
        callerId: targetUserId,
        calleeId: userId,
        chatId: signal.chatId,
        status: 'rejected',
        endedReason: signal.reason || 'rejected',
        signalingData: { reason: signal.reason || 'rejected' }
      });

      logCallEvent('reject received', {
        callId,
        fromUserId: userId,
        toUserId: targetUserId,
        chatId: signal.chatId,
        reason: signal.reason || 'rejected'
      });

      emitToUserSafely(targetUserId, 'call:rejected', {
        callId,
        chatId: signal.chatId,
        reason: signal.reason || 'rejected'
      });
      emitToUserSafely(targetUserId, 'call:reject', {
        callId,
        chatId: signal.chatId,
        reason: signal.reason || 'rejected'
      });
    };

    socket.on('call:reject', handleCallReject);
    socket.on('call:rejected', handleCallReject);

    socket.on('call:end', async (payload = {}) => {
      const signal = toPlainCallSignal(payload);
      const targetUserId = signal.targetUserId;
      const callId = signal.callId || getActiveCallId(targetUserId, userId, signal.chatId) || null;

      if (!targetUserId) {
        console.warn('[call] end dropped: missing target user', { fromUserId: userId, callId });
        return;
      }

      await updateCallRecord({
        callId,
        callerId: targetUserId,
        calleeId: userId,
        chatId: signal.chatId,
        status: 'ended',
        endedReason: signal.reason || 'ended',
        signalingData: { reason: signal.reason || 'ended' }
      });

      logCallEvent('end received', {
        callId,
        fromUserId: userId,
        toUserId: targetUserId,
        chatId: signal.chatId,
        reason: signal.reason || 'ended'
      });

      emitToUserSafely(targetUserId, 'call:end', {
        callId,
        chatId: signal.chatId,
        reason: signal.reason || 'ended'
      });
      emitToUserSafely(targetUserId, 'call:ended', {
        callId,
        chatId: signal.chatId,
        reason: signal.reason || 'ended'
      });
    });

    socket.on('message:send', async (payload = {}, ack) => {
      try {
        const chatId = Number(payload.chatId);
        if (!chatId) {
          if (typeof ack === 'function') ack({ ok: false, error: 'Missing chatId' });
          return;
        }

        const result = await createAndBroadcastMessage({
          chatId,
          senderId: userId,
          content: payload.content || '',
          replyToId: payload.replyToId || null,
          files: []
        });

        if (typeof ack === 'function') {
          ack({ ok: true, message: result.payload });
        }
      } catch (error) {
        console.error('[socket] message:send failed', error);
        if (typeof ack === 'function') {
          ack({ ok: false, error: error.message || 'Failed to send message' });
        }
      }
    });

    socket.on('join-chat', ({ chatId }) => {
      if (chatId) socket.join(`chat:${chatId}`);
    });

    socket.on('typing:start', ({ chatId }) => {
      if (!chatId) return;
      socket.to(`chat:${chatId}`).emit('typing:start', { chatId, userId });
    });

    socket.on('typing:stop', ({ chatId }) => {
      if (!chatId) return;
      socket.to(`chat:${chatId}`).emit('typing:stop', { chatId, userId });
    });

    socket.on('leave-chat', ({ chatId }) => {
      if (chatId) socket.leave(`chat:${chatId}`);
    });

    socket.on('disconnect', (reason) => {
      SocketManager.unregisterUserSocket(userId, socket.id);
      if (onlineUsers.get(userId) === socket.id) {
        const remainingSocketId = getActiveSocketIds(userId)[0] || null;
        if (remainingSocketId) {
          onlineUsers.set(userId, remainingSocketId);
        } else {
          onlineUsers.delete(userId);
        }
      }

      const remainingCount = SocketManager.getSocketsForUser(userId).length;
      console.log('[socket] disconnected', {
        userId,
        socketId: socket.id,
        reason,
        remainingSockets: remainingCount,
        primary: onlineUsers.get(userId) || null
      });

      const remaining = SocketManager.getSocketsForUser(userId).length;

      if (remaining === 0) {
        User.update({ isOnline: false, lastSeenAt: new Date() }, { where: { id: userId } }).catch(() => {});
        presenceService.setOffline(userId).catch(() => {});
        io.emit('user:offline', { userId, lastSeenAt: new Date().toISOString() });
      }

      io.emit('online-users', SocketManager.getOnlineUserIds());
    });
  });

  return io;
};

export default { initSocket, getIO, getSocketIdForUser };