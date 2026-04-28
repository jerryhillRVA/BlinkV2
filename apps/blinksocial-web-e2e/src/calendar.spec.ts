import { test, expect, type Page } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/login';
import { mockHiveContent } from './helpers/content-mocks';

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
    await expect(page.locator('[data-testid="calendar-page"] h1')).toHaveText(
      'Content Calendar',
    );
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
    await expect(page.locator('[data-testid="calendar-page"] h1')).toHaveText(
      'Content Calendar',
    );
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
    const instagramPills = page.locator(
      '[data-testid="month-grid"] .event-pill[data-platform="instagram"]',
    );
    const youtubePills = page.locator(
      '[data-testid="month-grid"] .event-pill[data-platform="youtube"]',
    );
    const beforeInsta = await instagramPills.count();
    const beforeYouTube = await youtubePills.count();
    expect(beforeInsta + beforeYouTube).toBeGreaterThan(0);

    await page.locator('[data-testid="filters-toggle"]').click();
    await page.locator('[data-testid="filter-platform-instagram"]').check();
    await expect(youtubePills).toHaveCount(0);
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

const SATURDAY_PEEK_PAYLOAD = {
  workspaceId: 'hive-collective',
  referenceDate: REFERENCE_DATE,
  items: [
    {
      id: 'sat-top',
      title: 'QA Due • Anti-Inflammatory Breakfast Bowl Walkthrough',
      platform: 'instagram',
      canonicalType: 'IMAGE_SINGLE',
      status: 'in-progress',
      owner: 'Ava Chen',
      scheduleAt: '2026-05-02T15:00:00.000Z',
      blockers: [],
    },
    {
      id: 'sat-bottom',
      title: 'Bottom-row Saturday publish',
      platform: 'instagram',
      canonicalType: 'IMAGE_SINGLE',
      status: 'approved',
      owner: 'Ava Chen',
      scheduleAt: '2026-05-30T15:00:00.000Z',
      blockers: [],
    },
    {
      id: 'midweek',
      title: 'Mid-week publish',
      platform: 'youtube',
      canonicalType: 'VIDEO_LONG_HORIZONTAL',
      status: 'approved',
      owner: 'Marcus Lee',
      scheduleAt: '2026-05-13T15:00:00.000Z',
      blockers: [],
    },
  ],
  milestones: [],
};

async function installPeekMocks(page: Page) {
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
      body: JSON.stringify(SATURDAY_PEEK_PAYLOAD),
    }),
  );
}

test.describe('Calendar — peek card placement', () => {
  test.beforeEach(async ({ page }) => {
    await installPeekMocks(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/workspace/hive-collective/calendar');
    await expect(page.locator('[data-testid="month-grid"]')).toBeVisible();
  });

  test('TC13 hovering a Saturday-column chip keeps the peek card inside the viewport', async ({
    page,
  }) => {
    const chip = page.locator('[data-testid="event-pill-publish-sat-top"]').first();
    await expect(chip).toBeVisible();
    await chip.hover();
    const card = page.locator('[data-testid="peek-card"]');
    await expect(card).toBeVisible();
    const inside = await card.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.left >= 0 && r.right <= window.innerWidth;
    });
    expect(inside).toBe(true);
  });

  test('TC14 hovering a mid-week chip preserves right-of-anchor placement', async ({
    page,
  }) => {
    const chip = page.locator('[data-testid="event-pill-publish-midweek"]').first();
    await expect(chip).toBeVisible();
    await chip.hover();
    const card = page.locator('[data-testid="peek-card"]');
    await expect(card).toBeVisible();
    const layout = await chip.evaluate((chipEl) => {
      const cardEl = document.querySelector('[data-testid="peek-card"]') as HTMLElement;
      const a = chipEl.getBoundingClientRect();
      const c = cardEl.getBoundingClientRect();
      return { chipRight: a.right, cardLeft: c.left };
    });
    expect(layout.cardLeft).toBeGreaterThanOrEqual(layout.chipRight);
  });

  test('TC15 bottom-row Saturday chip keeps the peek card inside the viewport vertically', async ({
    page,
  }) => {
    const chip = page.locator('[data-testid="event-pill-publish-sat-bottom"]').first();
    await expect(chip).toBeVisible();
    await chip.hover();
    const card = page.locator('[data-testid="peek-card"]');
    await expect(card).toBeVisible();
    const inside = await card.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return (
        r.top >= 0 &&
        r.bottom <= window.innerHeight &&
        r.left >= 0 &&
        r.right <= window.innerWidth
      );
    });
    expect(inside).toBe(true);
  });

  test('TC16 peek card background uses themeable tokens after positioning change', async ({
    page,
  }) => {
    const chip = page.locator('[data-testid="event-pill-publish-sat-top"]').first();
    await chip.hover();
    const card = page.locator('[data-testid="peek-card"]');
    await expect(card).toBeVisible();
    const colorLight = await card.evaluate((el) => getComputedStyle(el).backgroundColor);
    await page.locator('.theme-toggle-btn').click();
    await chip.hover();
    await expect(card).toBeVisible();
    const colorDark = await card.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(colorDark).not.toBe(colorLight);
  });
});

type RoundTripFixture = {
  workspace: string;
  contentId: string;
  title: string;
  scheduleAt: string;
  platform: 'instagram' | 'youtube';
  canonicalType: 'IMAGE_SINGLE' | 'VIDEO_SHORT_VERTICAL' | 'VIDEO_LONG_HORIZONTAL';
  contentType: 'reel' | 'long-form' | 'feed-post';
};

const ROUND_TRIP_FIXTURES: RoundTripFixture[] = [
  {
    workspace: 'booze-kills',
    contentId: 'bk-pub1',
    title: 'Dry January Results: What We Learned',
    scheduleAt: '2026-05-04T14:00:00.000Z',
    platform: 'instagram',
    canonicalType: 'VIDEO_SHORT_VERTICAL',
    contentType: 'reel',
  },
  {
    workspace: 'hive-collective',
    contentId: 'post1',
    title: '60-Second Morning Mobility Flow',
    scheduleAt: '2026-05-12T14:00:00.000Z',
    platform: 'instagram',
    canonicalType: 'VIDEO_SHORT_VERTICAL',
    contentType: 'reel',
  },
];

test.describe('Calendar — content round-trip in mock mode', () => {
  for (const fx of ROUND_TRIP_FIXTURES) {
    test(`TC10 (${fx.workspace}) calendar event click resolves to a populated content detail page`, async ({
      page,
    }) => {
      await mockAuthenticatedUser(page);
      await page.route('**/api/workspaces', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(WORKSPACES_PAYLOAD),
        }),
      );
      await page.route(
        new RegExp(`/api/calendar/${fx.workspace}$`),
        (route) =>
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              workspaceId: fx.workspace,
              referenceDate: REFERENCE_DATE,
              items: [
                {
                  id: fx.contentId,
                  title: fx.title,
                  platform: fx.platform,
                  canonicalType: fx.canonicalType,
                  status: 'scheduled',
                  owner: 'Ava Chen',
                  scheduleAt: fx.scheduleAt,
                  blockers: [],
                },
              ],
              milestones: [],
            }),
          }),
      );
      const itemDetail = {
        id: fx.contentId,
        stage: 'post' as const,
        status: 'scheduled' as const,
        title: fx.title,
        description: 'Round-trip fixture content',
        platform: fx.platform,
        contentType: fx.contentType,
        pillarIds: [],
        segmentIds: [],
        scheduledDate: fx.scheduleAt.slice(0, 10),
        scheduledAt: fx.scheduleAt,
        archived: false,
        createdAt: '2026-04-01T08:00:00Z',
        updatedAt: '2026-04-20T08:00:00Z',
      };
      await mockHiveContent(page, {
        workspaceId: fx.workspace,
        indexItems: [itemDetail],
        details: { [fx.contentId]: itemDetail },
      });

      await page.goto(`/workspace/${fx.workspace}/calendar`);
      await expect(page.locator('[data-testid="month-grid"]')).toBeVisible();

      const publishPill = page
        .locator(`[data-testid="event-pill-publish-${fx.contentId}"]`)
        .first();
      await expect(publishPill).toBeVisible();

      await publishPill.click();
      await expect(page).toHaveURL(
        new RegExp(
          `/workspace/${fx.workspace}/content/${fx.contentId}(\\?.*)?$`,
        ),
      );
      await expect(page.locator('app-post-detail')).toBeVisible();
      await expect(page.getByText('This item no longer exists.')).toHaveCount(
        0,
      );
      await expect(page.getByText(fx.title).first()).toBeVisible();
    });
  }

  test('TC11 calendar → detail → Back returns to Calendar (round-trip)', async ({
    page,
  }) => {
    const fx = ROUND_TRIP_FIXTURES[1];
    await mockAuthenticatedUser(page);
    await page.route('**/api/workspaces', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(WORKSPACES_PAYLOAD),
      }),
    );
    await page.route(
      new RegExp(`/api/calendar/${fx.workspace}$`),
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            workspaceId: fx.workspace,
            referenceDate: REFERENCE_DATE,
            items: [
              {
                id: fx.contentId,
                title: fx.title,
                platform: fx.platform,
                canonicalType: fx.canonicalType,
                status: 'scheduled',
                owner: 'Ava Chen',
                scheduleAt: fx.scheduleAt,
                blockers: [],
              },
            ],
            milestones: [],
          }),
        }),
    );
    const itemPayload = {
      id: fx.contentId,
      stage: 'post' as const,
      status: 'scheduled' as const,
      title: fx.title,
      description: 'Round-trip fixture content',
      pillarIds: [],
      segmentIds: [],
      platform: fx.platform,
      contentType: fx.contentType,
      scheduledDate: fx.scheduleAt.slice(0, 10),
      scheduledAt: fx.scheduleAt,
      createdAt: '2026-04-01T08:00:00Z',
      updatedAt: '2026-04-20T08:00:00Z',
    };
    await page.route(
      new RegExp(`/api/workspaces/${fx.workspace}/content-items/index$`),
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                id: itemPayload.id,
                stage: itemPayload.stage,
                status: itemPayload.status,
                title: itemPayload.title,
                platform: itemPayload.platform,
                contentType: itemPayload.contentType,
                pillarIds: [],
                segmentIds: [],
                owner: null,
                parentIdeaId: null,
                parentConceptId: null,
                scheduledDate: itemPayload.scheduledDate,
                archived: false,
                createdAt: itemPayload.createdAt,
                updatedAt: itemPayload.updatedAt,
              },
            ],
            totalCount: 1,
            lastUpdated: '2026-04-26T00:00:00.000Z',
          }),
        }),
    );
    await page.route(
      new RegExp(
        `/api/workspaces/${fx.workspace}/content-items/${fx.contentId}$`,
      ),
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(itemPayload),
        }),
    );

    const calendarNav = page.locator('.ws-nav-item', { hasText: 'Calendar' });
    const contentNav = page.locator('.ws-nav-item', { hasText: 'Content' });

    await page.goto(`/workspace/${fx.workspace}/calendar`);
    await expect(page.locator('[data-testid="month-grid"]')).toBeVisible();
    await expect(calendarNav).toHaveClass(/active/);
    await expect(contentNav).not.toHaveClass(/active/);

    const publishPill = page
      .locator(`[data-testid="event-pill-publish-${fx.contentId}"]`)
      .first();
    await expect(publishPill).toBeVisible();
    await publishPill.click();

    await expect(page).toHaveURL(
      new RegExp(
        `/workspace/${fx.workspace}/content/${fx.contentId}\\?.*from=calendar`,
      ),
    );
    await expect(page).toHaveURL(/calendarView=month/);
    await expect(page.locator('app-post-detail')).toBeVisible();
    // Issue #63 — header keeps Calendar active on a calendar-sourced detail URL.
    await expect(calendarNav).toHaveClass(/active/);
    await expect(contentNav).not.toHaveClass(/active/);

    await page.locator('app-post-detail .detail-back').click();

    await expect(page).toHaveURL(
      new RegExp(
        `/workspace/${fx.workspace}/calendar\\?.*calendarView=month`,
      ),
    );
    await expect(page.locator('[data-testid="month-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="view-btn-month"]')).toHaveClass(
      /active/,
    );
    await expect(calendarNav).toHaveClass(/active/);
    await expect(contentNav).not.toHaveClass(/active/);
  });

  test('TC12 calendar restores Week view + cursor when query params are present', async ({
    page,
  }) => {
    await installCalendarMocks(page);
    await page.goto(
      '/workspace/hive-collective/calendar?calendarView=week&calendarCursor=2026-05-04T00:00:00.000Z',
    );
    await expect(page.locator('[data-testid="week-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="view-btn-week"]')).toHaveClass(
      /active/,
    );
  });
});
