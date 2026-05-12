import { test, expect, type Page } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/login';
import { mockHiveContent, IDEA_ENTRY, CONCEPT_ENTRY } from './helpers/content-mocks';

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
    // Drop POST_ENTRY from the index so reconcileLineageStatuses keeps
    // concept1 at status: 'new' — without this it gets bumped to 'used'
    // by its child post and disappears from the Concepts kanban column.
    await mockHiveContent(page, { indexItems: [IDEA_ENTRY, CONCEPT_ENTRY] });
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

// ──────────────────────────────────────────────────────────────────
// #110 — concept-detail right column + main form alignment with prototype.
// ──────────────────────────────────────────────────────────────────

function expectRgbNear(actual: string, expected: [number, number, number], tol = 2): void {
  const m = actual.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  expect(m, `expected rgb()-like string, got: ${actual}`).not.toBeNull();
  const [r, g, b] = [Number(m![1]), Number(m![2]), Number(m![3])];
  for (const [name, got, want] of [
    ['r', r, expected[0]],
    ['g', g, expected[1]],
    ['b', b, expected[2]],
  ] as const) {
    expect(
      Math.abs(got - want),
      `${name} channel: got ${got}, want ~${want} (±${tol})`,
    ).toBeLessThanOrEqual(tol);
  }
}

test.describe('Concept detail right column (#110)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    // Drop POST_ENTRY from the index so reconcileLineageStatuses keeps
    // concept1 at status: 'new' — without this it gets bumped to 'used'
    // by its child post and disappears from the Concepts kanban column.
    await mockHiveContent(page, { indexItems: [IDEA_ENTRY, CONCEPT_ENTRY] });
    await page.goto('/workspace/hive-collective/content');
    await openFirstConceptCard(page);
  });

  test('TC-1: right-column DOM order — BizObj → Pillars → Audience → Content Journey, no Tags or Timestamps label', async ({ page }) => {
    const sidebarLabels = page.locator('app-concept-detail .detail-sidebar .panel-label');
    const labelTexts = (await sidebarLabels.allInnerTexts()).map((t) =>
      t.replace(/\s+/g, ' ').trim().toUpperCase(),
    );
    expect(labelTexts[0]).toContain('BUSINESS OBJECTIVE');
    expect(labelTexts[1]).toContain('PILLARS');
    expect(labelTexts[1]).not.toContain('CONTENT PILLARS');
    expect(labelTexts[2]).toContain('AUDIENCE');
    expect(labelTexts[2]).not.toContain('AUDIENCE SEGMENTS');
    expect(labelTexts[3]).toContain('CONTENT JOURNEY');
    expect(labelTexts.some((t) => /\bTAGS\b/.test(t))).toBe(false);
    expect(labelTexts.some((t) => /TIMESTAMPS/.test(t))).toBe(false);

    const strategy = page.locator('app-concept-detail .strategy-panel');
    await expect(strategy).toHaveCount(1);
    await expect(strategy.locator('.strategy-section')).toHaveCount(3);
  });

  test('TC-2: section header icons are gray, not coral', async ({ page }) => {
    const svgs = page.locator('app-concept-detail .strategy-section .panel-label > svg');
    await expect(svgs).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      const c = await svgs.nth(i).evaluate((el) => getComputedStyle(el).color);
      const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      expect(m).not.toBeNull();
      const [r, g, b] = [Number(m![1]), Number(m![2]), Number(m![3])];
      const isCoral = Math.abs(r - 217) < 30 && Math.abs(g - 78) < 30 && Math.abs(b - 51) < 30;
      expect(isCoral, `icon ${i} computed color is coral-ish: ${c}`).toBe(false);
    }
  });

  test('TC-3: stage badge is rounded-rect with no uppercase transform', async ({ page }) => {
    const badge = page.locator('app-concept-detail-header .stage-badge').first();
    await expect(badge).toBeVisible();
    const computed = await badge.evaluate((el) => ({
      borderRadius: getComputedStyle(el).borderRadius,
      textTransform: getComputedStyle(el).textTransform,
      text: el.textContent?.trim() ?? '',
    }));
    expect(computed.borderRadius).toBe('6px');
    expect(computed.textTransform).toBe('none');
    expect(computed.text).toContain('Concept');
    expect(computed.text).not.toContain('CONCEPT');
  });

  test('TC-4: pillar selected uses pillar.color tint (chromium-only)', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'computed-color serialization differs cross-browser');
    const pillarGrid = page.locator('app-concept-detail .chip-grid--pillar');
    await expect(pillarGrid).toBeVisible();
    await expect(pillarGrid.locator('.chip-dot')).toHaveCount(0);

    const allChips = pillarGrid.locator('.chip');
    const count = await allChips.count();
    for (let i = 0; i < count; i++) {
      const chip = allChips.nth(i);
      if ((await chip.getAttribute('class'))?.includes('is-active')) {
        await chip.click();
      }
    }
    await allChips.nth(0).click();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(250);
    const styles = await allChips.nth(0).evaluate((el) => {
      const cs = getComputedStyle(el);
      return { color: cs.color, backgroundColor: cs.backgroundColor, borderColor: cs.borderTopColor };
    });
    // First pillar in fixture is `Yoga & Movement` (#d94e33 = rgb(217, 78, 51)).
    expectRgbNear(styles.color, [217, 78, 51]);
    expectRgbNear(styles.backgroundColor, [217, 78, 51], 20);
    expectRgbNear(styles.borderColor, [217, 78, 51], 20);
  });

  test('TC-5: no upper-bound cap on pillar selection', async ({ page }) => {
    const labelText = (await page.locator('app-concept-detail .strategy-section').nth(1).locator('h3.panel-label').innerText()).toUpperCase();
    expect(labelText).toContain('PILLARS');
    expect(labelText).not.toMatch(/\(1[–-]\d+\)/);
    expect(labelText).not.toMatch(/MAX\s*\d+/);

    const chips = page.locator('app-concept-detail .chip-grid--pillar .chip');
    const count = await chips.count();
    for (let i = 0; i < count; i++) {
      await expect(chips.nth(i)).toBeEnabled();
    }
    for (let i = 0; i < count; i++) {
      const chip = chips.nth(i);
      if (!(await chip.evaluate((el) => el.classList.contains('is-active')))) {
        await chip.click();
      }
    }
    for (let i = 0; i < count; i++) {
      await expect(chips.nth(i)).toHaveClass(/is-active/);
    }
  });

  test('TC-6: Description and Hook are permanent textareas with the new copy', async ({ page }) => {
    const descTa = page.locator('app-concept-detail textarea.detail-description-input').first();
    await expect(descTa).toBeVisible();
    const hookTa = page.locator('app-concept-detail textarea.detail-hook-input').first();
    await expect(hookTa).toBeVisible();

    const descLabel = (await page.locator('app-concept-detail .detail-main h3.panel-label').first().innerText()).toUpperCase();
    expect(descLabel).toContain('DESCRIPTION');
    expect(descLabel).toMatch(/CHARACTERS/);

    const hookLabel = (await page.locator('app-concept-detail .detail-main h3.panel-label').nth(1).innerText()).toUpperCase();
    expect(hookLabel).toContain('HOOK ANGLE');
  });

  test('TC-7: status stepper is visible but visually de-emphasized (compact wrapper)', async ({ page }) => {
    const wrap = page.locator('app-concept-detail .status-stepper-wrap');
    await expect(wrap).toBeVisible();
    const hasCompact = await wrap.evaluate((el) => el.classList.contains('status-stepper-wrap--compact'));
    expect(hasCompact).toBe(true);
  });

  test('TC-8: hover border on pillar = pillar.color; on segment = segment-text (chromium-only)', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'computed-color serialization differs cross-browser');
    const firstPillar = page.locator('app-concept-detail .chip-grid--pillar .chip').first();
    if (await firstPillar.evaluate((el) => el.classList.contains('is-active'))) {
      await firstPillar.click();
      await page.mouse.move(0, 0);
    }
    await firstPillar.hover();
    await page.waitForTimeout(250);
    const pillarHoverBorder = await firstPillar.evaluate((el) => getComputedStyle(el).borderTopColor);
    expectRgbNear(pillarHoverBorder, [217, 78, 51], 15);

    await page.mouse.move(0, 0);
    const firstSeg = page.locator('app-concept-detail .chip-grid--segment .chip').first();
    if (await firstSeg.evaluate((el) => el.classList.contains('is-active'))) {
      await firstSeg.click();
      await page.mouse.move(0, 0);
    }
    await firstSeg.hover();
    await page.waitForTimeout(250);
    const segHoverBorder = await firstSeg.evaluate((el) => getComputedStyle(el).borderTopColor);
    expectRgbNear(segHoverBorder, [37, 99, 235], 15);
  });
});
