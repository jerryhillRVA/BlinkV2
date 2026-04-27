import type { Page } from '@playwright/test';

/**
 * Minimal hive-collective content + brand-voice fixtures for e2e specs that
 * exercise the pipeline view (Ideas / Concepts / In Production columns) and
 * the Idea / Concept / Post detail pages. Mirrors the dataset that the
 * frontend used to fall back to before content.mock-data.ts was removed
 * (commit on this branch). Routes return realistic but minimal payloads so
 * tests don't rely on the dev API serving authenticated requests.
 */

const PILLARS = [
  {
    id: 'p1',
    name: 'Yoga & Movement',
    description: 'Yoga and movement',
    color: '#d94e33',
  },
  {
    id: 'p2',
    name: 'Wellness & Mindfulness',
    description: 'Wellness and mindfulness',
    color: '#10b981',
  },
];

const SEGMENTS = [
  { id: 's1', name: 'Active 40s', description: 'Women in their 40s' },
  { id: 's4', name: 'Fitness Beginners', description: 'New to fitness' },
];

const NOW = '2026-04-01T09:00:00Z';

const IDEA_ENTRY = {
  id: 'idea1',
  stage: 'idea',
  status: 'draft',
  title: 'Morning Yoga Flow',
  platform: null,
  contentType: null,
  pillarIds: ['p1'],
  segmentIds: ['s1'],
  owner: null,
  parentIdeaId: null,
  parentConceptId: null,
  scheduledDate: null,
  archived: false,
  createdAt: NOW,
  updatedAt: NOW,
};

// parentIdeaId is intentionally null so demoteToIdea doesn't trigger the
// follow-up syncIdeaConceptStatus save, which races with the persist PUT
// in some browsers and clobbers the stage transition.
const CONCEPT_ENTRY = {
  id: 'concept1',
  stage: 'concept',
  status: 'concepting',
  title: 'Mindful Breathing 101',
  platform: null,
  contentType: null,
  pillarIds: ['p2'],
  segmentIds: ['s4'],
  owner: 'user-brett',
  parentIdeaId: null,
  parentConceptId: null,
  scheduledDate: null,
  archived: false,
  createdAt: NOW,
  updatedAt: NOW,
};

const POST_ENTRY = {
  id: 'prod1',
  stage: 'post',
  status: 'in-progress',
  title: '60-sec Morning Mobility Flow',
  platform: 'instagram',
  contentType: 'reel',
  pillarIds: ['p1'],
  segmentIds: ['s4'],
  owner: 'user-brett',
  parentIdeaId: null,
  parentConceptId: 'concept1',
  scheduledDate: null,
  archived: false,
  createdAt: NOW,
  updatedAt: NOW,
};

const IDEA_DETAIL = {
  ...IDEA_ENTRY,
  description: 'A short yoga flow for the morning.',
  tags: ['yoga', 'morning'],
};

const CONCEPT_DETAIL = {
  ...CONCEPT_ENTRY,
  description:
    'Three breathing techniques for stress relief that anyone can practise at their desk in under five minutes — paced inhale, box breathing, and 4-7-8 exhale.',
  hook: 'Two minutes. One technique. Zero excuses.',
  objective: 'education',
  targetPlatforms: [
    { platform: 'instagram', contentType: 'carousel', postId: null },
    { platform: 'tiktok', contentType: 'short-video', postId: null },
  ],
  cta: { type: 'follow', text: 'Follow for more breathwork tips' },
  tags: ['breathwork'],
};

const POST_DETAIL = {
  ...POST_ENTRY,
  description: 'Quick morning mobility routine for stiff joints.',
  hook: "Your body shouldn't feel 80 when you're 30.",
  objective: 'engagement',
  keyMessage: 'A 60-second flow can transform your mornings',
  tags: ['mobility'],
  conceptId: 'concept1',
  production: {
    productionStep: 'brief',
    brief: {
      strategy: {
        objective: 'engagement',
        audienceSegmentIds: ['s4'],
        pillarIds: ['p1'],
        keyMessage: 'A 60-second flow can transform your mornings',
        ctaType: 'follow',
        ctaText: 'Follow for daily flows',
        tonePreset: 'casual',
        doChecklist: ['Show clear form'],
        dontChecklist: ['Avoid medical claims'],
      },
      platformRules: {
        durationTarget: 60,
        hookType: 'outcome-first',
        loopEnding: true,
      },
      creativePlan: {
        hook: "Your body shouldn't feel 80 when you're 30",
        storyArc: 'hook-promise-sections-recap-cta',
        musicNotes: 'Lo-fi ambient',
      },
      compliance: { containsClaims: false, disclosureNeeded: false },
      approved: false,
      canonicalType: 'VIDEO_SHORT_VERTICAL',
      hasTalent: false,
      hasMusic: false,
      needsAccessibility: true,
    },
    sources: [],
    outputs: {},
    assets: [],
    tasks: [],
    versions: [],
  },
};

const BASE_DETAILS: Record<string, unknown> = {
  idea1: IDEA_DETAIL,
  concept1: CONCEPT_DETAIL,
  prod1: POST_DETAIL,
};

const INDEX_PAYLOAD = {
  items: [IDEA_ENTRY, CONCEPT_ENTRY, POST_ENTRY],
  totalCount: 3,
  lastUpdated: NOW,
};

const ARCHIVE_INDEX_PAYLOAD = {
  items: [],
  totalCount: 0,
  lastUpdated: NOW,
};

const BRAND_VOICE_PAYLOAD = {
  contentPillars: PILLARS,
  audienceSegments: SEGMENTS,
};

const OBJECTIVES_PAYLOAD: unknown[] = [];

interface MockHiveOptions {
  workspaceId?: string;
  indexItems?: ReadonlyArray<unknown>;
  details?: Record<string, unknown>;
}

/**
 * Install JSON mocks for the configured workspace's content + brand-voice
 * endpoints. Call after mockAuthenticatedUser and before page.goto.
 *
 * Playwright invokes route handlers in REVERSE registration order, so the
 * catch-all detail route is registered FIRST and the more specific
 * /content-items/index, /archive-index, and settings routes LAST so they
 * win over the catch-all.
 */
export const mockHiveContent = async (
  page: Page,
  options: MockHiveOptions = {},
) => {
  const ws = options.workspaceId ?? 'hive-collective';
  const indexItems = options.indexItems ?? [IDEA_ENTRY, CONCEPT_ENTRY, POST_ENTRY];
  const details: Record<string, unknown> = {
    ...BASE_DETAILS,
    ...(options.details ?? {}),
  };

  // Catch-all detail route (registered first → invoked LAST as fallback).
  // Echoes back the PUT/POST body so the frontend's optimistic state
  // updates aren't overwritten by a stale GET payload.
  await page.route(
    new RegExp(
      `/api/workspaces/${ws}/content-items/([^/?]+)(\\?.*)?$`,
    ),
    (route) => {
      const request = route.request();
      const method = request.method();
      const url = new URL(request.url());
      const segments = url.pathname.split('/');
      const itemId = segments[segments.length - 1];

      if (method === 'PUT' || method === 'PATCH' || method === 'POST') {
        const raw = request.postData();
        let merged: unknown = details[itemId] ?? {};
        if (raw) {
          try {
            merged = { ...(merged as object), ...JSON.parse(raw) };
          } catch {
            // ignore parse errors, fall through with stored detail
          }
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(merged),
        });
      }

      const detail = details[itemId];
      if (!detail) {
        return route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'not found' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(detail),
      });
    },
  );

  await page.route(
    new RegExp(`/api/workspaces/${ws}/content-items/index$`),
    (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: indexItems,
          totalCount: indexItems.length,
          lastUpdated: NOW,
        }),
      }),
  );

  await page.route(
    new RegExp(`/api/workspaces/${ws}/content-items/archive-index$`),
    (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ARCHIVE_INDEX_PAYLOAD),
      }),
  );

  await page.route(
    new RegExp(`/api/workspaces/${ws}/settings/brand-voice$`),
    (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(BRAND_VOICE_PAYLOAD),
      }),
  );

  await page.route(
    new RegExp(`/api/workspaces/${ws}/settings/business-objectives$`),
    (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(OBJECTIVES_PAYLOAD),
      }),
  );
};
