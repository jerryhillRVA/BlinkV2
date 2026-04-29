/**
 * Angular dev-server proxy config. JS instead of JSON so each worktree
 * picks up its own `API_PORT` at `npm start` time. Without this, every
 * worktree's web dev server proxies `/api` to a single shared `:3000`,
 * defeating per-worktree port isolation (issue #76).
 *
 * Defaults: 3000 (API) and 8000 (Agentic Filesystem). Override via env:
 *
 *   API_PORT=3101 AFS_PORT=8001 npm start
 */
const apiPort = Number(process.env.API_PORT) || 3000;
const afsPort = Number(process.env.AFS_PORT) || 8000;

module.exports = {
  '/api': {
    target: `http://localhost:${apiPort}`,
    secure: false,
    changeOrigin: true,
  },
  '/v1': {
    target: `http://localhost:${afsPort}`,
    secure: false,
    changeOrigin: true,
  },
  '/admin': {
    target: `http://localhost:${afsPort}`,
    secure: false,
    changeOrigin: true,
  },
};
