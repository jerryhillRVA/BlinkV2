import { test, expect } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/login';

test.describe('Footer', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/');
  });

  test('should display copyright text', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toContainText('2026 Blink Social');
    await expect(footer).toContainText('All rights reserved');
  });

  test('should be visible', async ({ page }) => {
    await expect(page.locator('footer')).toBeVisible();
  });
});
