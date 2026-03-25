import type { Page } from '@playwright/test';

/**
 * Mock the auth status API to return an authenticated admin user.
 * This must be called BEFORE any page.goto() so the route intercept
 * is active when Angular checks auth status on page load.
 */
export const mockAuthenticatedUser = async (page: Page) => {
  await page.route('**/api/auth/status', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        authenticated: true,
        needsBootstrap: false,
        user: {
          id: 'e2e-admin-id',
          email: 'blinkadmin@blinksocial.com',
          displayName: 'Blink Admin',
          workspaces: [
            { workspaceId: 'hive-collective', role: 'Admin' },
            { workspaceId: 'booze-kills', role: 'Admin' },
          ],
        },
      }),
    }),
  );
};
