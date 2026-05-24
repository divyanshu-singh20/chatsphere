import { asyncHandler } from '../utils/asyncHandler.js';
import { Chat, Group, User } from '../models/index.js';

export const createGroup = asyncHandler(async (req, res) => {
  const { name, memberIds = [], description } = req.body;
  const chat = await Chat.create({ name, isGroup: true, description, createdById: req.user.id });
  const group = await Group.create({ chatId: chat.id, adminId: req.user.id });
  const members = await User.findAll({ where: { id: [...new Set([req.user.id, ...memberIds.map(Number)])] } });
  await chat.addMembers(members);
  await group.addMembers(members);
  res.status(201).json({ group, chat });
});

export const getGroups = asyncHandler(async (req, res) => {
  const groups = await Group.findAll({ where: { adminId: req.user.id }, include: [{ model: Chat, as: 'chat' }, { model: User, as: 'members' }] });
  res.json({ groups });
});

export const updateGroup = asyncHandler(async (req, res) => {
  const group = await Group.findByPk(req.params.groupId);
  if (req.body.icon) group.icon = req.body.icon;
  if (req.body.rules) group.rules = req.body.rules;
  await group.save();
  res.json({ group });
});

export const addMembers = asyncHandler(async (req, res) => {
  const group = await Group.findByPk(req.params.groupId, { include: [{ model: Chat, as: 'chat' }] });
  const members = await User.findAll({ where: { id: req.body.memberIds } });
  await group.addMembers(members);
  await group.chat.addMembers(members);
  res.json({ message: 'Members added' });
});

export const removeMember = asyncHandler(async (req, res) => {
  const group = await Group.findByPk(req.params.groupId, { include: [{ model: Chat, as: 'chat' }] });
  await group.removeMember(Number(req.params.userId));
  await group.chat.removeMember(Number(req.params.userId));
  res.json({ message: 'Member removed' });
});

export const leaveGroup = asyncHandler(async (req, res) => {
  const group = await Group.findByPk(req.params.groupId, { include: [{ model: Chat, as: 'chat' }] });
  await group.removeMember(req.user.id);
  await group.chat.removeMember(req.user.id);
  res.json({ message: 'Left group' });
});