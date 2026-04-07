import { test, expect } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/login';

test.describe('Strategy & Research Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/workspace/hive-collective/strategy');
  });

  test('should display the strategy page layout', async ({ page }) => {
    await expect(page.locator('.strategy-page')).toBeVisible();
    await expect(page.locator('.strategy-sidebar')).toBeVisible();
    await expect(page.locator('.strategy-content')).toBeVisible();
  });

  test('should display sidebar with 3 sections', async ({ page }) => {
    const sectionLabels = page.locator('.sidebar-section-label');
    await expect(sectionLabels).toHaveCount(3);
    await expect(sectionLabels.nth(0)).toContainText('Strategy');
    await expect(sectionLabels.nth(1)).toContainText('Research');
    await expect(sectionLabels.nth(2)).toContainText('Content Tools');
  });

  test('should display 11 sidebar navigation items', async ({ page }) => {
    const items = page.locator('.sidebar-item');
    await expect(items).toHaveCount(11);
  });

  test('should highlight Brand Voice as default active view', async ({ page }) => {
    const activeItem = page.locator('.sidebar-item.active');
    await expect(activeItem).toContainText('Brand Voice & Tone');
  });

  test('should display objectives strip', async ({ page }) => {
    await expect(page.locator('app-objectives-strip')).toBeVisible();
  });

  test('should switch views when clicking sidebar items', async ({ page }) => {
    await page.locator('.sidebar-item', { hasText: 'Strategic Pillars' }).click();
    await expect(page.locator('app-strategic-pillars')).toBeVisible();

    await page.locator('.sidebar-item', { hasText: 'Audience' }).click();
    await expect(page.locator('app-audience')).toBeVisible();

    await page.locator('.sidebar-item', { hasText: 'SEO & Hashtags' }).click();
    await expect(page.locator('app-seo-hashtags')).toBeVisible();
  });

  test('should update active sidebar highlight on navigation', async ({ page }) => {
    await page.locator('.sidebar-item', { hasText: 'Channel Strategy' }).click();
    const activeItem = page.locator('.sidebar-item.active');
    await expect(activeItem).toContainText('Channel Strategy');
  });
});
