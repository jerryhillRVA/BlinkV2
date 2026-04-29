import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

// Per-worktree port + URL resolution. See docs/worktrees.md for the agent
// port-band convention. Defaults preserve previous behavior (3000 / 4200).
const apiPort = process.env['API_PORT'] || '3000';
const webPort = process.env['WEB_PORT'] || '4200';
const baseURL = process.env['BASE_URL'] || `http://localhost:${webPort}`;
const apiBaseURL =
  process.env['API_BASE_URL'] || `http://localhost:${apiPort}`;
// reuseExistingServer used to default to true, which let one worktree's
// Playwright run silently bind to another worktree's running server and
// validate the wrong code. Default false; opt-in via E2E_REUSE_SERVER=true.
const reuseExistingServer = process.env['E2E_REUSE_SERVER'] === 'true';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  /* Use list reporter for CI/hooks; never auto-open the HTML report */
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  // Angular SSR dev server saturates under default worker count (half CPUs);
  // page.goto times out across browsers. 2 workers keeps the suite stable.
  workers: process.env['CI'] ? 1 : 2,
  // SSR routes can take >30s to first-paint under concurrent load.
  timeout: 60_000,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  /* Run your local dev servers before starting the tests */
  webServer: [
    {
      // The API reads PORT from env (NestJS bootstrap), not a --port flag.
      command: `npx nx run blinksocial-api:serve`,
      url: `${apiBaseURL}/api/health`,
      reuseExistingServer,
      timeout: 180_000,
      cwd: workspaceRoot,
      env: { ...process.env, PORT: apiPort } as Record<string, string>,
    },
    {
      command: `npx nx run blinksocial-web:serve --port=${webPort}`,
      url: baseURL,
      reuseExistingServer,
      timeout: 180_000,
      cwd: workspaceRoot,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Uncomment for mobile browsers support
    /* {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    }, */

    // Uncomment for branded browsers
    /* {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    } */
  ],
});
