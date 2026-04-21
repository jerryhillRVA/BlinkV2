import { test, expect } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/login';

test.describe('Content Page — New Content modal', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/workspace/hive-collective/content');
    await expect(page.locator('app-pipeline-view')).toBeVisible();
  });

  test('clicking New Content opens the modal and locks body scroll', async ({ page }) => {
    await page.locator('.btn-new-content').click();
    await expect(page.locator('app-content-create-modal')).toBeAttached();
    await expect(page.locator('.content-create-dialog')).toBeVisible();
    const overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).toBe('hidden');
  });

  test('Idea quick-add: entering a title enables Save Idea and adds a card', async ({ page }) => {
    await page.locator('.btn-new-content').click();
    await expect(page.locator('.content-create-dialog')).toBeVisible();

    // Save Idea is the secondary footer button; Create Concept is the primary.
    const saveBtn = page.locator('.content-create-dialog .btn-modal-secondary', {
      hasText: 'Save Idea',
    });
    await expect(saveBtn).toBeDisabled();

    const uniqueTitle = `E2E idea ${Date.now()}`;
    await page.locator('#idea-title').fill(uniqueTitle);
    await expect(saveBtn).toBeEnabled();

    await saveBtn.click({ force: true });
    await expect(page.locator('.content-create-dialog')).toBeHidden({ timeout: 10_000 });

    const newCard = page.locator('.content-card', { hasText: uniqueTitle });
    await expect(newCard).toBeVisible({ timeout: 10_000 });
  });

  test('Cancel button closes the modal without saving', async ({ page }) => {
    await page.locator('.btn-new-content').click();
    await page.locator('.btn-modal-cancel').click();
    await expect(page.locator('.content-create-dialog')).toBeHidden();
  });

  test('Backdrop click closes the modal', async ({ page }) => {
    await page.locator('.btn-new-content').click();
    await page.locator('.content-create-overlay').click({ position: { x: 5, y: 5 } });
    await expect(page.locator('.content-create-dialog')).toBeHidden();
  });

  test('Close (X) button closes the modal', async ({ page }) => {
    await page.locator('.btn-new-content').click();
    await page.locator('.modal-close').click();
    await expect(page.locator('.content-create-dialog')).toBeHidden();
  });

  test('Production Brief mode shows Draft Assets + Save Brief in footer', async ({ page }) => {
    await page.locator('.btn-new-content').click();
    // Open the type dropdown and pick Production Brief
    await page.locator('.modal-body .field').first().locator('app-dropdown').click();
    await page.getByText('Production Brief', { exact: true }).click();

    await expect(page.getByRole('button', { name: /Save Brief/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Draft Assets/i })).toBeVisible();
  });
});
