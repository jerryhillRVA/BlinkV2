import { test, expect, type Page } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/login';
import { mockHiveContent } from './helpers/content-mocks';

/**
 * Ticket #126 — UI ↔ API persistence parity for the Instagram-Reel Post
 * workflow. Each test fills a field, reloads the page, and asserts the
 * value is restored. The existing `mockHiveContent` helper persists
 * PUT/POST patches in-memory and echoes them on follow-up GETs — that's
 * exactly the AFS write semantics this ticket guarantees, so a green
 * reload assertion proves the persist-call wires up correctly without
 * needing a live AFS endpoint.
 *
 * Field-complete round-trip across Brief/Draft/Packaging/QA against real
 * AFS is covered by `content-items.integration.spec.ts` (skipped when
 * `AGENTIC_FS_URL` is unset). This spec is the frontend-side complement —
 * it catches Brief-step persist-call drift specifically, where reload
 * regressions have historically been most likely to slip through unit
 * tests because the brief approval gate makes Brief the only step a user
 * can land on without prior setup.
 */

async function openProd1(page: Page): Promise<void> {
  await page.goto('/workspace/hive-collective/content/prod1');
  await expect(page.locator('app-post-detail')).toBeVisible();
}

test.describe('Post detail — UI↔API persistence (ticket #126)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await mockHiveContent(page);
  });

  test('Brief: Key Message survives reload', async ({ page }) => {
    await openProd1(page);
    const textarea = page.locator('app-brief-step .goal-message-card textarea.brief-textarea').first();
    await expect(textarea).toBeVisible();
    const sentinel = 'Persisted key message — ticket-126 sentinel';
    await textarea.fill(sentinel);
    await textarea.blur();
    // Allow the PUT to flush
    await page.waitForTimeout(150);
    await page.reload();
    await expect(
      page.locator('app-brief-step .goal-message-card textarea.brief-textarea').first(),
    ).toHaveValue(sentinel);
  });

  test('Brief: Reference Links list survives reload', async ({ page }) => {
    await openProd1(page);
    const card = page.locator('app-brief-step .reference-links-card').first();
    await expect(card).toBeVisible();
    const inputs = card.locator('.reference-link-row input');
    const initial = await inputs.count();
    const adder = inputs.last();
    await adder.fill('https://ticket-126.example/a');
    await adder.press('Enter');
    await expect(card.locator('.reference-link-row input')).toHaveCount(initial + 1);
    await page.waitForTimeout(150);
    await page.reload();
    const afterReload = page.locator('app-brief-step .reference-links-card .reference-link-row input');
    await expect(afterReload).toHaveCount(initial + 1);
    const values = await afterReload.evaluateAll((els) =>
      (els as HTMLInputElement[]).map((e) => e.value),
    );
    expect(values).toContain('https://ticket-126.example/a');
  });
});
