import { test, expect } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/login';

test.describe('Theme', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('blink-theme'));
  });

  test('should default to data-theme="light"', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('should have a theme toggle button in the header', async ({ page }) => {
    await expect(page.locator('.theme-toggle-btn')).toBeVisible();
  });

  test('should switch to dark on toggle click, then back to light', async ({ page }) => {
    const toggle = page.locator('.theme-toggle-btn');

    // Click to switch to dark
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Click again to switch back to light
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('should change body background in dark mode', async ({ page }) => {
    const body = page.locator('body');
    const lightBg = await body.evaluate((el) => getComputedStyle(el).backgroundColor);

    await page.locator('.theme-toggle-btn').click();
    const darkBg = await body.evaluate((el) => getComputedStyle(el).backgroundColor);

    expect(lightBg).not.toBe(darkBg);
  });

  test('should persist theme across reload', async ({ page }) => {
    // Switch to dark
    await page.locator('.theme-toggle-btn').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Reload and verify dark persists
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});
