import axios from 'axios';

const API = process.env.API_URL || 'http://localhost:5001';

async function run() {
  try {
    // Login as approved test user
    const admin = await axios.post(`${API}/api/admin/login`, { identifier: 'admin@chatapp.com', password: 'Admin@123' }).catch(e => e.response || e);
    const adminToken = admin.data.token;
    const adminClient = axios.create({ baseURL: API, headers: { Authorization: `Bearer ${adminToken}` }, withCredentials: true });
    const usersRes = await adminClient.get('/api/admin/users?status=approved');
    const testUser = usersRes.data.users.find(u => u.username && u.username.startsWith('testuser_'));
    const login = await axios.post(`${API}/api/auth/login`, { identifier: testUser.email, password: 'password123' }).catch(e => e.response || e);
    const token = login.data.token;
    const client = axios.create({ baseURL: API, headers: { Authorization: `Bearer ${token}` }, withCredentials: true });
    const res = await client.post('/api/auth/logout').catch(e => e.response || e);
    console.log('logout status', res.status, res.data);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
