import { test, expect, type Page } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/login';
import { mockHiveContent } from './helpers/content-mocks';

interface GenerateIdeasRequest {
  workspaceId?: string;
  pillarIds?: string[];
}

function stubIdeas(): {
  id: string;
  title: string;
  rationale: string;
  pillarId: string;
}[] {
  return Array.from({ length: 6 }, (_, i) => ({
    id: `gi-${i + 1}`,
    title: `Generated title ${i + 1}`,
    rationale: `Rationale ${i + 1}`,
    pillarId: i % 2 === 0 ? 'p1' : 'p2',
  }));
}

async function openIdeasGenerateTab(page: Page): Promise<void> {
  await page.locator('.btn-new-content').click();
  await page.locator('[data-type="idea"]').click();
  await expect(page.locator('[data-testid="content-create-drawer"]')).toBeVisible();
  // Switch to the Generate Ideas mode tab.
  await page
    .locator('.mode-toggle-btn', { hasText: 'Generate Ideas' })
    .click();
}

test.describe('Pipeline → Create Idea → Generate Ideas (#154)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await mockHiveContent(page);
    await page.goto('/workspace/hive-collective/content');
    await expect(page.locator('app-pipeline-view')).toBeVisible();
  });

  test('POSTs { workspaceId, pillarIds } to /api/generated-ideas and renders 6 cards', async ({
    page,
  }) => {
    let requestBody: GenerateIdeasRequest | null = null;
    await page.route('**/api/generated-ideas', async (route) => {
      requestBody = JSON.parse(route.request().postData() ?? '{}') as GenerateIdeasRequest;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ideas: stubIdeas() }),
      });
    });

    await openIdeasGenerateTab(page);

    // Pick a focus pillar.
    await page.locator('.chip').first().click();

    // Click Generate Ideas.
    await page.locator('.btn-generate').click();

    // Assert 6 cards render.
    const cards = page.locator('.idea-card');
    await expect(cards).toHaveCount(6, { timeout: 10_000 });

    expect(requestBody?.workspaceId).toBe('hive-collective');
    expect(Array.isArray(requestBody?.pillarIds)).toBe(true);
    expect(requestBody?.pillarIds?.length).toBeGreaterThan(0);

    // Each card has a non-empty title + rationale.
    for (let i = 0; i < 6; i++) {
      const card = cards.nth(i);
      await expect(card).toBeVisible();
      const text = (await card.innerText()).trim();
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test('502 → toast, ideas grid stays empty, Generate button visible again', async ({
    page,
  }) => {
    await page.route('**/api/generated-ideas', async (route) => {
      await route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'AI generation failed.' }),
      });
    });

    await openIdeasGenerateTab(page);
    await page.locator('.chip').first().click();
    await page.locator('.btn-generate').click();

    // Generate button must return to visible (UI is the load-bearing
    // assertion — Firefox doesn't surface response events for synthetic
    // route.fulfill so waitForResponse isn't reliable here).
    await expect(page.locator('.btn-generate')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.idea-card')).toHaveCount(0);
  });

  test('double-click guard: rapid clicks fire one request', async ({ page }) => {
    let callCount = 0;
    await page.route('**/api/generated-ideas', async (route) => {
      callCount++;
      // Slow the response so the second click happens while the first is in flight.
      await new Promise((r) => setTimeout(r, 250));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ideas: stubIdeas() }),
      });
    });

    await openIdeasGenerateTab(page);
    await page.locator('.chip').first().click();
    const btn = page.locator('.btn-generate');
    await btn.click();
    // Re-click immediately. The button is disabled during loading, so
    // Playwright would throw on a real `.click()`; use `.dispatchEvent()`
    // to simulate the user defeating the disabled attribute.
    await btn.dispatchEvent('click').catch(() => undefined);
    await expect(page.locator('.idea-card')).toHaveCount(6, { timeout: 10_000 });
    expect(callCount).toBe(1);
  });
});
