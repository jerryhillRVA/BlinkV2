import { Inject, Injectable, Optional } from '@nestjs/common';
import type {
  CalendarCanonicalTypeContract,
  CalendarContentItemContract,
  CalendarItemStatusContract,
  CalendarMilestoneContract,
  CalendarMilestoneTypeContract,
  CalendarResponseContract,
  CalendarSettingsContract,
  ContentItemsIndexContract,
  PlatformContract,
} from '@blinksocial/contracts';
import type { MockDataService } from '../mocks/mock-data.service';
import {
  deriveMilestonesForItem,
  mapContentItemToCalendarItem,
} from './calendar-mappers';

const CALENDAR_NAMESPACE = 'calendar';
const CALENDAR_FIXTURE_FILE = 'dataset.json';
const CONTENT_ITEMS_NAMESPACE = 'content-items';
const CONTENT_ITEMS_INDEX_FILE = '_content-items-index.json';
const CALENDAR_SETTINGS_TAB = 'calendar';
const REFERENCE_DATE = '2026-05-01T00:00:00.000Z';

const PLATFORMS: PlatformContract[] = [
  'instagram',
  'tiktok',
  'youtube',
  'facebook',
  'linkedin',
];

const CANONICAL_TYPES: CalendarCanonicalTypeContract[] = [
  'VIDEO_SHORT_VERTICAL',
  'VIDEO_LONG_HORIZONTAL',
  'VIDEO_SHORT_HORIZONTAL',
  'IMAGE_SINGLE',
  'IMAGE_CAROUSEL',
  'TEXT_POST',
  'LINK_POST',
  'DOCUMENT_CAROUSEL_PDF',
  'STORY_FRAME_SET',
  'LIVE_BROADCAST',
];

const STATUSES: CalendarItemStatusContract[] = [
  'intake',
  'in-progress',
  'in-review',
  'revisions',
  'approved',
  'scheduled',
  'published',
];

const MILESTONE_TYPES: CalendarMilestoneTypeContract[] = [
  'brief_due',
  'draft_due',
  'blueprint_due',
  'assets_due',
  'packaging_due',
  'qa_due',
];

const OWNER_POOL = [
  'Ava Chen',
  'Marcus Lee',
  'Priya Patel',
  'Jordan Reyes',
  'Sam O’Neill',
  'Taylor Kim',
];

const TITLE_POOL = [
  'Spring launch teaser',
  'Founder behind-the-scenes',
  'How we test new recipes',
  'Customer story: The Mill',
  'Quick tips: Week 14',
  'Product deep-dive',
  'Event recap carousel',
  'Webinar invite',
  'AMA highlights',
  'Behind the brand',
  'Testimonial reel',
  'FAQ Friday',
  'Holiday campaign kickoff',
  'Partner spotlight',
  'Team intro series',
  'Roadmap update',
  'Community showcase',
  'Case study: retention',
  'Seasonal inspiration',
  'Hot takes: industry',
];

function hashStringToSeed(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

@Injectable()
export class CalendarService {
  constructor(
    @Inject('MOCK_DATA_SERVICE') @Optional()
    private readonly mockDataService: MockDataService | null,
  ) {}

  async getCalendar(workspaceId: string): Promise<CalendarResponseContract> {
    const fixture = await this.tryLoadFixture(workspaceId);
    if (fixture) {
      return fixture;
    }
    const derived = await this.tryDeriveFromMockContent(workspaceId);
    if (derived) {
      return derived;
    }
    return this.generateSynthetic(workspaceId);
  }

  private async tryDeriveFromMockContent(
    workspaceId: string,
  ): Promise<CalendarResponseContract | null> {
    if (!this.mockDataService?.isMockWorkspace(workspaceId)) {
      return null;
    }
    const index = (await this.mockDataService.getNamespaceAggregate(
      workspaceId,
      CONTENT_ITEMS_NAMESPACE,
      CONTENT_ITEMS_INDEX_FILE,
    )) as ContentItemsIndexContract | null;
    const settings = (await this.mockDataService.getSettings(
      workspaceId,
      CALENDAR_SETTINGS_TAB,
    )) as CalendarSettingsContract | null;

    const items: CalendarContentItemContract[] = [];
    const milestones: CalendarMilestoneContract[] = [];
    const entries = Array.isArray(index?.items) ? index.items : [];
    for (const entry of entries) {
      if (entry.archived) continue;
      const calItem = mapContentItemToCalendarItem(entry);
      if (!calItem) continue;
      items.push(calItem);
      // Only apply deadline templates when the source item has an explicit
      // contentType. Items with null contentType fall back to IMAGE_SINGLE
      // for visual rendering, but we don't want that default to inherit
      // IMAGE_SINGLE's milestone schedule.
      if (entry.contentType) {
        milestones.push(
          ...deriveMilestonesForItem(
            calItem.id,
            calItem.scheduleAt as string,
            calItem.canonicalType,
            calItem.owner,
            settings,
          ),
        );
      }
    }

    return {
      workspaceId,
      referenceDate: REFERENCE_DATE,
      items,
      milestones,
    };
  }

  private async tryLoadFixture(
    workspaceId: string,
  ): Promise<CalendarResponseContract | null> {
    if (!this.mockDataService?.isMockWorkspace(workspaceId)) {
      return null;
    }
    const data = (await this.mockDataService.getNamespaceAggregate(
      workspaceId,
      CALENDAR_NAMESPACE,
      CALENDAR_FIXTURE_FILE,
    )) as CalendarResponseContract | null;
    if (!data) {
      return null;
    }
    return { ...data, workspaceId };
  }

  private generateSynthetic(workspaceId: string): CalendarResponseContract {
    const rand = mulberry32(hashStringToSeed(workspaceId));
    const pick = <T>(arr: readonly T[]): T =>
      arr[Math.floor(rand() * arr.length)] as T;
    const itemCount = 28 + Math.floor(rand() * 13);

    const items: CalendarContentItemContract[] = [];
    const milestones: CalendarMilestoneContract[] = [];

    for (let i = 0; i < itemCount; i += 1) {
      const id = `calitem-${workspaceId}-${i.toString().padStart(3, '0')}`;
      const status = pick(STATUSES);
      const offset = Math.floor(rand() * 85) - 40;
      const hasSchedule =
        status === 'scheduled' ||
        status === 'published' ||
        status === 'approved' ||
        rand() > 0.3;
      const scheduleAt = hasSchedule ? addDays(REFERENCE_DATE, offset) : null;
      const item: CalendarContentItemContract = {
        id,
        title: pick(TITLE_POOL),
        platform: pick(PLATFORMS),
        canonicalType: pick(CANONICAL_TYPES),
        status,
        owner: pick(OWNER_POOL),
        scheduleAt,
        flags: {
          hasClaims: rand() < 0.15,
          hasTalent: rand() < 0.2,
          publishingMode: rand() < 0.2 ? 'PAID_BOOSTED' : 'ORGANIC',
        },
        blockers: [],
      };
      items.push(item);

      const milestoneCount = 1 + Math.floor(rand() * 3);
      for (let m = 0; m < milestoneCount; m += 1) {
        const milestoneType = pick(MILESTONE_TYPES);
        const anchor = scheduleAt ?? addDays(REFERENCE_DATE, offset);
        const dueOffset = -(1 + Math.floor(rand() * 10));
        milestones.push({
          milestoneId: `${id}-${milestoneType}-${m}`,
          contentId: id,
          milestoneType,
          dueAt: addDays(anchor, dueOffset),
          milestoneOwner: pick(OWNER_POOL),
          isRequired: rand() < 0.8,
        });
      }
    }

    return {
      workspaceId,
      referenceDate: REFERENCE_DATE,
      items,
      milestones,
    };
  }
}
