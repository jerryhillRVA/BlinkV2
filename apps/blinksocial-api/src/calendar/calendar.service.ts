import {
  Inject,
  Injectable,
  Logger,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  CalendarCanonicalTypeContract,
  CalendarContentItemContract,
  CalendarItemStatusContract,
  CalendarMilestoneContract,
  CalendarMilestoneTypeContract,
  CalendarResponseContract,
  CalendarSettingsContract,
  ContentItemContract,
  ContentItemsIndexContract,
  PlatformContract,
} from '@blinksocial/contracts';
import { AgenticFilesystemService } from '../agentic-filesystem/agentic-filesystem.service';
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
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    private readonly fs: AgenticFilesystemService,
    @Inject('MOCK_DATA_SERVICE') @Optional()
    private readonly mockDataService: MockDataService | null,
  ) {}

  async getCalendar(workspaceId: string): Promise<CalendarResponseContract> {
    if (this.fs.isConfigured()) {
      try {
        return await this.tryDeriveFromAfs(workspaceId);
      } catch (error) {
        this.logger.error(
          `Calendar AFS read failed for ${workspaceId}`,
          error,
        );
        throw new ServiceUnavailableException('Storage service unavailable.');
      }
    }
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

  private async tryDeriveFromAfs(
    workspaceId: string,
  ): Promise<CalendarResponseContract> {
    const index = (await this.readAfsAggregate(
      workspaceId,
      CONTENT_ITEMS_NAMESPACE,
      CONTENT_ITEMS_INDEX_FILE,
    )) as ContentItemsIndexContract | null;
    const settings = (await this.readAfsAggregate(
      workspaceId,
      'settings',
      `${CALENDAR_SETTINGS_TAB}.json`,
    )) as CalendarSettingsContract | null;

    const items: CalendarContentItemContract[] = [];
    const milestones: CalendarMilestoneContract[] = [];
    const entries = Array.isArray(index?.items) ? index.items : [];
    // Load full item files in parallel only for entries with contentType —
    // the same gate that decides whether template milestones apply. The
    // full record is needed so per-item `milestoneOverrides` (#134) can
    // shadow the template-derived dueAt without touching the workspace
    // deadline template.
    const fullItems = await Promise.all(
      entries.map((entry) =>
        !entry.archived && entry.contentType
          ? this.readAfsItem(workspaceId, entry.id)
          : Promise.resolve(null),
      ),
    );
    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      if (entry.archived) continue;
      const calItem = mapContentItemToCalendarItem(entry);
      if (!calItem) continue;
      items.push(calItem);
      if (entry.contentType) {
        const full = fullItems[i];
        milestones.push(
          ...deriveMilestonesForItem(
            calItem.id,
            calItem.scheduledAt as string,
            calItem.canonicalType,
            calItem.owner,
            settings,
            full?.milestoneOverrides,
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

  private async readAfsItem(
    workspaceId: string,
    itemId: string,
  ): Promise<ContentItemContract | null> {
    let entries: Awaited<
      ReturnType<AgenticFilesystemService['listDirectory']>
    > = [];
    try {
      entries = await this.fs.listDirectory(workspaceId, CONTENT_ITEMS_NAMESPACE);
    } catch {
      return null;
    }
    const file = entries.find(
      (e) => e.type === 'file' && e.name === `${itemId}.json`,
    );
    if (!file?.file_id) return null;
    const files = await this.fs.batchRetrieve(workspaceId, [file.file_id]);
    if (files.length === 0 || files[0].content_type === 'error') return null;
    return files[0].content as ContentItemContract;
  }

  private async readAfsAggregate(
    workspaceId: string,
    namespace: string,
    filename: string,
  ): Promise<unknown | null> {
    let entries: Awaited<
      ReturnType<AgenticFilesystemService['listDirectory']>
    > = [];
    try {
      entries = await this.fs.listDirectory(workspaceId, namespace);
    } catch {
      return null;
    }
    const file = entries.find(
      (e) => e.type === 'file' && e.name === filename,
    );
    if (!file?.file_id) return null;
    const files = await this.fs.batchRetrieve(workspaceId, [file.file_id]);
    if (files.length === 0 || files[0].content_type === 'error') return null;
    return files[0].content;
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
    // Same per-item read as the AFS branch (#134): full record needed so
    // milestoneOverrides shadow the template-derived dueAt.
    const fullItems = await Promise.all(
      entries.map((entry) =>
        !entry.archived && entry.contentType && this.mockDataService
          ? (this.mockDataService.getItemFile(workspaceId, entry.id) as Promise<
              ContentItemContract | null
            >)
          : Promise.resolve(null),
      ),
    );
    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      if (entry.archived) continue;
      const calItem = mapContentItemToCalendarItem(entry);
      if (!calItem) continue;
      items.push(calItem);
      if (entry.contentType) {
        const full = fullItems[i];
        milestones.push(
          ...deriveMilestonesForItem(
            calItem.id,
            calItem.scheduledAt as string,
            calItem.canonicalType,
            calItem.owner,
            settings,
            full?.milestoneOverrides,
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
      const scheduledAt = hasSchedule ? addDays(REFERENCE_DATE, offset) : null;
      const item: CalendarContentItemContract = {
        id,
        title: pick(TITLE_POOL),
        platform: pick(PLATFORMS),
        canonicalType: pick(CANONICAL_TYPES),
        status,
        owner: pick(OWNER_POOL),
        scheduledAt,
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
        const anchor = scheduledAt ?? addDays(REFERENCE_DATE, offset);
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
