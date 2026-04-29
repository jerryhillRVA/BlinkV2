/* eslint-disable */
import axios from 'axios';
import { resolveApiE2ePort } from './port-helpers';

module.exports = async function () {
  // Configure axios for tests to use.
  const host = process.env.HOST ?? 'localhost';
  // Single source of truth — global-setup.ts owns the env→port resolution
  // so the two halves of the e2e bootstrap cannot drift apart.
  const port = resolveApiE2ePort();
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
