import { test, expect } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/login';

const mockWorkspacesResponse = {
  workspaces: [
    { id: 'hive-collective', name: 'Hive Collective', color: '#d94e33', status: 'active', createdAt: '2026-01-15T10:00:00Z' },
  ],
};

const mockCreateSessionResponse = {
  sessionId: 'e2e-session-1',
  status: 'active',
  initialMessage: "Welcome! I'm your Blink onboarding consultant. Let's discover your content strategy together.\n\nTo get started, I'd love to learn about your business:\n\n1. In one to two sentences, what does your business do — and who does it serve?\n2. What are your top 1-3 business goals for the next 12 months?",
  sections: [
    { id: 'business', name: 'Business Overview', covered: false },
    { id: 'brand_voice', name: 'Brand & Voice', covered: false },
    { id: 'audience', name: 'Audience', covered: false },
    { id: 'competitors', name: 'Competitors', covered: false },
    { id: 'content', name: 'Content Strategy', covered: false },
    { id: 'channels', name: 'Channels & Capacity', covered: false },
    { id: 'expectations', name: 'Expectations & Goals', covered: false },
  ],
};

const mockSendMessageResponse = {
  agentMessage: "That's great context! Your fitness studio sounds like it has a strong foundation.\n\nLet me dig a little deeper:\n\n1. What is the single most important commercial outcome you want content to support?\n2. Where is the business right now in terms of followers, community size, or revenue?",
  sections: [
    { id: 'business', name: 'Business Overview', covered: false },
    { id: 'brand_voice', name: 'Brand & Voice', covered: false },
    { id: 'audience', name: 'Audience', covered: false },
    { id: 'competitors', name: 'Competitors', covered: false },
    { id: 'content', name: 'Content Strategy', covered: false },
    { id: 'channels', name: 'Channels & Capacity', covered: false },
    { id: 'expectations', name: 'Expectations & Goals', covered: false },
  ],
  currentSection: 'business',
  readyToGenerate: false,
};

test.describe('Dashboard Onboard Card', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.route('**/api/workspaces', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockWorkspacesResponse) })
    );
  });

  test('should show the Onboard New Workspace card', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.action-onboard')).toBeVisible();
    await expect(page.locator('.action-onboard')).toContainText('Engage an onboarding agent');
  });

  test('should navigate to /onboard when card is clicked', async ({ page }) => {
    await page.route('**/api/onboarding/sessions', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockCreateSessionResponse) })
    );
    await page.goto('/');
    await page.locator('.action-onboard').click();
    await expect(page).toHaveURL(/\/onboard/);
  });
});

test.describe('Onboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.route('**/api/onboarding/sessions', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockCreateSessionResponse) });
      }
    });
  });

  /** Helper to start a discovery session from the name input screen. */
  async function startSession(page: import('@playwright/test').Page) {
    await page.goto('/onboard');
    await page.locator('.name-input-field').fill('E2E Test Corp');
    await page.locator('.start-session-btn').click();
    // Wait for the chat UI to appear
    await page.locator('app-chat-message').first().waitFor({ state: 'visible' });
  }

  test('should show the page header', async ({ page }) => {
    await page.goto('/onboard');
    await expect(page.locator('.page-title')).toHaveText('Project Onboarding');
    await expect(page.locator('.page-subtitle')).toHaveText('AI-guided discovery for your content strategy');
  });

  test('should display the initial agent message', async ({ page }) => {
    await startSession(page);
    await expect(page.locator('app-chat-message').first()).toBeVisible();
    await expect(page.locator('.assistant .content').first()).toContainText('Welcome!');
  });

  test('should show 7 section progress steps', async ({ page }) => {
    await startSession(page);
    await expect(page.locator('.progress-step')).toHaveCount(7);
  });

  test('should have a back button that navigates to dashboard', async ({ page }) => {
    await page.route('**/api/workspaces', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockWorkspacesResponse) })
    );
    await page.goto('/onboard');
    await page.locator('.back-home').click();
    await expect(page).toHaveURL('/');
  });

  test('should send a message and receive agent reply', async ({ page }) => {
    await page.route('**/api/onboarding/sessions/e2e-session-1/messages', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSendMessageResponse) })
    );
    await startSession(page);

    // Wait for the initial message to appear
    await expect(page.locator('app-chat-message')).toHaveCount(1);

    // Type and send a message
    await page.locator('.message-input').fill('We run a perimenopause fitness studio');
    await page.locator('.send-btn').click();

    // Should show user message immediately
    await expect(page.locator('app-chat-message')).toHaveCount(3, { timeout: 5000 });
  });

  test('should send message on Enter key', async ({ page }) => {
    await page.route('**/api/onboarding/sessions/e2e-session-1/messages', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSendMessageResponse) })
    );
    await startSession(page);
    await expect(page.locator('app-chat-message')).toHaveCount(1);

    await page.locator('.message-input').fill('My business is a yoga studio');
    await page.locator('.message-input').press('Enter');

    await expect(page.locator('app-chat-message')).toHaveCount(3, { timeout: 5000 });
  });

  test('should disable send button when input is empty', async ({ page }) => {
    await startSession(page);
    await expect(page.locator('.send-btn')).toBeDisabled();
  });
});

test.describe('Onboard Page - chat rendering (#89)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.route('**/api/onboarding/sessions', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockCreateSessionResponse) });
      }
    });
  });

  /** Local copy of startSession — the parent describe's helper isn't visible here. */
  async function startSession(page: import('@playwright/test').Page) {
    await page.goto('/onboard');
    await page.locator('.name-input-field').fill('E2E Test Corp');
    await page.locator('.start-session-btn').click();
    await page.locator('app-chat-message').first().waitFor({ state: 'visible' });
  }

  /** Section list shared by all #89 mock replies. */
  const sections = [
    { id: 'business', name: 'Business Overview', covered: false },
    { id: 'brand_voice', name: 'Brand & Voice', covered: false },
    { id: 'audience', name: 'Audience', covered: false },
    { id: 'competitors', name: 'Competitors', covered: false },
    { id: 'content', name: 'Content Strategy', covered: false },
    { id: 'channels', name: 'Channels & Capacity', covered: false },
    { id: 'expectations', name: 'Expectations & Goals', covered: false },
  ];

  test('TC-1: renders markdown (bold, italic, lists, code) in agent bubble', async ({ page }) => {
    await page.route('**/api/onboarding/sessions/e2e-session-1/messages', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          agentMessage:
            '**On brand voice:** here are *three* points:\n\n1. First\n2. Second\n3. Third\n\n```\nconst x = 1;\n```',
          sections,
          currentSection: 'business',
          readyToGenerate: false,
        }),
      }),
    );
    await startSession(page);
    await page.locator('.message-input').fill('Tell me about brand voice');
    await page.locator('.send-btn').click();

    // Wait for the agent reply to appear (3 bubbles: initial + user + agent reply)
    await expect(page.locator('app-chat-message')).toHaveCount(3, { timeout: 5000 });

    const lastBubble = page.locator('app-chat-message').last();
    await expect(lastBubble.locator('.content.markdown')).toBeVisible();
    await expect(lastBubble.locator('strong')).toContainText('On brand voice:');
    await expect(lastBubble.locator('em')).toContainText('three');
    await expect(lastBubble.locator('ol > li')).toHaveCount(3);
    await expect(lastBubble.locator('pre code')).toContainText('const x = 1;');

    const text = await lastBubble.locator('.content.markdown').textContent();
    expect(text).not.toContain('**');
    expect(text).not.toContain('```');
  });

  test('TC-2: truncated JSON envelope debris never reaches the user', async ({ page }) => {
    // Represents the post-fix recovered output from `parseTurnResponse` after
    // a real truncation — partial agentMessage + the truncation footer, with
    // no envelope debris.
    await page.route('**/api/onboarding/sessions/e2e-session-1/messages', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          agentMessage:
            '**On brand voice:** the pre-work covers personality...\n\n[Response was truncated. Please continue the conversation.]',
          sections,
          currentSection: 'business',
          readyToGenerate: false,
        }),
      }),
    );
    await startSession(page);
    await page.locator('.message-input').fill('Continue please');
    await page.locator('.send-btn').click();

    await expect(page.locator('app-chat-message')).toHaveCount(3, { timeout: 5000 });

    const allText = (await page.locator('app-chat-message').allTextContents()).join('\n');
    expect(allText).not.toContain('{"agentMessage"');
    expect(allText).not.toContain('\\n');
    expect(allText).not.toContain('\\"');
    // The friendly truncation notice IS expected and should appear as plain text.
    expect(allText).toContain('[Response was truncated. Please continue the conversation.]');
  });

  test('TC-3: XSS smoke — <script> in agent output does not execute or render', async ({ page }) => {
    await page.route('**/api/onboarding/sessions/e2e-session-1/messages', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          agentMessage:
            'Hello <script>window.__pwned = true</script> world',
          sections,
          currentSection: 'business',
          readyToGenerate: false,
        }),
      }),
    );
    await startSession(page);
    await page.locator('.message-input').fill('hi');
    await page.locator('.send-btn').click();

    await expect(page.locator('app-chat-message')).toHaveCount(3, { timeout: 5000 });

    // No <script> element renders into the bubble (Angular sanitiser strips it)
    expect(await page.locator('app-chat-message script').count()).toBe(0);
    // The script never executed
    const pwned = await page.evaluate(() => (window as unknown as { __pwned?: boolean }).__pwned);
    expect(pwned).toBeUndefined();
    // Visible text is preserved
    const lastBubble = page.locator('app-chat-message').last();
    await expect(lastBubble).toContainText('Hello');
    await expect(lastBubble).toContainText('world');
  });
});

test.describe('Onboard Page - Non-admin user', () => {
  test('should redirect non-admin users away from /onboard', async ({ page }) => {
    await page.route('**/api/auth/status', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: true,
          needsBootstrap: false,
          user: {
            id: 'viewer-id',
            email: 'viewer@blinksocial.com',
            displayName: 'Viewer User',
            workspaces: [{ workspaceId: 'ws-1', role: 'Viewer' }],
          },
        }),
      })
    );
    await page.route('**/api/workspaces', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockWorkspacesResponse) })
    );

    await page.goto('/onboard');
    // Should redirect to dashboard
    await expect(page).toHaveURL('/');
  });
});
