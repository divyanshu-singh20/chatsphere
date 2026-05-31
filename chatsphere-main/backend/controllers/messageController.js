import { Op } from 'sequelize';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Message, MessageReaction, User } from '../models/index.js';
import { createAndBroadcastMessage } from '../services/messageService.js';
import { getIO } from '../socket/index.js';

const serializeMessage = (message) => {
  if (!message) return null;

  const plain = message.toJSON ? message.toJSON() : message;

  return {
    ...plain,
    sender: message.sender
      ? {
          id: message.sender.id,
          fullName: message.sender.fullName,
          username: message.sender.username,
          avatar: message.sender.avatar
        }
      : message.sender,
    replyTo: message.replyTo
      ? {
          ...message.replyTo.toJSON?.(),
          sender: message.replyTo.sender
            ? {
                id: message.replyTo.sender.id,
                fullName: message.replyTo.sender.fullName,
                username: message.replyTo.sender.username,
                avatar: message.replyTo.sender.avatar
              }
            : message.replyTo.sender
        }
      : message.replyTo
    ,
    status: plain.status || 'sent',
    deliveredAt: plain.deliveredAt || null,
    seenAt: plain.seenAt || null,
    editedAt: plain.editedAt || null,
    deletedForEveryone: !!plain.deletedForEveryone,
    reactions: Array.isArray(plain.reactors)
      ? plain.reactors.reduce((acc, reactor) => {
          const emoji = reactor?.MessageReaction?.emoji || reactor?.emoji;
          if (!emoji) return acc;
          const existing = acc.find((item) => item.emoji === emoji);
          if (existing) {
            existing.count += 1;
            return acc;
          }
          acc.push({ emoji, count: 1 });
          return acc;
        }, [])
      : []
  };
};

export const getMessages = asyncHandler(async (req, res) => {
  const chatId = Number(req.params.chatId);
  const messages = await Message.findAll({
    where: { chatId, deletedForEveryone: false },
    include: [
      { model: User, as: 'sender' },
      { model: Message, as: 'replyTo', include: [{ model: User, as: 'sender' }] },
      { model: User, as: 'reactors', through: { attributes: ['emoji'] }, required: false }
    ],
    order: [['createdAt', 'ASC']],
    limit: 100
  });
  res.json({ messages: messages.map(serializeMessage) });
});

export const sendMessage = asyncHandler(async (req, res) => {
  try {
    const { chatId, content = '', replyToId } = req.body;

    if (!chatId) {
    return res.status(400).json({ success: false, message: 'chatId is required' });
    }

    const { payload } = await createAndBroadcastMessage({
      chatId: Number(chatId),
      senderId: req.user.id,
      content,
      replyToId: replyToId || null,
      files: req.files || []
    });

    console.log('[message][http-send]', {
      senderId: req.user.id,
      chatId: Number(chatId),
      messageId: payload?.id || null,
      hasFiles: Array.isArray(req.files) && req.files.length > 0,
      hasContent: !!String(content || '').trim()
    });

    return res.status(201).json({ message: payload });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error('sendMessage error', error);
    return res.status(status).json({ success: false, message: error.message || 'Internal server error' });
  }
});

export const editMessage = asyncHandler(async (req, res) => {
  const message = await Message.findByPk(req.params.messageId, {
    include: [
      { model: User, as: 'sender' },
      { model: Message, as: 'replyTo', include: [{ model: User, as: 'sender' }] },
      { model: User, as: 'reactors', through: { attributes: ['emoji'] }, required: false }
    ]
  });
  if (!message || message.senderId !== req.user.id) {
    res.status(403);
    throw new Error('Not allowed');
  }
  message.content = req.body.content;
  message.editedAt = new Date();
  await message.save();

  const payload = serializeMessage(message);
  const io = getIO();
  if (io) {
    io.to(`chat:${message.chatId}`).emit('message:edited', payload);
    io.to(`user:${message.senderId}`).emit('message:updated', payload);
  }

  res.json({ message: payload });
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findByPk(req.params.messageId, {
    include: [
      { model: User, as: 'sender' },
      { model: Message, as: 'replyTo', include: [{ model: User, as: 'sender' }] },
      { model: User, as: 'reactors', through: { attributes: ['emoji'] }, required: false }
    ]
  });
  if (!message || message.senderId !== req.user.id) {
    res.status(403);
    throw new Error('Not allowed');
  }
  message.deletedAt = new Date();
  message.deletedForEveryone = true;
  await message.save();

  const payload = serializeMessage(message);
  const io = getIO();
  if (io) {
    io.to(`chat:${message.chatId}`).emit('message:deleted', payload);
    io.to(`user:${message.senderId}`).emit('message:deleted', payload);
  }

  res.json({ message: payload });
});

export const markSeen = asyncHandler(async (req, res) => {
  const { chatId } = req.body;
  const seenAt = new Date();
  await Message.update(
    { seenAt },
    { where: { chatId, senderId: { [Op.ne]: req.user.id } } }
  );

  const io = getIO();
  if (io) {
    io.to(`chat:${chatId}`).emit('message:seen', {
      chatId: Number(chatId),
      seenByUserId: req.user.id,
      seenAt: seenAt.toISOString()
    });
  }

  res.json({ message: 'Seen updated', seenAt: seenAt.toISOString() });
});

export const reactToMessage = asyncHandler(async (req, res) => {
  const messageId = Number(req.params.messageId);
  const emoji = String(req.body.emoji || '').trim();

  if (!emoji) {
    res.status(400);
    throw new Error('emoji is required');
  }

  const message = await Message.findByPk(messageId);
  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }

  const existingReaction = await MessageReaction.findOne({ where: { messageId, userId: req.user.id } });
  let removed = false;
  let previousEmoji = null;

  if (!existingReaction) {
    await MessageReaction.create({ messageId, userId: req.user.id, emoji });
  } else {
    previousEmoji = existingReaction.emoji;
    if (existingReaction.emoji === emoji) {
      await existingReaction.destroy();
      removed = true;
    } else {
      existingReaction.emoji = emoji;
      await existingReaction.save();
    }
  }

  const io = getIO();
  const payload = { messageId, chatId: message.chatId, userId: req.user.id, emoji, removed, previousEmoji };
  if (io) {
    io.to(`chat:${message.chatId}`).emit('message:reaction', payload);
  }

  res.json({ success: true, reaction: payload });
});