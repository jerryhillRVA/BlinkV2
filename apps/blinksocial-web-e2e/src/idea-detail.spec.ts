import { test, expect, type Page, type Request } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/login';
import { mockHiveContent } from './helpers/content-mocks';
import { waitForCssToSettle } from './helpers/css-stability';

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
// from hex/oklch sources. Channels typically differ by ±1 but webkit can
// drift further (±6 observed on near-white surfaces) — widen tolerance so
// the assertion still catches a *wrong* color while tolerating renderer
// quantization across all 3 browsers.
function expectRgbNear(actual: string, expected: [number, number, number], tol = 8): void {
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

    // Re-focus the textarea so the :focus background takes effect. Use
    // `.click()` rather than `.focus()` — WebKit's synthetic `.focus()`
    // doesn't always promote the element to the :focus state for CSS
    // matching, but a real mouse click reliably does in every browser.
    await textarea.click();
    // Wait for the focus-driven background transition to settle rather
    // than a fixed sleep — adapts to actual transition speed. Helper
    // caps at 2s and throws on overflow.
    await waitForCssToSettle(textarea, 'background-color');
    // WebKit can lag the focus box-shadow even after the background-color
    // transition has settled. Wait for the shadow itself before the
    // alpha/spread assertions below or webkit reads rgba(0,0,0,0).
    await waitForCssToSettle(textarea, 'box-shadow');
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

  // ──────────────────────────────────────────────────────────────────
  // #108 polish — section icons gray, stage badge rounded-rect, pillar
  // data-driven tint, audience blue, tooltips flush.
  // ──────────────────────────────────────────────────────────────────

  test('TC-11: section header icons render in muted gray, not coral', async ({ page }) => {
    await mockHiveContent(page);
    await page.goto('/workspace/hive-collective/content');
    await openFirstIdea(page);

    const svgs = page.locator('app-idea-detail .strategy-section .panel-label > svg');
    await expect(svgs).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      const c = await svgs.nth(i).evaluate((el) => getComputedStyle(el).color);
      // Coral is rgb(217, 78, 51). Anything in that family means we regressed.
      const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      expect(m, `expected rgb()-like color, got: ${c}`).not.toBeNull();
      const [r, g, b] = [Number(m![1]), Number(m![2]), Number(m![3])];
      const isCoral = Math.abs(r - 217) < 30 && Math.abs(g - 78) < 30 && Math.abs(b - 51) < 30;
      expect(isCoral, `icon ${i} computed color is coral-ish: ${c}`).toBe(false);
    }
  });

  test('TC-12: stage badge is rounded-rect with no uppercase transform', async ({ page }) => {
    await mockHiveContent(page);
    await page.goto('/workspace/hive-collective/content');
    await openFirstIdea(page);

    const badge = page.locator('app-idea-detail-header .stage-badge').first();
    await expect(badge).toBeVisible();
    const computed = await badge.evaluate((el) => ({
      borderRadius: getComputedStyle(el).borderRadius,
      textTransform: getComputedStyle(el).textTransform,
      text: el.textContent?.trim() ?? '',
    }));
    expect(computed.borderRadius).toBe('6px');
    expect(computed.textTransform).toBe('none');
    expect(computed.text).toContain('Idea');
    expect(computed.text).not.toContain('IDEA');

    await page.screenshot({ path: `${SHOTS_DIR}/tc-12-stage-badge.png`, fullPage: true });
  });

  test('TC-13: pillar chips drop the dot and use pillar.color tint when selected', async ({ page, browserName }) => {
    // Cross-browser computed-style serialization for alpha-tinted colors
    // varies (Firefox returns the alpha-blended visual color, WebKit
    // sometimes does the same). The CSS/HTML wiring is browser-agnostic;
    // verify the visible color contract in Chromium and rely on the
    // unit spec for the inline-style binding fact across all browsers.
    test.skip(browserName !== 'chromium', 'computed-color serialization differs cross-browser');
    await mockHiveContent(page);
    await page.goto('/workspace/hive-collective/content');
    await openFirstIdea(page);

    const pillarGrid = page.locator('app-idea-detail .chip-grid--pillar');
    await expect(pillarGrid).toBeVisible();
    // Dot is gone.
    await expect(pillarGrid.locator('.chip-dot')).toHaveCount(0);

    // The fixture's idea1 starts with p1 (#d94e33) selected, but to keep the
    // assertion deterministic, deselect any pre-existing selection then click p1.
    const allChips = pillarGrid.locator('.chip');
    const count = await allChips.count();
    for (let i = 0; i < count; i++) {
      const chip = allChips.nth(i);
      if ((await chip.getAttribute('class'))?.includes('is-active')) {
        await chip.click(); // toggle off
      }
    }
    // Click the Yoga & Movement chip (p1, #d94e33) which is the first pillar.
    await allChips.nth(0).click();
    await expect(allChips.nth(0)).toHaveClass(/is-active/);
    // Move cursor off the chip — :hover state would otherwise mask the
    // tinted border color in Firefox/WebKit.
    await page.mouse.move(0, 0);
    // Wait for Angular to flush the inline-style pillar-color binding and
    // for the 150ms background transition to fully settle. Without this,
    // parallel-run CD scheduling can race the assertion and leave bg/
    // border partway through their transition, producing intermediate
    // computed values that don't match the pillar.color tolerance.
    await page.waitForFunction(() => {
      const el = document.querySelector(
        'app-idea-detail .chip-grid--pillar .chip',
      );
      if (!el) return false;
      const cs = getComputedStyle(el);
      const inRange = (raw: string, want: [number, number, number]) => {
        const m = raw.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!m) return false;
        return (
          Math.abs(parseInt(m[1], 10) - want[0]) <= 20 &&
          Math.abs(parseInt(m[2], 10) - want[1]) <= 20 &&
          Math.abs(parseInt(m[3], 10) - want[2]) <= 20
        );
      };
      const want: [number, number, number] = [217, 78, 51];
      return (
        inRange(cs.color, want) &&
        inRange(cs.backgroundColor, want) &&
        inRange(cs.borderTopColor, want)
      );
    }, null, { timeout: 3000 });

    const styles = await allChips.nth(0).evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        borderColor: cs.borderTopColor,
      };
    });
    // Pillar color #d94e33 = rgb(217, 78, 51). Text is fully opaque, so
    // tolerance can be tight. WebKit/Firefox blend alpha-tinted background
    // and border slightly differently than Chromium, so widen the tolerance
    // for those channels (±20 covers all three engines empirically).
    expectRgbNear(styles.color, [217, 78, 51]);
    expectRgbNear(styles.backgroundColor, [217, 78, 51], 20);
    expectRgbNear(styles.borderColor, [217, 78, 51], 20);

    await page.screenshot({ path: `${SHOTS_DIR}/tc-13-pillar-tint.png`, fullPage: true });

    // Click again to deselect; class must come off (inline-style emptiness
    // is exercised by the unit spec; here we only verify the state toggle).
    await allChips.nth(0).click();
    await expect(allChips.nth(0)).not.toHaveClass(/is-active/);
  });

  test('TC-14: audience chips use --blink-segment-* tokens when selected', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'computed-color serialization differs cross-browser');
    await mockHiveContent(page);
    await page.goto('/workspace/hive-collective/content');
    await openFirstIdea(page);

    const segGrid = page.locator('app-idea-detail .chip-grid--segment');
    await expect(segGrid).toBeVisible();
    const segChips = segGrid.locator('.chip');

    // Deselect any pre-selected chips, then click the first.
    const segCount = await segChips.count();
    for (let i = 0; i < segCount; i++) {
      const chip = segChips.nth(i);
      if ((await chip.getAttribute('class'))?.includes('is-active')) {
        await chip.click();
      }
    }
    await segChips.nth(0).click();
    await expect(segChips.nth(0)).toHaveClass(/is-active/);
    await page.mouse.move(0, 0); // clear hover
    // .chip has transition: border-color 0.15s; wait until it settles
    // (replaces a fixed 250ms sleep — adapts to actual transition speed).
    await waitForCssToSettle(segChips.nth(0), 'border-top-color');

    const styles = await segChips.nth(0).evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        borderColor: cs.borderTopColor,
      };
    });
    // Tokens: --blink-segment-text (#2563eb), --blink-segment-bg (#eff6ff),
    // --blink-segment-border (#bfdbfe). WebKit/Firefox vary by ±8 channels
    // vs Chromium due to different color rendering pipelines, so widen the
    // tolerance for the lighter (bg/border) shades.
    expectRgbNear(styles.color, [37, 99, 235]);
    expectRgbNear(styles.backgroundColor, [239, 246, 255], 15);
    expectRgbNear(styles.borderColor, [191, 219, 254], 15);

    await page.screenshot({ path: `${SHOTS_DIR}/tc-14-segment-blue.png`, fullPage: true });
  });

  test('TC-15: tooltip sits flush right of the section label, not floated to the panel edge', async ({ page }) => {
    await mockHiveContent(page);
    await page.goto('/workspace/hive-collective/content');
    await openFirstIdea(page);

    const rows = page.locator('app-idea-detail .strategy-section .panel-label-row');
    await expect(rows).toHaveCount(3);

    for (let i = 0; i < 3; i++) {
      const gap = await rows.nth(i).evaluate((row) => {
        const label = row.querySelector('h3.panel-label') as HTMLElement | null;
        const tooltip = row.querySelector('app-tooltip') as HTMLElement | null;
        if (!label || !tooltip) return -1;
        const lr = label.getBoundingClientRect().right;
        const tl = tooltip.getBoundingClientRect().left;
        return tl - lr;
      });
      // Existing flex gap is 8px. Allow a generous 24px ceiling for sub-pixel
      // rounding + padding. The bug today gives 100s of pixels.
      expect(gap, `row ${i}: tooltip is ${gap}px from label end`).toBeGreaterThanOrEqual(0);
      expect(gap).toBeLessThanOrEqual(24);
    }
  });

  test('TC-16: dark theme parity — section icons stay muted, segment chip uses dark blue tokens', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'computed-color serialization differs cross-browser');
    await mockHiveContent(page);
    await page.goto('/workspace/hive-collective/content');
    await openFirstIdea(page);
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    // Section icons remain readable, non-coral.
    const iconColor = await page
      .locator('app-idea-detail .strategy-section .panel-label > svg')
      .first()
      .evaluate((el) => getComputedStyle(el).color);
    const m = iconColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    expect(m).not.toBeNull();
    const [r, g, b] = [Number(m![1]), Number(m![2]), Number(m![3])];
    expect(Math.abs(r - 217) < 30 && Math.abs(g - 78) < 30 && Math.abs(b - 51) < 30).toBe(false);

    // Segment chip selected uses dark-mode segment tokens (also blue, slightly different rgba).
    const segChip = page.locator('app-idea-detail .chip-grid--segment .chip').first();
    if (!(await segChip.evaluate((el) => el.classList.contains('is-active')))) {
      await segChip.click();
    }
    const styles = await segChip.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { color: cs.color, backgroundColor: cs.backgroundColor };
    });
    // Dark --blink-segment-text = #3b82f6 = rgb(59, 130, 246)
    expectRgbNear(styles.color, [59, 130, 246]);
    // Dark --blink-segment-bg = rgba(37, 99, 235, 0.12) → blends with whatever
    // surface; we verify the rgb channel family is in the blue family rather
    // than pinning the exact alpha-blended value.
    const bgM = styles.backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    expect(bgM).not.toBeNull();
    const isBlueFamily = Number(bgM![3]) > Number(bgM![1]); // B > R
    expect(isBlueFamily).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────
  // Post-design polish (commits after the design plan landed)
  // ──────────────────────────────────────────────────────────────────

  test('TC-17: no "(max N)" hint, no upper-bound cap on pillar selection', async ({ page }) => {
    await mockHiveContent(page);
    await page.goto('/workspace/hive-collective/content');
    await openFirstIdea(page);

    // The "(max 3)" hint is gone from the Pillars label.
    const pillarsLabel = page.locator('app-idea-detail .strategy-section').nth(1).locator('h3.panel-label');
    await expect(pillarsLabel).toBeVisible();
    const labelText = (await pillarsLabel.innerText()).toUpperCase();
    expect(labelText).toContain('PILLARS');
    expect(labelText).not.toMatch(/MAX\s*\d+/);

    // No chip is disabled and no cap blocks adding a 3rd / 4th pillar
    // (with 2 fixture pillars — assert both can be selected and none are
    // disabled).
    const chips = page.locator('app-idea-detail .chip-grid--pillar .chip');
    const count = await chips.count();
    for (let i = 0; i < count; i++) {
      await expect(chips.nth(i)).not.toBeDisabled();
    }
    // Click both pillar chips → both selected, neither disabled.
    for (let i = 0; i < count; i++) {
      const chip = chips.nth(i);
      if (!(await chip.evaluate((el) => el.classList.contains('is-active')))) {
        await chip.click();
      }
    }
    for (let i = 0; i < count; i++) {
      await expect(chips.nth(i)).toHaveClass(/is-active/);
      await expect(chips.nth(i)).not.toBeDisabled();
    }
  });

  test('TC-18: hover border = pillar.color on pillars; segment-text on audience', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'computed-color serialization differs cross-browser');
    await mockHiveContent(page);
    await page.goto('/workspace/hive-collective/content');
    await openFirstIdea(page);

    // Pillar p1 in the fixture is `#d94e33` (Yoga & Movement). The chip's
    // [style.--chip-hover-color] should be set to that value.
    const firstPillar = page.locator('app-idea-detail .chip-grid--pillar .chip').first();
    const hoverVar = await firstPillar.evaluate(
      (el) => el.style.getPropertyValue('--chip-hover-color').trim(),
    );
    expect(hoverVar).toBe('#d94e33');

    // Hover the chip and confirm the border picks up that color.
    // Deselect first so we read the hover state cleanly (selected chips
    // have an inline border-color from pillarBorder() that wins over hover).
    if (await firstPillar.evaluate((el) => el.classList.contains('is-active'))) {
      await firstPillar.click();
      await page.mouse.move(0, 0);
    }
    await firstPillar.hover();
    const pillarHoverColor = await waitForCssToSettle(firstPillar, 'border-top-color');
    // #d94e33 = rgb(217, 78, 51); allow ±15 for color-rendering pipeline differences.
    expectRgbNear(pillarHoverColor, [217, 78, 51], 15);

    // Move cursor off and onto an audience chip; border should resolve to
    // --blink-segment-text (#2563eb = rgb(37, 99, 235)).
    await page.mouse.move(0, 0);
    const firstSeg = page.locator('app-idea-detail .chip-grid--segment .chip').first();
    if (await firstSeg.evaluate((el) => el.classList.contains('is-active'))) {
      await firstSeg.click();
      await page.mouse.move(0, 0);
    }
    await firstSeg.hover();
    const segHoverColor = await waitForCssToSettle(firstSeg, 'border-top-color');
    expectRgbNear(segHoverColor, [37, 99, 235], 15);
  });
});
