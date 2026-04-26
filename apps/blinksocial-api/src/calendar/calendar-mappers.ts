import type {
  CalendarCanonicalTypeContract,
  CalendarContentItemContract,
  CalendarItemStatusContract,
  CalendarMilestoneContract,
  CalendarSettingsContract,
  ContentItemContract,
  ContentItemsIndexEntryContract,
  ContentStatusContract,
  ContentTypeContract,
  PlatformContract,
} from '@blinksocial/contracts';

const DEFAULT_PUBLISH_TIME_UTC = 'T14:00:00.000Z';

const CONTENT_TYPE_TO_CANONICAL: Record<
  ContentTypeContract,
  CalendarCanonicalTypeContract
> = {
  reel: 'VIDEO_SHORT_VERTICAL',
  'short-video': 'VIDEO_SHORT_VERTICAL',
  shorts: 'VIDEO_SHORT_VERTICAL',
  'fb-reel': 'VIDEO_SHORT_VERTICAL',
  'long-form': 'VIDEO_LONG_HORIZONTAL',
  'ln-video': 'VIDEO_LONG_HORIZONTAL',
  carousel: 'IMAGE_CAROUSEL',
  'photo-carousel': 'IMAGE_CAROUSEL',
  'feed-post': 'IMAGE_SINGLE',
  'fb-feed-post': 'IMAGE_SINGLE',
  'fb-link-post': 'LINK_POST',
  'ln-article': 'LINK_POST',
  story: 'STORY_FRAME_SET',
  'fb-story': 'STORY_FRAME_SET',
  live: 'LIVE_BROADCAST',
  'live-stream': 'LIVE_BROADCAST',
  'fb-live': 'LIVE_BROADCAST',
  'community-post': 'TEXT_POST',
  'ln-text-post': 'TEXT_POST',
  'ln-document': 'DOCUMENT_CAROUSEL_PDF',
  guide: 'TEXT_POST',
};

const CONTENT_STATUS_TO_CALENDAR_STATUS: Record<
  ContentStatusContract,
  CalendarItemStatusContract
> = {
  draft: 'intake',
  concepting: 'intake',
  posting: 'in-progress',
  'in-progress': 'in-progress',
  review: 'in-review',
  scheduled: 'scheduled',
  published: 'published',
};

export function mapContentTypeToCanonical(
  contentType: ContentTypeContract | null | undefined,
): CalendarCanonicalTypeContract {
  if (contentType && CONTENT_TYPE_TO_CANONICAL[contentType]) {
    return CONTENT_TYPE_TO_CANONICAL[contentType];
  }
  return 'IMAGE_SINGLE';
}

export function mapContentStatusToCalendarStatus(
  status: ContentStatusContract,
): CalendarItemStatusContract {
  return CONTENT_STATUS_TO_CALENDAR_STATUS[status] ?? 'intake';
}

export function resolveScheduleAt(
  item: Pick<ContentItemContract, 'scheduledAt' | 'scheduledDate'>,
): string | null {
  if (item.scheduledAt) return item.scheduledAt;
  if (item.scheduledDate) return `${item.scheduledDate}${DEFAULT_PUBLISH_TIME_UTC}`;
  return null;
}

export function mapContentItemToCalendarItem(
  item: ContentItemContract | ContentItemsIndexEntryContract,
): CalendarContentItemContract | null {
  const scheduleAt = resolveScheduleAt(item);
  if (!scheduleAt) return null;
  const platform: PlatformContract = item.platform ?? 'tbd';
  return {
    id: item.id,
    title: item.title,
    platform,
    canonicalType: mapContentTypeToCanonical(item.contentType ?? null),
    status: mapContentStatusToCalendarStatus(item.status),
    owner: item.owner ?? 'Unassigned',
    scheduleAt,
    blockers: [],
  };
}

export function deriveMilestonesForItem(
  contentId: string,
  scheduleAt: string,
  canonicalType: CalendarCanonicalTypeContract,
  ownerLabel: string,
  settings: CalendarSettingsContract | null,
): CalendarMilestoneContract[] {
  if (!settings?.deadlineTemplates) return [];
  const template = settings.deadlineTemplates[canonicalType];
  if (!template?.milestones) return [];
  const anchor = new Date(scheduleAt);
  return template.milestones.map((m, idx) => {
    const due = new Date(anchor);
    due.setUTCDate(due.getUTCDate() + m.offsetDays);
    return {
      milestoneId: `${contentId}-${m.milestoneType}-${idx}`,
      contentId,
      milestoneType: m.milestoneType,
      dueAt: due.toISOString(),
      milestoneOwner: ownerLabel,
      isRequired: m.required,
    };
  });
}
