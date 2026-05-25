import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { sequelize, User, Chat, Message, Group, Notification } from '../models/index.js';

const seed = async () => {
  const reset = String(process.env.SEED_RESET || '').toLowerCase() === 'true';
  await sequelize.sync(reset ? { force: true } : {});

  const password = await bcrypt.hash('Password@123', 12);
  const adminPassword = await bcrypt.hash('Admin@123', 12);

  await User.create({
    fullName: 'ChatSphere Admin',
    username: 'admin',
    email: 'admin@chatapp.com',
    phoneNumber: '+10000000000',
    password: adminPassword,
    role: 'admin',
    status: 'approved'
  });

  const users = await User.bulkCreate([
    {
      fullName: 'Aarav Sharma',
      username: 'aarav',
      email: 'aarav@chatsphere.app',
      phoneNumber: '+919999000001',
      password,
      role: 'user',
      status: 'approved',
      bio: 'Product designer and early adopter.',
      isOnline: true
    },
    {
      fullName: 'Maya Patel',
      username: 'maya',
      email: 'maya@chatsphere.app',
      phoneNumber: '+919999000002',
      password,
      role: 'user',
      status: 'approved',
      bio: 'Frontend engineer who loves real-time UX.'
    },
    {
      fullName: 'Kabir Singh',
      username: 'kabir',
      email: 'kabir@chatsphere.app',
      phoneNumber: '+919999000003',
      password,
      role: 'user',
      status: 'approved',
      bio: 'Backend engineer and coffee enthusiast.'
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