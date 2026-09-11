const run = async () => {
  try {
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'adminA@organizationa.com', password: 'password123', role: 'admin' })
    });
    const loginData = await loginRes.json();
    const token = loginData.accessToken;

    const res = await fetch('http://localhost:3001/api/logs', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const resData = await res.json();
    console.log('resData:', resData);
  } catch (e) {
    console.error('Error:', e);
  }
};
run();
