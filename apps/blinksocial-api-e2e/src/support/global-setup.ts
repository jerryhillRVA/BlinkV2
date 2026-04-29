import { waitForPortOpen } from '@nx/node/utils';
import { exec } from 'child_process';
import { ensurePortFree, resolveApiE2ePort } from './port-helpers';

/* eslint-disable */
var __TEARDOWN_MESSAGE__: string;

module.exports = async function () {
  console.log('\nSetting up...\n');

  const host = process.env.HOST ?? 'localhost';
  // Force-override to 3001 so we don't collide with the web-e2e webServer
  // (which serves the API on 3000). Nx loads the workspace .env at
  // bootstrap, which otherwise seeds PORT=3000 here. When both e2e targets
  // run in parallel via `nx affected -t e2e`, sharing 3000 lets one task
  // kill the other's server mid-test. Callers can still override by
  // setting API_E2E_PORT.
  const port = resolveApiE2ePort();
  process.env.PORT = String(port);

  // Fail-fast when something is already listening on the port. The
  // previous "force-cleanup" approach SIGKILLed whatever owned the port,
  // including a sibling worktree's e2e run. global-teardown only stops
  // the server *this* setup spawned, which is the right blast radius —
  // see docs/worktrees.md.
  ensurePortFree(port);

  // Start the API server in the background
  const serverProcess = exec('node apps/blinksocial-api/dist/main.js', {
    cwd: process.env.NX_WORKSPACE_ROOT || process.cwd(),
    env: { ...process.env, PORT: String(port), AGENTIC_FS_URL: '' },
  });

  serverProcess.stdout?.on('data', (data) => process.stdout.write(data));
  serverProcess.stderr?.on('data', (data) => process.stderr.write(data));

  // Store the process for teardown
  globalThis.__SERVER_PROCESS__ = serverProcess;

  await waitForPortOpen(port, { host });

  globalThis.__TEARDOWN_MESSAGE__ = '\nTearing down...\n';
};
