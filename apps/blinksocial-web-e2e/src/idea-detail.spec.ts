import { test, expect } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/login';
import { mockHiveContent } from './helpers/content-mocks';

test.describe('Idea detail page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await mockHiveContent(page);
    await page.goto('/workspace/hive-collective/content');
    await expect(page.locator('app-pipeline-view')).toBeVisible();
  });

  test('clicking an Idea card navigates to the detail route and renders the layout', async ({ page }) => {
    const firstIdea = page.locator('.kanban-column').first().locator('.content-card').first();
    await firstIdea.click();
    await expect(page).toHaveURL(/\/workspace\/hive-collective\/content\/[^/]+$/);
    await expect(page.locator('app-idea-detail')).toBeVisible();
    await expect(page.locator('app-idea-detail-header')).toBeVisible();
    await expect(page.locator('app-content-journey')).toBeVisible();
  });

  test('Back button returns to the pipeline board', async ({ page }) => {
    await page.locator('.kanban-column').first().locator('.content-card').first().click();
    await expect(page.locator('app-idea-detail')).toBeVisible();
    await page.locator('.detail-back').click();
    await expect(page).toHaveURL(/\/workspace\/hive-collective\/content$/);
    await expect(page.locator('app-pipeline-view')).toBeVisible();
  });

  test('inline-editing the title commits the new value', async ({ page }) => {
    await page.locator('.kanban-column').first().locator('.content-card').first().click();
    await expect(page.locator('app-idea-detail')).toBeVisible();
    const titleDisplay = page.locator('app-idea-detail-header .detail-title').first();
    const originalText = (await titleDisplay.innerText()).trim();
    await titleDisplay.click();
    const input = page.locator('app-idea-detail-header input.inline-edit-input');
    const uniqueTitle = `E2E title ${Date.now()}`;
    await input.fill(uniqueTitle);
    await input.blur();
    await expect(titleDisplay).toContainText(uniqueTitle);
    expect(uniqueTitle).not.toBe(originalText);
  });

  test('Generate Concept Options reveals 6 option cards after loading', async ({ page }) => {
    await page.locator('.kanban-column').first().locator('.content-card').first().click();
    await expect(page.locator('app-concept-options-panel')).toBeVisible();
    await page.locator('app-concept-options-panel .btn-generate').click();
    await expect(page.locator('app-concept-options-panel .options-skeleton')).toHaveCount(6);
    await expect(page.locator('app-concept-option-card')).toHaveCount(6, { timeout: 10_000 });
  });

  test('Concept CTA navigates to the Concept detail page', async ({ page }) => {
    // Each content item has its own URL; advancing an idea navigates to the
    // newly-created concept's `/workspace/:id/content/:conceptId` URL and
    // swaps the idea-detail view for the concept-detail view.
    await page.locator('.kanban-column').first().locator('.content-card').first().click();
    await expect(page.locator('app-idea-detail')).toBeVisible();
    const ideaUrl = page.url();
    const advance = page.locator('app-idea-detail-header .btn-advance');
    await advance.click();
    await expect(page.locator('app-concept-detail')).toBeVisible();
    await expect(page.locator('app-idea-detail')).toHaveCount(0);
    // URL changed to a different content item under the same workspace
    await expect(page).toHaveURL(/\/workspace\/[^/]+\/content\/[^/]+$/);
    expect(page.url()).not.toBe(ideaUrl);
  });
});
