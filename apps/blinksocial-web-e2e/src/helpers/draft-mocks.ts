import type {
  ContentItemContract,
  ContentItemsIndexEntryContract,
  PlatformContract,
  ContentTypeContract,
} from '@blinksocial/contracts';

const NOW = '2026-04-01T09:00:00Z';

interface ApprovedPostOptions {
  id: string;
  title: string;
  platform: PlatformContract;
  contentType: ContentTypeContract;
}

export function approvedPostEntry(
  o: ApprovedPostOptions,
): ContentItemsIndexEntryContract {
  return {
    id: o.id,
    stage: 'post',
    status: 'in-progress',
    title: o.title,
    platform: o.platform,
    contentType: o.contentType,
    pillarIds: ['p1'],
    segmentIds: ['s1'],
    owner: 'user-brett',
    parentIdeaId: null,
    parentConceptId: null,
    scheduledDate: null,
    scheduledAt: null,
    archived: false,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

export function approvedPostDetail(
  o: ApprovedPostOptions,
): ContentItemContract {
  return {
    ...approvedPostEntry(o),
    description: 'Test post for the draft step.'.padEnd(80, ' .'),
    hook: 'A hook',
    objective: 'engagement',
    keyMessage: 'Test key message that meets the minimum length requirement.',
    cta: { type: 'follow', text: 'Follow for more' },
    briefApproved: true,
    briefApprovedAt: NOW,
    briefApprovedBy: 'user-brett',
    tags: [],
    production: {
      productionStep: 'draft',
      brief: {
        canonicalType: 'auto',
      },
    },
  };
}

/**
 * Approved post seeded directly on the Packaging step. Used by the
 * Production Packaging (#116) e2e tests so individual TCs don't have to
 * traverse Brief + Draft first.
 */
export function approvedPostInPackaging(
  o: ApprovedPostOptions,
): ContentItemContract {
  return {
    ...approvedPostDetail(o),
    production: {
      productionStep: 'packaging',
      brief: {
        canonicalType: 'auto',
        publishingMode: 'ORGANIC',
      },
      draft: {
        mode: 'TEXT',
        text: {
          caption: 'Draft caption seed',
          hashtags: [],
        },
      },
    },
  };
}

/**
 * Approved post seeded directly on the Approve & Schedule step. Used by
 * the Approve & Schedule (#124) e2e tests. Pre-fills a valid packaging
 * slot for the requested platform so `canContinueFromPackaging` is true
 * and the QA tab is unlocked.
 */
export function approvedPostInQA(o: ApprovedPostOptions): ContentItemContract {
  // The store's packagingErrors() rule for each platform requires a
  // non-empty caption (or title+description for YouTube). Seed a tiny
  // valid caption per-platform so the qa tab is reachable.
  const platform = o.platform;
  const captionedPackaging =
    platform === 'youtube'
      ? { youtube: { title: 'Title', description: 'Description' } }
      : platform === 'tbd'
      ? {}
      : { [platform]: { caption: 'Seed caption' } };
  return {
    ...approvedPostDetail(o),
    production: {
      productionStep: 'qa',
      brief: {
        canonicalType: 'auto',
        publishingMode: 'ORGANIC',
      },
      draft: {
        mode: 'TEXT',
        text: {
          caption: 'Draft caption seed',
          hashtags: [],
        },
      },
      packaging: {
        platform,
        ...captionedPackaging,
      },
    },
  };
}
