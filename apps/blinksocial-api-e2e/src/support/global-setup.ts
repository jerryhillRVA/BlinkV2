import { waitForPortOpen } from '@nx/node/utils';
import { exec } from 'child_process';

/* eslint-disable */
var __TEARDOWN_MESSAGE__: string;

module.exports = async function () {
  console.log('\nSetting up...\n');

  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;

  // Start the API server in the background
  const serverProcess = exec('node apps/blinksocial-api/dist/main.js', {
    cwd: process.env.NX_WORKSPACE_ROOT || process.cwd(),
    env: { ...process.env, PORT: String(port) },
  });

  serverProcess.stdout?.on('data', (data) => process.stdout.write(data));
  serverProcess.stderr?.on('data', (data) => process.stderr.write(data));

  // Store the process for teardown
  globalThis.__SERVER_PROCESS__ = serverProcess;

  await waitForPortOpen(port, { host });

  globalThis.__TEARDOWN_MESSAGE__ = '\nTearing down...\n';
};
