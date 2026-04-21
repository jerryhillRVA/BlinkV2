import { test, expect, type Page } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/login';

async function openFirstInProductionCard(page: Page): Promise<void> {
  const firstCard = page.locator('.kanban-column').nth(2).locator('.content-card').first();
  await expect(firstCard).toBeVisible();
  await firstCard.click();
  await expect(page).toHaveURL(/\/workspace\/hive-collective\/content\/[^/]+$/);
  await expect(page.locator('app-post-detail')).toBeVisible();
}

test.describe('Post detail page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/workspace/hive-collective/content');
    await expect(page.locator('app-pipeline-view')).toBeVisible();
  });

  test('clicking an In-Production card lands on /content/<id> with Brief active', async ({ page }) => {
    await openFirstInProductionCard(page);
    await expect(page).toHaveURL(/\/workspace\/hive-collective\/content\/[^/]+$/);
    await expect(page.locator('app-post-detail-header')).toBeVisible();
    await expect(page.locator('app-production-steps-bar')).toBeVisible();
    await expect(page.locator('app-brief-step')).toBeVisible();
    await expect(page.locator('app-brief-status-sidebar')).toBeVisible();
  });

  test('stepper navigates between Brief / Builder / Packaging / QA', async ({ page }) => {
    await openFirstInProductionCard(page);
    const buttons = page.locator('app-production-steps-bar .steps-btn');
    await buttons.nth(1).click();
    await expect(page.locator('app-step-placeholder')).toBeVisible();
    await expect(page.locator('app-brief-step')).toHaveCount(0);
    await buttons.nth(2).click();
    await expect(page.locator('app-step-placeholder')).toBeVisible();
    await buttons.nth(3).click();
    await expect(page.locator('app-step-placeholder')).toBeVisible();
    await buttons.nth(0).click();
    await expect(page.locator('app-brief-step')).toBeVisible();
  });

  test('Back button returns to the pipeline board', async ({ page }) => {
    await openFirstInProductionCard(page);
    await page.locator('app-post-detail-header .detail-back').click();
    await expect(page).toHaveURL(/\/workspace\/hive-collective\/content$/);
  });

  test('"Back to Concept" navigates to the linked concept when conceptId is set', async ({ page }) => {
    await openFirstInProductionCard(page);
    const link = page.locator('app-post-detail-header .btn-back-to-concept');
    if ((await link.count()) === 0) {
      test.skip();
      return;
    }
    await link.click();
    await expect(page.locator('app-concept-detail')).toBeVisible();
  });

  test('approving the brief locks edits and sidebar shows the approved state', async ({ page }) => {
    await openFirstInProductionCard(page);
    const toggle = page.locator('app-brief-status-sidebar .approve-toggle');
    await expect(toggle).toBeVisible();
    if ((await page.locator('app-brief-status-sidebar .approve-toggle input:disabled').count()) > 0) {
      test.skip();
      return;
    }
    await toggle.click();
    await expect(page.locator('app-brief-status-sidebar .status-badge.is-approved')).toBeVisible();
    const titleDisplay = page.locator('app-brief-step .brief-title').first();
    await titleDisplay.click();
    await expect(
      page.locator('app-brief-step input.brief-title-input'),
    ).toHaveCount(0);
  });

  test('unlock re-enables edits', async ({ page }) => {
    await openFirstInProductionCard(page);
    const toggle = page.locator('app-brief-status-sidebar .approve-toggle');
    await expect(toggle).toBeVisible();
    if ((await page.locator('app-brief-status-sidebar .approve-toggle input:disabled').count()) > 0) {
      test.skip();
      return;
    }
    await toggle.click();
    await expect(page.locator('app-brief-status-sidebar .status-badge.is-approved')).toBeVisible();
    await page.locator('app-brief-status-sidebar .btn-unlock').click();
    await expect(page.locator('app-brief-status-sidebar .status-badge.is-approved')).toHaveCount(0);
  });
});
