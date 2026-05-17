import { test, expect } from '@playwright/test';
import type {
  ConceptDraftRequestContract,
} from '@blinksocial/contracts';
import { mockAuthenticatedUser } from './helpers/login';
import { mockConceptDraftEndpoint, mockHiveContent } from './helpers/content-mocks';

const DRAWER = '[data-testid="content-create-drawer"]';
const GENERATE_BTN = `${DRAWER} .btn-generate`;

async function openConceptDrawer(page: import('@playwright/test').Page): Promise<void> {
  await page.locator('.btn-new-content').click();
  await page.locator('[data-type="concept"]').click();
  await expect(page.locator(DRAWER)).toBeVisible();
}

test.describe('Content Page — Create Concept Generate with AI (#156)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await mockHiveContent(page);
    await page.goto('/workspace/hive-collective/content');
    await expect(page.locator('app-pipeline-view')).toBeVisible();
  });

  test('TC-3: button disabled until both title and objective are set', async ({ page }) => {
    await openConceptDrawer(page);
    const btn = page.locator(GENERATE_BTN);
    await expect(btn).toBeDisabled();

    await page.locator('#concept-title').fill('Why teams need rituals');
    await expect(btn).toBeDisabled();

    await page.locator('#concept-title').fill('');
    await page.locator(`${DRAWER} .objective-btn`, { hasText: 'Engagement' }).click();
    await expect(btn).toBeDisabled();

    await page.locator('#concept-title').fill('Why teams need rituals');
    await expect(btn).toBeEnabled();
  });

  test('TC-1: fresh form generates description + hook + CTA and auto-fills fallback chips', async ({
    page,
  }) => {
    const captured: ConceptDraftRequestContract[] = [];
    await mockConceptDraftEndpoint(page, { captured });

    await openConceptDrawer(page);
    await page.locator('#concept-title').fill('Why teams need rituals');
    await page.locator(`${DRAWER} .objective-btn`, { hasText: 'Engagement' }).click();
    await page.locator(GENERATE_BTN).click();

    // Drawer flips into the post-AI review form. Description + hook populate.
    const descriptionTextarea = page.locator(`${DRAWER} textarea.field-textarea`);
    await expect(descriptionTextarea).toHaveValue(/Spark conversation/);

    const hookInput = page.locator(`${DRAWER} input.field-input[placeholder*="hook"]`);
    await expect(hookInput).toHaveValue(/Quick question/);

    // CTA dropdown shows the matching label, CTA-text input populated.
    await expect(page.locator(DRAWER)).toContainText('Comment');
    await expect(
      page.locator(`${DRAWER} #concept-cta-text`),
    ).toHaveValue('Drop your thoughts in the comments below');

    // Pillar chip #1 + Segment chips #1 and #4 auto-selected (fallbacks).
    await expect(
      page.locator(`${DRAWER} .chip.is-active`).filter({ hasText: 'Yoga & Movement' }),
    ).toBeVisible();
    await expect(
      page.locator(`${DRAWER} .chip.is-active`).filter({ hasText: 'Active 40s' }),
    ).toBeVisible();
    await expect(
      page.locator(`${DRAWER} .chip.is-active`).filter({ hasText: 'Fitness Beginners' }),
    ).toBeVisible();

    // Exactly one POST /api/concept-draft was issued with the expected body.
    expect(captured).toHaveLength(1);
    expect(captured[0]).toEqual({
      workspaceId: 'hive-collective',
      draft: {
        title: 'Why teams need rituals',
        objective: 'engagement',
        pillarIds: [],
        segmentIds: [],
      },
    });
  });

  test('TC-2: user-selected chips are preserved across the Generate click', async ({ page }) => {
    const captured: ConceptDraftRequestContract[] = [];
    await mockConceptDraftEndpoint(page, {
      captured,
      draft: {
        description: 'desc',
        hook: 'hook',
        cta: null,
        pillarIdFallback: null,
        segmentIdsFallback: [],
      },
    });

    await openConceptDrawer(page);
    await page.locator('#concept-title').fill('Why teams need rituals');
    await page.locator(`${DRAWER} .objective-btn`, { hasText: 'Engagement' }).click();

    // The pre-generation form has no chip-row to pre-select pillars from.
    // The store-level guarantee (server-side overriding fallback to null
    // when chips are selected) is verified by U-W8; here we simulate the
    // server saying "no fallback" and confirm the UI doesn't auto-fill.
    await page.locator(GENERATE_BTN).click();

    await expect(page.locator(`${DRAWER} textarea.field-textarea`)).toHaveValue('desc');
    // No pillar chip became active.
    await expect(page.locator(`${DRAWER} .chip.is-active`)).toHaveCount(0);

    expect(captured[0].draft.pillarIds).toEqual([]);
    expect(captured[0].draft.segmentIds).toEqual([]);
  });

  test('TC-4: server error shows toast, clears spinner, leaves fields unchanged', async ({
    page,
  }) => {
    await mockConceptDraftEndpoint(page, { errorStatus: 500 });

    await openConceptDrawer(page);
    await page.locator('#concept-title').fill('Why teams need rituals');
    await page.locator(`${DRAWER} .objective-btn`, { hasText: 'Engagement' }).click();
    await page.locator(GENERATE_BTN).click();

    // Toast appears with the expected message.
    await expect(page.locator('.mat-mdc-snack-bar-container').first()).toContainText(
      'AI Assist failed',
    );
    // Drawer stays on the pre-generation view (conceptAiGenerated stayed false).
    await expect(page.locator(GENERATE_BTN)).toBeVisible();
    await expect(page.locator(GENERATE_BTN)).toBeEnabled();
  });

  test('TC-5: re-clicking Generate after success does not clobber user-selected chips', async ({
    page,
  }) => {
    const captured: ConceptDraftRequestContract[] = [];
    let callCount = 0;
    await page.route('**/api/concept-draft', async (route) => {
      callCount++;
      try {
        const raw = route.request().postData();
        if (raw) captured.push(JSON.parse(raw) as ConceptDraftRequestContract);
      } catch {
        // ignore
      }
      // First call: full fallback. Second call (with chips set):
      // server returns null fallbacks because user has chips selected.
      const isFirst = callCount === 1;
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          draft: {
            description: `desc-${callCount}`,
            hook: `hook-${callCount}`,
            cta: { type: 'comment', text: 'Reply below' },
            pillarIdFallback: isFirst ? 'p1' : null,
            segmentIdsFallback: isFirst ? ['s1', 's4'] : [],
          },
        }),
      });
    });

    await openConceptDrawer(page);
    await page.locator('#concept-title').fill('Why teams need rituals');
    await page.locator(`${DRAWER} .objective-btn`, { hasText: 'Engagement' }).click();
    await page.locator(GENERATE_BTN).click();

    // After first call: description/hook populated, chips auto-selected.
    await expect(page.locator(`${DRAWER} textarea.field-textarea`)).toHaveValue('desc-1');
    await expect(
      page.locator(`${DRAWER} .chip.is-active`).filter({ hasText: 'Yoga & Movement' }),
    ).toBeVisible();

    // Drawer is now in post-generation review mode — the inline AI Assist
    // pencil button no longer triggers full-concept Generate, but the back
    // button returns to the pre-generation form. Simplest re-click path:
    // call the API service directly via the back→generate cycle.
    await page.locator(`${DRAWER} .back-btn`).click();
    await page.locator(GENERATE_BTN).click();

    expect(callCount).toBe(2);
    // Second request should carry the pillar + segment chips that were set
    // by the first response.
    expect(captured[1].draft.pillarIds).toEqual(['p1']);
    expect(captured[1].draft.segmentIds).toEqual(['s1', 's4']);

    // After second call: description + hook updated, chips unchanged (server
    // returned null fallbacks because chips were already selected).
    await expect(page.locator(`${DRAWER} textarea.field-textarea`)).toHaveValue('desc-2');
    await expect(
      page.locator(`${DRAWER} .chip.is-active`).filter({ hasText: 'Yoga & Movement' }),
    ).toBeVisible();
    await expect(
      page.locator(`${DRAWER} .chip.is-active`).filter({ hasText: 'Active 40s' }),
    ).toBeVisible();
  });
});
