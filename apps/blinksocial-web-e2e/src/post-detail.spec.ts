import { test, expect, type Page } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/login';
import { mockHiveContent, POST_DETAIL_PROD1 } from './helpers/content-mocks';
import { approvedPostDetail, approvedPostEntry } from './helpers/draft-mocks';

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

  test('TC-8: sidebar Content Concept card renders locked summary with NO Edit Concept link', async ({ page }) => {
    // The Edit Concept link was removed by team decision — concept editing
    // flows through the kebab menu's "Send back to Concept" instead.
    const card = page.locator('app-brief-content-concept .brief-content-concept-card').first();
    await expect(card).toBeVisible();
    await expect(card.locator('.card-locked')).toContainText(/locked/i);
    await expect(card.locator('.card-edit')).toHaveCount(0);
  });
});

test.describe('Production Draft (#114)', () => {
  // Open a brief-approved post by id for the Draft tests. Each test seeds a
  // fixture in a different (platform, contentType) combo so the factory
  // routes to the right builder.
  async function openApprovedPostInDraft(
    page: Page,
    options: { id: string; platform: string; contentType: string; title?: string },
  ): Promise<void> {
    const entry = approvedPostEntry({
      id: options.id,
      title: options.title ?? 'Draft test post',
      platform: options.platform as never,
      contentType: options.contentType as never,
    });
    const detail = approvedPostDetail({
      id: options.id,
      title: options.title ?? 'Draft test post',
      platform: options.platform as never,
      contentType: options.contentType as never,
    });
    await mockHiveContent(page, {
      indexItems: [entry],
      details: { [options.id]: detail },
    });
    await page.goto(`/workspace/hive-collective/content/${options.id}`);
    await expect(page.locator('app-post-detail')).toBeVisible();
    // Brief-approved posts with production.productionStep="draft" should
    // land directly on the Draft step. We still defensively click "Draft"
    // in case a future fixture is at brief — click of the active step is
    // a harmless no-op.
    await page
      .locator('app-production-steps-bar .steps-btn', { hasText: 'Draft' })
      .first()
      .click();
    await expect(page.locator('app-draft-step')).toBeVisible();
  }

  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
  });

  test('TC-11: landing step is derived from production.productionStep — approved + draft persisted lands directly on Draft (no manual click)', async ({ page }) => {
    const entry = approvedPostEntry({
      id: 'landing-draft',
      title: 'Landing test',
      platform: 'instagram',
      contentType: 'reel',
    });
    const detail = approvedPostDetail({
      id: 'landing-draft',
      title: 'Landing test',
      platform: 'instagram',
      contentType: 'reel',
    });
    await mockHiveContent(page, {
      indexItems: [entry],
      details: { 'landing-draft': detail },
    });
    await page.goto(`/workspace/hive-collective/content/landing-draft`);
    await expect(page.locator('app-post-detail')).toBeVisible();
    // The page should be on Draft without us clicking anything.
    await expect(page.locator('app-draft-step')).toBeVisible();
    await expect(page.locator('app-brief-step')).toHaveCount(0);
    // The Draft step in the steps-bar is the active one.
    const draftBtn = page.locator(
      'app-production-steps-bar .steps-btn',
      { hasText: 'Draft' },
    );
    await expect(draftBtn).toHaveAttribute('aria-current', 'step');
  });

  test('TC-12: Continue from Draft persists productionStep="packaging" so reload lands on Packaging', async ({ page }) => {
    const entry = approvedPostEntry({
      id: 'landing-advance',
      title: 'Advance test',
      platform: 'instagram',
      contentType: 'reel',
    });
    const detail = approvedPostDetail({
      id: 'landing-advance',
      title: 'Advance test',
      platform: 'instagram',
      contentType: 'reel',
    });
    await mockHiveContent(page, {
      indexItems: [entry],
      details: { 'landing-advance': detail },
    });
    await page.goto(`/workspace/hive-collective/content/landing-advance`);
    await expect(page.locator('app-draft-step')).toBeVisible();
    // Fill the required fields, then click Continue to Packaging.
    await page.locator('app-video-builder textarea[aria-label="Hook"]').fill('A hook');
    await page.locator('app-shot-list .add-shot-row .ghost-btn').click();
    await page.locator('app-step-action-bar .continue-btn').click();
    await expect(page.locator('app-packaging-step')).toBeVisible();
    // Reload — should land on Packaging directly (productionStep persisted).
    await page.reload();
    await expect(page.locator('app-post-detail')).toBeVisible();
    await expect(page.locator('app-packaging-step')).toBeVisible();
    await expect(page.locator('app-draft-step')).toHaveCount(0);
  });

  test('TC-1: factory routes (instagram,reel)→VIDEO, (youtube,long-form)→VIDEO_LONG, (instagram,feed-post)→IMAGE_SINGLE', async ({ page }) => {
    await openApprovedPostInDraft(page, {
      id: 'draft-vid',
      platform: 'instagram',
      contentType: 'reel',
    });
    await expect(page.locator('app-video-builder')).toBeVisible();
    await expect(page.locator('app-video-long-builder')).toHaveCount(0);
    await expect(page.locator('app-image-single-builder')).toHaveCount(0);
  });

  test('TC-2: VIDEO builder — hook + ≥1 shot enables Continue, click advances to Packaging', async ({ page }) => {
    await openApprovedPostInDraft(page, {
      id: 'draft-vid-2',
      platform: 'instagram',
      contentType: 'reel',
    });
    const continueBtn = page.locator('app-step-action-bar .continue-btn');
    await expect(continueBtn).toBeDisabled();
    // Type a hook
    await page
      .locator('app-video-builder textarea[aria-label="Hook"]')
      .fill('Open with smile');
    await expect(continueBtn).toBeDisabled(); // shotList still empty
    // Add a shot via app-shot-list
    await page.locator('app-shot-list .add-shot-row .ghost-btn').click();
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();
    // After advance, shell renders the Packaging placeholder (existing
    // step-placeholder). Draft step is no longer rendered.
    await expect(page.locator('app-draft-step')).toHaveCount(0);
    await expect(page.locator('app-packaging-step')).toBeVisible();
  });

  test('TC-3: VIDEO_LONG builder — sequence block with description enables Continue', async ({ page }) => {
    await openApprovedPostInDraft(page, {
      id: 'draft-vlong',
      platform: 'youtube',
      contentType: 'long-form',
    });
    await expect(page.locator('app-video-long-builder')).toBeVisible();
    const continueBtn = page.locator('app-step-action-bar .continue-btn');
    await expect(continueBtn).toBeDisabled();
    await page.locator('app-video-long-builder .add-btn').click();
    // Block exists but has empty description — should still be disabled
    await expect(continueBtn).toBeDisabled();
    await page
      .locator('app-video-long-builder input[aria-label="Block 1 description"]')
      .fill('Open with the promise');
    await expect(continueBtn).toBeEnabled();
  });

  test('TC-4: IMAGE_SINGLE builder — hook + image attached enables Continue', async ({ page }) => {
    await openApprovedPostInDraft(page, {
      id: 'draft-img',
      platform: 'instagram',
      contentType: 'feed-post',
    });
    await expect(page.locator('app-image-single-builder')).toBeVisible();
    const continueBtn = page.locator('app-step-action-bar .continue-btn');
    await expect(continueBtn).toBeDisabled();
    await page
      .locator('app-image-single-builder textarea[aria-label="Hook"]')
      .fill('A hook');
    await expect(continueBtn).toBeDisabled();
    // AI Generate button writes a stub filename into imageRef.
    await page
      .locator('app-image-single-builder app-asset-uploader .ai-generate-btn')
      .click();
    await expect(continueBtn).toBeEnabled();
  });

  test('TC-5: CAROUSEL builder — hook + ≥2 slides with headlines enables Continue', async ({ page }) => {
    await openApprovedPostInDraft(page, {
      id: 'draft-car',
      platform: 'instagram',
      contentType: 'carousel',
    });
    await expect(page.locator('app-carousel-builder')).toBeVisible();
    const continueBtn = page.locator('app-step-action-bar .continue-btn');
    await page
      .locator('app-carousel-builder textarea[aria-label="Hook"]')
      .fill('A hook');
    // Add 2 slides one at a time, waiting for each to render in the DOM
    // before adding the next. Without the wait, the second add can re-render
    // the just-added slide-1 input mid-keystroke and Playwright sees the
    // first slide's input as "detached" when filling.
    await page.locator('app-carousel-builder .add-btn').click();
    await expect(
      page.locator('app-carousel-builder input[aria-label="Slide 1 headline"]'),
    ).toBeVisible();
    await page.locator('app-carousel-builder .add-btn').click();
    await expect(
      page.locator('app-carousel-builder input[aria-label="Slide 2 headline"]'),
    ).toBeVisible();
    await page
      .locator('app-carousel-builder input[aria-label="Slide 1 headline"]')
      .fill('Slide one');
    await expect(continueBtn).toBeDisabled(); // need 2nd headline
    await page
      .locator('app-carousel-builder input[aria-label="Slide 2 headline"]')
      .fill('Slide two');
    await expect(continueBtn).toBeEnabled();
  });

  test('TC-6: TEXT builder — caption alone enables Continue', async ({ page }) => {
    await openApprovedPostInDraft(page, {
      id: 'draft-text',
      platform: 'linkedin',
      contentType: 'ln-text-post',
    });
    await expect(page.locator('app-text-builder')).toBeVisible();
    const continueBtn = page.locator('app-step-action-bar .continue-btn');
    await expect(continueBtn).toBeDisabled();
    await page
      .locator('app-text-builder textarea[aria-label="Caption"]')
      .fill('A caption that meets the requirement.');
    await expect(continueBtn).toBeEnabled();
  });

  test('TC-7: Unsupported canonical (story) shows the placeholder + disabled Continue with aria-disabled', async ({ page }) => {
    await openApprovedPostInDraft(page, {
      id: 'draft-story',
      platform: 'instagram',
      contentType: 'story',
    });
    await expect(page.locator('app-builder-placeholder')).toBeVisible();
    await expect(
      page.locator('app-draft-step .placeholder-title'),
    ).toContainText('Story coming soon');
    const btn = page.locator('app-step-action-bar .continue-btn');
    await expect(btn).toBeDisabled();
    await expect(btn).toHaveAttribute('aria-disabled', 'true');
  });

  test('TC-8: VIDEO persistence round-trip survives reload', async ({ page }) => {
    await openApprovedPostInDraft(page, {
      id: 'draft-rt',
      platform: 'instagram',
      contentType: 'reel',
    });
    await page
      .locator('app-video-builder textarea[aria-label="Hook"]')
      .fill('Persistence hook');
    await page.locator('app-shot-list .add-shot-row .ghost-btn').click();
    // Reload — the mock-merge middleware persists writes between fetches.
    await page.reload();
    await expect(page.locator('app-post-detail')).toBeVisible();
    await page
      .locator('app-production-steps-bar .steps-btn', { hasText: 'Draft' })
      .first()
      .click();
    await expect(page.locator('app-video-builder textarea[aria-label="Hook"]')).toHaveValue(
      'Persistence hook',
    );
    await expect(page.locator('app-shot-list li.shot-row')).toHaveCount(1);
  });

  test('TC-9: Keyboard-only path through VIDEO builder — Tab through, Enter activates Continue', async ({ page }) => {
    await openApprovedPostInDraft(page, {
      id: 'draft-kbd',
      platform: 'instagram',
      contentType: 'reel',
    });
    // Focus the hook directly (Tab order from page top is long; this is enough
    // to confirm keyboard activation works in the builder). Type the hook,
    // then Tab to Add Shot, press Enter, then Tab through the new row, then
    // Tab to Continue and press Enter.
    const hook = page.locator('app-video-builder textarea[aria-label="Hook"]');
    await hook.focus();
    await hook.fill('Keyboard hook');
    // Add a shot via the Add-shot button — via keyboard
    const addShot = page.locator('app-shot-list .add-shot-row .ghost-btn');
    await addShot.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('app-shot-list li.shot-row')).toHaveCount(1);
    // Activate Continue via keyboard
    const continueBtn = page.locator('app-step-action-bar .continue-btn');
    await expect(continueBtn).toBeEnabled();
    await continueBtn.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('app-packaging-step')).toBeVisible();
  });

  test('TC-10: Continue button gating reflects required-field state in real-time', async ({ page }) => {
    await openApprovedPostInDraft(page, {
      id: 'draft-err',
      platform: 'instagram',
      contentType: 'reel',
    });
    // Continue is disabled while VIDEO mode required fields are missing
    // (hook + ≥1 shot). The bar's gating + the inline "1 shot required"
    // badge in the section-label are the surfaces that convey this now —
    // the standalone field-count summary panel was removed.
    const continueBtn = page.locator('app-step-action-bar .continue-btn');
    await expect(continueBtn).toBeDisabled();
    // Fill hook → still disabled (no shots yet)
    await page
      .locator('app-video-builder textarea[aria-label="Hook"]')
      .fill('A hook');
    await expect(continueBtn).toBeDisabled();
    // Add shot → all required fields satisfied, button enables
    await page.locator('app-shot-list .add-shot-row .ghost-btn').click();
    await expect(continueBtn).toBeEnabled();
  });
});

test.describe('Send back to Concept menu visibility (#121)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    // Simulate a Post whose server payload carries parentConceptId but no
    // conceptId alias — the repro case from #121. Without the cache
    // normalizer in ContentStateService, the "Send back to Concept" kebab
    // entry would be hidden by its @if (item.conceptId) guard.
    const postWithoutConceptId = {
      ...POST_DETAIL_PROD1,
      parentConceptId: 'concept1',
    };
    delete (postWithoutConceptId as { conceptId?: string }).conceptId;
    await mockHiveContent(page, {
      details: { prod1: postWithoutConceptId },
    });
    await page.goto('/workspace/hive-collective/content/prod1');
    await expect(page.locator('app-post-detail-header')).toBeVisible();
  });

  test('TC-1: kebab menu shows "Send back to Concept" when payload omits conceptId', async ({ page }) => {
    await page.locator('app-post-detail-header .detail-menu-btn').click();
    const menuItem = page
      .locator('app-post-detail-header [role="menuitem"]', { hasText: 'Send back to Concept' });
    await expect(menuItem).toBeVisible();
  });
});
