const fetch = global.fetch || require('node-fetch');
const base = process.env.BASE_URL || 'http://localhost:5003';
(async () => {
  try {
    const adminRes = await fetch(base + '/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: 'admin@chatapp.com', password: 'Admin@123' }) });
    const admin = await adminRes.json();
    if (!admin.token) { console.error('admin login failed', admin); process.exit(1);}    
    const usersRes = await fetch(base + '/api/users', { headers: { Authorization: 'Bearer ' + admin.token } });
    const users = await usersRes.json();
    for (const email of ['maya@chatsphere.app','kabir@chatsphere.app']) {
      const u = (users.users||[]).find(x => x.email===email);
      console.log(email, '=>', u ? u.status : 'not found');
    }
  } catch (err) { console.error(err); process.exit(1); }
})();
