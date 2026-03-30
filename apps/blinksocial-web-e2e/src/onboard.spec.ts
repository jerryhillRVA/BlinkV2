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
    await expect(page.locator('.card-onboard')).toBeVisible();
    await expect(page.locator('.card-onboard .new-label')).toHaveText('Onboard New Workspace');
  });

  test('should navigate to /onboard when card is clicked', async ({ page }) => {
    await page.route('**/api/onboarding/sessions', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockCreateSessionResponse) })
    );
    await page.goto('/');
    await page.locator('.card-onboard').click();
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

  test('should show the page header', async ({ page }) => {
    await page.goto('/onboard');
    await expect(page.locator('.page-title')).toHaveText('Project Onboarding');
    await expect(page.locator('.page-subtitle')).toHaveText('AI-guided discovery for your content strategy');
  });

  test('should display the initial agent message', async ({ page }) => {
    await page.goto('/onboard');
    await expect(page.locator('app-chat-message').first()).toBeVisible();
    await expect(page.locator('.assistant .content').first()).toContainText('Welcome!');
  });

  test('should show 7 section progress steps', async ({ page }) => {
    await page.goto('/onboard');
    await expect(page.locator('.progress-step')).toHaveCount(7);
  });

  test('should have a back button that navigates to dashboard', async ({ page }) => {
    await page.route('**/api/workspaces', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockWorkspacesResponse) })
    );
    await page.goto('/onboard');
    await page.locator('.back-btn').click();
    await expect(page).toHaveURL('/');
  });

  test('should send a message and receive agent reply', async ({ page }) => {
    await page.route('**/api/onboarding/sessions/e2e-session-1/messages', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSendMessageResponse) })
    );
    await page.goto('/onboard');

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
    await page.goto('/onboard');
    await expect(page.locator('app-chat-message')).toHaveCount(1);

    await page.locator('.message-input').fill('My business is a yoga studio');
    await page.locator('.message-input').press('Enter');

    await expect(page.locator('app-chat-message')).toHaveCount(3, { timeout: 5000 });
  });

  test('should disable send button when input is empty', async ({ page }) => {
    await page.goto('/onboard');
    await expect(page.locator('.send-btn')).toBeDisabled();
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
