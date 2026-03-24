import { test, expect } from '@playwright/test';

test.describe('Header', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display brand icon with SVG', async ({ page }) => {
    const icon = page.locator('.brand-icon');
    await expect(icon).toBeVisible();
    await expect(icon.locator('svg')).toBeAttached();
  });

  test('should display "BLINK" brand text', async ({ page }) => {
    await expect(page.locator('.brand-text')).toHaveText('BLINK SOCIAL');
  });

  test('should display user name and role', async ({ page }) => {
    await expect(page.locator('.user-name')).toHaveText('Brett Lewis');
    await expect(page.locator('.user-role')).toHaveText('Admin');
  });

  test('should display avatar with "BL" initials', async ({ page }) => {
    await expect(page.locator('.avatar-placeholder')).toContainText('BL');
  });

  test('should show profile menu with logout when avatar is clicked', async ({ page }) => {
    await page.locator('.avatar-placeholder').click();
    await expect(page.locator('.profile-menu')).toBeVisible();
    await expect(page.locator('.profile-menu-item.logout')).toBeVisible();
  });
});
