import { Op } from 'sequelize';
import { Call, Chat, User } from '../models/index.js';

const activeCallMap = new Map();

const toPositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const toPlainValue = (value, seen = new WeakSet()) => {
  if (value == null) return null;
  if (Array.isArray(value)) {
    return value.map((entry) => toPlainValue(entry, seen));
  }

  if (typeof value?.toJSON === 'function') {
    return toPlainValue(value.toJSON(), seen);
  }

  if (typeof value !== 'object') {
    return value;
  }

  if (seen.has(value)) {
    return null;
  }

  seen.add(value);

  const output = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'function' || typeof entry === 'symbol') continue;
    output[key] = toPlainValue(entry, seen);
  }
  return output;
};

export const serializeSequelizeValue = (value) => toPlainValue(value);

export const serializeCallRecord = (call) => (call ? toPlainValue(call) : null);

export const sanitizeSessionDescription = (description) => {
  if (!description || typeof description !== 'object') return null;

  const type = typeof description.type === 'string' ? description.type : null;
  const sdp = typeof description.sdp === 'string' ? description.sdp : null;

  if (!type || !sdp) return null;

  return { type, sdp };
};

export const sanitizeIceCandidate = (candidate) => {
  if (!candidate || typeof candidate !== 'object') return null;

  const candidateString = typeof candidate.candidate === 'string' ? candidate.candidate : '';
  if (!candidateString) return null;

  const sdpMLineIndex = candidate.sdpMLineIndex == null ? null : Number(candidate.sdpMLineIndex);

  return {
    candidate: candidateString,
    sdpMid: typeof candidate.sdpMid === 'string' ? candidate.sdpMid : null,
    sdpMLineIndex: Number.isInteger(sdpMLineIndex) ? sdpMLineIndex : null
  };
};

export const sanitizeCallPayload = (payload = {}) => ({
  targetUserId: toPositiveInteger(payload.targetUserId || payload.calleeId || payload.toUserId),
  chatId: payload.chatId == null ? null : Number(payload.chatId),
  callId: typeof payload.callId === 'string' && payload.callId.trim() ? payload.callId.trim() : null,
  type: payload.type === 'video' ? 'video' : 'voice',
  reason: typeof payload.reason === 'string' && payload.reason.trim() ? payload.reason.trim() : null,
  offer: sanitizeSessionDescription(payload.offer),
  answer: sanitizeSessionDescription(payload.answer),
  candidate: sanitizeIceCandidate(payload.candidate)
});

export const buildCallKey = ({ callerId, calleeId, chatId }) =>
  `${Number(callerId)}:${Number(calleeId)}:${chatId || 'direct'}`;

export const toSafeUser = (user) =>
  user
    ? {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        avatar: user.avatar
      }
    : null;

export const createCallRecord = async ({ callerId, calleeId, chatId = null, type, signalingData = {} }) => {
  const call = await Call.create({
    callerId,
    calleeId,
    chatId,
    type,
    status: 'ringing',
    startedAt: new Date(),
    signalingData: toPlainValue(signalingData)
  });

  activeCallMap.set(buildCallKey({ callerId, calleeId, chatId }), call.id);

  return call;
};

export const resolveCallRecord = async ({ callId, callerId, calleeId, chatId }) => {
  if (callId) {
    return Call.findByPk(callId);
  }

  const key = buildCallKey({ callerId, calleeId, chatId });
  const activeId = activeCallMap.get(key);

  if (!activeId) return null;

  return Call.findByPk(activeId);
};

export const updateCallRecord = async ({
  callId,
  callerId,
  calleeId,
  chatId,
  status,
  endedReason,
  signalingData = {}
}) => {
  const call = await resolveCallRecord({ callId, callerId, calleeId, chatId });
  if (!call) return null;

  const shouldEnd = ['ended', 'rejected'].includes(status) || endedReason === 'missed';
  const endedAt = shouldEnd && !call.endedAt ? new Date() : call.endedAt;
  const durationSeconds = endedAt && call.startedAt
    ? Math.max(0, Math.round((new Date(endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000))
    : Number(call.signalingData?.durationSeconds || 0);

  call.status = status || call.status;
  call.endedAt = endedAt;
  call.signalingData = {
    ...(call.signalingData || {}),
    ...signalingData,
    endedReason: endedReason || call.signalingData?.endedReason || null,
    durationSeconds
  };

  await call.save();

  if (shouldEnd) {
    activeCallMap.delete(buildCallKey({ callerId: call.callerId, calleeId: call.calleeId, chatId: call.chatId }));
  }

  return call;
};

const formatDuration = (startedAt, endedAt) => {
  if (!startedAt) return 0;
  const endTime = endedAt ? new Date(endedAt).getTime() : Date.now();
  return Math.max(0, Math.round((endTime - new Date(startedAt).getTime()) / 1000));
};

export const serializeCallHistoryItem = (call, currentUserId) => {
  const signalingData = call.signalingData || {};
  const endedReason = signalingData.endedReason || null;

  return {
    id: call.id,
    chatId: call.chatId,
    callerId: call.callerId,
    calleeId: call.calleeId,
    type: call.type,
    status: endedReason === 'missed' ? 'missed' : call.status,
    direction: Number(call.callerId) === Number(currentUserId) ? 'outgoing' : 'incoming',
    durationSeconds: Number(signalingData.durationSeconds ?? formatDuration(call.startedAt, call.endedAt)),
    startedAt: call.startedAt,
    endedAt: call.endedAt,
    endedReason,
    counterpart: Number(call.callerId) === Number(currentUserId) ? serializeSequelizeValue(call.callee) : serializeSequelizeValue(call.caller),
    chat: serializeSequelizeValue(call.chat)
  };
};

export const getCallHistoryForUser = async (userId) => {
  const calls = await Call.findAll({
    where: {
      [Op.or]: [{ callerId: userId }, { calleeId: userId }]
    },
    include: [
      { model: User, as: 'caller' },
      { model: User, as: 'callee' },
      { model: Chat, as: 'chat' }
    ],
    order: [['createdAt', 'DESC']],
    limit: 200
  });

  return calls.map((call) => serializeCallHistoryItem(call, userId));
};

export const getActiveCallId = (callerId, calleeId, chatId) =>
  activeCallMap.get(buildCallKey({ callerId, calleeId, chatId }));