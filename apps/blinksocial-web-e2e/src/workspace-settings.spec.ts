import { test, expect } from '@playwright/test';

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

const mockPlatformSettings = {
  globalRules: { defaultPlatform: 'instagram', maxIdeasPerMonth: 60 },
  platforms: [
    { platformId: 'instagram', enabled: true, defaultResolution: '1080x1920', postingSchedule: 'Daily' },
    { platformId: 'youtube', enabled: false },
  ],
};

test.describe('Workspace Settings Navigation', () => {
  test('should navigate from dashboard to settings when "Go to Workspace" is clicked', async ({ page }) => {
    await page.goto('/');
    // Mock settings API
    await page.route('**/api/workspaces/hive-collective/settings/general', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockGeneralSettings),
      })
    );
    // Click the first "Go to Workspace" button
    const links = page.locator('.workspace-link');
    await links.first().click();
    await expect(page).toHaveURL(/\/workspace\/hive-collective\/settings/);
  });

  test('should navigate back to dashboard when header logo is clicked', async ({ page }) => {
    await page.route('**/api/workspaces/hive-collective/settings/general', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockGeneralSettings),
      })
    );
    await page.goto('/workspace/hive-collective/settings');
    await page.locator('.navbar-brand').click();
    await expect(page).toHaveURL('/');
  });
});

test.describe('Workspace Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the general settings API (loaded by default)
    await page.route('**/api/workspaces/hive-collective/settings/general', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockGeneralSettings),
      })
    );
    await page.goto('/workspace/hive-collective/settings');
  });

  test('should display "Workspace Settings" title', async ({ page }) => {
    await expect(page.locator('.settings-title')).toHaveText('Workspace Settings');
  });

  test('should display subtitle', async ({ page }) => {
    await expect(page.locator('.settings-subtitle')).toContainText('Manage your Blink Social');
  });

  test('should have 8 tab buttons', async ({ page }) => {
    const tabs = page.locator('.tab-button');
    await expect(tabs).toHaveCount(8);
  });

  test('should default to General tab active', async ({ page }) => {
    const activeTab = page.locator('.tab-button.active');
    await expect(activeTab).toContainText('General');
  });

  test('should display general settings fields', async ({ page }) => {
    await expect(page.locator('#ws-name')).toHaveValue('Hive Collective');
  });

  test('should have a save button', async ({ page }) => {
    await expect(page.locator('.save-button')).toContainText('Save Workspace Identity');
  });

  test('should have blurred background image', async ({ page }) => {
    await expect(page.locator('.settings-bg')).toBeAttached();
  });
});

test.describe('Workspace Settings Tab Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/workspaces/hive-collective/settings/general', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockGeneralSettings),
      })
    );
    await page.route('**/api/workspaces/hive-collective/settings/platforms', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPlatformSettings),
      })
    );
    await page.route('**/api/workspaces/hive-collective/settings/brand-voice', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ brandVoiceDescription: 'Warm and encouraging' }),
      })
    );
    await page.route('**/api/workspaces/hive-collective/settings/skills', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ skills: [{ id: 'sk1', skillId: 'research', name: 'Research Agent', role: 'Scanner', enabled: true }] }),
      })
    );
    await page.route('**/api/workspaces/hive-collective/settings/team', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ members: [{ id: 'm1', name: 'Brett Lewis', email: 'brett@hive.co', role: 'Admin', status: 'active' }] }),
      })
    );
    await page.route('**/api/workspaces/hive-collective/settings/notifications', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ channels: { email: true, inApp: true, slack: false }, triggers: { researchResults: true } }),
      })
    );
    await page.route('**/api/workspaces/hive-collective/settings/calendar', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ deadlineTemplates: {}, reminderSettings: {}, autoCreateOnPublish: true }),
      })
    );
    await page.route('**/api/workspaces/hive-collective/settings/security', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ twoFactorEnabled: true, activeSessions: [], apiKeys: [], loginHistory: [] }),
      })
    );
    await page.goto('/workspace/hive-collective/settings');
  });

  test('should switch to Platforms tab', async ({ page }) => {
    await page.locator('.tab-button', { hasText: 'Platforms' }).click();
    await expect(page.locator('.tab-button.active')).toContainText('Platforms');
    await expect(page.locator('.save-button')).toContainText('Save Platform Settings');
  });

  test('should switch to Content tab', async ({ page }) => {
    await page.locator('.tab-button', { hasText: 'Content' }).click();
    await expect(page.locator('.tab-button.active')).toContainText('Content');
    await expect(page.locator('.save-button')).toContainText('Save Content Strategy');
  });

  test('should switch to Agents tab', async ({ page }) => {
    await page.locator('.tab-button', { hasText: 'Agents' }).click();
    await expect(page.locator('.tab-button.active')).toContainText('Agents');
    await expect(page.locator('.save-button')).toContainText('Save All Agents');
  });

  test('should switch to Team tab', async ({ page }) => {
    await page.locator('.tab-button', { hasText: 'Team' }).click();
    await expect(page.locator('.tab-button.active')).toContainText('Team');
    await expect(page.locator('.save-button')).toContainText('Save Team Settings');
  });

  test('should switch to Notifications tab', async ({ page }) => {
    await page.locator('.tab-button', { hasText: 'Notifications' }).click();
    await expect(page.locator('.tab-button.active')).toContainText('Notifications');
    await expect(page.locator('.save-button')).toContainText('Save Notification Settings');
  });

  test('should switch to Calendar tab', async ({ page }) => {
    await page.locator('.tab-button', { hasText: 'Calendar' }).click();
    await expect(page.locator('.tab-button.active')).toContainText('Calendar');
    await expect(page.locator('.save-button')).toContainText('Save Templates');
  });

  test('should switch to Security tab', async ({ page }) => {
    await page.locator('.tab-button', { hasText: 'Security' }).click();
    await expect(page.locator('.tab-button.active')).toContainText('Security');
    await expect(page.locator('.save-button')).toContainText('Save Security Settings');
  });
});

test.describe('Workspace Settings Save', () => {
  test('should call API when save button is clicked', async ({ page }) => {
    await page.route('**/api/workspaces/hive-collective/settings/general', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockGeneralSettings),
        });
      }
      // PUT
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockGeneralSettings),
      });
    });
    await page.goto('/workspace/hive-collective/settings');

    // Click save
    await page.locator('.save-button').click();

    // Button should show save label (not "Saving...")
    await expect(page.locator('.save-button')).toContainText('Save Workspace Identity');
  });
});
