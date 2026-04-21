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

  test('should display sidebar with 4 sections', async ({ page }) => {
    const sectionLabels = page.locator('.sidebar-section-label');
    await expect(sectionLabels).toHaveCount(4);
    await expect(sectionLabels.nth(0)).toContainText('Strategy');
    await expect(sectionLabels.nth(1)).toContainText('Research');
    await expect(sectionLabels.nth(2)).toContainText('Content Tools');
    await expect(sectionLabels.nth(3)).toContainText('Influencer');
  });

  test('should display 12 sidebar navigation items', async ({ page }) => {
    const items = page.locator('.sidebar-item');
    await expect(items).toHaveCount(12);
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

  test('should open Influencer Marketing with Discovery tab by default', async ({ page }) => {
    await page.locator('.sidebar-item', { hasText: 'Influencer Marketing' }).click();
    await expect(page.locator('app-influencer-marketing')).toBeVisible();
    await expect(page.locator('app-influencer-discovery-tab')).toBeVisible();
    const activeTab = page.locator('.influencer-marketing__tab.influencer-marketing__tab--active');
    await expect(activeTab).toContainText('Discovery');
  });

  test('should switch between Influencer Marketing sub-tabs', async ({ page }) => {
    await page.locator('.sidebar-item', { hasText: 'Influencer Marketing' }).click();
    await page.locator('.influencer-marketing__tab', { hasText: 'Shortlist' }).click();
    await expect(page.locator('app-influencer-shortlist-tab')).toBeVisible();
    await page.locator('.influencer-marketing__tab', { hasText: 'Campaigns' }).click();
    await expect(page.locator('app-influencer-campaigns-tab')).toBeVisible();
  });

  test('should render Discovery context strip and Find Influencers controls', async ({ page }) => {
    await page.locator('.sidebar-item', { hasText: 'Influencer Marketing' }).click();
    await expect(page.locator('.discovery__context')).toContainText('Matching against');
    await expect(page.locator('.discovery__context')).toContainText('objectives');
    await expect(page.locator('.discovery__context')).toContainText('pillars');
    await expect(page.locator('.discovery__find')).toContainText('Find Influencers');
    await expect(page.locator('.discovery__empty-title')).toContainText('Find influencers matched to your strategy');
  });

  test('should show empty state on Shortlist tab when no influencers added', async ({ page }) => {
    await page.locator('.sidebar-item', { hasText: 'Influencer Marketing' }).click();
    await page.locator('.influencer-marketing__tab', { hasText: 'Shortlist' }).click();
    await expect(page.locator('.shortlist__empty-title')).toContainText('No influencers shortlisted yet');
  });

  test('should show empty state on Campaigns tab when none tracked', async ({ page }) => {
    await page.locator('.sidebar-item', { hasText: 'Influencer Marketing' }).click();
    await page.locator('.influencer-marketing__tab', { hasText: 'Campaigns' }).click();
    await expect(page.locator('.campaigns__empty-title')).toContainText('No campaigns tracked yet');
    await expect(page.locator('.campaigns__add-btn')).toContainText('Track Campaign');
  });
});
