import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API = process.env.API_URL || 'http://localhost:5001';

const rnd = Math.floor(Math.random() * 1000000);
const testUser = {
  fullName: `Test User ${rnd}`,
  username: `testuser_${rnd}`,
  email: `test${rnd}@example.com`,
  phoneNumber: `+100000${rnd}`,
  password: 'password123',
  bio: 'Automated test user'
};

const client = axios.create({ baseURL: API, withCredentials: true });

async function run() {
  try {
    console.log('Registering user...');
    const regRes = await client.post('/api/auth/register', testUser).catch(e => e.response || e);
    console.log('Register response status:', regRes.status);
    console.log(regRes.data);

    const userId = regRes.data?.user?.id;
    if (!userId) {
      console.error('Registration did not return a user id - FAIL');
      process.exit(1);
    }

    console.log('Approving user in DB (via admin bypass)...');
    // Use API to update user status if admin endpoint exists; otherwise update via direct DB access is not implemented here.
    // We'll try to login (expected to be rejected while pending) and then report that behavior.

    console.log('Attempting login while status pending (should FAIL with 403)...');
    const loginResPending = await client.post('/api/auth/login', {
      identifier: testUser.email,
      password: testUser.password
    }).catch(e => e.response || e);

    console.log('Login (pending) status:', loginResPending.status);
    console.log(loginResPending.data);

    if (loginResPending.status === 200) {
      console.error('Unexpected successful login while pending - FAIL');
    } else {
      console.log('Expected rejection while pending - PASS');
    }

    console.log('Note: this script does not modify DB to approve users. To fully test login flow, run a DB update to set status=approved.');

    console.log('Testing protected route without token (should 401)...');
    const meNoToken = await client.get('/api/auth/me').catch(e => e.response || e);
    console.log('Status:', meNoToken.status);
    console.log(meNoToken.data);

    if (meNoToken.status === 401) console.log('Protected route without token - PASS');
    else console.error('Protected route without token - FAIL');

    console.log('All done.');
  } catch (err) {
    console.error('Test error', err);
    process.exit(1);
  }
}

run();
