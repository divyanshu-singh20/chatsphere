const fs = require('fs');
const fetch = global.fetch || require('node-fetch');
const base = process.env.BASE_URL || 'http://localhost:5003';
(async () => {
  try {
    const adminRes = await fetch(base + '/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: 'admin@chatapp.com', password: 'Admin@123' }) });
    const admin = await adminRes.json();
    const out = { admin };
    if (!admin.token) {
      fs.writeFileSync('scripts/check-users-output.json', JSON.stringify(out, null, 2));
      console.error('admin login failed', admin);
      process.exit(1);
    }
    const usersRes = await fetch(base + '/api/users', { headers: { Authorization: 'Bearer ' + admin.token } });
    const users = await usersRes.json();
    out.users = users;
    fs.writeFileSync('scripts/check-users-output.json', JSON.stringify(out, null, 2));
    console.log('wrote scripts/check-users-output.json');
  } catch (err) {
    fs.writeFileSync('scripts/check-users-output.json', JSON.stringify({ error: String(err) }, null, 2));
    console.error(err);
    process.exit(1);
  }
})();
