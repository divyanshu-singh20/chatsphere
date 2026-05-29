import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

// Import models after env loaded
import { User } from '../models/index.js';
import axios from 'axios';

const API = process.env.API_URL || 'http://localhost:5001';

async function run() {
  try {
    console.log('Searching for latest testuser_ account...');
    const user = await User.findOne({
      where: { username: { [Sequelize.Op.like]: 'testuser_%' } },
      order: [['createdAt', 'DESC']]
    });

    if (!user) {
      console.error('No testuser_ found');
      process.exit(1);
    }

    console.log('Found user:', user.username, 'id=', user.id, 'status=', user.status);
    user.status = 'approved';
    await user.save();
    console.log('User approved in DB. Now attempting login...');

    const client = axios.create({ baseURL: API, withCredentials: true });
    const loginRes = await client.post('/api/auth/login', { identifier: user.email, password: 'password123' }).catch(e => e.response || e);
    console.log('Login status:', loginRes.status);
    console.log(loginRes.data);

    if (loginRes.status === 200) {
      console.log('Login success - token present:', !!loginRes.data?.token);
    } else {
      console.error('Login failed after approval');
    }
  } catch (err) {
    console.error('Error', err);
    process.exit(1);
  }
}

run();
