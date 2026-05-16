import { test, expect } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/login';
import { mockHiveContent } from './helpers/content-mocks';

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
    const drawer = page.locator('[data-testid="content-create-drawer"]');
    await expect(drawer).toBeVisible();
    // The drawer's (keyup.escape) host listener only fires when the keyup
    // event bubbles from a descendant of the drawer. WebKit sometimes
    // drops focus to <body> after the picker option is detached, so the
    // keyup never reaches the drawer. Re-anchor focus inside the drawer
    // before pressing Esc — this matches real-user behavior, where focus
    // lands on the drawer's first input/textarea/button via rAF.
    await drawer.focus();
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
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

// Pipeline column rename — #141: "Review & Schedule" → "Scheduled". The
// column id, statuses, and SCSS class remain unchanged; only the visible
// header label flips. These TCs exercise the public surface of that change.
test.describe('Pipeline column rename to "Scheduled" (#141)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    // TC-E2 relies on the Scheduled lane containing the seed's prod2 entry
    // (status: scheduled), so install the hive fixture before navigation.
    await mockHiveContent(page);
    await page.goto('/workspace/hive-collective/content');
    await expect(page.locator('app-pipeline-view')).toBeVisible();
  });

  test('TC-E1: fourth column header renders "Scheduled (n)"; old label gone from the board', async ({ page }) => {
    const fourthColumnTitle = page.locator('.kanban-column').nth(3).locator('.column-title');
    await expect(fourthColumnTitle).toHaveText(/^Scheduled \(\d+\)$/);
    await expect(page.getByText('Review & Schedule')).toHaveCount(0);
  });

  test('TC-E2: column membership is unchanged (review + scheduled statuses still surface)', async ({ page }) => {
    // The default hive-collective seed includes prod2 (status: scheduled).
    // Confirm prod2's card lives in the fourth column, not the Post Builder
    // column (index 2). Asserting on a unique-to-prod2 substring ("Evening
    // Reset") keeps this test stable against future copy edits to other
    // seed titles, and avoids collision with prod1 ("Morning Mobility") in
    // the Post Builder column.
    const fourthColumn = page.locator('.kanban-column').nth(3);
    const postBuilderColumn = page.locator('.kanban-column').nth(2);
    await expect(fourthColumn).toContainText('Evening Reset');
    await expect(postBuilderColumn).not.toContainText('Evening Reset');
  });

  test('TC-E5: renamed column has no add-button (read-only lane)', async ({ page }) => {
    const fourthColumn = page.locator('.kanban-column').nth(3);
    await expect(fourthColumn.locator('.column-add-btn')).toHaveCount(0);
  });
});
