import { Chat, Message, User } from '../models/index.js';
import { uploadBuffer } from '../config/cloudinary.js';
import { getIO } from '../socket/index.js';
import * as SocketManager from '../socket/manager.js';

const toSafeUser = (user) => (user ? {
  id: user.id,
  fullName: user.fullName,
  username: user.username,
  avatar: user.avatar
} : user);

const serializeMessage = (message) => {
  if (!message) return null;
  const plain = message.toJSON ? message.toJSON() : message;

  return {
    ...plain,
    sender: toSafeUser(message.sender),
    replyTo: message.replyTo
      ? {
          ...message.replyTo.toJSON?.(),
          sender: toSafeUser(message.replyTo.sender)
        }
      : message.replyTo,
    status: plain.seenAt ? 'seen' : plain.deliveredAt ? 'delivered' : 'sent',
    deliveredAt: plain.deliveredAt || null,
    seenAt: plain.seenAt || null,
    editedAt: plain.editedAt || null,
    deletedForEveryone: !!plain.deletedForEveryone,
    reactions: Array.isArray(plain.reactors)
      ? plain.reactors.reduce((acc, reactor) => {
          const emoji = reactor?.MessageReaction?.emoji || reactor?.messageReaction?.emoji || reactor?.emoji;
          if (!emoji) return acc;
          const existing = acc.find((item) => item.emoji === emoji);
          if (existing) {
            existing.count += 1;
            if (!existing.users.some((user) => Number(user.id) === Number(reactor.id))) {
              existing.users.push(toSafeUser(reactor));
            }
            return acc;
          }
          acc.push({ emoji, count: 1, users: [toSafeUser(reactor)] });
          return acc;
        }, [])
      : []
  };
};

const getMediaTypeFromMime = (mimeType = '') => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'file';
};

const getReceiverIds = (chat, senderId) => (chat.members || [])
  .map((member) => Number(member.id))
  .filter((memberId) => memberId && memberId !== Number(senderId));

export const persistMessage = async ({ chatId, senderId, content = '', replyToId = null, files = [] }) => {
  const chat = await Chat.findByPk(chatId, {
    include: [{ model: User, as: 'members', through: { attributes: [] } }]
  });

  if (!chat) {
    const error = new Error('Chat not found');
    error.statusCode = 404;
    throw error;
  }

  const senderIsMember = (chat.members || []).some((member) => Number(member.id) === Number(senderId));
  if (!senderIsMember) {
    const error = new Error('Not allowed');
    error.statusCode = 403;
    throw error;
  }

  let mediaUrl = null;
  let mediaType = 'text';

  if (files.length > 0) {
    const file = files[0];
    mediaUrl = await uploadBuffer(file.buffer, file.mimetype, 'chatsphere/messages');
    mediaType = getMediaTypeFromMime(file.mimetype);
  }

  const message = await Message.create({
    chatId,
    senderId,
    content,
    replyToId: replyToId || null,
    mediaUrl,
    mediaType
  });

  const saved = await Message.findByPk(message.id, {
    include: [
      { model: User, as: 'sender' },
      { model: Message, as: 'replyTo', include: [{ model: User, as: 'sender' }] }
    ]
  });

  if (!saved) {
    const error = new Error('Failed to load saved message');
    error.statusCode = 500;
    throw error;
  }

  await Chat.update({ lastMessageAt: new Date() }, { where: { id: chatId } });

  console.log('[message][save]', {
    messageId: saved.id,
    chatId: Number(chatId),
    senderId: Number(senderId),
    receiverIds: getReceiverIds(chat, senderId),
    hasMedia: !!mediaUrl,
    mediaType
  });

  return {
    chat,
    message: saved,
    payload: serializeMessage(saved),
    receiverIds: getReceiverIds(chat, senderId)
  };
};

export const broadcastMessage = ({ chatId, senderId, receiverIds = [], payload }) => {
  const io = getIO();
  if (!io || !payload) return;

  const normalizedChatId = Number(chatId);

  console.log('[message][broadcast]', {
    chatId: normalizedChatId,
    senderId,
    receiverIds,
    messageId: payload.id,
    type: payload.mediaType || 'text'
  });

  io.to(`user:${senderId}`).emit('message:sent', payload);
  console.debug('[message][emit]', { event: 'message:sent', to: `user:${senderId}`, messageId: payload.id });

  receiverIds.forEach((receiverId) => {
    const roomName = `user:${receiverId}`;
    const receiverSocketIds = SocketManager.getSocketsForUser(receiverId);
    const roomSize = io.sockets?.adapter?.rooms?.get(roomName)?.size || 0;
    console.debug('[message][broadcast-target]', {
      receiverId,
      roomName,
      receiverSocketIds,
      roomSize,
      messageId: payload.id
    });

    const target = io.to(`user:${receiverId}`);
    target.emit('message:receive', payload);
    target.emit('message-received', payload);
    target.emit('message:delivered', { chatId: normalizedChatId, messageId: payload.id, deliveredAt: payload.deliveredAt || new Date().toISOString(), senderId });
    target.emit('new_message_notification', {
      chatId: normalizedChatId,
      message: payload
    });
    target.emit('sidebar_update', {
      chatId: normalizedChatId,
      message: payload
    });
    console.debug('[message][emit]', { event: 'message:receive', to: `user:${receiverId}`, messageId: payload.id });
  });

  io.to(`user:${senderId}`).emit('sidebar_update', {
    chatId: normalizedChatId,
    message: payload
  });
  console.debug('[message][emit]', { event: 'sidebar_update', to: `user:${senderId}`, messageId: payload.id });
};

export const createAndBroadcastMessage = async (options) => {
  const result = await persistMessage(options);
  broadcastMessage({
    chatId: result.chat.id,
    senderId: options.senderId,
    receiverIds: result.receiverIds,
    payload: result.payload
  });
  return result;
};

export default {
  persistMessage,
  broadcastMessage,
  createAndBroadcastMessage
};
