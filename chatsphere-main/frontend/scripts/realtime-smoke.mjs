import { io } from 'socket.io-client';

const baseUrl = process.env.BASE_URL || 'http://localhost:5001';

const login = async (identifier, password) => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`${identifier} login failed: ${data.message || response.statusText}`);
  }

  return data;
};

const adminLogin = async () => {
  const response = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin@chatapp.com', password: 'Admin@123' })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`admin login failed: ${data.message || response.statusText}`);
  }

  return data;
};

const register = async ({ fullName, username, email, phoneNumber, password }) => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName, username, email, phoneNumber, password })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`register failed for ${email}: ${data.message || response.statusText}`);
  }

  return data;
};

const approveUser = async (adminToken, userId) => {
  const response = await fetch(`${baseUrl}/api/admin/approve/${userId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`approve failed for ${userId}: ${data.message || response.statusText}`);
  }

  return data;
};

const waitForEvent = (socket, eventName, timeoutMs = 10000) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => {
    socket.off(eventName, onEvent);
    reject(new Error(`Timeout waiting for ${eventName}`));
  }, timeoutMs);

  const onEvent = (...args) => {
    clearTimeout(timer);
    socket.off(eventName, onEvent);
    resolve(args.length > 1 ? args : args[0]);
  };

  socket.on(eventName, onEvent);
});

const connectUser = (token, label) => {
  const socket = io(baseUrl, {
    transports: ['websocket', 'polling'],
    autoConnect: false,
    reconnection: false,
    withCredentials: true
  });

  socket.auth = { token };
  socket.on('connect', () => console.log(`[${label}] connect`, socket.id));
  socket.on('disconnect', (reason) => console.log(`[${label}] disconnect`, reason));
  socket.on('connect_error', (err) => console.log(`[${label}] connect_error`, err.message));
  socket.on('user:online', (payload) => console.log(`[${label}] user:online`, payload));
  socket.on('user:offline', (payload) => console.log(`[${label}] user:offline`, payload));
  socket.on('online-users', (payload) => console.log(`[${label}] online-users`, payload));
  socket.on('message:receive', (payload) => console.log(`[${label}] message:receive`, payload?.id || null, payload?.chatId || null));
  socket.on('message:sent', (payload) => console.log(`[${label}] message:sent`, payload?.id || null, payload?.chatId || null));
  socket.connect();

  return socket;
};

const main = async () => {
  const admin = await adminLogin();

  const suffix = Date.now();
  const password = 'Password@123';
  const senderRegistration = await register({
    fullName: `Realtime Sender ${suffix}`,
    username: `realtime_sender_${suffix}`,
    email: `realtime_sender_${suffix}@example.com`,
    phoneNumber: `+1555000${String(suffix).slice(-4).padStart(4, '0')}`,
    password
  });
  const recipientRegistration = await register({
    fullName: `Realtime Recipient ${suffix}`,
    username: `realtime_recipient_${suffix}`,
    email: `realtime_recipient_${suffix}@example.com`,
    phoneNumber: `+1555111${String(suffix).slice(-4).padStart(4, '0')}`,
    password
  });

  await approveUser(admin.token, senderRegistration.user.id);
  await approveUser(admin.token, recipientRegistration.user.id);

  const sender = await login(senderRegistration.user.email, password);
  const recipient = await login(recipientRegistration.user.email, password);

  const senderSocket = connectUser(sender.token, 'maya');
  const recipientSocket = connectUser(recipient.token, 'kabir');

  const senderOnline = await waitForEvent(senderSocket, 'user:online');
  const recipientOnline = await waitForEvent(recipientSocket, 'user:online');
  console.log('presence events received', { senderOnline, recipientOnline });

  const usersRes = await fetch(`${baseUrl}/api/users`, {
    headers: { Authorization: `Bearer ${sender.token}` }
  });
  const usersData = await usersRes.json();
  const recipientUser = (usersData.users || []).find((user) => Number(user.id) === Number(recipientRegistration.user.id));
  if (!recipientUser) {
    throw new Error('Recipient user was not found in /api/users');
  }

  const chatsRes = await fetch(`${baseUrl}/api/chats`, {
    headers: { Authorization: `Bearer ${sender.token}` }
  });
  const chatsData = await chatsRes.json();
  let directChat = (chatsData.chats || []).find((chat) => !chat.isGroup && (chat.members || []).some((member) => Number(member.id) === Number(recipientRegistration.user.id)));

  if (!directChat) {
    const createResponse = await fetch(`${baseUrl}/api/chats/direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sender.token}`
      },
      body: JSON.stringify({ userId: recipientUser.id })
    });

    const createdData = await createResponse.json();
    if (!createResponse.ok) {
      throw new Error(`Direct chat creation failed: ${createdData.message || createResponse.statusText}`);
    }

    directChat = createdData.chat;
  }

  if (!directChat) {
    throw new Error('Direct chat between the two test users not found');
  }

  const recipientMessagePromise = waitForEvent(recipientSocket, 'message:receive');
  const ackPromise = new Promise((resolve, reject) => {
    senderSocket.emit('message:send', {
      chatId: directChat.id,
      content: 'Realtime test message',
      clientMsgId: `test-${Date.now()}`
    }, (ack) => {
      if (!ack || !ack.ok) {
        reject(new Error(`Ack failed: ${JSON.stringify(ack)}`));
        return;
      }

      resolve(ack);
    });
  });

  const [ack, received] = await Promise.all([ackPromise, recipientMessagePromise]);
  console.log('message delivery confirmed', {
    ackMessageId: ack.message?.id || null,
    receivedMessageId: received?.id || null,
    receivedChatId: received?.chatId || null,
    receivedContent: received?.content || null
  });

  const offlinePromise = waitForEvent(recipientSocket, 'user:offline');
  senderSocket.disconnect();
  const offline = await offlinePromise;
  console.log('offline event confirmed', offline);

  recipientSocket.disconnect();
};

main().catch((error) => {
  console.error('TEST_FAILED', error);
  process.exitCode = 1;
});