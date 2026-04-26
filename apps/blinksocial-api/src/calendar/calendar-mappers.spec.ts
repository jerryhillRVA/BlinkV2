import type {
  CalendarSettingsContract,
  ContentItemContract,
  ContentItemsIndexEntryContract,
  ContentStatusContract,
  ContentTypeContract,
} from '@blinksocial/contracts';
import {
  deriveMilestonesForItem,
  mapContentItemToCalendarItem,
  mapContentStatusToCalendarStatus,
  mapContentTypeToCanonical,
  resolveScheduleAt,
} from './calendar-mappers';

describe('calendar-mappers', () => {
  describe('mapContentTypeToCanonical', () => {
    const cases: Array<[ContentTypeContract, string]> = [
      ['reel', 'VIDEO_SHORT_VERTICAL'],
      ['short-video', 'VIDEO_SHORT_VERTICAL'],
      ['shorts', 'VIDEO_SHORT_VERTICAL'],
      ['fb-reel', 'VIDEO_SHORT_VERTICAL'],
      ['long-form', 'VIDEO_LONG_HORIZONTAL'],
      ['ln-video', 'VIDEO_LONG_HORIZONTAL'],
      ['carousel', 'IMAGE_CAROUSEL'],
      ['photo-carousel', 'IMAGE_CAROUSEL'],
      ['feed-post', 'IMAGE_SINGLE'],
      ['fb-feed-post', 'IMAGE_SINGLE'],
      ['fb-link-post', 'LINK_POST'],
      ['ln-article', 'LINK_POST'],
      ['story', 'STORY_FRAME_SET'],
      ['fb-story', 'STORY_FRAME_SET'],
      ['live', 'LIVE_BROADCAST'],
      ['live-stream', 'LIVE_BROADCAST'],
      ['fb-live', 'LIVE_BROADCAST'],
      ['community-post', 'TEXT_POST'],
      ['ln-text-post', 'TEXT_POST'],
      ['ln-document', 'DOCUMENT_CAROUSEL_PDF'],
      ['guide', 'TEXT_POST'],
    ];
    it.each(cases)('maps %s → %s', (input, expected) => {
      expect(mapContentTypeToCanonical(input)).toBe(expected);
    });
    it('falls back to IMAGE_SINGLE when contentType is null/undefined', () => {
      expect(mapContentTypeToCanonical(null)).toBe('IMAGE_SINGLE');
      expect(mapContentTypeToCanonical(undefined)).toBe('IMAGE_SINGLE');
    });
  });

  describe('mapContentStatusToCalendarStatus', () => {
    const cases: Array<[ContentStatusContract, string]> = [
      ['draft', 'intake'],
      ['concepting', 'intake'],
      ['posting', 'in-progress'],
      ['in-progress', 'in-progress'],
      ['review', 'in-review'],
      ['scheduled', 'scheduled'],
      ['published', 'published'],
    ];
    it.each(cases)('maps %s → %s', (input, expected) => {
      expect(mapContentStatusToCalendarStatus(input)).toBe(expected);
    });
  });

  describe('resolveScheduleAt', () => {
    it('prefers scheduledAt when present', () => {
      const got = resolveScheduleAt({
        scheduledAt: '2026-05-10T18:00:00.000Z',
        scheduledDate: '2026-05-10',
      });
      expect(got).toBe('2026-05-10T18:00:00.000Z');
    });
    it('synthesizes ISO from scheduledDate when only date is set', () => {
      const got = resolveScheduleAt({ scheduledDate: '2026-05-10' });
      expect(got).toBe('2026-05-10T14:00:00.000Z');
    });
    it('returns null when neither field is set', () => {
      expect(resolveScheduleAt({})).toBeNull();
    });
  });

  describe('mapContentItemToCalendarItem', () => {
    const baseItem: ContentItemContract = {
      id: 'bk-pub1',
      stage: 'post',
      status: 'published',
      title: 'Dry January Results',
      description: '',
      pillarIds: [],
      segmentIds: [],
      platform: 'instagram',
      contentType: 'reel',
      scheduledDate: '2026-02-15',
      scheduledAt: '2026-02-15T14:00:00Z',
      owner: 'user-mara',
      createdAt: '2026-02-01T08:00:00Z',
      updatedAt: '2026-02-15T10:00:00Z',
    };
    it('maps a fully-populated content item', () => {
      const result = mapContentItemToCalendarItem(baseItem);
      expect(result).toEqual({
        id: 'bk-pub1',
        title: 'Dry January Results',
        platform: 'instagram',
        canonicalType: 'VIDEO_SHORT_VERTICAL',
        status: 'published',
        owner: 'user-mara',
        scheduleAt: '2026-02-15T14:00:00Z',
        blockers: [],
      });
    });
    it('returns null when neither scheduledAt nor scheduledDate is set', () => {
      const item = { ...baseItem, scheduledAt: undefined, scheduledDate: undefined };
      expect(mapContentItemToCalendarItem(item)).toBeNull();
    });
    it('defaults platform to "tbd" and owner to "Unassigned" when missing', () => {
      const indexEntry: ContentItemsIndexEntryContract = {
        id: 'x1',
        stage: 'post',
        status: 'in-progress',
        title: 'Untyped post',
        platform: null,
        contentType: null,
        pillarIds: [],
        segmentIds: [],
        owner: null,
        parentIdeaId: null,
        parentConceptId: null,
        scheduledDate: '2026-05-04',
        archived: false,
        createdAt: '2026-04-01T08:00:00Z',
        updatedAt: '2026-04-10T08:00:00Z',
      };
      const result = mapContentItemToCalendarItem(indexEntry);
      expect(result?.platform).toBe('tbd');
      expect(result?.owner).toBe('Unassigned');
      expect(result?.canonicalType).toBe('IMAGE_SINGLE');
    });
  });

  describe('deriveMilestonesForItem', () => {
    const settings: CalendarSettingsContract = {
      enableDeadlineTemplates: true,
      deadlineTemplates: {
        VIDEO_SHORT_VERTICAL: {
          milestones: [
            { milestoneType: 'draft_due', offsetDays: -5, required: true },
            { milestoneType: 'qa_due', offsetDays: -1, required: true },
          ],
          phases: [],
        },
      },
      reminderSettings: {
        milestone72h: false,
        milestone24h: false,
        milestoneOverdue: false,
        publish24h: false,
      },
      autoCreateOnPublish: false,
    };

    it('derives one milestone per template entry, anchored to scheduleAt', () => {
      const milestones = deriveMilestonesForItem(
        'bk-pub1',
        '2026-05-15T15:00:00.000Z',
        'VIDEO_SHORT_VERTICAL',
        'user-mara',
        settings,
      );
      expect(milestones).toHaveLength(2);
      expect(milestones[0]).toMatchObject({
        contentId: 'bk-pub1',
        milestoneType: 'draft_due',
        dueAt: '2026-05-10T15:00:00.000Z',
        milestoneOwner: 'user-mara',
        isRequired: true,
      });
      expect(milestones[1].dueAt).toBe('2026-05-14T15:00:00.000Z');
      expect(milestones[1].milestoneType).toBe('qa_due');
    });

    it('returns [] when no template matches the canonical type', () => {
      const got = deriveMilestonesForItem(
        'x1',
        '2026-05-15T15:00:00.000Z',
        'IMAGE_CAROUSEL',
        'user-x',
        settings,
      );
      expect(got).toEqual([]);
    });

    it('returns [] when settings is null', () => {
      expect(
        deriveMilestonesForItem(
          'x1',
          '2026-05-15T15:00:00.000Z',
          'VIDEO_SHORT_VERTICAL',
          'user-x',
          null,
        ),
      ).toEqual([]);
    });
  });
});
