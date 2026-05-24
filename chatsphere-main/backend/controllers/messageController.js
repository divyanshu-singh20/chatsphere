import { Op } from 'sequelize';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Message, User } from '../models/index.js';
import { createAndBroadcastMessage } from '../services/messageService.js';

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
  };
};

export const getMessages = asyncHandler(async (req, res) => {
  const chatId = Number(req.params.chatId);
  const messages = await Message.findAll({
    where: { chatId, deletedForEveryone: false },
    include: [
      { model: User, as: 'sender' },
      { model: Message, as: 'replyTo', include: [{ model: User, as: 'sender' }] }
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

    return res.status(201).json({ message: payload });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error('sendMessage error', error);
    return res.status(status).json({ success: false, message: error.message || 'Internal server error' });
  }
});

export const editMessage = asyncHandler(async (req, res) => {
  const message = await Message.findByPk(req.params.messageId, { include: [{ model: User, as: 'sender' }] });
  if (!message || message.senderId !== req.user.id) {
    res.status(403);
    throw new Error('Not allowed');
  }
  message.content = req.body.content;
  message.editedAt = new Date();
  await message.save();
  res.json({ message });
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findByPk(req.params.messageId);
  if (!message || message.senderId !== req.user.id) {
    res.status(403);
    throw new Error('Not allowed');
  }
  message.deletedAt = new Date();
  message.deletedForEveryone = true;
  await message.save();
  res.json({ message: 'Message deleted' });
});

export const markSeen = asyncHandler(async (req, res) => {
  const { chatId } = req.body;
  await Message.update({ seenAt: new Date() }, { where: { chatId, senderId: { [Op.ne]: req.user.id } } });
  res.json({ message: 'Seen updated' });
});