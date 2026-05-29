import axios from 'axios';
import { io } from 'socket.io-client';

const API = process.env.API_URL || 'http://localhost:5001';
const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:5001';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  try {
    // Admin to find users
    const admin = await axios.post(`${API}/api/admin/login`, { identifier: 'admin@chatapp.com', password: 'Admin@123' }).catch(e => e.response || e);
    if (admin.status !== 200) throw new Error('Admin login failed');
    const adminToken = admin.data.token;
    const adminClient = axios.create({ baseURL: API, headers: { Authorization: `Bearer ${adminToken}` }, withCredentials: true });

    const usersRes = await adminClient.get('/api/admin/users?status=approved');
    const users = usersRes.data.users;

    // pick testuser and aarav
    const testUser = users.find(u => u.username && u.username.startsWith('testuser_'));
    const aarav = users.find(u => u.username === 'aarav');

    if (!testUser || !aarav) {
      console.error('Required users not found');
      process.exit(1);
    }

    // login both
    const loginA = await axios.post(`${API}/api/auth/login`, { identifier: testUser.email, password: 'password123' }).catch(e => e.response || e);
    const loginB = await axios.post(`${API}/api/auth/login`, { identifier: aarav.email, password: 'Password@123' }).catch(e => e.response || e);
    if (loginA.status !== 200 || loginB.status !== 200) {
      console.error('User logins failed', loginA.status, loginB.status);
      process.exit(1);
    }
    const tokenA = loginA.data.token;
    const tokenB = loginB.data.token;

    // create direct chat as A to B
    const clientA = axios.create({ baseURL: API, headers: { Authorization: `Bearer ${tokenA}` }, withCredentials: true });
    const chatRes = await clientA.post('/api/chats/direct', { userId: aarav.id }).catch(e => e.response || e);
    if (chatRes.status !== 201) {
      console.error('Failed to create direct chat', chatRes.data);
      process.exit(1);
    }
    const chat = chatRes.data.chat;
    console.log('Created direct chat id', chat.id);

    // connect sockets
    const socketA = io(SOCKET_URL, { auth: { token: tokenA }, autoConnect: false, transports: ['websocket'] });
    const socketB = io(SOCKET_URL, { auth: { token: tokenB }, autoConnect: false, transports: ['websocket'] });

    await new Promise((resolve, reject) => {
      let ready = 0;
      const maybeResolve = () => { ready += 1; if (ready === 2) resolve(); };

      socketA.on('connect', () => { console.log('socketA connected', socketA.id); maybeResolve(); });
      socketB.on('connect', () => { console.log('socketB connected', socketB.id); maybeResolve(); });

      socketA.on('connect_error', (err) => { reject(err); });
      socketB.on('connect_error', (err) => { reject(err); });

      socketA.connect();
      socketB.connect();
    });

    // join chat rooms
    socketA.emit('join-chat', { chatId: chat.id });
    socketB.emit('join-chat', { chatId: chat.id });

    let received = false;
    socketB.on('message:receive', (payload) => {
      console.log('socketB received message:receive', payload);
      received = true;
    });

    // send message from A
    const ack = await new Promise((resolve) => {
      socketA.emit('message:send', { chatId: chat.id, content: 'Hello from test automation' }, (resp) => {
        resolve(resp);
      });
    });

    console.log('message send ack', ack);

    // wait a bit for delivery
    await sleep(1000);

    if (ack && ack.ok && received) {
      console.log('Socket message flow - PASS');
    } else {
      console.error('Socket message flow - FAIL', { ack, received });
    }

    socketA.disconnect();
    socketB.disconnect();

    process.exit(0);
  } catch (err) {
    console.error('Socket test error', err);
    process.exit(1);
  }
}

run();
