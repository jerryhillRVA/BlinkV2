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
        approved: true,
        canonicalType: 'auto',
      },
    },
  };
}
