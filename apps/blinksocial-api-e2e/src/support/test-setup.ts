/* eslint-disable */
import axios from 'axios';

module.exports = async function () {
  // Configure axios for tests to use.
  const host = process.env.HOST ?? 'localhost';
  // Must match the port in global-setup.ts (which force-overrides to 3001
  // to avoid colliding with web-e2e's webServer on 3000).
  const port = process.env.API_E2E_PORT ?? '3001';
  axios.defaults.baseURL = `http://${host}:${port}`;

  // Login with the bootstrap admin credentials to get a session cookie.
  // The API starts in mock mode (no AFS), so bootstrap login creates the admin user.
  const loginResp = await axios.post('/api/auth/login', {
    email: 'blinkadmin@blinksocial.com',
    password: 'blinksocial',
  });

  // Extract the session cookie and set it as default for all requests
  const setCookieHeader = loginResp.headers['set-cookie'];
  if (setCookieHeader) {
    const sessionCookie = setCookieHeader
      .map((c: string) => c.split(';')[0])
      .join('; ');
    axios.defaults.headers.common['Cookie'] = sessionCookie;
  }
};
