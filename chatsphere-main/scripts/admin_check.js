(async () => {
  try {
    const fetch = globalThis.fetch || (await import('node-fetch')).default;
    const loginRes = await fetch('http://localhost:5006/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@chatapp.com', password: 'Admin@123' })
    });
    const loginJson = await loginRes.json();
    console.log('TOKEN:' + (loginJson.token || 'NO_TOKEN'));

    const dashRes = await fetch('http://localhost:5006/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${loginJson.token}` }
    });
    const dashJson = await dashRes.json();
    console.log('DASH:' + JSON.stringify(dashJson));

    const pendingRes = await fetch('http://localhost:5006/api/admin/pending-users', {
      headers: { Authorization: `Bearer ${loginJson.token}` }
    });
    const pendingJson = await pendingRes.json();
    console.log('PEND:' + JSON.stringify(pendingJson));
  } catch (e) {
    console.error('ERR', e);
    process.exit(1);
  }
})();
