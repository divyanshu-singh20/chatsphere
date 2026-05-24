import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { sequelize, User, Chat, Message, Group, Notification } from '../models/index.js';

const seed = async () => {
  const reset = String(process.env.SEED_RESET || '').toLowerCase() === 'true';
  await sequelize.sync(reset ? { force: true } : {});

  const password = await bcrypt.hash('Password@123', 12);
  const users = await User.bulkCreate([
    {
      fullName: 'Owner Admin',
      username: 'owner',
      email: 'owner@chatsphere.app',
      phoneNumber: '+919999000000',
      password,
      bio: 'ChatSphere owner account.',
      isOnline: true,
      status: 'approved',
      role: 'admin'
    },
    {
      fullName: 'Aarav Sharma',
      username: 'aarav',
      email: 'aarav@chatsphere.app',
      phoneNumber: '+919999000001',
      password,
      bio: 'Product designer and early adopter.',
      status: 'pending',
      role: 'user'
    },
    {
      fullName: 'Maya Patel',
      username: 'maya',
      email: 'maya@chatsphere.app',
      phoneNumber: '+919999000002',
      password,
      bio: 'Frontend engineer who loves real-time UX.',
      status: 'pending',
      role: 'user'
    },
    {
      fullName: 'Kabir Singh',
      username: 'kabir',
      email: 'kabir@chatsphere.app',
      phoneNumber: '+919999000003',
      password,
      bio: 'Backend engineer and coffee enthusiast.',
      status: 'pending',
      role: 'user'
    }
  ]);

  const directChat = await Chat.create({ name: 'Aarav Sharma', createdById: users[0].id, isGroup: false, lastMessageAt: new Date() });
  await directChat.addMembers([users[0], users[1]]);

  const groupChat = await Chat.create({ name: 'ChatSphere Team', createdById: users[0].id, isGroup: true, description: 'Core team planning space', lastMessageAt: new Date() });
  await groupChat.addMembers(users);

  const group = await Group.create({ chatId: groupChat.id, adminId: users[0].id, rules: 'Be kind. Share updates. Keep it moving.' });
  await group.addMembers(users);

  await Message.bulkCreate([
    { chatId: directChat.id, senderId: users[0].id, content: 'Welcome to ChatSphere. This is a seeded conversation.' },
    { chatId: directChat.id, senderId: users[1].id, content: 'Real-time chat is live and ready.' },
    { chatId: groupChat.id, senderId: users[2].id, content: 'Group chat, notifications, and voice notes are wired up.' }
  ]);

  await Notification.create({ userId: users[1].id, type: 'message', title: 'Maya, you have a new message', body: 'Open ChatSphere to continue the conversation.' });

  console.log('Seed data created');
  await sequelize.close();
};

seed().catch(async (error) => {
  console.error(error);
  await sequelize.close();
  process.exit(1);
});