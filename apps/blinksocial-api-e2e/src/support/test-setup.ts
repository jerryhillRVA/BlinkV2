/* eslint-disable */
import axios from 'axios';

module.exports = async function () {
  // Configure axios for tests to use.
  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ?? '3000';
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
