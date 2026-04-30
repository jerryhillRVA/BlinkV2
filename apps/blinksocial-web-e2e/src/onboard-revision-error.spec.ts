import { test, expect } from '@playwright/test';
import { buildSampleBlueprint } from '@blinksocial/core';
import type { BlueprintDocumentContract } from '@blinksocial/contracts';
import { mockAuthenticatedUser } from './helpers/login';

/**
 * Ticket #88 — error ergonomics for the Blueprint revision regen path.
 *
 * The bug: a parse / shape miss in the LLM response surfaced as HTTP 500
 * and a generic full-width red `Internal server error` banner across the
 * top of the Blueprint page, even though the backend already preserves
 * the prior Blueprint and the failure is user-recoverable.
 *
 * The fix: API now returns a structured 422 with a user-facing message;
 * the FE routes post-`complete` errors to a scoped `chat-error` block
 * inside the chat panel and reserves the full-width banner for
 * pre-`complete` failures (initial generation / resume).
 */

const TENANT_ID = 'tnt-revision-error-88';
const SESSION_ID = 'sess-revision-error-88';

const SECTIONS_COMPLETE = [
  { id: 'business', name: 'Business Overview', covered: true },
  { id: 'brand_voice', name: 'Brand & Voice', covered: true },
  { id: 'audience', name: 'Audience', covered: true },
  { id: 'competitors', name: 'Competitors', covered: true },
  { id: 'content', name: 'Content Strategy', covered: true },
  { id: 'channels', name: 'Channels & Capacity', covered: true },
  { id: 'expectations', name: 'Expectations & Goals', covered: true },
];

function buildBlueprint(): BlueprintDocumentContract {
  const bp = buildSampleBlueprint();
  bp.clientName = 'Acme Co';
  return bp;
}

const buildResumedComplete = () => ({
  sessionId: SESSION_ID,
  status: 'complete',
  messages: [],
  sections: SECTIONS_COMPLETE,
  currentSection: 'expectations',
  readyToGenerate: true,
  blueprint: buildBlueprint(),
});

const buildResumedActive = () => ({
  sessionId: SESSION_ID,
  status: 'active',
  messages: [
    {
      id: 'a0',
      role: 'assistant',
      content: 'Welcome',
      timestamp: '2026-04-30T10:00:00Z',
    },
  ],
  sections: SECTIONS_COMPLETE,
  currentSection: 'expectations',
  readyToGenerate: true,
  blueprint: null,
});

const REVISION_PARSE_FAIL_BODY = {
  message:
    "We couldn't apply that revision — please try rephrasing or try again.",
  errors: [{ code: 'BLUEPRINT_PARSE_FAILED', attempts: 2 }],
};

const FIRST_TIME_PARSE_FAIL_BODY = {
  message: "We couldn't generate the blueprint — please try again.",
  errors: [{ code: 'BLUEPRINT_PARSE_FAILED', attempts: 1 }],
};

test.describe('Onboarding revision regen error handling (#88)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
  });

  test('TC-1: revision regen 422 surfaces inline chat-error, preserves prior Blueprint, and dismisses cleanly', async ({
    page,
  }) => {
    // Resume into a complete session with a valid prior Blueprint.
    await page.route(
      `**/api/onboarding/sessions/by-workspace/${TENANT_ID}`,
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(buildResumedComplete()),
        }),
    );

    // The user sends a confirmation; the agent responds with
    // readyToRevise:true, which auto-fires the regen request.
    await page.route(
      `**/api/onboarding/sessions/${SESSION_ID}/messages`,
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            agentMessage: 'Regenerating now…',
            sections: SECTIONS_COMPLETE,
            currentSection: 'expectations',
            readyToGenerate: true,
            readyToRevise: true,
          }),
        }),
    );

    // Auto-triggered regen returns 422 — the bug fix. Both attempts on the
    // server have failed; from the FE's POV this is a single 422 response.
    await page.route(
      `**/api/onboarding/sessions/${SESSION_ID}/generate`,
      (route) =>
        route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify(REVISION_PARSE_FAIL_BODY),
        }),
    );

    await page.goto(`/onboard?workspace=${TENANT_ID}`);
    await page
      .locator('[data-testid="blueprint-panel"]')
      .waitFor({ state: 'visible' });

    // Send a "yes go ahead"-type message to trigger the auto-regen path.
    await page.locator('.message-input').fill('yes go ahead');
    await page.locator('.send-btn').click();

    // The inline chat-error must appear inside the chat panel.
    const chatError = page.locator('[data-testid="chat-error"]');
    await expect(chatError).toBeVisible();
    await expect(chatError).toContainText("couldn't apply that revision");

    // The full-width banner MUST NOT render simultaneously — it would
    // crowd the Blueprint preview and was the original UX bug.
    await expect(page.locator('.error-banner')).toHaveCount(0);

    // Prior Blueprint preview is still visible with its content intact.
    await expect(page.locator('[data-testid="blueprint-panel"]')).toBeVisible();
    await expect(page.locator('.markdown-rendered')).toContainText('Acme Co');

    // Composer remains enabled so the user can rephrase + retry.
    await expect(page.locator('.message-input')).not.toBeDisabled();

    // TC-2: Dismiss removes the chat-error from the DOM.
    await chatError.locator('button').click();
    await expect(page.locator('[data-testid="chat-error"]')).toHaveCount(0);
  });

  test('TC-3: first-time generation 422 surfaces full-width banner, not chat-error', async ({
    page,
  }) => {
    // Resume returns an active session (no prior Blueprint) so we click
    // the Generate Blueprint button while status is still pre-complete.
    await page.route(
      `**/api/onboarding/sessions/by-workspace/${TENANT_ID}`,
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(buildResumedActive()),
        }),
    );

    await page.route(
      `**/api/onboarding/sessions/${SESSION_ID}/generate`,
      (route) =>
        route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify(FIRST_TIME_PARSE_FAIL_BODY),
        }),
    );

    await page.goto(`/onboard?workspace=${TENANT_ID}`);
    await page.locator('.generate-btn').waitFor({ state: 'visible' });
    await page.locator('.generate-btn').click();

    // Full-width banner appears for pre-complete failures.
    const banner = page.locator('.error-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("couldn't generate the blueprint");

    // No chat-error — the chat panel doesn't even render until status is
    // 'complete', but assert explicitly so a future layout change can't
    // double-render error UI.
    await expect(page.locator('[data-testid="chat-error"]')).toHaveCount(0);
  });
});
