import { test, expect } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/login';

test.describe('Content Page — type picker + drawer', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/workspace/hive-collective/content');
    await expect(page.locator('app-pipeline-view')).toBeVisible();
  });

  test('clicking New Content opens the type picker (drawer not yet visible)', async ({ page }) => {
    await page.locator('.btn-new-content').click();
    await expect(page.locator('app-content-type-picker .picker')).toBeVisible();
    await expect(page.locator('[data-testid="content-create-drawer"]')).toHaveCount(0);
  });

  test('picker shows three options with the correct labels', async ({ page }) => {
    await page.locator('.btn-new-content').click();
    const labels = page.locator('app-content-type-picker .picker-label');
    await expect(labels).toHaveCount(3);
    await expect(labels.nth(0)).toHaveText('Idea');
    await expect(labels.nth(1)).toHaveText('Concept');
    await expect(labels.nth(2)).toHaveText('Production Brief');
  });

  test('clicking outside the picker dismisses it without opening the drawer', async ({ page }) => {
    await page.locator('.btn-new-content').click();
    await expect(page.locator('app-content-type-picker .picker')).toBeVisible();
    await page.locator('.pipeline-card-header').click({ position: { x: 5, y: 5 } });
    await expect(page.locator('app-content-type-picker .picker')).toBeHidden();
    await expect(page.locator('[data-testid="content-create-drawer"]')).toHaveCount(0);
  });

  test('Esc dismisses the picker without opening the drawer', async ({ page }) => {
    await page.locator('.btn-new-content').click();
    await expect(page.locator('app-content-type-picker .picker')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('app-content-type-picker .picker')).toBeHidden();
    await expect(page.locator('[data-testid="content-create-drawer"]')).toHaveCount(0);
  });

  test('selecting Concept opens the drawer with type pre-set, locks body scroll', async ({ page }) => {
    await page.locator('.btn-new-content').click();
    await page.locator('[data-type="concept"]').click();
    const drawer = page.locator('[data-testid="content-create-drawer"]');
    await expect(drawer).toBeVisible();
    // Type dropdown reflects Concept.
    await expect(drawer.locator('app-dropdown').first()).toContainText('Concept');
    const overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).toBe('hidden');
  });

  test('Idea quick-add adds a card to the Ideas column', async ({ page }) => {
    await page.locator('.btn-new-content').click();
    await page.locator('[data-type="idea"]').click();
    const drawer = page.locator('[data-testid="content-create-drawer"]');
    await expect(drawer).toBeVisible();

    const saveBtn = drawer.locator('.btn-modal-secondary', { hasText: 'Save Idea' });
    await expect(saveBtn).toBeDisabled();

    const uniqueTitle = `E2E idea ${Date.now()}`;
    await page.locator('#idea-title').fill(uniqueTitle);
    await expect(saveBtn).toBeEnabled();

    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();
    await expect(drawer).toBeHidden({ timeout: 10_000 });

    const newCard = page.locator('.content-card', { hasText: uniqueTitle });
    await expect(newCard).toBeVisible({ timeout: 10_000 });
  });

  test('Esc dismisses the drawer', async ({ page }) => {
    await page.locator('.btn-new-content').click();
    await page.locator('[data-type="idea"]').click();
    await expect(page.locator('[data-testid="content-create-drawer"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="content-create-drawer"]')).toBeHidden();
  });

  test('X button dismisses the drawer', async ({ page }) => {
    await page.locator('.btn-new-content').click();
    await page.locator('[data-type="idea"]').click();
    await expect(page.locator('[data-testid="content-create-drawer"]')).toBeVisible();
    await page.locator('.drawer-close').click();
    await expect(page.locator('[data-testid="content-create-drawer"]')).toBeHidden();
  });

  test('Production Brief drawer shows Draft Assets + Save Brief in footer', async ({ page }) => {
    await page.locator('.btn-new-content').click();
    await page.locator('[data-type="production-brief"]').click();
    const drawer = page.locator('[data-testid="content-create-drawer"]');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('button', { name: /Save Brief/i })).toBeVisible();
    await expect(drawer.getByRole('button', { name: /Draft Assets/i })).toBeVisible();
  });

  test('column rename: "Posts in Production" absent, "Post Builder" present', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Post Builder/ })).toBeVisible();
    await expect(page.getByText('Posts in Production')).toHaveCount(0);
  });
});
