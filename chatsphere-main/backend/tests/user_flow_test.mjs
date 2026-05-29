import axios from 'axios';

const API = process.env.API_URL || 'http://localhost:5001';

async function run() {
  try {
    // Admin login to fetch approved test user
    const admin = await axios.post(`${API}/api/admin/login`, { identifier: 'admin@chatapp.com', password: 'Admin@123' }).catch(e => e.response || e);
    if (admin.status !== 200) {
      console.error('Admin login failed');
      process.exit(1);
    }
    const adminToken = admin.data.token;
    const adminClient = axios.create({ baseURL: API, headers: { Authorization: `Bearer ${adminToken}` }, withCredentials: true });

    // Find approved testuser_
    const usersRes = await adminClient.get('/api/admin/users?status=approved').catch(e => e.response || e);
    if (usersRes.status !== 200) {
      console.error('Failed to list users');
      process.exit(1);
    }

    const found = usersRes.data.users.find(u => u.username && u.username.startsWith('testuser_'));
    if (!found) {
      console.error('No approved testuser_ found');
      process.exit(1);
    }

    console.log('Found approved test user:', found.username, found.email);

    // Login as that user
    const userLogin = await axios.post(`${API}/api/auth/login`, { identifier: found.email, password: 'password123' }).catch(e => e.response || e);
    if (userLogin.status !== 200) {
      console.error('User login failed', userLogin.data);
      process.exit(1);
    }

    const userToken = userLogin.data.token;
    const userClient = axios.create({ baseURL: API, headers: { Authorization: `Bearer ${userToken}` }, withCredentials: true });

    // Get profile
    const me = await userClient.get('/api/users/me').catch(e => e.response || e);
    console.log('/api/users/me status', me.status);

    // List users
    const list = await userClient.get('/api/users').catch(e => e.response || e);
    console.log('/api/users status', list.status, 'users count', Array.isArray(list.data.users) ? list.data.users.length : 0);

    const target = list.data.users && list.data.users[0] ? list.data.users[0] : null;
    if (!target) {
      console.error('No other users to block');
      process.exit(1);
    }

    // Block target
    const block = await userClient.post(`/api/users/block/${target.id}`).catch(e => e.response || e);
    console.log('Block status', block.status, block.data);

    if (block.status === 200) console.log('Block user - PASS'); else console.error('Block user - FAIL');

    console.log('User flow tests complete');
  } catch (err) {
    console.error('Error', err);
    process.exit(1);
  }
}

run();
