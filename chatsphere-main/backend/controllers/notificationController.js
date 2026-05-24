import { asyncHandler } from '../utils/asyncHandler.js';
import { Notification } from '../models/index.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] });
  res.json({ notifications });
});

export const markRead = asyncHandler(async (req, res) => {
  await Notification.update({ isRead: true }, { where: { userId: req.user.id } });
  res.json({ message: 'Notifications marked as read' });
});