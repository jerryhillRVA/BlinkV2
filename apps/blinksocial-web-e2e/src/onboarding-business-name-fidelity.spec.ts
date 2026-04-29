import { test, expect } from '@playwright/test';
import { buildSampleBlueprint } from '@blinksocial/core';
import type {
  BlueprintDocumentContract,
  WizardStateContract,
} from '@blinksocial/contracts';
import { mockAuthenticatedUser } from './helpers/login';

/**
 * Ticket #72 — UI fidelity for the user-supplied businessName.
 *
 * The bug: the onboarding LLM was substituting "Hive Fitness" for the
 * user's discovery answer "Hive Collective" — in the rendered Blueprint
 * header, Strategic Summary, Brand & Voice positioning blockquote, and
 * carrying the wrong name into the workspace setup wizard.
 *
 * The fix lives on the API side (pin clientName, prose-fidelity check on
 * generation, seed wizardName from discovery). These specs lock in the
 * UI contract so a regression in the rendering / wizard-resume chain
 * cannot silently re-introduce the wrong name even if the API sends the
 * right one — they assert what the user actually sees.
 */

const BUSINESS_NAME = 'Hive Collective';
const BAD_NAME = 'Hive Fitness';
const TENANT_ID = 'tnt-hive-72';
const SESSION_ID = 'sess-hive-72';

/**
 * Build a structurally-complete Blueprint with the businessName planted
 * in every slot the ticket polices. Using the shared sample fixture
 * keeps the spec aligned with schema changes.
 */
function buildHiveBlueprint(): BlueprintDocumentContract {
  const bp = buildSampleBlueprint();
  bp.clientName = BUSINESS_NAME;
  bp.strategicSummary =
    `${BUSINESS_NAME} occupies a rare position in fitness content for women 40+ who are ready to start. ` +
    `Every decision in this strategy reinforces ${BUSINESS_NAME}'s territory.`;
  bp.brandVoice.positioningStatement = `${BUSINESS_NAME} is the strength and movement coach for women 40+.`;
  return bp;
}

const buildResumedSession = () => ({
  sessionId: SESSION_ID,
  status: 'complete',
  messages: [],
  sections: [
    { id: 'business', name: 'Business Overview', covered: true },
    { id: 'brand_voice', name: 'Brand & Voice', covered: true },
    { id: 'audience', name: 'Audience', covered: true },
    { id: 'competitors', name: 'Competitors', covered: true },
    { id: 'content', name: 'Content Strategy', covered: true },
    { id: 'channels', name: 'Channels & Capacity', covered: true },
    { id: 'expectations', name: 'Expectations & Goals', covered: true },
  ],
  currentSection: 'expectations',
  readyToGenerate: true,
  blueprint: buildHiveBlueprint(),
});

const buildWizardState = (): WizardStateContract => ({
  currentStep: 0,
  completedSteps: [],
  formData: {
    general: {
      workspaceName: BUSINESS_NAME,
    },
  } as WizardStateContract['formData'],
  blueprintSessionId: SESSION_ID,
});

test.describe('Onboarding businessName fidelity (#72)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);

    // Resume returns a complete session whose Blueprint mentions the
    // user-supplied businessName in every named slot.
    await page.route(
      `**/api/onboarding/sessions/by-workspace/${TENANT_ID}`,
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(buildResumedSession()),
        }),
    );
  });

  test('TC-1: rendered Blueprint shows the discovery businessName in every slot and never the substituted name', async ({
    page,
  }) => {
    await page.goto(`/onboard?workspace=${TENANT_ID}`);
    await page.locator('.markdown-rendered').waitFor({ state: 'visible' });

    const markdown = page.locator('.markdown-rendered');

    // AC #1 / #2 — header `Prepared for:` + every prose mention uses the
    // discovery businessName. We don't pin to an exact count because the
    // sample blueprint sprinkles `clientName` into surrounding sections
    // (e.g. the audience profiles), but at minimum the three named slots
    // ticket #72 calls out must each contribute a hit.
    const hits = await markdown
      .locator(`text=${BUSINESS_NAME}`)
      .count();
    expect(hits).toBeGreaterThanOrEqual(3);

    // The substituted name from the bug report must NOT appear anywhere
    // in the rendered preview. This is the key regression assertion.
    await expect(markdown).not.toContainText(BAD_NAME);

    // Spot-check the two prose slots called out by the ticket are
    // visible to the user (not hidden behind a collapsed section etc.).
    await expect(markdown).toContainText(
      `${BUSINESS_NAME} occupies a rare position`,
    );
    await expect(markdown).toContainText(
      `${BUSINESS_NAME} is the strength and movement coach`,
    );
  });

  test('TC-2: workspace setup wizard pre-fills the workspace name from discovery, not from any drifted value', async ({
    page,
  }) => {
    // After the user clicks Create Workspace from Blueprint, the API
    // responds with the post-pin wizardData; the FE then navigates to
    // /new-workspace?resume=<tenantId> and reads wizard-state.json,
    // which is itself sourced from the discovery businessName on the
    // API side.
    await page.route(
      `**/api/onboarding/sessions/${SESSION_ID}/create-workspace`,
      (route) => {
        if (route.request().method() === 'POST') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              workspaceId: TENANT_ID,
              tenantId: TENANT_ID,
              wizardData: {
                general: { workspaceName: BUSINESS_NAME },
              },
            }),
          });
        }
        return route.continue();
      },
    );
    await page.route(
      `**/api/workspaces/${TENANT_ID}/settings/wizard-state`,
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(buildWizardState()),
        }),
    );

    await page.goto(`/onboard?workspace=${TENANT_ID}`);
    await page.locator('.create-workspace-btn').waitFor({ state: 'visible' });
    await page.locator('.create-workspace-btn').click();

    await expect(page).toHaveURL(/\/new-workspace\?resume=/);

    const nameInput = page.locator('#workspace-name');
    await expect(nameInput).toHaveValue(BUSINESS_NAME);
    // The input must NOT carry the substituted name even transiently.
    await expect(nameInput).not.toHaveValue(BAD_NAME);
  });
});
