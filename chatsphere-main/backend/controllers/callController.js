import { asyncHandler } from '../utils/asyncHandler.js';
import { Call } from '../models/index.js';
import { getIO, getSocketIdForUser } from '../socket/index.js';
import {
  createCallRecord,
  getCallHistoryForUser,
  sanitizeSessionDescription,
  serializeCallRecord,
  toSafeUser
} from '../services/callService.js';

export const startCall = asyncHandler(async (req, res) => {
  const targetUserId = Number(req.body.calleeId);
  const chatId = req.body.chatId == null ? null : Number(req.body.chatId);
  const offer = sanitizeSessionDescription(req.body.offer);

  if (!targetUserId || !offer) {
    return res.status(400).json({ success: false, message: 'Invalid call payload' });
  }

  const call = await createCallRecord({
    chatId,
    callerId: req.user.id,
    calleeId: targetUserId,
    type: req.body.type === 'video' ? 'video' : 'voice',
    signalingData: {
      offer,
      reason: 'manual-http-call'
    }
  });

  const io = getIO();
  if (io) {
    const targetSocketId = getSocketIdForUser(targetUserId);
    const payload = {
      fromUserId: req.user.id,
      fromUser: toSafeUser(req.user),
      offer,
      type: call.type,
      chatId: chatId || call.chatId || null,
      callId: call.id,
      call: serializeCallRecord(call)
    };

    if (targetSocketId) {
      io.to(targetSocketId).emit('call:offer', payload);
      io.to(targetSocketId).emit('call:incoming', payload);
      io.to(targetSocketId).emit('call-invite', payload);
      io.to(targetSocketId).emit('incoming-call', payload);
    }
  }

  res.status(201).json({ call: serializeCallRecord(call) });
});

export const getCalls = asyncHandler(async (req, res) => {
  const calls = await getCallHistoryForUser(req.user.id);
  res.json({ calls });
});

export const updateCall = asyncHandler(async (req, res) => {
  const call = await Call.findByPk(req.params.callId);
  if (!call) {
    return res.status(404).json({ success: false, message: 'Call not found' });
  }

  const allowedStatuses = new Set(['ringing', 'accepted', 'rejected', 'ended']);
  const nextStatus = allowedStatuses.has(req.body.status) ? req.body.status : call.status;
  const nextReason = req.body.endedReason || call.signalingData?.endedReason || null;
  const endedAt = nextStatus === 'ended' || nextStatus === 'rejected' ? new Date() : call.endedAt;
  const durationSeconds = endedAt && call.startedAt
    ? Math.max(0, Math.round((new Date(endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000))
    : Number(call.signalingData?.durationSeconds || 0);

  call.status = nextStatus;
  call.endedAt = endedAt;
  call.signalingData = {
    ...(call.signalingData || {}),
    ...req.body.signalingData,
    endedReason: nextReason,
    durationSeconds
  };

  await call.save();

  res.json({ call: serializeCallRecord(call) });
});