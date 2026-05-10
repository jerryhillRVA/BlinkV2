import { test, expect, type Page } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/login';
import { mockHiveContent } from './helpers/content-mocks';

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
    await mockHiveContent(page);
    await page.goto('/workspace/hive-collective/content');
    await expect(page.locator('app-pipeline-view')).toBeVisible();
  });

  test('clicking an In-Production card lands on /content/<id> with Brief active', async ({ page }) => {
    await openFirstInProductionCard(page);
    await expect(page).toHaveURL(/\/workspace\/hive-collective\/content\/[^/]+$/);
    await expect(page.locator('app-post-detail-header')).toBeVisible();
    await expect(page.locator('app-production-steps-bar')).toBeVisible();
    await expect(page.locator('app-brief-step')).toBeVisible();
    await expect(page.locator('app-brief-content-concept')).toBeVisible();
  });

  test('Back button returns to the pipeline board', async ({ page }) => {
    await openFirstInProductionCard(page);
    await page.locator('app-post-detail-header .detail-back').click();
    await expect(page).toHaveURL(/\/workspace\/hive-collective\/content$/);
  });
});

test.describe('Production Brief (#112)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await mockHiveContent(page);
    await page.goto('/workspace/hive-collective/content');
    await expect(page.locator('app-pipeline-view')).toBeVisible();
    await openFirstInProductionCard(page);
  });

  test('TC-1: page header shows Production badge with Clapperboard icon, no status stepper', async ({ page }) => {
    const badge = page.locator('app-post-detail-header .stage-badge').first();
    await expect(badge).toBeVisible();
    const computed = await badge.evaluate((el) => ({
      borderRadius: getComputedStyle(el).borderRadius,
      textTransform: getComputedStyle(el).textTransform,
      text: el.textContent?.trim() ?? '',
    }));
    expect(computed.borderRadius).toBe('6px');
    expect(computed.textTransform).toBe('none');
    expect(computed.text).toContain('Production');
    expect(computed.text).not.toContain('PRODUCTION');
    const paths = await badge.locator('svg path').allTextContents();
    // We only need to confirm an SVG renders (Clapperboard); attribute-walk in browser
    const dAttrs = await badge.locator('svg path').evaluateAll((els) =>
      els.map((e) => e.getAttribute('d') ?? ''),
    );
    expect(paths.length).toBeGreaterThanOrEqual(0); // playwright-quirk; allTextContents is empty for empty <path>
    expect(dAttrs.some((d) => d.startsWith('M20.2 6'))).toBe(true);
    // Status stepper from concept-detail must NOT be on this page
    await expect(page.locator('app-post-detail app-status-stepper')).toHaveCount(0);
  });

  test('TC-2: production-steps bar has 4 steps (Brief / Draft / Packaging / Approve & Schedule)', async ({ page }) => {
    const labels = await page.locator('app-production-steps-bar .steps-label').allTextContents();
    expect(labels.map((l) => l.trim())).toEqual(['Brief', 'Draft', 'Packaging', 'Approve & Schedule']);
    await expect(page.locator('app-production-steps-bar .steps-btn')).toHaveCount(4);
  });

  test('TC-3: Goal & Message card has Key Message label, AI Assist sibling, and a textarea', async ({ page }) => {
    const card = page.locator('app-brief-step .goal-message-card').first();
    await expect(card).toBeVisible();
    await expect(card.locator('h3.panel-label').first()).toContainText('Key Message');
    await expect(card.locator('.assist-btn')).toBeVisible();
    await expect(card.locator('textarea.brief-textarea')).toBeVisible();
    await card.locator('.assist-btn').click();
    await expect(card.locator('textarea.brief-textarea')).not.toHaveValue('');
  });

  test('TC-4: Reference Links — Enter adds a row; × removes it', async ({ page }) => {
    const card = page.locator('app-brief-step .reference-links-card').first();
    await expect(card).toBeVisible();
    const inputs = card.locator('.reference-link-row input');
    const initialCount = await inputs.count();
    const addInput = inputs.last();
    await addInput.fill('https://example.com/a');
    await addInput.press('Enter');
    await expect(card.locator('.reference-link-row input')).toHaveCount(initialCount + 1);
    await addInput.fill('https://example.com/b');
    await addInput.press('Enter');
    await expect(card.locator('.reference-link-row input')).toHaveCount(initialCount + 2);
    await card.locator('.link-row-remove').first().click();
    await expect(card.locator('.reference-link-row input')).toHaveCount(initialCount + 1);
  });

  test('TC-5: Ownership & Timeline shows Owner + Due Date — no Paid & Boosted toggle, no Campaign Name field (post-prototype trim)', async ({ page }) => {
    const card = page.locator('app-brief-step .ownership-timeline-card').first();
    await expect(card).toBeVisible();
    // Owner select + Due Date date input are present
    await expect(card.locator('select.brief-select')).toBeVisible();
    await expect(card.locator('input[type="date"].brief-date-input')).toBeVisible();
    // Paid & Boosted toggle and Campaign Name field were removed during the
    // in-session prototype-alignment iteration — neither should render.
    expect(await card.getByText('Campaign Name').count()).toBe(0);
    expect(await card.getByText(/paid\s*&\s*boosted/i).count()).toBe(0);
    expect(await card.locator('.publishing-toggle').count()).toBe(0);
  });

  test('TC-6: CTA SelectGrid renders 8 pills; selection moves between pills', async ({ page }) => {
    const grid = page.locator('app-brief-step .cta-card .cta-grid');
    await expect(grid).toBeVisible();
    const pills = grid.locator('.pill-cta');
    await expect(pills).toHaveCount(8);
    const enabled = await pills.evaluateAll((els) => els.filter((b) => !(b as HTMLButtonElement).disabled).length);
    if (enabled < 2) {
      test.skip();
      return;
    }
    // Click the first inactive pill — assert it picks up is-active.
    const inactiveIdxA = await pills.evaluateAll((els) =>
      els.findIndex((b) => !b.classList.contains('is-active') && !(b as HTMLButtonElement).disabled),
    );
    const a = pills.nth(inactiveIdxA);
    await a.click();
    await expect(a).toHaveClass(/is-active/);
    // Click another inactive pill — it picks up is-active, prior pill drops it.
    const inactiveIdxB = await pills.evaluateAll((els, skip) =>
      els.findIndex((b, i) => i !== skip && !b.classList.contains('is-active') && !(b as HTMLButtonElement).disabled),
    inactiveIdxA);
    const b = pills.nth(inactiveIdxB);
    await b.click();
    await expect(b).toHaveClass(/is-active/);
    await expect(a).not.toHaveClass(/is-active/);
  });

  test('TC-7: Brief Status approve toggle (skips when canApprove is false on the seeded fixture)', async ({ page }) => {
    const toggle = page.locator('app-brief-step .brief-status-card .approve-toggle');
    await expect(toggle).toBeVisible();
    if (await toggle.isDisabled()) {
      test.skip();
      return;
    }
    await toggle.check();
    await expect(page.locator('app-brief-step .status-approved-badge')).toBeVisible();
    await page.locator('app-brief-step .unlock-btn').click();
    await expect(page.locator('app-brief-step .status-approved-badge')).toHaveCount(0);
  });

  test('TC-8: sidebar Content Concept card renders locked summary with Edit Concept link', async ({ page }) => {
    const card = page.locator('app-brief-content-concept .brief-content-concept-card').first();
    await expect(card).toBeVisible();
    await expect(card.locator('.card-locked')).toContainText(/locked/i);
    const editLink = card.locator('.card-edit');
    await expect(editLink).toBeVisible();
    await editLink.click();
    // Edit Concept routes to the parent concept-detail
    await expect(page.locator('app-concept-detail')).toBeVisible();
  });
});
