/**
 * Cloud Run injects PORT=8080 by default. Honor $PORT when set, otherwise
 * fall back to 8080 so a bare `node main.js` matches Cloud Run convention.
 * Dev (`npm start` / `npm run start:api`) sets PORT explicitly via API_PORT.
 */
export function resolvePort(env: NodeJS.ProcessEnv = process.env): string | number {
  return env['PORT'] || 8080;
}
