import { test, expect } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/login';
import { mockHiveContent } from './helpers/content-mocks';

test.describe('Detail back button — ?from=calendar aria-label flip (#46)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await mockHiveContent(page);
  });

  test('Idea detail: aria-label is "Back to pipeline" by default', async ({ page }) => {
    await page.goto('/workspace/hive-collective/content/idea1');
    await expect(page.locator('app-idea-detail')).toBeVisible();
    const back = page.locator('app-idea-detail-header app-detail-back-button .detail-back');
    await expect(back).toBeVisible();
    await expect(back).toHaveAttribute('aria-label', 'Back to pipeline');
  });

  test('Idea detail: aria-label flips to "Back to calendar" when from=calendar', async ({ page }) => {
    await page.goto('/workspace/hive-collective/content/idea1?from=calendar');
    await expect(page.locator('app-idea-detail')).toBeVisible();
    const back = page.locator('app-idea-detail-header app-detail-back-button .detail-back');
    await expect(back).toHaveAttribute('aria-label', 'Back to calendar');
    await expect(back.locator('span')).toHaveText('Back');
  });

  test('Concept detail: aria-label flips to "Back to calendar" when from=calendar', async ({ page }) => {
    await page.goto('/workspace/hive-collective/content/concept1?from=calendar');
    await expect(page.locator('app-concept-detail')).toBeVisible();
    const back = page.locator('app-concept-detail-header app-detail-back-button .detail-back');
    await expect(back).toHaveAttribute('aria-label', 'Back to calendar');
    await expect(back.locator('span')).toHaveText('Back');
  });

  test('Post detail: aria-label flips to "Back to calendar" when from=calendar', async ({ page }) => {
    await page.goto('/workspace/hive-collective/content/prod1?from=calendar');
    await expect(page.locator('app-post-detail')).toBeVisible();
    const back = page.locator('app-post-detail-header app-detail-back-button .detail-back');
    await expect(back).toHaveAttribute('aria-label', 'Back to calendar');
    await expect(back.locator('span')).toHaveText('Back');
  });

  test('Post detail: aria-label is "Back to pipeline" by default', async ({ page }) => {
    await page.goto('/workspace/hive-collective/content/prod1');
    await expect(page.locator('app-post-detail')).toBeVisible();
    const back = page.locator('app-post-detail-header app-detail-back-button .detail-back');
    await expect(back).toHaveAttribute('aria-label', 'Back to pipeline');
  });

  test('Concept detail: aria-label is "Back to pipeline" by default', async ({ page }) => {
    await page.goto('/workspace/hive-collective/content/concept1');
    await expect(page.locator('app-concept-detail')).toBeVisible();
    const back = page.locator('app-concept-detail-header app-detail-back-button .detail-back');
    await expect(back).toHaveAttribute('aria-label', 'Back to pipeline');
  });
});
