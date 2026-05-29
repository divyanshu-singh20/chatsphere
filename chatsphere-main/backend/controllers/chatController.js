import { Op } from 'sequelize';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Chat, Message, User } from '../models/index.js';
import { ensureDirectChat } from '../services/chatService.js';

const serializeChat = (chat, currentUserId) => {
  const members = (chat.members || []).filter((member) => Number(member.id) === Number(currentUserId) || member.status === 'approved');
  const counterpart = members.find((member) => Number(member.id) !== Number(currentUserId)) || null;
  const lastMessage = chat.messages?.[0] || null;

  if (!chat.isGroup && !counterpart) {
    return null;
  }

  if (chat.isGroup && members.length < 2) {
    return null;
  }

  return {
    id: chat.id,
    name: chat.isGroup ? chat.name : counterpart?.fullName || chat.name,
    avatar: chat.isGroup ? chat.avatar : counterpart?.avatar,
    status: counterpart?.status,
    isGroup: chat.isGroup,
    members,
    lastMessage,
    lastMessageAt: chat.lastMessageAt,
    updatedLabel: chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleDateString() : ''
  };
};

export const getChats = asyncHandler(async (req, res) => {
  const chats = await Chat.findAll({
    include: [
      { model: User, as: 'members', through: { attributes: [] }, where: { status: 'approved', isDeleted: false }, required: false }
    ],
    order: [['updatedAt', 'DESC']]
  });

  const visible = chats.filter((chat) => (chat.members || []).some((member) => member.id === req.user.id));
  const chatIds = visible.map((chat) => chat.id);

  const latestMessages = chatIds.length
    ? await Message.findAll({
      where: { chatId: chatIds, deletedForEveryone: false },
      include: [{ model: User, as: 'sender' }],
      order: [['chatId', 'ASC'], ['createdAt', 'DESC']]
    })
    : [];

  const latestByChatId = new Map();
  latestMessages.forEach((message) => {
    const chatId = Number(message.chatId);
    if (!latestByChatId.has(chatId)) {
      latestByChatId.set(chatId, message);
    }
  });

  res.json({
    chats: visible.map((chat) => serializeChat({ ...chat.toJSON(), messages: [latestByChatId.get(Number(chat.id))].filter(Boolean) }, req.user.id)).filter(Boolean)
  });
});

export const createDirectChat = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }
    const chat = await ensureDirectChat(req.user.id, Number(userId));
    const full = await Chat.findByPk(chat.id, {
      include: [
        { model: User, as: 'members', through: { attributes: [] }, where: { status: 'approved', isDeleted: false }, required: false },
        { model: Message, as: 'messages', limit: 1, order: [['createdAt', 'DESC']], separate: true, include: [{ model: User, as: 'sender' }] }
      ]
    });
    if (!full) {
      return res.status(500).json({ success: false, message: 'Failed to load created chat' });
    }
    return res.status(201).json({ chat: serializeChat(full, req.user.id) });
  } catch (error) {
    console.error('createDirectChat error', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

export const createGroupChat = asyncHandler(async (req, res) => {
  const { name, memberIds = [], description } = req.body;
  const chat = await Chat.create({ name, isGroup: true, description, createdById: req.user.id });
  const members = await User.findAll({ where: { id: [...new Set([req.user.id, ...memberIds.map(Number)])] } });
  await chat.addMembers(members);
  res.status(201).json({ chat });
});

export const addChatMember = asyncHandler(async (req, res) => {
  const chat = await Chat.findByPk(req.params.chatId, { include: [{ model: User, as: 'members', through: { attributes: [] } }] });
  const user = await User.findByPk(req.body.userId);
  await chat.addMember(user);
  res.json({ message: 'Member added' });
});

export const removeChatMember = asyncHandler(async (req, res) => {
  const chat = await Chat.findByPk(req.params.chatId);
  await chat.removeMember(Number(req.params.userId));
  res.json({ message: 'Member removed' });
});

export const leaveGroup = asyncHandler(async (req, res) => {
  const chat = await Chat.findByPk(req.params.chatId);
  await chat.removeMember(req.user.id);
  res.json({ message: 'Left group' });
});