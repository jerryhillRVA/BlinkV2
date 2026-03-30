import { waitForPortOpen } from '@nx/node/utils';
import { exec, execSync } from 'child_process';

/* eslint-disable */
var __TEARDOWN_MESSAGE__: string;

module.exports = async function () {
  console.log('\nSetting up...\n');

  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;

  // Kill any existing process on the port to ensure a clean server with fresh in-memory state
  try {
    execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, { stdio: 'ignore' });
    // Brief pause to let the port release
    await new Promise((resolve) => setTimeout(resolve, 500));
  } catch {
    // No process on port — that's fine
  }

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
