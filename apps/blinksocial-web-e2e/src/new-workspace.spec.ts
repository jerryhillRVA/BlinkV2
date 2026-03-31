import { test, expect } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/login';

test.describe('New Workspace Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.route('**/api/workspaces', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          workspaces: [
            { id: 'hive-collective', name: 'Hive Collective', color: '#d94e33', status: 'active', createdAt: '2026-01-15T10:00:00Z' },
          ],
        }),
      })
    );
    await page.goto('/');
  });

  test('should navigate to wizard when "Use the setup wizard" is clicked', async ({ page }) => {
    await page.locator('.action-wizard').click();
    await expect(page).toHaveURL('/new-workspace');
  });
});

/** Helper: fill required fields and advance through validated steps to reach a target step. */
async function advanceToStep(page: import('@playwright/test').Page, targetStep: number) {
  // Step 1 → 2: requires workspace name
  if (targetStep > 1) {
    await page.locator('#workspace-name').fill('E2E Test Workspace');
    await page.locator('.wizard-next').click();
  }
  // Step 2 → 3: requires an objective statement
  if (targetStep > 2) {
    await page.locator('.objective-card .field-input').first().fill('Grow followers to 10k');
    await page.locator('.wizard-next').click();
  }
  // Steps 3→4, 4→5 need segment name on step 4
  if (targetStep > 3) {
    // Step 3 (Brand) has no required fields
    await page.locator('.wizard-next').click();
  }
  if (targetStep > 4) {
    // Step 4 (Audience) requires a segment name
    await page.locator('.segment-input').first().fill('Founders');
    await page.locator('.wizard-next').click();
  }
  // Steps 5→6, 6→7 have no required fields
  for (let i = 5; i < targetStep; i++) {
    await page.locator('.wizard-next').click();
  }
}

test.describe('New Workspace Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    // Mock the workspace list so dashboard loads don't show stale server data
    await page.route('**/api/workspaces', (route, request) => {
      if (request.method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ workspaces: [] }),
        });
      }
      return route.continue();
    });
    await page.goto('/new-workspace');
    // Wait for Angular hydration to complete before interacting
    await page.locator('#workspace-name').waitFor({ state: 'attached' });
    await page.waitForFunction(() => !document.querySelector('[ngh]'));
  });

  test('should show step indicator with 7 steps', async ({ page }) => {
    const circles = page.locator('.step-circle');
    await expect(circles).toHaveCount(7);
  });

  test('should default to step 1 (Foundation)', async ({ page }) => {
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

  test('should not advance from step 1 without workspace name', async ({ page }) => {
    await page.locator('.wizard-next').click();
    const active = page.locator('.step-active');
    await expect(active).toContainText('1');
    const toast = page.locator('.mat-mdc-snack-bar-container');
    await expect(toast).toBeVisible();
  });

  test('should advance to step 2 when Next is clicked with valid name', async ({ page }) => {
    await page.locator('#workspace-name').fill('Test Workspace');
    await page.locator('.wizard-next').click();
    const active = page.locator('.step-active');
    await expect(active).toContainText('2');
  });

  test('should not advance from step 2 without an objective statement', async ({ page }) => {
    await advanceToStep(page, 2);
    await page.locator('.wizard-next').click();
    const active = page.locator('.step-active');
    await expect(active).toContainText('2');
    const toast = page.locator('.mat-mdc-snack-bar-container');
    await expect(toast).toBeVisible();
  });

  test('should not advance from step 4 without a segment name', async ({ page }) => {
    await advanceToStep(page, 4);
    await page.locator('.wizard-next').click();
    const active = page.locator('.step-active');
    await expect(active).toContainText('4');
    const toast = page.locator('.mat-mdc-snack-bar-container');
    await expect(toast).toBeVisible();
  });

  test('should return to step 1 when Back is clicked after advancing', async ({ page }) => {
    await page.locator('#workspace-name').fill('Test Workspace');
    await page.locator('.wizard-next').click();
    await page.locator('.wizard-back').click();
    const active = page.locator('.step-active');
    await expect(active).toContainText('1');
  });

  test('should allow Back from step 7 to step 6', async ({ page }) => {
    await advanceToStep(page, 7);
    const active7 = page.locator('.step-active');
    await expect(active7).toContainText('7');
    await page.locator('.wizard-back').click();
    const active6 = page.locator('.step-active');
    await expect(active6).toContainText('6');
  });

  test('should navigate to dashboard when "Back to Home" is clicked', async ({ page }) => {
    await page.locator('.back-home').click();
    await expect(page).toHaveURL('/');
  });

  test('should show "Finish" on step 7 and navigate to dashboard', async ({ page }) => {
    // Override route to handle both POST (create) and GET (list after redirect)
    await page.unroute('**/api/workspaces');
    await page.route('**/api/workspaces', (route, request) => {
      if (request.method() === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'e2e-test-id',
            workspaceName: 'E2E Test Workspace',
            status: 'active',
            createdAt: new Date().toISOString(),
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ workspaces: [] }),
      });
    });

    await advanceToStep(page, 7);
    await expect(page.locator('.wizard-next')).toContainText('Finish');
    await page.locator('.wizard-next').click();
    await expect(page).toHaveURL('/');
  });

  test('should show toast error when API returns validation error', async ({ page }) => {
    await page.unroute('**/api/workspaces');
    await page.route('**/api/workspaces', (route, request) => {
      if (request.method() === 'POST') {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Validation failed' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ workspaces: [] }),
      });
    });

    await advanceToStep(page, 7);
    await page.locator('.wizard-next').click();

    const toast = page.locator('.mat-mdc-snack-bar-container');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Validation failed');
  });
});
