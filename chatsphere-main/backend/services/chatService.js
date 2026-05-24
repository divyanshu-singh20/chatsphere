import { Chat, Group, Message, User } from '../models/index.js';

export const buildChatPreview = async (chat, currentUserId) => {
  const memberIds = (chat.members || []).map((member) => member.id);
  const counterpart = (chat.members || []).find((member) => member.id !== currentUserId) || (chat.members || [])[0];
  return {
    id: chat.id,
    name: chat.isGroup ? chat.name : counterpart?.fullName || chat.name,
    avatar: chat.isGroup ? chat.avatar : counterpart?.avatar,
    status: counterpart?.status,
    isGroup: chat.isGroup,
    members: chat.members || [],
    memberIds,
    lastMessage: chat.messages?.[0] || null,
    updatedLabel: chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleDateString() : ''
  };
};

export const getDirectChatWhere = async (userId, otherUserId) => {
  const chats = await Chat.findAll({
    where: { isGroup: false },
    include: [{ model: User, as: 'members', through: { attributes: [] } }]
  });

  return chats.find((chat) => {
    const memberIds = (chat.members || []).map((member) => Number(member.id)).sort();
    return memberIds.length === 2 && memberIds.includes(Number(userId)) && memberIds.includes(Number(otherUserId));
  }) || null;
};

export const ensureDirectChat = async (userId, otherUserId) => {
  if (!userId || !otherUserId) {
    throw new Error('Invalid user ids for direct chat');
  }
  const existing = await getDirectChatWhere(userId, otherUserId);
  if (existing) return existing;

  const otherUser = await User.findByPk(otherUserId);
  const currentUser = await User.findByPk(userId);
  if (!otherUser || !currentUser) {
    throw new Error('User not found');
  }
  const chat = await Chat.create({ name: otherUser.fullName || 'Direct chat', createdById: userId, isGroup: false });
  await chat.addMembers([currentUser, otherUser]);
  return chat;
};