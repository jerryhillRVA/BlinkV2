import { test, expect } from '@playwright/test';

test.describe('New Workspace Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to wizard when "New Workspace" card is clicked', async ({ page }) => {
    await page.locator('.card-new').click();
    await expect(page).toHaveURL('/new-workspace');
  });
});

test.describe('New Workspace Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/new-workspace');
  });

  test('should show step indicator with 5 steps', async ({ page }) => {
    const circles = page.locator('.step-circle');
    await expect(circles).toHaveCount(5);
  });

  test('should default to step 1 (Workspace)', async ({ page }) => {
    const active = page.locator('.step-active');
    await expect(active).toHaveCount(1);
    await expect(active).toContainText('1');
  });

  test('should show "Back to Home" button', async ({ page }) => {
    await expect(page.locator('.back-home')).toContainText('Back to Home');
  });

  test('should show page title', async ({ page }) => {
    await expect(page.locator('.page-title')).toHaveText('Setup Your Workspace');
  });

  test('should advance to step 2 when Next is clicked', async ({ page }) => {
    await page.locator('.wizard-next').click();
    const active = page.locator('.step-active');
    await expect(active).toContainText('2');
  });

  test('should return to step 1 when Back is clicked after advancing', async ({ page }) => {
    await page.locator('.wizard-next').click();
    await page.locator('.wizard-back').click();
    const active = page.locator('.step-active');
    await expect(active).toContainText('1');
  });

  test('should navigate to dashboard when "Back to Home" is clicked', async ({ page }) => {
    await page.locator('.back-home').click();
    await expect(page).toHaveURL('/');
  });

  test('should show "Finish & Launch" on step 5 and navigate to dashboard', async ({ page }) => {
    // Mock the API since the backend isn't running during e2e tests
    await page.route('**/api/workspaces', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'e2e-test-id',
          workspaceName: 'E2E Test Workspace',
          status: 'active',
          createdAt: new Date().toISOString(),
        }),
      })
    );

    // Fill in required workspace name before advancing
    await page.locator('#workspace-name').fill('E2E Test Workspace');

    // Navigate to step 5
    for (let i = 0; i < 4; i++) {
      await page.locator('.wizard-next').click();
    }
    await expect(page.locator('.wizard-next')).toContainText('Finish & Launch');
    await page.locator('.wizard-next').click();
    await expect(page).toHaveURL('/');
  });
});
