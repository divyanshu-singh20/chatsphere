const fs = require('fs');
const fetch = global.fetch || require('node-fetch');

const base = process.env.BASE_URL || 'http://localhost:5003';
const password = 'Password@123';

const now = Date.now();
const mayaEmail = `e2e_maya_${now}@example.com`;
const kabirEmail = `e2e_kabir_${now}@example.com`;

async function json(res) {
  const data = await res.json().catch(() => ({}));
  return data;
}

async function login(identifier, pwd) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password: pwd })
  });
  const data = await json(res);
  if (!res.ok) throw new Error(`login failed for ${identifier}: ${JSON.stringify(data)}`);
  return data;
}

async function registerUser({ fullName, username, email, phoneNumber }) {
  const res = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName, username, email, phoneNumber, password })
  });
  const data = await json(res);
  if (!res.ok) throw new Error(`register failed for ${email}: ${JSON.stringify(data)}`);
  return data;
}

(async () => {
  const out = { base, createdAt: new Date().toISOString() };
  try {
    const admin = await fetch(`${base}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@chatapp.com', password: 'Admin@123' })
    });
    const adminData = await json(admin);
    if (!admin.ok || !adminData.token) {
      throw new Error(`admin login failed: ${JSON.stringify(adminData)}`);
    }

    out.adminUserId = adminData.user?.id || null;

    const mayaReg = await registerUser({
      fullName: `E2E Maya ${now}`,
      username: `e2e_maya_${now}`,
      email: mayaEmail,
      phoneNumber: `+1555${String(now).slice(-7)}`
    });

    const kabirReg = await registerUser({
      fullName: `E2E Kabir ${now}`,
      username: `e2e_kabir_${now}`,
      email: kabirEmail,
      phoneNumber: `+1666${String(now).slice(-7)}`
    });

    const approve = async (id) => {
      const res = await fetch(`${base}/api/admin/approve/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminData.token}` }
      });
      const data = await json(res);
      if (!res.ok) throw new Error(`approve failed for ${id}: ${JSON.stringify(data)}`);
      return data;
    };

    await approve(mayaReg.user.id);
    await approve(kabirReg.user.id);

    const mayaLogin = await login(mayaEmail, password);
    const kabirLogin = await login(kabirEmail, password);

    const createDirect = await fetch(`${base}/api/chats/direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mayaLogin.token}`
      },
      body: JSON.stringify({ userId: kabirLogin.user.id })
    });
    const directData = await json(createDirect);
    if (!createDirect.ok) throw new Error(`create direct failed: ${JSON.stringify(directData)}`);

    out.users = {
      maya: { email: mayaEmail, password, id: mayaLogin.user.id, token: mayaLogin.token },
      kabir: { email: kabirEmail, password, id: kabirLogin.user.id, token: kabirLogin.token }
    };
    out.chat = directData.chat;
    out.pass = true;
  } catch (error) {
    out.pass = false;
    out.error = String(error);
  }

  fs.writeFileSync('scripts/e2e-setup-users-output.json', JSON.stringify(out, null, 2));
  if (!out.pass) process.exitCode = 1;
})();
