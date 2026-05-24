import { Notification } from '../models/index.js';
import { getIO } from '../socket/index.js';

export const createNotification = async ({ userId, type, title, body, meta }) => {
  const notification = await Notification.create({ userId, type, title, body, meta });
  const io = getIO();
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification);
  }
  return notification;
};