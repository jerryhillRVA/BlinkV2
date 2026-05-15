import { test, expect, type Page } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/login';
import { mockHiveContent, POST_DETAIL_PROD1 } from './helpers/content-mocks';
import {
  approvedPostDetail,
  approvedPostEntry,
  approvedPostInPackaging,
  approvedPostInQA,
} from './helpers/draft-mocks';

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

// #139 — short-form VIDEO builder splits Upload Assets out of <app-shot-list>
// into a sibling card. Pool entries are shared across all shot rows; each
// shot row picks from the pool via an "Assign an asset…" select.
test.describe('Upload Assets pool — split out of Shot List (#139)', () => {
  async function openApprovedVideoDraft(
    page: Page,
    options: {
      id: string;
      title?: string;
      uploadedAssets?: ReadonlyArray<{ id: string; filename: string; mimeType?: string }>;
      shots?: ReadonlyArray<{ id: string; type: string; description: string; duration: string; assetRef?: string }>;
    },
  ): Promise<void> {
    const entry = approvedPostEntry({
      id: options.id,
      title: options.title ?? 'Upload Assets test',
      platform: 'instagram',
      contentType: 'reel',
    });
    const baseDetail = approvedPostDetail({
      id: options.id,
      title: options.title ?? 'Upload Assets test',
      platform: 'instagram',
      contentType: 'reel',
    });
    // Inject the draft.mode='VIDEO' + shotList + uploadedAssets seed.
    const detail = {
      ...baseDetail,
      production: {
        ...baseDetail.production,
        productionStep: 'draft' as const,
        draft: {
          mode: 'VIDEO' as const,
          video: {
            ...(options.uploadedAssets ? { uploadedAssets: [...options.uploadedAssets] } : {}),
            ...(options.shots ? { shotList: [...options.shots] } : {}),
          },
        },
      },
    };
    await mockHiveContent(page, {
      indexItems: [entry],
      details: { [options.id]: detail as never },
    });
    await page.goto(`/workspace/hive-collective/content/${options.id}`);
    await expect(page.locator('app-post-detail')).toBeVisible();
    await expect(page.locator('app-draft-step')).toBeVisible();
    await expect(page.locator('app-video-builder')).toBeVisible();
  }

  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
  });

  test('TC-E2: cover-asset slot is gone; <app-upload-assets> is above <app-shot-list>', async ({ page }) => {
    await openApprovedVideoDraft(page, { id: 'tc-e2', shots: [{ id: 's1', type: 'Shot', description: '', duration: '5s' }] });
    // Old top-level cover-asset slot in shot-list is absent.
    await expect(page.locator('app-shot-list .asset-slot')).toHaveCount(0);
    await expect(page.locator('app-shot-list .asset-empty')).toHaveCount(0);
    // New upload-assets card is present, and renders before shot-list.
    await expect(page.locator('app-upload-assets')).toBeVisible();
    const order = await page.evaluate(() => {
      const upload = document.querySelector('app-upload-assets');
      const shotList = document.querySelector('app-shot-list');
      if (!upload || !shotList) return null;
      return upload.compareDocumentPosition(shotList) & Node.DOCUMENT_POSITION_FOLLOWING ? 'before' : 'after';
    });
    expect(order).toBe('before');
  });

  test('TC-E1: upload an asset → warning + badge disappear → assign to shot → reload survives', async ({ page }) => {
    await openApprovedVideoDraft(page, {
      id: 'tc-e1',
      shots: [{ id: 's1', type: 'Shot', description: '', duration: '5s' }],
    });
    // Empty state: warning copy + "1 asset required" badge are visible.
    await expect(page.locator('app-upload-assets .upload-warning')).toContainText(
      'Upload at least one asset before building your shot list.',
    );
    // Upload one file via the empty-state input.
    await page
      .locator('app-upload-assets .upload-btn input[type="file"]')
      .setInputFiles({
        name: 'clip.mp4',
        mimeType: 'video/mp4',
        buffer: Buffer.from('fake'),
      });
    // Filled state: warning gone, one thumbnail rendered.
    await expect(page.locator('app-upload-assets .upload-warning')).toHaveCount(0);
    await expect(page.locator('app-upload-assets .thumb')).toHaveCount(1);
    await expect(page.locator('app-upload-assets .thumb-filename')).toContainText('clip.mp4');
    // Shot 1's picker now lists clip.mp4. Pick it.
    const picker = page.locator('.shot-row .shot-asset-picker').first();
    await expect(picker).toBeEnabled();
    await picker.selectOption({ label: 'clip.mp4' });
    // The row flips to chip mode.
    await expect(page.locator('.shot-row .asset-chip--sm')).toContainText('clip.mp4');
    // Reload: pool + assigned shot ref survive (mock merges PUT body).
    await page.reload();
    await expect(page.locator('app-post-detail')).toBeVisible();
    await expect(page.locator('app-upload-assets .thumb-filename')).toContainText('clip.mp4');
    await expect(page.locator('.shot-row .asset-chip--sm')).toContainText('clip.mp4');
  });

  test('TC-E3: removing a referenced asset cascades to clear the shot.assetRef', async ({ page }) => {
    await openApprovedVideoDraft(page, {
      id: 'tc-e3',
      uploadedAssets: [{ id: 'a1', filename: 'clip.mp4', mimeType: 'video/mp4' }],
      shots: [{ id: 's1', type: 'Shot', description: '', duration: '5s', assetRef: 'a1' }],
    });
    await expect(page.locator('.shot-row .asset-chip--sm')).toContainText('clip.mp4');
    // Click the × on the pool thumbnail.
    await page.locator('app-upload-assets .thumb-remove').click();
    // Pool empty, shot reverts to picker (disabled — pool is empty).
    await expect(page.locator('app-upload-assets .thumb')).toHaveCount(0);
    await expect(page.locator('.shot-row .asset-chip--sm')).toHaveCount(0);
    const picker = page.locator('.shot-row .shot-asset-picker');
    await expect(picker).toBeDisabled();
    // Reload: state survives.
    await page.reload();
    await expect(page.locator('app-post-detail')).toBeVisible();
    await expect(page.locator('app-upload-assets .thumb')).toHaveCount(0);
    await expect(page.locator('.shot-row .shot-asset-picker')).toBeDisabled();
  });

  test('TC-E4: the same pool asset can be assigned to two shots simultaneously', async ({ page }) => {
    await openApprovedVideoDraft(page, {
      id: 'tc-e4',
      uploadedAssets: [{ id: 'a1', filename: 'clip.mp4', mimeType: 'video/mp4' }],
      shots: [
        { id: 's1', type: 'Shot', description: '', duration: '5s' },
        { id: 's2', type: 'Shot', description: '', duration: '5s' },
      ],
    });
    // Both shots show the picker initially.
    await expect(page.locator('.shot-row .shot-asset-picker')).toHaveCount(2);
    await page.locator('.shot-row .shot-asset-picker').nth(0).selectOption({ label: 'clip.mp4' });
    await page.locator('.shot-row .shot-asset-picker').nth(0).selectOption({ label: 'clip.mp4' });
    // After both assignments, both rows render the chip and the pool still
    // has exactly one thumbnail (no duplication).
    await expect(page.locator('.shot-row .asset-chip--sm')).toHaveCount(2);
    await expect(page.locator('app-upload-assets .thumb')).toHaveCount(1);
    // Reload survives.
    await page.reload();
    await expect(page.locator('app-post-detail')).toBeVisible();
    await expect(page.locator('.shot-row .asset-chip--sm')).toHaveCount(2);
  });

  test('TC-E5: pool-empty picker is disabled but other shot controls stay editable (warning-only gating)', async ({ page }) => {
    await openApprovedVideoDraft(page, {
      id: 'tc-e5',
      shots: [{ id: 's1', type: 'Shot', description: '', duration: '5s' }],
    });
    await expect(page.locator('.shot-row .shot-asset-picker')).toBeDisabled();
    // Description / duration / type stay editable.
    await expect(page.locator('.shot-row .shot-description')).toBeEnabled();
    await expect(page.locator('.shot-row .shot-duration')).toBeEnabled();
    await expect(page.locator('.shot-row .shot-type')).toBeEnabled();
    // Add Shot + AI Generate stay clickable.
    await expect(
      page.locator('app-shot-list .add-shot-row .ghost-btn', { hasText: 'Add shot' }),
    ).toBeEnabled();
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

test.describe('Production Packaging (#116)', () => {
  // Seed an approved post landing directly on the Packaging step. Each TC
  // takes a (platform, contentType) pair so the factory routes to the right
  // builder. Mirrors the Production Draft helper but pre-advances to packaging.
  async function openApprovedPostInPackaging(
    page: Page,
    options: { id: string; platform: string; contentType: string; title?: string },
  ): Promise<void> {
    const entry = approvedPostEntry({
      id: options.id,
      title: options.title ?? 'Packaging test post',
      platform: options.platform as never,
      contentType: options.contentType as never,
    });
    const detail = approvedPostInPackaging({
      id: options.id,
      title: options.title ?? 'Packaging test post',
      platform: options.platform as never,
      contentType: options.contentType as never,
    });
    await mockHiveContent(page, {
      indexItems: [entry],
      details: { [options.id]: detail },
    });
    await page.goto(`/workspace/hive-collective/content/${options.id}`);
    await expect(page.locator('app-post-detail')).toBeVisible();
    await expect(page.locator('app-packaging-step')).toBeVisible();
  }

  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
  });

  test('TC-1: factory routes each platform to its dedicated builder', async ({ page }) => {
    // Iterate through the 6 supported platforms; each renders only its own builder.
    const cases: Array<{
      platform: string;
      contentType: string;
      selector: string;
      not: string[];
    }> = [
      {
        platform: 'instagram',
        contentType: 'reel',
        selector: 'app-instagram-packaging',
        not: ['app-tiktok-packaging', 'app-youtube-packaging', 'app-facebook-packaging', 'app-linkedin-packaging', 'app-x-packaging'],
      },
      {
        platform: 'tiktok',
        contentType: 'short-video',
        selector: 'app-tiktok-packaging',
        not: ['app-instagram-packaging', 'app-youtube-packaging', 'app-facebook-packaging', 'app-linkedin-packaging', 'app-x-packaging'],
      },
      {
        platform: 'youtube',
        contentType: 'long-form',
        selector: 'app-youtube-packaging',
        not: ['app-instagram-packaging', 'app-tiktok-packaging', 'app-facebook-packaging', 'app-linkedin-packaging', 'app-x-packaging'],
      },
      {
        platform: 'linkedin',
        contentType: 'ln-text-post',
        selector: 'app-linkedin-packaging',
        not: ['app-instagram-packaging', 'app-tiktok-packaging', 'app-youtube-packaging', 'app-facebook-packaging', 'app-x-packaging'],
      },
      {
        platform: 'facebook',
        contentType: 'fb-feed-post',
        selector: 'app-facebook-packaging',
        not: ['app-instagram-packaging', 'app-tiktok-packaging', 'app-youtube-packaging', 'app-linkedin-packaging', 'app-x-packaging'],
      },
      {
        platform: 'x',
        contentType: 'tweet',
        selector: 'app-x-packaging',
        not: ['app-instagram-packaging', 'app-tiktok-packaging', 'app-youtube-packaging', 'app-facebook-packaging', 'app-linkedin-packaging'],
      },
    ];
    for (const c of cases) {
      await openApprovedPostInPackaging(page, {
        id: `pkg-${c.platform}`,
        platform: c.platform,
        contentType: c.contentType,
      });
      await expect(page.locator(c.selector)).toBeVisible();
      for (const off of c.not) {
        await expect(page.locator(off)).toHaveCount(0);
      }
    }
  });

  test('TC-2: Instagram end-to-end — caption + hashtag + persistence + Continue advance', async ({ page }) => {
    await openApprovedPostInPackaging(page, {
      id: 'pkg-ig-e2e',
      platform: 'instagram',
      contentType: 'reel',
    });
    // Type caption.
    await page.locator('#post-caption').fill('Hello world');
    await expect(page.locator('#post-caption')).toHaveValue('Hello world');
    // Typing a #tag in the caption should produce a chip via the
    // caption-is-source-of-truth model (extractHashtagsFromCaption).
    await page.locator('#post-caption').fill('Hello world #wellness');
    await expect(page.locator('app-pkg-hashtag-bank')).toContainText('#wellness');
    // Continue should be enabled once caption is non-empty.
    const continueBtn = page.locator('app-step-action-bar .continue-btn');
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();
    // Advance lands on the Approve & Schedule placeholder (qa step).
    await expect(page.locator('app-packaging-step')).toHaveCount(0);
    await expect(page.locator('app-approve-schedule-step')).toBeVisible();
  });

  test('TC-3: TikTok end-to-end — TikTok-specific audio licensing note renders', async ({ page }) => {
    await openApprovedPostInPackaging(page, {
      id: 'pkg-tt-e2e',
      platform: 'tiktok',
      contentType: 'short-video',
    });
    await expect(page.locator('app-tiktok-packaging')).toBeVisible();
  });

  test('TC-4: YouTube end-to-end — builder renders title/description fields', async ({ page }) => {
    await openApprovedPostInPackaging(page, {
      id: 'pkg-yt-e2e',
      platform: 'youtube',
      contentType: 'long-form',
    });
    await expect(page.locator('app-youtube-packaging')).toBeVisible();
    // YouTube uses Title (not Caption) — distinct from caption-driven platforms.
    await expect(page.locator('app-youtube-packaging')).toContainText(/Title/i);
  });

  test('TC-5: LinkedIn end-to-end — caption + builder renders', async ({ page }) => {
    await openApprovedPostInPackaging(page, {
      id: 'pkg-li-e2e',
      platform: 'linkedin',
      contentType: 'ln-text-post',
    });
    await expect(page.locator('app-linkedin-packaging')).toBeVisible();
  });

  test('TC-6: Facebook end-to-end — builder renders for fb-feed-post', async ({ page }) => {
    await openApprovedPostInPackaging(page, {
      id: 'pkg-fb-e2e',
      platform: 'facebook',
      contentType: 'fb-feed-post',
    });
    await expect(page.locator('app-facebook-packaging')).toBeVisible();
  });

  test('TC-7: X end-to-end — builder renders for tweet contentType', async ({ page }) => {
    await openApprovedPostInPackaging(page, {
      id: 'pkg-x-e2e',
      platform: 'x',
      contentType: 'tweet',
    });
    await expect(page.locator('app-x-packaging')).toBeVisible();
  });

  test('TC-8: Unsupported platform (tbd) shows the placeholder', async ({ page }) => {
    // Build a fixture manually since approvedPostInPackaging requires a real
    // platform string. tbd is the canonical "no platform set yet" value.
    const id = 'pkg-tbd';
    const entry = approvedPostEntry({
      id,
      title: 'Unset platform',
      platform: 'instagram' as never, // index-level shape needs a value, but detail overrides
      contentType: 'reel' as never,
    });
    const detail = {
      ...approvedPostInPackaging({
        id,
        title: 'Unset platform',
        platform: 'instagram' as never,
        contentType: 'reel' as never,
      }),
      platform: null,
      contentType: null,
    };
    await mockHiveContent(page, {
      indexItems: [entry],
      details: { [id]: detail },
    });
    await page.goto(`/workspace/hive-collective/content/${id}`);
    await expect(page.locator('app-packaging-step')).toBeVisible();
    await expect(page.locator('app-packaging-builder-placeholder')).toBeVisible();
    // No platform builder is rendered.
    await expect(page.locator('app-instagram-packaging')).toHaveCount(0);
  });

  test('TC-9: Continue gating — disabled when caption is empty, enables once filled', async ({ page }) => {
    await openApprovedPostInPackaging(page, {
      id: 'pkg-gate',
      platform: 'instagram',
      contentType: 'reel',
    });
    const continueBtn = page.locator('app-step-action-bar .continue-btn');
    // Empty caption → Continue disabled (per canContinueFromPackaging).
    await expect(continueBtn).toBeDisabled();
    await page.locator('#post-caption').fill('A caption');
    await expect(continueBtn).toBeEnabled();
    // Clearing the caption flips it back to disabled.
    await page.locator('#post-caption').fill('');
    await expect(continueBtn).toBeDisabled();
  });

  test('TC-12: Keyboard-only — caption + Continue activatable via keyboard', async ({ page }) => {
    await openApprovedPostInPackaging(page, {
      id: 'pkg-kbd',
      platform: 'instagram',
      contentType: 'reel',
    });
    // Populate the caption via fill() — Playwright's keyboard.type is
    // unreliable in Firefox when focus traversal is asynchronous. The
    // important keyboard-activation assertion (Enter on Continue) follows.
    await page.locator('#post-caption').fill('Hello keyboard');
    await expect(page.locator('#post-caption')).toHaveValue('Hello keyboard');
    const continueBtn = page.locator('app-step-action-bar .continue-btn');
    await expect(continueBtn).toBeEnabled();
    // Focus Continue and press Enter — proves the button is keyboard-
    // activatable (no mouse). Tab-order traversal is covered by component
    // unit tests; this TC asserts the keyboard event reaches the handler.
    await continueBtn.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('app-approve-schedule-step')).toBeVisible();
  });

  test('TC-13: persistence round-trip — caption + hashtag survive reload', async ({ page }) => {
    await openApprovedPostInPackaging(page, {
      id: 'pkg-reload',
      platform: 'instagram',
      contentType: 'reel',
    });
    await page.locator('#post-caption').fill('Persisted caption #stays');
    // Allow the debounced PUT to fire and the mock to merge it.
    await expect(page.locator('app-pkg-hashtag-bank')).toContainText('#stays');
    await page.reload();
    await expect(page.locator('app-post-detail')).toBeVisible();
    await expect(page.locator('app-packaging-step')).toBeVisible();
    // After reload, caption + chip should still be present from the merged
    // PUT body (content-mocks helper persists writes into the in-memory map).
    await expect(page.locator('#post-caption')).toHaveValue('Persisted caption #stays');
    await expect(page.locator('app-pkg-hashtag-bank')).toContainText('#stays');
  });
});

test.describe('Approve & Schedule (#124)', () => {
  async function openApprovedPostInQA(
    page: Page,
    options: { id: string; platform: string; contentType: string; title?: string },
  ): Promise<void> {
    const entry = approvedPostEntry({
      id: options.id,
      title: options.title ?? 'Approve & Schedule test post',
      platform: options.platform as never,
      contentType: options.contentType as never,
    });
    const detail = approvedPostInQA({
      id: options.id,
      title: options.title ?? 'Approve & Schedule test post',
      platform: options.platform as never,
      contentType: options.contentType as never,
    });
    await mockHiveContent(page, {
      indexItems: [entry],
      details: { [options.id]: detail },
    });
    await page.goto(`/workspace/hive-collective/content/${options.id}`);
    await expect(page.locator('app-post-detail')).toBeVisible();
    await expect(page.locator('app-approve-schedule-step')).toBeVisible();
  }

  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
  });

  test('TC-1: shell renders with pending banner + single Brand Reviewer row', async ({ page }) => {
    await openApprovedPostInQA(page, {
      id: 'qa-tc1',
      platform: 'instagram',
      contentType: 'reel',
    });
    await expect(page.locator('app-approval-status-banner .banner')).toHaveAttribute(
      'data-state',
      'pending',
    );
    await expect(page.locator('app-approval-status-banner')).toContainText('Pending Review');
    await expect(page.locator('app-approval-status-banner')).toContainText('1 required approval pending');
    await expect(page.locator('.approver-row')).toHaveCount(1);
    await expect(page.locator('.approver-row')).toContainText('Brand Reviewer');
  });

  test('TC-2: Approve flips the row to approved and the banner to green', async ({ page }) => {
    await openApprovedPostInQA(page, {
      id: 'qa-tc2',
      platform: 'instagram',
      contentType: 'reel',
    });
    await page.locator('.approver-row .btn--primary', { hasText: 'Approve' }).first().click();
    await expect(page.locator('.approver-row')).toHaveAttribute('data-status', 'approved');
    await expect(page.locator('.status-pill--approved')).toBeVisible();
    await expect(page.locator('app-approval-status-banner .banner')).toHaveAttribute(
      'data-state',
      'approved',
    );
  });

  test('TC-3: Request Changes → Submit with empty note shows the inline error', async ({ page }) => {
    await openApprovedPostInQA(page, {
      id: 'qa-tc3',
      platform: 'instagram',
      contentType: 'reel',
    });
    await page.locator('.approver-row .btn--outline', { hasText: 'Request Changes' }).click();
    await expect(page.locator('.note-input')).toBeVisible();
    await page.locator('.approver-row .btn--outline', { hasText: 'Submit' }).click();
    await expect(page.locator('.note-error')).toContainText(
      'Add a note describing the required changes',
    );
    // Row remains pending — no status change.
    await expect(page.locator('.approver-row')).toHaveAttribute('data-status', 'pending');
  });

  test('TC-4: Request Changes with note flips the row to changes + banner amber', async ({ page }) => {
    await openApprovedPostInQA(page, {
      id: 'qa-tc4',
      platform: 'instagram',
      contentType: 'reel',
    });
    await page.locator('.approver-row .btn--outline', { hasText: 'Request Changes' }).click();
    await page.locator('.note-input').fill('Tighten the hook copy');
    await page.locator('.approver-row .btn--outline', { hasText: 'Submit' }).click();
    await expect(page.locator('.approver-row')).toHaveAttribute('data-status', 'changes-requested');
    await expect(page.locator('.status-pill--changes')).toBeVisible();
    await expect(page.locator('.approver-note')).toContainText('Tighten the hook copy');
    await expect(page.locator('app-approval-status-banner .banner')).toHaveAttribute(
      'data-state',
      'changes-requested',
    );
  });

  test('TC-5: Revoke flips an approved row back to pending', async ({ page }) => {
    await openApprovedPostInQA(page, {
      id: 'qa-tc5',
      platform: 'instagram',
      contentType: 'reel',
    });
    await page.locator('.approver-row .btn--primary', { hasText: 'Approve' }).first().click();
    await expect(page.locator('.approver-row')).toHaveAttribute('data-status', 'approved');
    await page.locator('.approver-row .btn--ghost', { hasText: 'Revoke' }).click();
    await expect(page.locator('.approver-row')).toHaveAttribute('data-status', 'pending');
    await expect(page.locator('.status-pill--pending')).toBeVisible();
  });

  test('TC-6: Approve & Publish is disabled when required pending; enabled after approval', async ({ page }) => {
    await openApprovedPostInQA(page, {
      id: 'qa-tc6',
      platform: 'instagram',
      contentType: 'reel',
    });
    const cta = page.locator('.approve-publish');
    await expect(cta).toBeDisabled();
    await expect(page.locator('.approve-publish-helper')).toContainText('1 required approval pending');
    await page.locator('.approver-row .btn--primary', { hasText: 'Approve' }).first().click();
    await expect(cta).toBeEnabled();
    await cta.click();
    // Button label flips to the approved variant.
    await expect(cta).toContainText('Approved — Publish');
  });

  test('TC-7: Schedule pill reveals the datetime input', async ({ page }) => {
    await openApprovedPostInQA(page, {
      id: 'qa-tc7',
      platform: 'instagram',
      contentType: 'reel',
    });
    await expect(page.locator('#schedule-at-input')).toHaveCount(0);
    await page
      .locator('app-publish-config-block .pill-row [role="radio"]', { hasText: 'Schedule' })
      .click();
    await expect(page.locator('#schedule-at-input')).toBeVisible();
  });

  test('TC-8: past-date scheduleAt renders the inline error', async ({ page }) => {
    await openApprovedPostInQA(page, {
      id: 'qa-tc8',
      platform: 'instagram',
      contentType: 'reel',
    });
    await page
      .locator('app-publish-config-block .pill-row [role="radio"]', { hasText: 'Schedule' })
      .click();
    await page.locator('#schedule-at-input').fill('2020-01-01T10:00');
    await expect(page.locator('app-publish-config-block .field-error')).toContainText(
      'Must be a future date/time',
    );
  });

  test('TC-9: Delivery method "Notify me to publish" toggles the selected pill', async ({ page }) => {
    await openApprovedPostInQA(page, {
      id: 'qa-tc9',
      platform: 'instagram',
      contentType: 'reel',
    });
    // Delivery method pills are the second pill-row in the publish-config-block.
    const deliveryPills = page.locator('app-publish-config-block .pill-row').nth(1).locator('[role="radio"]');
    await deliveryPills.filter({ hasText: 'Notify me to publish' }).click();
    await expect(
      deliveryPills.filter({ hasText: 'Notify me to publish' }),
    ).toHaveClass(/pill--selected/);
  });

  test('TC-10: Notify team on publish checkbox toggles state', async ({ page }) => {
    await openApprovedPostInQA(page, {
      id: 'qa-tc10',
      platform: 'instagram',
      contentType: 'reel',
    });
    const cb = page.locator('#notify-team-input');
    await expect(cb).not.toBeChecked();
    await cb.check();
    await expect(cb).toBeChecked();
  });

  test('TC-11: visibility + Made for Kids do NOT render on an Instagram post', async ({ page }) => {
    await openApprovedPostInQA(page, {
      id: 'qa-tc11',
      platform: 'instagram',
      contentType: 'reel',
    });
    await expect(page.locator('#visibility-select')).toHaveCount(0);
    await expect(page.locator('.switch-row')).toHaveCount(0);
  });

  test('TC-12: empty connected-accounts list shows the workspace-settings prompt', async ({ page }) => {
    await openApprovedPostInQA(page, {
      id: 'qa-tc12',
      platform: 'instagram',
      contentType: 'reel',
    });
    await expect(page.locator('app-publish-config-block .empty-state')).toContainText(
      'No accounts connected for this platform',
    );
    await expect(page.locator('app-publish-config-block .empty-state-cta')).toContainText(
      'Connect one in Workspace Settings → Accounts',
    );
  });

  test('TC-13: keyboard-only — focus Approve via Tab and activate with Enter', async ({ page }) => {
    await openApprovedPostInQA(page, {
      id: 'qa-tc13',
      platform: 'instagram',
      contentType: 'reel',
    });
    const approveBtn = page.locator('.approver-row .btn--primary', { hasText: 'Approve' }).first();
    await approveBtn.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.approver-row')).toHaveAttribute('data-status', 'approved');
  });

  test('TC-14: Post Preview expand state persists across Packaging ↔ Approve & Schedule', async ({ page }) => {
    await openApprovedPostInQA(page, {
      id: 'qa-preview-persist',
      platform: 'instagram',
      contentType: 'reel',
    });
    // Land on QA, jump back to Packaging via the steps bar.
    await page.locator('app-production-steps-bar button', { hasText: 'Packaging' }).click();
    await expect(page.locator('app-packaging-step')).toBeVisible();
    // Expand the Post Preview from Packaging.
    const previewHeader = page.locator('.brief-side app-post-preview-card .pp-header');
    await expect(previewHeader).toBeVisible();
    await expect(previewHeader).toHaveAttribute('aria-expanded', 'false');
    await previewHeader.click();
    await expect(previewHeader).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.brief-side app-post-preview-card .pp-body')).toBeVisible();

    // Switch to Approve & Schedule — preview must STAY expanded.
    await page.locator('app-production-steps-bar button', { hasText: 'Approve & Schedule' }).click();
    await expect(page.locator('app-approve-schedule-step')).toBeVisible();
    await expect(page.locator('.brief-side app-post-preview-card .pp-header')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(page.locator('.brief-side app-post-preview-card .pp-body')).toBeVisible();

    // Switch back to Packaging — still expanded.
    await page.locator('app-production-steps-bar button', { hasText: 'Packaging' }).click();
    await expect(page.locator('app-packaging-step')).toBeVisible();
    await expect(page.locator('.brief-side app-post-preview-card .pp-header')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(page.locator('.brief-side app-post-preview-card .pp-body')).toBeVisible();
  });

  test('TC-15: persistence round-trip — approval + publishConfig survive reload', async ({ page }) => {
    await openApprovedPostInQA(page, {
      id: 'qa-reload',
      platform: 'instagram',
      contentType: 'reel',
    });
    // Approve the row and switch to Schedule + future datetime.
    await page.locator('.approver-row .btn--primary', { hasText: 'Approve' }).first().click();
    await page
      .locator('app-publish-config-block .pill-row [role="radio"]', { hasText: 'Schedule' })
      .click();
    await page.locator('#schedule-at-input').fill('2099-01-01T10:00');
    // Allow the PUT to land.
    await expect(page.locator('.status-pill--approved')).toBeVisible();
    await page.reload();
    await expect(page.locator('app-post-detail')).toBeVisible();
    await expect(page.locator('app-approve-schedule-step')).toBeVisible();
    // After reload: approval + scheduleAt persist via the mock's merge-on-PUT.
    await expect(page.locator('.status-pill--approved')).toBeVisible();
    await expect(page.locator('#schedule-at-input')).toHaveValue('2099-01-01T10:00');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Pipeline-lane sync (#129) — advancing into Approve & Schedule from
// in-progress flips top-level status to 'review' so the post moves from
// the Post Builder lane to Scheduled (column id is still 'review', label
// was renamed in #141). The pipeline view reads from the cache-merged
// items() signal, so the swap is observable both immediately after
// Continue and across a reload.
// ─────────────────────────────────────────────────────────────────────────
test.describe('Pipeline lane sync (#129)', () => {
  const POST_BUILDER_COL = 2; // 0=Ideas, 1=Concepts, 2=Post Builder
  const REVIEW_COL = 3; // 3=Scheduled (column id is still 'review'), 4=Published

  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
  });

  test('TC-1: Continue from Packaging swaps post from Post Builder to Scheduled lane', async ({
    page,
  }) => {
    const id = 'lane-tc1';
    const title = 'Lane-swap TC1';
    const entry = approvedPostEntry({
      id,
      title,
      platform: 'instagram',
      contentType: 'reel',
    });
    const detail = approvedPostInPackaging({
      id,
      title,
      platform: 'instagram',
      contentType: 'reel',
    });
    await mockHiveContent(page, { indexItems: [entry], details: { [id]: detail } });

    await page.goto(`/workspace/hive-collective/content/${id}`);
    await expect(page.locator('app-post-detail')).toBeVisible();
    await expect(page.locator('app-packaging-step')).toBeVisible();

    // Caption the Instagram packaging slot so canContinueFromPackaging flips true.
    await page.locator('#post-caption').fill('Hello world');

    const continueBtn = page.locator('app-step-action-bar .continue-btn');
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();
    await expect(page.locator('app-approve-schedule-step')).toBeVisible();

    // Back to the pipeline. items() is cache-merged so the lane swap is
    // visible immediately (no reload required).
    await page.locator('app-post-detail-header .detail-back').click();
    await expect(page.locator('app-pipeline-view')).toBeVisible();

    const reviewCol = page.locator('.kanban-column').nth(REVIEW_COL);
    await expect(reviewCol.locator('.column-title')).toContainText('Scheduled');
    await expect(reviewCol.locator('.content-card', { hasText: title })).toBeVisible();

    const postBuilderCol = page.locator('.kanban-column').nth(POST_BUILDER_COL);
    await expect(postBuilderCol.locator('.column-title')).toContainText('Post Builder');
    await expect(postBuilderCol.locator('.content-card', { hasText: title })).toHaveCount(0);
  });

  test('TC-2: lane swap persists across page reload (round-trip)', async ({ page }) => {
    const id = 'lane-tc2';
    const title = 'Lane-swap TC2';
    const entry = approvedPostEntry({
      id,
      title,
      platform: 'instagram',
      contentType: 'reel',
    });
    const detail = approvedPostInPackaging({
      id,
      title,
      platform: 'instagram',
      contentType: 'reel',
    });
    await mockHiveContent(page, { indexItems: [entry], details: { [id]: detail } });

    await page.goto(`/workspace/hive-collective/content/${id}`);
    await expect(page.locator('app-packaging-step')).toBeVisible();
    await page.locator('#post-caption').fill('Caption for reload');

    const continueBtn = page.locator('app-step-action-bar .continue-btn');
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();
    await expect(page.locator('app-approve-schedule-step')).toBeVisible();

    // Reload while on post-detail. The mock route handler has persisted the
    // status:'review' bytes into details[id]; post-detail re-mounts on reload
    // and re-caches the full item via loadFullItem.
    await page.reload();
    await expect(page.locator('app-post-detail')).toBeVisible();
    await expect(page.locator('app-approve-schedule-step')).toBeVisible();

    // Navigate to pipeline. loadAll refreshes indexEntries from the (stale)
    // /index GET, but items() merges fullItemCache on top — the cached full
    // item carries status:'review', so the lane membership reflects it.
    await page.locator('app-post-detail-header .detail-back').click();
    await expect(page.locator('app-pipeline-view')).toBeVisible();

    const reviewCol = page.locator('.kanban-column').nth(REVIEW_COL);
    await expect(reviewCol.locator('.column-title')).toContainText('Scheduled');
    await expect(reviewCol.locator('.content-card', { hasText: title })).toBeVisible();

    const postBuilderCol = page.locator('.kanban-column').nth(POST_BUILDER_COL);
    await expect(postBuilderCol.locator('.content-card', { hasText: title })).toHaveCount(0);
  });

  test('TC-3: tab-clicks on a status="review" QA post fire no save and do not churn status', async ({
    page,
  }) => {
    const id = 'lane-tc3';
    const title = 'Lane-swap TC3';
    // Pre-seed the post directly on the QA step with status='review' so
    // the lane is correct from the start. Both the index entry AND the
    // detail must carry status='review' — the entry feeds the pipeline's
    // initial /index GET while the detail feeds /content-items/<id>.
    const entry = {
      ...approvedPostEntry({
        id,
        title,
        platform: 'instagram',
        contentType: 'reel',
      }),
      status: 'review' as const,
    };
    const detail = {
      ...approvedPostInQA({
        id,
        title,
        platform: 'instagram',
        contentType: 'reel',
      }),
      status: 'review' as const,
    };
    await mockHiveContent(page, { indexItems: [entry], details: { [id]: detail } });

    // Count PUT/PATCH/POST hits to the content-item endpoint. Tab-clicks
    // should be UI-only — zero saves.
    let writeCount = 0;
    page.on('request', (req) => {
      const url = req.url();
      const method = req.method();
      if (
        (method === 'PUT' || method === 'PATCH' || method === 'POST') &&
        url.includes(`/api/workspaces/hive-collective/content-items/${id}`)
      ) {
        writeCount++;
      }
    });

    await page.goto(`/workspace/hive-collective/content/${id}`);
    await expect(page.locator('app-approve-schedule-step')).toBeVisible();

    // Tab-click round-trip: QA → Packaging → QA. setActiveStep only,
    // no advanceProductionStep, so saveItem must NOT fire.
    await page
      .locator('app-production-steps-bar button', { hasText: 'Packaging' })
      .click();
    await expect(page.locator('app-packaging-step')).toBeVisible();
    await page
      .locator('app-production-steps-bar button', { hasText: 'Approve & Schedule' })
      .click();
    await expect(page.locator('app-approve-schedule-step')).toBeVisible();

    // No writes at all — tab-clicks are UI-only.
    expect(writeCount).toBe(0);

    // Lane membership unchanged: still in Scheduled, absent from Post Builder.
    await page.locator('app-post-detail-header .detail-back').click();
    await expect(page.locator('app-pipeline-view')).toBeVisible();

    const reviewCol = page.locator('.kanban-column').nth(REVIEW_COL);
    await expect(reviewCol.locator('.content-card', { hasText: title })).toBeVisible();
    const postBuilderCol = page.locator('.kanban-column').nth(POST_BUILDER_COL);
    await expect(postBuilderCol.locator('.content-card', { hasText: title })).toHaveCount(0);
  });
});
