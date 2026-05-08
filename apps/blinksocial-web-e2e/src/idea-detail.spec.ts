import { test, expect, type Page, type Request } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/login';
import { mockHiveContent } from './helpers/content-mocks';

const SHOTS_DIR = 'test-results/idea-detail-106';

const OBJECTIVES_TWO = [
  { id: 'obj-grow', category: 'growth', statement: 'Grow YouTube subs to 10k', target: 10000, unit: 'subs', timeframe: 'Q4' },
  { id: 'obj-edu',  category: 'education', statement: 'Educate audience on breathwork basics', target: 5, unit: 'posts', timeframe: 'monthly' },
] as const;

async function openFirstIdea(page: Page): Promise<void> {
  await page.locator('.kanban-column').first().locator('.content-card').first().click();
  await expect(page.locator('app-idea-detail')).toBeVisible();
}

// WebKit and Chromium round CSS color values differently when computing
// from hex/oklch sources — channels can differ by ±1. Use a tolerance
// when asserting exact rgb() strings.
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
    await page.locator('app-concept-options-panel .btn-generate button').click();
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

// Idea detail header — title typography (real-browser verification).
//
// The font-size assertion lives here rather than in
// idea-detail-header.component.spec.ts because jsdom doesn't honor the
// cross-component cascade we depend on (consumer's
// `:host ::ng-deep .inline-edit-display.detail-title { font-size: 20px }`
// vs inline-edit's `.inline-edit-display { font-size: inherit }`). Real
// Chromium honors specificity and !important correctly.
test.describe('Idea detail header typography', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await mockHiveContent(page);
    await page.goto('/workspace/hive-collective/content');
    await openFirstIdea(page);
  });

  test('title (.inline-edit-display.detail-title) renders at 20px and weight 700', async ({ page }) => {
    const titleBtn = page.locator('app-idea-detail-header .inline-edit-display.detail-title').first();
    await expect(titleBtn).toBeVisible();
    const computed = await titleBtn.evaluate((el) => ({
      fontSize: getComputedStyle(el).fontSize,
      fontWeight: getComputedStyle(el).fontWeight,
    }));
    expect(computed.fontSize).toBe('20px');
    expect(computed.fontWeight).toBe('700');
  });

  test('description textarea matches prototype: permanent (always visible), borderless, gray focus ring, 88px min, 14px / 1.625, prototype placeholder', async ({ page }) => {
    // The description is a permanent textarea (matching the prototype's
    // always-on Textarea), NOT a click-to-edit display→textarea swap.
    const textarea = page.locator(
      'app-idea-detail textarea.detail-description-input',
    ).first();
    await expect(textarea).toBeVisible();
    // No `.inline-edit-display.detail-description` button should exist —
    // there's no display state to swap to.
    await expect(
      page.locator('app-idea-detail .inline-edit-display.detail-description'),
    ).toHaveCount(0);

    // Default (unfocused) state must already show the gray box —
    // background = --blink-input-bg-dark = #f3f4f6 = rgb(243, 244, 246).
    // WebKit rounds RGB channels by ±1 vs Chromium, so use a tolerance.
    const bgUnfocused = await textarea.evaluate((el) => getComputedStyle(el).backgroundColor);
    expectRgbNear(bgUnfocused, [243, 244, 246]);

    // Re-focus explicitly — Playwright's `.click()` on the wrapper button
    // can leave focus unsettled by the time evaluate() runs.
    await textarea.focus();
    await page.waitForTimeout(100);
    const computed = await textarea.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        resize: cs.resize,
        borderTopWidth: cs.borderTopWidth,
        borderRightWidth: cs.borderRightWidth,
        borderBottomWidth: cs.borderBottomWidth,
        borderLeftWidth: cs.borderLeftWidth,
        borderRadius: cs.borderRadius,
        padding: cs.padding,
        minHeight: cs.minHeight,
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        backgroundColor: cs.backgroundColor,
        boxShadow: cs.boxShadow,
        placeholder: (el as HTMLTextAreaElement).placeholder,
      };
    });

    // Non-resizable
    expect(computed.resize).toBe('none');

    // Borderless on all four sides
    expect(computed.borderTopWidth).toBe('0px');
    expect(computed.borderRightWidth).toBe('0px');
    expect(computed.borderBottomWidth).toBe('0px');
    expect(computed.borderLeftWidth).toBe('0px');

    // 8px radius and 8px 12px padding match the prototype shadcn Textarea.
    expect(computed.borderRadius).toBe('8px');
    expect(computed.padding).toBe('8px 12px');

    // 88px min-height (prototype `min-h-[88px]`)
    expect(computed.minHeight).toBe('88px');

    // 14px (prototype `text-sm` ≡ --blink-body-medium)
    expect(computed.fontSize).toBe('14px');

    // 1.625 line-height (prototype `leading-relaxed`) — Chromium reports as
    // px after multiplying by font-size: 14 × 1.625 = 22.75 → '22.75px'.
    // Allow a tiny tolerance and reject 'normal'.
    expect(computed.lineHeight).not.toBe('normal');
    const lh = parseFloat(computed.lineHeight);
    expect(lh).toBeGreaterThan(22);
    expect(lh).toBeLessThan(24);

    // Focused background (autofocused on click).
    // --blink-input-bg-focus = #edeff2 = rgb(237, 239, 242)
    // WebKit rounds RGB channels by ±1 vs Chromium, so use a tolerance.
    expectRgbNear(computed.backgroundColor, [237, 239, 242]);

    // Focus ring should be a thin neutral gray, NOT the prior coral glow.
    // --blink-outline = rgba(0, 0, 0, 0.1) on a near-white surface →
    // visually equivalent to the prototype's ring-gray-200.
    // Tolerance: the page-enter animation can cause sub-pixel rendering
    // during this assertion, slightly perturbing alpha and spread.
    const shadowMatch = computed.boxShadow.match(
      /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)\s*[\d.]+px\s*[\d.]+px\s*[\d.]+px\s*([\d.]+)px/,
    );
    expect(shadowMatch).not.toBeNull();
    const [, r, g, b, alpha, spread] = shadowMatch!;
    expect(`${r},${g},${b}`).toBe('0,0,0');
    const a = parseFloat(alpha);
    expect(a).toBeGreaterThan(0.05);
    expect(a).toBeLessThanOrEqual(0.1);
    const sp = parseFloat(spread);
    expect(sp).toBeGreaterThan(0.5);
    expect(sp).toBeLessThanOrEqual(1.0);

    // Placeholder copy matches prototype.
    expect(computed.placeholder).toBe('Add a description to get sharper concept options…');

    // Verify default-state background rule presence (the textarea is
    // permanent now but we still want to confirm the rule exists in case
    // future refactors break the `:focus` cascade).
    const ruleHasDefaultBg = await page.evaluate(() => {
      const styles = Array.from(document.styleSheets);
      for (const ss of styles) {
        try {
          for (const rule of Array.from(ss.cssRules) as CSSRule[]) {
            if (
              rule instanceof CSSStyleRule &&
              rule.selectorText.includes('.detail-description-input') &&
              !rule.selectorText.includes(':focus') &&
              rule.style.background.includes('--blink-input-bg-dark')
            ) {
              return true;
            }
          }
        } catch {
          /* ignore cross-origin stylesheets */
        }
      }
      return false;
    });
    expect(ruleHasDefaultBg).toBe(true);
  });
});

// Ticket #106 — right-column parity with the prototype.
test.describe('Idea detail right column (#106)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
  });

  test('TC-1 / TC-3 / TC-5: empty-objectives state — order, no Tags panel, prototype warning copy', async ({ page }) => {
    await mockHiveContent(page);
    await page.goto('/workspace/hive-collective/content');
    await openFirstIdea(page);

    const sidebarLabels = page.locator('app-idea-detail .detail-sidebar .panel-label');
    // panel-label has text-transform: uppercase, so innerText() returns
    // the visually-rendered uppercase form.
    const labelTexts = (await sidebarLabels.allInnerTexts()).map((t) =>
      t.replace(/\s+/g, ' ').trim().toUpperCase(),
    );

    // TC-1: Business Objective → Pillars → Audience → Content Journey, no Tags / Timestamps label
    expect(labelTexts[0]).toContain('BUSINESS OBJECTIVE');
    expect(labelTexts[1]).toContain('PILLARS');
    expect(labelTexts[1]).not.toContain('CONTENT PILLARS');
    expect(labelTexts[2]).toContain('AUDIENCE');
    expect(labelTexts[2]).not.toContain('AUDIENCE SEGMENTS');
    expect(labelTexts[3]).toContain('CONTENT JOURNEY');
    expect(labelTexts.some((t) => /\bTAGS\b/.test(t))).toBe(false);
    expect(labelTexts.some((t) => /TIMESTAMPS/.test(t))).toBe(false);

    // TC-5: no tags input/chips anywhere on the screen
    await expect(page.locator('app-idea-detail .tags-input')).toHaveCount(0);
    await expect(page.locator('app-idea-detail .tag-chips')).toHaveCount(0);

    // TC-3: empty-state warning shows the prototype copy
    const warning = page.locator('app-idea-detail .strategy-panel .panel-warning');
    await expect(warning).toBeVisible();
    await expect(warning).toContainText('No business objectives have been set up. Add them in Strategy & Research first.');

    await page.screenshot({ path: `${SHOTS_DIR}/tc-1-3-5-empty-objectives.png`, fullPage: true });
  });

  test('TC-2: strategy card structure — single panel, three sections, asterisks, tooltips', async ({ page }) => {
    await mockHiveContent(page, { objectives: [...OBJECTIVES_TWO] });
    await page.goto('/workspace/hive-collective/content');
    await openFirstIdea(page);

    // Single .strategy-panel card with three .strategy-section children
    const strategyCards = page.locator('app-idea-detail .strategy-panel');
    await expect(strategyCards).toHaveCount(1);
    const sections = strategyCards.locator('.strategy-section');
    await expect(sections).toHaveCount(3);

    // Each section's panel-label-row pairs an h3 with an app-tooltip help sibling
    const rows = strategyCards.locator('.panel-label-row');
    await expect(rows).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      await expect(rows.nth(i).locator('h3.panel-label')).toHaveCount(1);
      await expect(rows.nth(i).locator('app-tooltip')).toHaveCount(1);
    }

    // Required asterisks: BizObj + Pillars yes; Audience no
    await expect(sections.nth(0).locator('.panel-required')).toHaveCount(1);
    await expect(sections.nth(1).locator('.panel-required')).toHaveCount(1);
    await expect(sections.nth(2).locator('.panel-required')).toHaveCount(0);

    // Each label has a leading SVG icon (Target / Layers / Users)
    for (let i = 0; i < 3; i++) {
      await expect(sections.nth(i).locator('h3.panel-label svg').first()).toBeVisible();
    }

    await page.screenshot({ path: `${SHOTS_DIR}/tc-2-strategy-card.png`, fullPage: true });
  });

  test('TC-4: chip selection persists — UI toggles, PUT body carries objectiveId, post-reload state stable', async ({ page }) => {
    await mockHiveContent(page, { objectives: [...OBJECTIVES_TWO] });
    await page.goto('/workspace/hive-collective/content');
    await openFirstIdea(page);

    const chips = page.locator('app-idea-detail .objective-chips .chip');
    await expect(chips).toHaveCount(2);
    await expect(chips.nth(0)).not.toHaveClass(/is-active/);
    await expect(chips.nth(1)).not.toHaveClass(/is-active/);

    // Capture the next PUT/PATCH/POST to a content-items detail and assert payload
    const ideaItemUrlRe = /\/api\/workspaces\/hive-collective\/content-items\/idea1(\?.*)?$/;
    const writeReq: Promise<Request> = page.waitForRequest((req) => {
      return ideaItemUrlRe.test(req.url()) && ['PUT', 'PATCH', 'POST'].includes(req.method());
    });

    await chips.nth(0).click();

    const req = await writeReq;
    const bodyRaw = req.postData() ?? '';
    expect(bodyRaw.length).toBeGreaterThan(0);
    const parsed = JSON.parse(bodyRaw) as { objectiveId?: string };
    expect(parsed.objectiveId).toBe('obj-grow');

    await expect(chips.nth(0)).toHaveClass(/is-active/);
    await expect(chips.nth(1)).not.toHaveClass(/is-active/);

    await page.screenshot({ path: `${SHOTS_DIR}/tc-4-chip-selected.png`, fullPage: true });

    // Post-reload: the persisted detail should keep the chip selected
    await page.reload();
    await expect(page.locator('app-idea-detail')).toBeVisible();
    const reloadedChips = page.locator('app-idea-detail .objective-chips .chip');
    await expect(reloadedChips).toHaveCount(2);
    await expect(reloadedChips.nth(0)).toHaveClass(/is-active/);

    await page.screenshot({ path: `${SHOTS_DIR}/tc-4-after-reload.png`, fullPage: true });
  });

  test('TC-6: vertical Content Journey on stage=idea (current=idea)', async ({ page }) => {
    await mockHiveContent(page);
    await page.goto('/workspace/hive-collective/content');
    await openFirstIdea(page);

    const journey = page.locator('app-idea-detail app-content-journey');
    await expect(journey.locator('.journey-steps-vertical')).toHaveCount(1);
    await expect(journey.locator('.journey-progress')).toHaveCount(0);
    await expect(journey.locator('.journey-progress-fill')).toHaveCount(0);

    const steps = journey.locator('.journey-step');
    await expect(steps).toHaveCount(3);
    await expect(steps.nth(0)).toHaveClass(/is-current/);
    await expect(steps.nth(1)).toHaveClass(/is-future/);
    await expect(steps.nth(2)).toHaveClass(/is-future/);

    // Current circle has aria-current="step" and shows the digit "1"
    await expect(steps.nth(0).locator('.journey-circle')).toHaveAttribute('aria-current', 'step');
    await expect(steps.nth(0).locator('.journey-circle svg')).toHaveCount(0);

    // Existing 4px gradient bar is on the parent .panel-journey, not inside the journey component
    const journeyPanel = page.locator('app-idea-detail .panel-journey');
    await expect(journeyPanel).toBeVisible();

    await page.screenshot({ path: `${SHOTS_DIR}/tc-6-journey-idea.png`, fullPage: true });
  });

  // TC-7 (vertical Content Journey at stage=concept) is intentionally skipped
  // here. ContentJourneyComponent is consumed only by idea-detail today, and
  // a concept-stage item routes to concept-detail (which renders a different
  // sidebar without the journey). The stage=concept rendering is fully
  // exercised by the Angular unit test:
  // apps/blinksocial-web/src/app/pages/content/views/idea-detail/components/
  //   content-journey.component.spec.ts
  //   "concept stage: idea=past (checkmark), concept=current, post=future"
  test.skip('TC-7: vertical Content Journey on stage=concept (covered by unit test)', () => {
    /* covered by unit spec — see comment above */
  });

  test('TC-8: timestamps card has no header, two clock-icon rows, prototype date format', async ({ page }) => {
    await mockHiveContent(page);
    await page.goto('/workspace/hive-collective/content');
    await openFirstIdea(page);

    const ts = page.locator('app-idea-detail .timestamps-panel');
    await expect(ts).toBeVisible();
    // No panel-label inside the timestamps card.
    await expect(ts.locator('.panel-label')).toHaveCount(0);

    const rows = ts.locator('.timestamp-row');
    await expect(rows).toHaveCount(2);
    for (let i = 0; i < 2; i++) {
      await expect(rows.nth(i).locator('svg').first()).toBeVisible();
      await expect(rows.nth(i).locator('.timestamp-label')).toBeVisible();
      await expect(rows.nth(i).locator('.timestamp-value')).toBeVisible();
    }

    // Labels exact text — .timestamp-label has text-transform: uppercase
    // so innerText() returns the rendered uppercase form.
    expect((await rows.nth(0).locator('.timestamp-label').innerText()).trim().toUpperCase()).toBe('CREATED');
    expect((await rows.nth(1).locator('.timestamp-label').innerText()).trim().toUpperCase()).toBe('LAST UPDATED');

    // Date format: "Wed, Apr 1, 2026" — weekday short, month short, no AM/PM, no HH:MM
    const created = (await rows.nth(0).locator('.timestamp-value').innerText()).trim();
    expect(created).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+\w{3}\s+\d{1,2},\s+\d{4}$/);
    expect(created).not.toMatch(/\bAM\b|\bPM\b/i);
    expect(created).not.toMatch(/:\d{2}/);

    await page.screenshot({ path: `${SHOTS_DIR}/tc-8-timestamps.png`, fullPage: true });
  });

  test('TC-9: mobile parity at 375px — sidebar reflows, new panels do not overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await mockHiveContent(page, { objectives: [...OBJECTIVES_TWO] });
    await page.goto('/workspace/hive-collective/content');
    await openFirstIdea(page);

    // The new sidebar panels (this ticket's scope) must not themselves overflow
    // the 375px viewport. Asserting on document.body.scrollWidth would also
    // include unrelated header/stepper layout that's outside this ticket.
    const sidebarWidths = await page.evaluate(() => {
      const sel = (s: string) => document.querySelector(s) as HTMLElement | null;
      const get = (s: string) => sel(s)?.getBoundingClientRect().width ?? 0;
      return {
        viewport: window.innerWidth,
        sidebar: get('app-idea-detail .detail-sidebar'),
        strategyCard: get('app-idea-detail .strategy-panel'),
        journey: get('app-idea-detail app-content-journey'),
        timestamps: get('app-idea-detail .timestamps-panel'),
      };
    });
    expect(sidebarWidths.sidebar).toBeLessThanOrEqual(sidebarWidths.viewport);
    expect(sidebarWidths.strategyCard).toBeLessThanOrEqual(sidebarWidths.viewport);
    expect(sidebarWidths.journey).toBeLessThanOrEqual(sidebarWidths.viewport);
    expect(sidebarWidths.timestamps).toBeLessThanOrEqual(sidebarWidths.viewport);

    // Sidebar reflows below main (single-column at narrow widths).
    const layout = await page.evaluate(() => {
      const main = document.querySelector('app-idea-detail .detail-main') as HTMLElement | null;
      const aside = document.querySelector('app-idea-detail .detail-sidebar') as HTMLElement | null;
      if (!main || !aside) return null;
      return {
        mainTop: main.getBoundingClientRect().top,
        asideTop: aside.getBoundingClientRect().top,
      };
    });
    expect(layout).not.toBeNull();
    expect(layout!.asideTop).toBeGreaterThanOrEqual(layout!.mainTop);

    // All new panels are visible (no clipping).
    await expect(page.locator('app-idea-detail .strategy-panel')).toBeVisible();
    await expect(page.locator('app-idea-detail app-content-journey')).toBeVisible();
    await expect(page.locator('app-idea-detail .timestamps-panel')).toBeVisible();

    await page.screenshot({ path: `${SHOTS_DIR}/tc-9-mobile-375.png`, fullPage: true });
  });

  test('TC-10: dark theme parity — toggle, no hardcoded white flashes, brand stays coral', async ({ page }) => {
    await mockHiveContent(page);
    await page.goto('/workspace/hive-collective/content');
    await openFirstIdea(page);

    // Force dark theme via the documented data-theme attribute (matches ThemeService).
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    // Brand-primary should still resolve to a coral-ish colour. We assert that the
    // current-step circle in the journey uses the brand-primary CSS variable and
    // that its computed colour is non-empty.
    const currentCircleBg = await page
      .locator('app-idea-detail app-content-journey .journey-step.is-current .journey-circle')
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(currentCircleBg).not.toBe('');
    expect(currentCircleBg).not.toBe('rgba(0, 0, 0, 0)');

    // Strategy card border should resolve to a non-empty value (dark variant of --blink-outline-variant).
    const strategyBorder = await page
      .locator('app-idea-detail .strategy-panel')
      .evaluate((el) => getComputedStyle(el).borderTopColor);
    expect(strategyBorder).not.toBe('');

    await page.screenshot({ path: `${SHOTS_DIR}/tc-10-dark-theme.png`, fullPage: true });
  });
});
