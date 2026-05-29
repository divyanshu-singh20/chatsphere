import axios from 'axios';

const API = process.env.API_URL || 'http://localhost:5001';

const adminCreds = { identifier: 'admin@chatapp.com', password: 'Admin@123' };

const client = axios.create({ baseURL: API, withCredentials: true });

async function run() {
  try {
    console.log('Admin login...');
    const adminLogin = await client.post('/api/admin/login', adminCreds).catch(e => e.response || e);
    console.log('admin login status', adminLogin.status);
    if (adminLogin.status !== 200) {
      console.error('Admin login failed', adminLogin.data);
      process.exit(1);
    }

    const token = adminLogin.data.token;
    const authClient = axios.create({ baseURL: API, headers: { Authorization: `Bearer ${token}` }, withCredentials: true });

    console.log('Fetching pending users...');
    const pending = await authClient.get('/api/admin/pending-users').catch(e => e.response || e);
    console.log('pending status', pending.status);
    if (pending.status !== 200) {
      console.error('Failed fetching pending users', pending.data);
      process.exit(1);
    }

    const found = pending.data.users.find(u => u.username && u.username.startsWith('testuser_'));
    if (!found) {
      console.error('No testuser_ in pending users');
      process.exit(1);
    }

    console.log('Approving user', found.username, found.id);
    const approveRes = await authClient.patch(`/api/admin/approve/${found.id}`).catch(e => e.response || e);
    console.log('approve status', approveRes.status);
    console.log(approveRes.data);

    if (approveRes.status !== 200) {
      console.error('Approve failed');
      process.exit(1);
    }

    console.log('Attempting login for approved user...');
    const loginRes = await client.post('/api/auth/login', { identifier: found.email, password: 'password123' }).catch(e => e.response || e);
    console.log('user login status', loginRes.status);
    console.log(loginRes.data);

    if (loginRes.status === 200) console.log('User login after approval - PASS');
    else console.error('User login after approval - FAIL');

  } catch (err) {
    console.error('Error', err);
    process.exit(1);
  }
}

run();
