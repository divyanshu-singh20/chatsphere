import 'dotenv/config';
import axios from 'axios';
import { io } from 'socket.io-client';

const base = process.env.API_BASE_URL;
const socketUrl = process.env.SOCKET_URL;

if (!base || !socketUrl) {
  throw new Error('API_BASE_URL and SOCKET_URL must be set to run this script.');
}
const password = 'Password@123';

const login = async (identifier) => {
  const { data } = await axios.post(`${base}/auth/login`, { identifier, password });
  return data.token;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const once = (socket, event) => new Promise((resolve) => socket.once(event, resolve));

const tokenA = await login('aarav@chatsphere.app');
const tokenB = await login('maya@chatsphere.app');

const socketA = io(socketUrl, { transports: ['websocket'], autoConnect: false, auth: { token: tokenA } });
const socketB = io(socketUrl, { transports: ['websocket'], autoConnect: false, auth: { token: tokenB } });

const connectA = once(socketA, 'connect');
const connectB = once(socketB, 'connect');
socketA.connect();
socketB.connect();
await Promise.all([connectA, connectB]);

const { data: chatsA } = await axios.get(`${base}/chats`, { headers: { Authorization: `Bearer ${tokenA}` } });
const directChat = chatsA.chats.find((chat) => !chat.isGroup && chat.members?.some((member) => member.email === 'maya@chatsphere.app'));
if (!directChat) {
  throw new Error('Direct chat not found');
}

const receiverIds = directChat.members
  .filter((member) => member.email === 'maya@chatsphere.app')
  .map((member) => member.id);

let typingCount = 0;
let stopTypingCount = 0;
let typingPayload;
let stopTypingPayload;

socketB.on('typing', (payload) => {
  typingCount += 1;
  typingPayload = payload;
});

socketB.on('stop_typing', (payload) => {
  stopTypingCount += 1;
  stopTypingPayload = payload;
});

socketA.emit('typing', { chatId: directChat.id, receiverIds, senderId: 1 });
await wait(350);
socketA.emit('stop_typing', { chatId: directChat.id, receiverIds, senderId: 1 });
await wait(350);

console.log(JSON.stringify({
  directChatId: directChat.id,
  receiverIds,
  typingCount,
  stopTypingCount,
  typingPayload,
  stopTypingPayload
}, null, 2));

socketA.disconnect();
socketB.disconnect();
