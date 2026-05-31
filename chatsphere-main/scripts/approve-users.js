const fetch = global.fetch || require('node-fetch');
const base = process.env.BASE_URL || 'http://localhost:5002';
(async () => {
  try {
    const adminRes = await fetch(base + '/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: 'admin@chatapp.com', password: 'Admin@123' }) });
    const admin = await adminRes.json();
    if (!admin.token) {
      console.error('admin login failed', admin);
      process.exit(1);
    }
    console.log('[admin-login] ok');
    const usersRes = await fetch(base + '/api/users', { headers: { Authorization: 'Bearer ' + admin.token } });
    const users = await usersRes.json();
    console.log('[users][before] count', (users.users || []).length);
    for (const email of ['maya@chatsphere.app', 'kabir@chatsphere.app']) {
      const u = (users.users || []).find(x => x.email === email);
      console.log('[users][before]', email, u ? u.status : null);
      if (u && u.status !== 'approved') {
        const res = await fetch(base + `/api/admin/approve/${u.id}`, { method: 'PATCH', headers: { Authorization: 'Bearer ' + admin.token } });
        const data = await res.json();
        console.log('[approve]', email, data.success);
      }
    }
    const usersRes2 = await fetch(base + '/api/users', { headers: { Authorization: 'Bearer ' + admin.token } });
    const users2 = await usersRes2.json();
    for (const email of ['maya@chatsphere.app', 'kabir@chatsphere.app']) {
      const u = (users2.users || []).find(x => x.email === email);
      console.log('[users][after]', email, u ? u.status : null);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
