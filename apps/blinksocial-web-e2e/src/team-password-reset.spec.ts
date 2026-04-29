import { test, expect, type Page } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/login';

const mockGeneralSettings = {
  workspaceName: 'Hive Collective',
  purpose: 'Content creation',
  mission: 'Grow audience',
  timezone: 'America/New_York',
  language: 'en',
  brandColor: '#d94e33',
  logoUrl: '',
  website: 'https://hive.co',
  contactEmail: 'hello@hive.co',
};

const teamWithMaya = {
  members: [
    { id: 'e2e-admin-id', name: 'Blink Admin', email: 'blinkadmin@blinksocial.com', role: 'Admin', status: 'active' },
    { id: 'u2', name: 'Maya Rodriguez', email: 'maya@hive.co', role: 'Viewer', status: 'active' },
  ],
};

async function setupTeamTab(page: Page, teamPayload: object = teamWithMaya): Promise<void> {
  await page.route('**/api/workspaces/hive-collective/settings/general', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockGeneralSettings),
    }),
  );
  await page.route('**/api/workspaces/hive-collective/settings/team', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(teamPayload),
    }),
  );
}

test.describe('Admin password reset (Teams tab)', () => {
  test('admin resets a teammate\'s password and sees the temp-password banner', async ({ page }) => {
    await mockAuthenticatedUser(page);
    await setupTeamTab(page);

    let resetPostBody: unknown = null;
    await page.route(
      '**/api/account/hive-collective/users/u2/password-reset',
      async (route) => {
        resetPostBody = route.request().postDataJSON?.() ?? route.request().postData();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'u2',
              email: 'maya@hive.co',
              displayName: 'Maya Rodriguez',
              workspaces: [{ workspaceId: 'hive-collective', role: 'Viewer' }],
            },
            temporaryPassword: 'rotatedPw',
            message: 'Password reset',
          }),
        });
      },
    );

    await page.goto('/workspace/hive-collective/settings');
    await page.locator('.tab-button', { hasText: 'Team' }).click();

    // Reset button should appear on Maya's row only, not on the bootstrap admin row
    const mayaResetBtn = page.locator(
      '.member-reset-btn[data-member-id="u2"]',
    );
    await expect(mayaResetBtn).toBeVisible();
    await expect(
      page.locator('.member-reset-btn[data-member-id="e2e-admin-id"]'),
    ).toHaveCount(0);

    await mayaResetBtn.click();
    await expect(page.locator('.confirm-modal')).toBeVisible();
    await expect(page.locator('.confirm-modal-body')).toContainText(
      'maya@hive.co',
    );

    await page.locator('.confirm-modal-confirm').click();

    // Banner shows the rotated password and the target email
    const banner = page.locator('.temp-password-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('maya@hive.co');
    await expect(banner.locator('.temp-password-code')).toHaveText('rotatedPw');

    // Sanity: the dialog is gone, and the request body was empty
    await expect(page.locator('.confirm-modal')).toHaveCount(0);
    expect(resetPostBody === null || resetPostBody === '' || (typeof resetPostBody === 'object' && Object.keys(resetPostBody as object).length === 0)).toBe(true);
  });

  test('Cancel closes the dialog without firing the reset request', async ({ page }) => {
    await mockAuthenticatedUser(page);
    await setupTeamTab(page);

    let requested = false;
    await page.route(
      '**/api/account/hive-collective/users/u2/password-reset',
      async (route) => {
        requested = true;
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      },
    );

    await page.goto('/workspace/hive-collective/settings');
    await page.locator('.tab-button', { hasText: 'Team' }).click();
    await page.locator('.member-reset-btn[data-member-id="u2"]').click();
    await expect(page.locator('.confirm-modal')).toBeVisible();
    await page.locator('.confirm-modal-cancel').click();
    await expect(page.locator('.confirm-modal')).toHaveCount(0);
    expect(requested).toBe(false);
  });

  test('shows the server error inline when the request fails', async ({ page }) => {
    await mockAuthenticatedUser(page);
    await setupTeamTab(page);

    await page.route(
      '**/api/account/hive-collective/users/u2/password-reset',
      (route) =>
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: "Cannot reset bootstrap admin's password" }),
        }),
    );

    await page.goto('/workspace/hive-collective/settings');
    await page.locator('.tab-button', { hasText: 'Team' }).click();
    await page.locator('.member-reset-btn[data-member-id="u2"]').click();
    await page.locator('.confirm-modal-confirm').click();

    await expect(page.locator('.confirm-modal-error')).toContainText(
      "Cannot reset bootstrap admin's password",
    );
    await expect(page.locator('.confirm-modal')).toBeVisible();
    await expect(page.locator('.temp-password-banner')).toHaveCount(0);
  });

  test('reset button is hidden on the bootstrap admin row even when other admin rows exist', async ({ page }) => {
    await mockAuthenticatedUser(page);
    await setupTeamTab(page, {
      members: [
        { id: 'e2e-admin-id', name: 'Blink Admin', email: 'blinkadmin@blinksocial.com', role: 'Admin', status: 'active' },
        { id: 'u3', name: 'Co Admin', email: 'co@hive.co', role: 'Admin', status: 'active' },
      ],
    });

    await page.goto('/workspace/hive-collective/settings');
    await page.locator('.tab-button', { hasText: 'Team' }).click();

    // Bootstrap row: hidden. Self row: also hidden (the bootstrap admin is also the
    // current user in this fixture). Co-admin row: should show the button.
    await expect(
      page.locator('.member-reset-btn[data-member-id="u3"]'),
    ).toBeVisible();
    await expect(
      page.locator('.member-reset-btn[data-member-id="e2e-admin-id"]'),
    ).toHaveCount(0);
  });
});
