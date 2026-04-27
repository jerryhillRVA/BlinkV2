import { test, expect, type Page } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/login';
import { mockHiveContent } from './helpers/content-mocks';

async function openFirstConceptCard(page: Page): Promise<void> {
  const firstCard = page.locator('.kanban-column').nth(1).locator('.content-card').first();
  await expect(firstCard).toBeVisible();
  await firstCard.click();
  await expect(page).toHaveURL(/\/workspace\/hive-collective\/content\/[^/]+$/);
  await expect(page.locator('app-concept-detail')).toBeVisible();
}

test.describe('Concept detail page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await mockHiveContent(page);
    await page.goto('/workspace/hive-collective/content');
    await expect(page.locator('app-pipeline-view')).toBeVisible();
  });

  test('clicking a Concept card routes to the detail URL and renders header + key panels', async ({ page }) => {
    await openFirstConceptCard(page);
    await expect(page).toHaveURL(/\/workspace\/hive-collective\/content\/[^/]+$/);
    await expect(page.locator('app-concept-detail-header')).toBeVisible();
    await expect(page.locator('app-production-targets-picker')).toBeVisible();
    await expect(page.locator('app-content-journey')).toBeVisible();
  });

  test('Move to Production CTA enables after required fields are valid', async ({ page }) => {
    await openFirstConceptCard(page);
    const cta = page.locator('app-concept-detail-header .btn-advance');
    await expect(cta).toBeEnabled();
    await cta.click();
    await expect(page.locator('.move-dialog')).toBeVisible();
  });

  test('dialog "Add all to Production Queue" returns to the pipeline board', async ({ page }) => {
    await openFirstConceptCard(page);
    await page.locator('app-concept-detail-header .btn-advance').click();
    const dialog = page.locator('.move-dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /Add all to Production Queue/i }).click();
    await expect(page).toHaveURL(/\/workspace\/hive-collective\/content$/);
    await expect(page.locator('app-pipeline-view')).toBeVisible();
  });

  test('dialog "Add all" retains the concept card in the Concepts column', async ({ page }) => {
    await openFirstConceptCard(page);
    const conceptTitle = (
      await page.locator('app-concept-detail-header .detail-title').first().innerText()
    ).trim();
    await page.locator('app-concept-detail-header .btn-advance').click();
    const dialog = page.locator('.move-dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /Add all to Production Queue/i }).click();
    await expect(page).toHaveURL(/\/workspace\/hive-collective\/content$/);
    const conceptsColumn = page.locator('.kanban-column').nth(1);
    await expect(conceptsColumn.locator('.content-card', { hasText: conceptTitle })).toBeVisible();
  });

  test('dialog "Work on one" navigates to the created post URL', async ({ page }) => {
    await openFirstConceptCard(page);
    const detailUrl = page.url();
    await page.locator('app-concept-detail-header .btn-advance').click();
    const dialog = page.locator('.move-dialog');
    const workBtn = dialog.getByRole('button', { name: /^Produce / }).first();
    await workBtn.click();
    await expect(page).toHaveURL(/\/workspace\/hive-collective\/content\/[^/]+$/);
    expect(page.url()).not.toBe(detailUrl);
  });

  test('Back button returns to the pipeline board', async ({ page }) => {
    await openFirstConceptCard(page);
    await page.locator('app-concept-detail-header .detail-back').click();
    await expect(page).toHaveURL(/\/workspace\/hive-collective\/content$/);
  });

  test('Send back to Idea demotes the concept to the Ideas column', async ({ page }) => {
    await openFirstConceptCard(page);
    await page.locator('app-concept-detail-header .detail-menu-btn').click();
    await page.getByRole('menuitem', { name: 'Send back to Idea' }).click();
    await expect(page.locator('app-idea-detail')).toBeVisible();
  });
});
