import { test, expect, type Page } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/login';

const REFERENCE_DATE = '2026-05-01T00:00:00.000Z';

const CALENDAR_PAYLOAD = {
  workspaceId: 'hive-collective',
  referenceDate: REFERENCE_DATE,
  items: [
    {
      id: 'e2e-1',
      title: 'Spring launch teaser',
      platform: 'instagram',
      canonicalType: 'IMAGE_SINGLE',
      status: 'in-progress',
      owner: 'Ava Chen',
      scheduleAt: '2026-05-03T15:00:00.000Z',
      blockers: [],
    },
    {
      id: 'e2e-2',
      title: 'Founder behind-the-scenes',
      platform: 'youtube',
      canonicalType: 'VIDEO_LONG_HORIZONTAL',
      status: 'approved',
      owner: 'Marcus Lee',
      scheduleAt: '2026-05-10T18:00:00.000Z',
      blockers: [],
    },
  ],
  milestones: [
    {
      milestoneId: 'e2e-1-draft',
      contentId: 'e2e-1',
      milestoneType: 'draft_due',
      dueAt: '2026-04-28T00:00:00.000Z',
      milestoneOwner: 'Ava Chen',
      isRequired: true,
    },
    {
      milestoneId: 'e2e-2-qa',
      contentId: 'e2e-2',
      milestoneType: 'qa_due',
      dueAt: '2026-05-06T00:00:00.000Z',
      milestoneOwner: 'Marcus Lee',
      isRequired: true,
    },
  ],
};

const WORKSPACES_PAYLOAD = {
  workspaces: [
    {
      id: 'hive-collective',
      name: 'Hive Collective',
      color: '#d94e33',
      status: 'active',
      createdAt: '2026-01-15T10:00:00Z',
    },
    {
      id: 'booze-kills',
      name: 'Booze Kills',
      color: '#2b6bff',
      status: 'active',
      createdAt: '2026-02-01T10:00:00Z',
    },
  ],
};

async function installCalendarMocks(page: Page) {
  await mockAuthenticatedUser(page);
  await page.route('**/api/workspaces', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(WORKSPACES_PAYLOAD),
    }),
  );
  await page.route('**/api/calendar/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(CALENDAR_PAYLOAD),
    }),
  );
}

test.describe('Calendar — navigation entry points', () => {
  test.beforeEach(async ({ page }) => {
    await installCalendarMocks(page);
  });

  test('TC1 header Calendar tab navigates to the calendar page with Month default', async ({
    page,
  }) => {
    await page.goto('/workspace/hive-collective/content');
    const calendarTab = page
      .locator('.ws-nav-item', { hasText: 'Calendar' });
    await expect(calendarTab).toBeVisible();
    await calendarTab.click();
    await expect(page).toHaveURL(/\/workspace\/hive-collective\/calendar$/);
    await expect(page.locator('h1')).toHaveText('Calendar');
    await expect(page.locator('[data-testid="month-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="view-btn-month"]')).toHaveClass(
      /active/,
    );
  });

  test('TC2 workspace-card Calendar quick-access navigates to the calendar page', async ({
    page,
  }) => {
    await page.goto('/');
    const card = page
      .locator('app-workspace-card', { hasText: 'Hive Collective' });
    await expect(card).toBeVisible();
    const calendarBtn = card.locator('.quick-item', { hasText: 'Calendar' });
    await calendarBtn.click();
    await expect(page).toHaveURL(/\/workspace\/hive-collective\/calendar$/);
    await expect(page.locator('h1')).toHaveText('Calendar');
  });
});

test.describe('Calendar — page interactions', () => {
  test.beforeEach(async ({ page }) => {
    await installCalendarMocks(page);
    await page.goto('/workspace/hive-collective/calendar');
    await expect(page.locator('[data-testid="month-grid"]')).toBeVisible();
  });

  test('TC3 Calendar tab has active state on /workspace/:id/calendar', async ({
    page,
  }) => {
    const calendarTab = page.locator('.ws-nav-item', { hasText: 'Calendar' });
    await expect(calendarTab).toHaveClass(/active/);
    const contentTab = page.locator('.ws-nav-item', { hasText: 'Content' });
    const strategyTab = page.locator('.ws-nav-item', {
      hasText: 'Strategy & Research',
    });
    await expect(contentTab).not.toHaveClass(/active/);
    await expect(strategyTab).not.toHaveClass(/active/);
  });

  test('TC4 view switcher cycles Month → Week → Day → List → Month', async ({
    page,
  }) => {
    await page.locator('[data-testid="view-btn-week"]').click();
    await expect(page.locator('[data-testid="week-grid"]')).toBeVisible();
    await page.locator('[data-testid="view-btn-day"]').click();
    await expect(page.locator('[data-testid="day-grid"]')).toBeVisible();
    await page.locator('[data-testid="view-btn-list"]').click();
    await expect(page.locator('[data-testid="list-grid"]')).toBeVisible();
    await page.locator('[data-testid="view-btn-month"]').click();
    await expect(page.locator('[data-testid="month-grid"]')).toBeVisible();
  });

  test('TC5 Prev advances month header; Today returns to the reference month', async ({
    page,
  }) => {
    const header = page.locator('[data-testid="cursor-label"]');
    await expect(header).toHaveText('May 2026');
    await page.locator('[data-testid="nav-next"]').click();
    await expect(header).toHaveText('June 2026');
    await page.locator('[data-testid="nav-today"]').click();
    await expect(header).toHaveText('May 2026');
  });

  test('TC6 toggling a platform filter narrows visible events', async ({
    page,
  }) => {
    const instagramPills = page
      .locator('[data-testid^="event-pill-"]')
      .filter({ has: page.locator('.pill-label:has-text("Instagram")') });
    const youtubePills = page
      .locator('[data-testid^="event-pill-"]')
      .filter({ has: page.locator('.pill-label:has-text("YouTube")') });
    const beforeInsta = await instagramPills.count();
    const beforeYouTube = await youtubePills.count();
    expect(beforeInsta + beforeYouTube).toBeGreaterThan(0);

    await page.locator('[data-testid="filter-platform-instagram"]').check();
    await expect(page.locator('.pill-label:has-text("YouTube")')).toHaveCount(0);
    expect(await instagramPills.count()).toBeGreaterThan(0);
  });

  test('TC7 upcoming panel shows overdue entry with a text+icon severity badge', async ({
    page,
  }) => {
    const panel = page.locator('[data-testid="upcoming-panel"]');
    await expect(panel).toBeVisible();
    const overdueRow = panel.locator('.upcoming-row.severity-overdue').first();
    await expect(overdueRow).toBeVisible();
    const badge = overdueRow.locator('.severity-badge');
    await expect(badge).toContainText('Overdue');
    await expect(badge.locator('.severity-icon')).toBeVisible();
  });

  test('TC8 clicking a publish pill deep-links to content detail with ?tab=packaging', async ({
    page,
  }) => {
    const publishPill = page
      .locator('[data-testid="event-pill-publish-e2e-1"]')
      .first();
    await expect(publishPill).toBeVisible();
    await publishPill.click();
    await expect(page).toHaveURL(
      /\/workspace\/hive-collective\/content\/e2e-1\?tab=packaging/,
    );
  });

  test('TC9 event pill uses themeable var(--blink-*) tokens (theme toggle changes computed color)', async ({
    page,
  }) => {
    const pill = page.locator('[data-testid^="event-pill-publish-"]').first();
    await expect(pill).toBeVisible();
    const colorLight = await pill.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    await page.locator('.theme-toggle-btn').click();
    const colorDark = await pill.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    expect(colorDark).not.toBe(colorLight);
  });
});
