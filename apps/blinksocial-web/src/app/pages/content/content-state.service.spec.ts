import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ContentStateService } from './content-state.service';
import { WorkspaceSettingsApiService } from '../workspace-settings/workspace-settings-api.service';
import { ContentItemsApiService } from './content-items-api.service';
import { MockDataService } from '../../core/mock-data/mock-data.service';
import { ToastService } from '../../core/toast/toast.service';
import type { ContentItemsIndexEntryContract, ContentItemContract } from '@blinksocial/contracts';

function indexRow(
  overrides: Partial<ContentItemsIndexEntryContract> = {},
): ContentItemsIndexEntryContract {
  return {
    id: overrides.id ?? 'c-1',
    stage: overrides.stage ?? 'idea',
    status: overrides.status ?? 'draft',
    title: overrides.title ?? 'Row',
    platform: overrides.platform ?? null,
    contentType: overrides.contentType ?? null,
    pillarIds: overrides.pillarIds ?? [],
    segmentIds: overrides.segmentIds ?? [],
    owner: overrides.owner ?? null,
    parentIdeaId: overrides.parentIdeaId ?? null,
    parentConceptId: overrides.parentConceptId ?? null,
    scheduledAt: overrides.scheduledAt ?? null,
    archived: overrides.archived ?? false,
    createdAt: overrides.createdAt ?? '2026-04-21T00:00:00Z',
    updatedAt: overrides.updatedAt ?? '2026-04-21T00:00:00Z',
  };
}

function fullItem(
  overrides: Partial<ContentItemContract> = {},
): ContentItemContract {
  return {
    id: overrides.id ?? 'c-1',
    stage: overrides.stage ?? 'idea',
    status: overrides.status ?? 'draft',
    title: overrides.title ?? 'Row',
    description: overrides.description ?? '',
    pillarIds: overrides.pillarIds ?? [],
    segmentIds: overrides.segmentIds ?? [],
    archived: overrides.archived ?? false,
    createdAt: overrides.createdAt ?? '2026-04-21T00:00:00Z',
    updatedAt: overrides.updatedAt ?? '2026-04-21T00:00:00Z',
    ...overrides,
  } as ContentItemContract;
}

describe('ContentStateService', () => {
  let service: ContentStateService;
  let workspaceApi: {
    getSettings: ReturnType<typeof vi.fn>;
  };
  let itemsApi: {
    getIndex: ReturnType<typeof vi.fn>;
    getArchiveIndex: ReturnType<typeof vi.fn>;
    getItem: ReturnType<typeof vi.fn>;
    createItem: ReturnType<typeof vi.fn>;
    updateItem: ReturnType<typeof vi.fn>;
    archiveItem: ReturnType<typeof vi.fn>;
    unarchiveItem: ReturnType<typeof vi.fn>;
    deleteItem: ReturnType<typeof vi.fn>;
    sendConceptBack: ReturnType<typeof vi.fn>;
  };
  let mockDataService: { markReal: ReturnType<typeof vi.fn>; isMock: ReturnType<typeof vi.fn> };
  let toastService: { showError: ReturnType<typeof vi.fn>; showSuccess: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    workspaceApi = {
      getSettings: vi.fn().mockReturnValue(of(null)),
    };
    itemsApi = {
      getIndex: vi
        .fn()
        .mockReturnValue(of({ items: [], totalCount: 0, lastUpdated: '' })),
      getArchiveIndex: vi
        .fn()
        .mockReturnValue(of({ items: [], totalCount: 0, lastUpdated: '' })),
      getItem: vi.fn().mockReturnValue(of(null)),
      createItem: vi.fn(),
      updateItem: vi.fn(),
      archiveItem: vi.fn(),
      unarchiveItem: vi.fn(),
      deleteItem: vi.fn(),
      sendConceptBack: vi.fn(),
    };
    mockDataService = {
      markReal: vi.fn(),
      isMock: vi.fn().mockReturnValue(true),
    };
    toastService = {
      showError: vi.fn(),
      showSuccess: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ContentStateService,
        { provide: WorkspaceSettingsApiService, useValue: workspaceApi },
        { provide: ContentItemsApiService, useValue: itemsApi },
        { provide: MockDataService, useValue: mockDataService },
        { provide: ToastService, useValue: toastService },
      ],
    });

    service = TestBed.inject(ContentStateService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty state', () => {
    expect(service.items()).toEqual([]);
    expect(service.pillars()).toEqual([]);
    expect(service.segments()).toEqual([]);
    expect(service.loading()).toBe(false);
  });

  describe('loadAll', () => {
    it('should set workspace ID', () => {
      service.loadAll('ws-1');
      expect(service.workspaceId()).toBe('ws-1');
    });

    it('should call API for content-items index and brand-voice', () => {
      service.loadAll('ws-1');
      expect(itemsApi.getIndex).toHaveBeenCalledWith('ws-1');
      expect(workspaceApi.getSettings).toHaveBeenCalledWith('ws-1', 'brand-voice');
    });

    it('treats an empty-index API response as legitimately empty (no mock seed)', () => {
      service.loadAll('ws-1');
      expect(service.items()).toEqual([]);
    });

    it('renders empty list and toasts an error when index API fails', () => {
      itemsApi.getIndex.mockReturnValue(throwError(() => new Error('fail')));
      service.loadAll('ws-1');
      expect(service.items()).toEqual([]);
      expect(toastService.showError).toHaveBeenCalledWith(
        "Couldn't load content. Try refreshing.",
      );
      expect(toastService.showError).toHaveBeenCalledTimes(1);
    });

    it('toasts exactly once when all three APIs fail simultaneously', () => {
      itemsApi.getIndex.mockReturnValue(throwError(() => new Error('idx')));
      workspaceApi.getSettings.mockReturnValue(
        throwError(() => new Error('settings')),
      );
      service.loadAll('ws-1');
      expect(service.items()).toEqual([]);
      expect(service.pillars()).toEqual([]);
      expect(service.segments()).toEqual([]);
      expect(service.businessObjectives()).toEqual([]);
      expect(toastService.showError).toHaveBeenCalledTimes(1);
    });

    it('does not toast on a successful empty index', () => {
      service.loadAll('ws-1');
      expect(service.items()).toEqual([]);
      expect(toastService.showError).not.toHaveBeenCalled();
    });

    it('populates business objectives from brand-voice api for D-05 binding', () => {
      workspaceApi.getSettings.mockImplementation((_id: string, key: string) => {
        if (key === 'business-objectives') {
          return of([{ id: 'o-1', category: 'growth', statement: 'Grow', target: 1, unit: '', timeframe: '' }]);
        }
        return of(null);
      });
      service.loadAll('ws-1');
      expect(service.businessObjectives().length).toBe(1);
      expect(service.businessObjectives()[0].id).toBe('o-1');
    });

    it('leaves business objectives empty when brand-voice fails', () => {
      workspaceApi.getSettings.mockReturnValue(throwError(() => new Error('fail')));
      service.loadAll('ws-1');
      expect(service.businessObjectives()).toEqual([]);
    });

    it('should use API content items when index has rows and mark real', () => {
      const apiRow = indexRow({ id: 'api-1', title: 'From API' });
      itemsApi.getIndex.mockReturnValue(
        of({ items: [apiRow], totalCount: 1, lastUpdated: '' }),
      );
      service.loadAll('ws-1');
      expect(service.items().length).toBe(1);
      expect(service.items()[0].title).toBe('From API');
      expect(mockDataService.markReal).toHaveBeenCalledWith('content-items');
    });

    it('leaves pillars empty when brand-voice returns null', () => {
      service.loadAll('ws-1');
      expect(service.pillars()).toEqual([]);
    });

    it('leaves segments empty when brand-voice returns null', () => {
      service.loadAll('ws-1');
      expect(service.segments()).toEqual([]);
    });

    it('leaves pillars and segments empty when brand-voice errors', () => {
      workspaceApi.getSettings.mockImplementation((_id: string, key: string) => {
        if (key === 'brand-voice') return throwError(() => new Error('fail'));
        return of(null);
      });
      service.loadAll('ws-1');
      expect(service.pillars()).toEqual([]);
      expect(service.segments()).toEqual([]);
    });

    it('should use API pillars when real content items and brand-voice pillars exist', () => {
      itemsApi.getIndex.mockReturnValue(
        of({ items: [indexRow({ id: 'api-1' })], totalCount: 1, lastUpdated: '' }),
      );
      workspaceApi.getSettings.mockReturnValue(
        of({
          contentPillars: [
            { id: 'p-api', name: 'API Pillar', description: 'From API', color: '#ff0000' },
          ],
          audienceSegments: [],
        }),
      );
      service.loadAll('ws-1');
      expect(service.pillars().length).toBe(1);
      expect(service.pillars()[0].name).toBe('API Pillar');
    });
  });

  describe('loadArchiveIndex', () => {
    beforeEach(() => {
      service.loadAll('ws-1');
    });

    it('should fetch the archive index and populate archivedItems', () => {
      const archivedRow = indexRow({ id: 'a-1', archived: true });
      itemsApi.getArchiveIndex.mockReturnValue(
        of({ items: [archivedRow], totalCount: 1, lastUpdated: '' }),
      );
      service.loadArchiveIndex();
      expect(itemsApi.getArchiveIndex).toHaveBeenCalledWith('ws-1');
      expect(service.archivedItems().length).toBe(1);
    });

    it('should only fetch archive index once', () => {
      itemsApi.getArchiveIndex.mockReturnValue(
        of({ items: [], totalCount: 0, lastUpdated: '' }),
      );
      service.loadArchiveIndex();
      service.loadArchiveIndex();
      expect(itemsApi.getArchiveIndex).toHaveBeenCalledTimes(1);
    });
  });

  describe('loadFullItem', () => {
    beforeEach(() => {
      service.loadAll('ws-1');
    });

    it('should fetch a full item and merge into items()', () => {
      const full = fullItem({
        id: 'full-1',
        description: 'Detail body',
        title: 'Full Title',
      });
      itemsApi.getItem.mockReturnValue(of(full));
      service.loadFullItem('full-1');
      const merged = service.items().find((i) => i.id === 'full-1');
      expect(merged?.description).toBe('Detail body');
    });

    it('aliases conceptId from parentConceptId when the API payload lacks conceptId', () => {
      const full = fullItem({
        id: 'post-1',
        stage: 'post',
        parentConceptId: 'concept-1',
      });
      delete (full as { conceptId?: string }).conceptId;
      itemsApi.getItem.mockReturnValue(of(full));
      service.loadFullItem('post-1');
      const cached = service.items().find((i) => i.id === 'post-1');
      expect(cached?.conceptId).toBe('concept-1');
      expect(cached?.parentConceptId).toBe('concept-1');
    });

    it('preserves an explicit conceptId on the API payload', () => {
      const full = fullItem({
        id: 'post-2',
        stage: 'post',
        parentConceptId: 'concept-a',
        conceptId: 'concept-b',
      });
      itemsApi.getItem.mockReturnValue(of(full));
      service.loadFullItem('post-2');
      const cached = service.items().find((i) => i.id === 'post-2');
      expect(cached?.conceptId).toBe('concept-b');
    });

    it('leaves conceptId undefined when both fields are missing (top-level Idea)', () => {
      const full = fullItem({ id: 'idea-1', stage: 'idea' });
      delete (full as { conceptId?: string }).conceptId;
      delete (full as { parentConceptId?: string | null }).parentConceptId;
      itemsApi.getItem.mockReturnValue(of(full));
      service.loadFullItem('idea-1');
      const cached = service.items().find((i) => i.id === 'idea-1');
      expect(cached?.conceptId).toBeUndefined();
    });
  });

  describe('saveItem', () => {
    it('should POST when item has no matching index row', () => {
      itemsApi.getIndex.mockReturnValue(
        of({ items: [], totalCount: 0, lastUpdated: '' }),
      );
      service.loadAll('real-workspace');
      // clear mock items so saveItem sees no existing row
      itemsApi.createItem.mockReturnValue(of(fullItem({ id: 'server-1', title: 'New' })));

      service
        .saveItem(fullItem({ id: 'temp-1', title: 'New' }))
        .subscribe((saved) => {
          expect(saved.id).toBe('server-1');
        });

      expect(itemsApi.createItem).toHaveBeenCalledWith(
        'real-workspace',
        expect.objectContaining({ title: 'New' }),
      );
    });

    it('should PUT when item matches an existing index row', () => {
      const row = indexRow({ id: 'c-existing' });
      itemsApi.getIndex.mockReturnValue(
        of({ items: [row], totalCount: 1, lastUpdated: '' }),
      );
      service.loadAll('ws-1');
      itemsApi.updateItem.mockReturnValue(
        of(fullItem({ id: 'c-existing', title: 'Updated' })),
      );

      service
        .saveItem(fullItem({ id: 'c-existing', title: 'Updated' }))
        .subscribe();

      expect(itemsApi.updateItem).toHaveBeenCalledWith(
        'ws-1',
        'c-existing',
        expect.objectContaining({ title: 'Updated' }),
      );
    });

    it('aliases conceptId on the cached item when createItem returns a payload without conceptId', () => {
      itemsApi.getIndex.mockReturnValue(
        of({ items: [], totalCount: 0, lastUpdated: '' }),
      );
      service.loadAll('ws-1');
      const saved = fullItem({
        id: 'server-1',
        stage: 'post',
        parentConceptId: 'concept-1',
      });
      delete (saved as { conceptId?: string }).conceptId;
      itemsApi.createItem.mockReturnValue(of(saved));

      service.saveItem(fullItem({ id: 'temp-1', stage: 'post' })).subscribe();

      const cached = service.items().find((i) => i.id === 'server-1');
      expect(cached?.conceptId).toBe('concept-1');
    });

    it('aliases conceptId on the cached item when updateItem returns a payload without conceptId', () => {
      const row = indexRow({ id: 'post-existing', stage: 'post' });
      itemsApi.getIndex.mockReturnValue(
        of({ items: [row], totalCount: 1, lastUpdated: '' }),
      );
      service.loadAll('ws-1');
      const saved = fullItem({
        id: 'post-existing',
        stage: 'post',
        parentConceptId: 'concept-1',
        title: 'Updated',
      });
      delete (saved as { conceptId?: string }).conceptId;
      itemsApi.updateItem.mockReturnValue(of(saved));

      service
        .saveItem(fullItem({ id: 'post-existing', stage: 'post', title: 'Updated' }))
        .subscribe();

      const cached = service.items().find((i) => i.id === 'post-existing');
      expect(cached?.conceptId).toBe('concept-1');
    });
  });

  describe('archive / unarchive', () => {
    beforeEach(() => {
      const row = indexRow({ id: 'c-1' });
      itemsApi.getIndex.mockReturnValue(
        of({ items: [row], totalCount: 1, lastUpdated: '' }),
      );
      service.loadAll('ws-1');
    });

    it('archive moves row out of activeItems into archivedItems', () => {
      itemsApi.archiveItem.mockReturnValue(
        of(fullItem({ id: 'c-1', archived: true })),
      );
      service.archive('c-1').subscribe();
      expect(service.activeItems().find((i) => i.id === 'c-1')).toBeUndefined();
      expect(service.archivedItems().find((i) => i.id === 'c-1')).toBeDefined();
    });

    it('archive normalizes conceptId when the server response omits the alias', () => {
      const archived = fullItem({
        id: 'c-1',
        stage: 'post',
        parentConceptId: 'concept-1',
        archived: true,
      });
      delete (archived as { conceptId?: string }).conceptId;
      itemsApi.archiveItem.mockReturnValue(of(archived));
      service.archive('c-1').subscribe();
      const cached = service.items().find((i) => i.id === 'c-1');
      expect(cached?.conceptId).toBe('concept-1');
    });

    it('unarchive moves row out of archivedItems back into activeItems', () => {
      itemsApi.archiveItem.mockReturnValue(
        of(fullItem({ id: 'c-1', archived: true })),
      );
      service.archive('c-1').subscribe();

      itemsApi.unarchiveItem.mockReturnValue(
        of(fullItem({ id: 'c-1', archived: false })),
      );
      service.unarchive('c-1').subscribe();

      expect(service.activeItems().find((i) => i.id === 'c-1')).toBeDefined();
      expect(service.archivedItems().find((i) => i.id === 'c-1')).toBeUndefined();
    });
  });

  describe('deleteItem', () => {
    beforeEach(() => {
      const row = indexRow({ id: 'c-1' });
      itemsApi.getIndex.mockReturnValue(
        of({ items: [row], totalCount: 1, lastUpdated: '' }),
      );
      service.loadAll('ws-1');
    });

    it('should remove the row from both signals and the cache', () => {
      itemsApi.deleteItem.mockReturnValue(of({ deleted: true, id: 'c-1' }));
      service.deleteItem('c-1').subscribe();
      expect(service.items().find((i) => i.id === 'c-1')).toBeUndefined();
    });
  });

  describe('sendConceptBack (ticket #118)', () => {
    beforeEach(() => {
      const concept = indexRow({
        id: 'concept-1',
        stage: 'concept',
        status: 'used',
      });
      const post1 = indexRow({
        id: 'post-1',
        stage: 'post',
        parentConceptId: 'concept-1',
      });
      const post2 = indexRow({
        id: 'post-2',
        stage: 'post',
        parentConceptId: 'concept-1',
      });
      itemsApi.getIndex.mockReturnValue(
        of({ items: [concept, post1, post2], totalCount: 3, lastUpdated: '' }),
      );
      service.loadAll('ws-1');
    });

    it('on success: archives every returned post id and flips the concept to `new`', () => {
      itemsApi.sendConceptBack.mockReturnValue(
        of({
          conceptId: 'concept-1',
          archivedPostIds: ['post-1', 'post-2'],
          alreadyArchivedPostIds: [],
          conceptStatus: 'new',
        }),
      );

      service.sendConceptBack('concept-1').subscribe();

      expect(itemsApi.sendConceptBack).toHaveBeenCalledWith('ws-1', 'concept-1');
      expect(
        service.activeItems().find((i) => i.id === 'post-1'),
      ).toBeUndefined();
      expect(
        service.archivedItems().find((i) => i.id === 'post-1'),
      ).toBeDefined();
      expect(
        service.activeItems().find((i) => i.id === 'post-2'),
      ).toBeUndefined();
      expect(
        service.items().find((i) => i.id === 'concept-1')?.status,
      ).toBe('new');
    });

    it('on error: local state stays put', () => {
      itemsApi.sendConceptBack.mockReturnValue(
        throwError(() => new Error('storage down')),
      );

      let errored = false;
      service.sendConceptBack('concept-1').subscribe({
        error: () => {
          errored = true;
        },
      });

      expect(errored).toBe(true);
      expect(service.activeItems().find((i) => i.id === 'post-1')).toBeDefined();
      expect(service.activeItems().find((i) => i.id === 'post-2')).toBeDefined();
      expect(
        service.items().find((i) => i.id === 'concept-1')?.status,
      ).toBe('used');
    });
  });

  describe('updateStatus', () => {
    beforeEach(() => {
      const row = indexRow({ id: 'c-1', status: 'draft' });
      itemsApi.getIndex.mockReturnValue(
        of({ items: [row], totalCount: 1, lastUpdated: '' }),
      );
      service.loadAll('ws-1');
    });

    it('should call updateItem and reflect the new status', () => {
      itemsApi.updateItem.mockReturnValue(
        of(fullItem({ id: 'c-1', status: 'in-progress' })),
      );
      service.updateStatus('c-1', 'in-progress').subscribe();
      expect(itemsApi.updateItem).toHaveBeenCalledWith(
        'ws-1',
        'c-1',
        { status: 'in-progress' },
      );
      expect(service.items().find((i) => i.id === 'c-1')?.status).toBe('in-progress');
    });
  });

  describe('advanceStage', () => {
    it('should advance idea to concept', () => {
      const row = indexRow({ id: 'c-idea', stage: 'idea' });
      itemsApi.getIndex.mockReturnValue(
        of({ items: [row], totalCount: 1, lastUpdated: '' }),
      );
      service.loadAll('ws-1');
      itemsApi.updateItem.mockReturnValue(
        of(fullItem({ id: 'c-idea', stage: 'concept' })),
      );
      service.advanceStage('c-idea').subscribe();
      expect(itemsApi.updateItem).toHaveBeenCalledWith(
        'ws-1',
        'c-idea',
        { stage: 'concept' },
      );
    });

    it('should fall back to optimistic update when updateItem errors', () => {
      const row = indexRow({ id: 'c-concept', stage: 'concept' });
      itemsApi.getIndex.mockReturnValue(
        of({ items: [row], totalCount: 1, lastUpdated: '' }),
      );
      service.loadAll('ws-1');
      itemsApi.updateItem.mockReturnValue(throwError(() => new Error('fail')));
      let result = '';
      service.advanceStage('c-concept').subscribe((saved) => {
        result = saved.stage;
      });
      expect(result).toBe('post');
    });

    it('returns current item when stage cannot advance further', () => {
      const row = indexRow({ id: 'c-post', stage: 'post' });
      itemsApi.getIndex.mockReturnValue(
        of({ items: [row], totalCount: 1, lastUpdated: '' }),
      );
      service.loadAll('ws-1');
      service.advanceStage('c-post').subscribe();
      expect(itemsApi.updateItem).not.toHaveBeenCalled();
    });
  });

  describe('loadFullItem', () => {
    it('short-circuits when workspaceId is empty', () => {
      service.loadFullItem('c-1');
      expect(itemsApi.getItem).not.toHaveBeenCalled();
    });

    it('swallows API errors silently', () => {
      service.workspaceId.set('ws-1');
      itemsApi.getItem.mockReturnValue(throwError(() => new Error('fail')));
      expect(() => service.loadFullItem('c-missing')).not.toThrow();
    });
  });

  describe('saveItem error branch', () => {
    it('falls back to optimistic item when updateItem throws', () => {
      const row = indexRow({ id: 'c-1' });
      itemsApi.getIndex.mockReturnValue(
        of({ items: [row], totalCount: 1, lastUpdated: '' }),
      );
      service.loadAll('ws-1');
      itemsApi.updateItem.mockReturnValue(throwError(() => new Error('fail')));
      const draft = fullItem({ id: 'c-1', title: 'updated' });
      let saved = '';
      service.saveItem(draft).subscribe((item) => {
        saved = item.title;
      });
      expect(saved).toBe('updated');
    });

    it('falls back to optimistic item when createItem throws', () => {
      itemsApi.createItem.mockReturnValue(throwError(() => new Error('fail')));
      const draft = fullItem({ id: 'new-id', title: 'fresh' });
      let saved = '';
      service.saveItem(draft).subscribe((item) => {
        saved = item.title;
      });
      expect(saved).toBe('fresh');
    });
  });

  describe('archive / unarchive error branches', () => {
    it('archive falls back to optimistic item on API error', () => {
      const row = indexRow({ id: 'c-1' });
      itemsApi.getIndex.mockReturnValue(
        of({ items: [row], totalCount: 1, lastUpdated: '' }),
      );
      service.loadAll('ws-1');
      itemsApi.archiveItem.mockReturnValue(throwError(() => new Error('fail')));
      let archived = false;
      service.archive('c-1').subscribe((item) => {
        archived = !!item.archived;
      });
      expect(archived).toBe(true);
    });

    it('unarchive falls back to optimistic item on API error', () => {
      const row = indexRow({ id: 'c-1', archived: true });
      itemsApi.getArchiveIndex.mockReturnValue(
        of({ items: [row], totalCount: 1, lastUpdated: '' }),
      );
      service.loadAll('ws-1');
      service.loadArchiveIndex();
      itemsApi.unarchiveItem.mockReturnValue(throwError(() => new Error('fail')));
      let result: boolean | undefined;
      service.unarchive('c-1').subscribe((item) => {
        result = item.archived;
      });
      expect(result).toBe(false);
    });

    it('updateStatus falls back to optimistic item on API error', () => {
      const row = indexRow({ id: 'c-1' });
      itemsApi.getIndex.mockReturnValue(
        of({ items: [row], totalCount: 1, lastUpdated: '' }),
      );
      service.loadAll('ws-1');
      itemsApi.updateItem.mockReturnValue(throwError(() => new Error('fail')));
      let status = '';
      service.updateStatus('c-1', 'review').subscribe((item) => {
        if (item) status = item.status;
      });
      expect(status).toBe('review');
    });
  });

  describe('stepCounts', () => {
    it('computes step counts from API rows', () => {
      itemsApi.getIndex.mockReturnValue(
        of({
          items: [
            indexRow({ id: 'a', stage: 'idea', status: 'draft' }),
            indexRow({ id: 'b', stage: 'post', status: 'in-progress' }),
            indexRow({ id: 'c', stage: 'post', status: 'review' }),
            indexRow({ id: 'd', stage: 'post', status: 'published' }),
          ],
          totalCount: 4,
          lastUpdated: '',
        }),
      );
      service.loadAll('ws-1');
      const counts = service.stepCounts();
      expect(counts.overview).toBe(4);
      expect(counts.production).toBe(1);
      expect(counts.review).toBe(1);
      expect(counts.performance).toBe(1);
    });

    it('zeroes step counts when index errors', () => {
      itemsApi.getIndex.mockReturnValue(throwError(() => new Error('fail')));
      service.loadAll('ws-1');
      expect(service.stepCounts().overview).toBe(0);
    });
  });

  describe('setItems (test helper)', () => {
    it('populates items from a plain list and clears indexes', () => {
      const row = indexRow({ id: 'existing' });
      itemsApi.getIndex.mockReturnValue(
        of({ items: [row], totalCount: 1, lastUpdated: '' }),
      );
      service.loadAll('ws-1');
      expect(service.items().length).toBeGreaterThan(0);

      service.setItems([fullItem({ id: 'seed', title: 'Seed' })]);
      expect(service.items().map((i) => i.id)).toEqual(['seed']);
      expect(service.activeItems()).toEqual([]);
      expect(service.archivedItems()).toEqual([]);
    });
  });

  describe('error fallbacks', () => {
    it('saveItem falls back to the submitted item on HTTP error', () => {
      itemsApi.getIndex.mockReturnValue(
        of({ items: [], totalCount: 0, lastUpdated: '' }),
      );
      service.loadAll('ws-1');
      itemsApi.createItem.mockReturnValue(
        throwError(() => new Error('net down')),
      );
      const draft = fullItem({ id: 'client-temp', title: 'Draft' });
      let saved: ContentItemContract | undefined;
      service.saveItem(draft).subscribe((s) => {
        saved = s;
      });
      expect(saved?.title).toBe('Draft');
    });

    it('archive falls back to an in-memory toggle on HTTP error', () => {
      const row = indexRow({ id: 'c-arch' });
      itemsApi.getIndex.mockReturnValue(
        of({ items: [row], totalCount: 1, lastUpdated: '' }),
      );
      service.loadAll('ws-1');
      itemsApi.archiveItem.mockReturnValue(
        throwError(() => new Error('net down')),
      );
      let saved: ContentItemContract | undefined;
      service.archive('c-arch').subscribe((s) => {
        saved = s;
      });
      expect(saved?.archived).toBe(true);
      expect(service.archivedItems().find((i) => i.id === 'c-arch')).toBeDefined();
    });

    it('unarchive falls back to an in-memory toggle on HTTP error', () => {
      const row = indexRow({ id: 'c-unarch', archived: true });
      itemsApi.getArchiveIndex.mockReturnValue(
        of({ items: [row], totalCount: 1, lastUpdated: '' }),
      );
      service.loadAll('ws-1');
      service.loadArchiveIndex();
      itemsApi.unarchiveItem.mockReturnValue(
        throwError(() => new Error('net down')),
      );
      let saved: ContentItemContract | undefined;
      service.unarchive('c-unarch').subscribe((s) => {
        saved = s;
      });
      expect(saved?.archived).toBe(false);
      expect(service.activeItems().find((i) => i.id === 'c-unarch')).toBeDefined();
    });

    it('deleteItem falls back on HTTP error but still removes from local state', () => {
      const row = indexRow({ id: 'c-del' });
      itemsApi.getIndex.mockReturnValue(
        of({ items: [row], totalCount: 1, lastUpdated: '' }),
      );
      service.loadAll('ws-1');
      itemsApi.deleteItem.mockReturnValue(
        throwError(() => new Error('net down')),
      );
      service.deleteItem('c-del').subscribe();
      expect(service.items().find((i) => i.id === 'c-del')).toBeUndefined();
    });

    it('updateStatus falls back with timestamp bump on HTTP error', () => {
      const row = indexRow({ id: 'c-s', status: 'draft' });
      itemsApi.getIndex.mockReturnValue(
        of({ items: [row], totalCount: 1, lastUpdated: '' }),
      );
      service.loadAll('ws-1');
      itemsApi.updateItem.mockReturnValue(
        throwError(() => new Error('net down')),
      );
      let saved: ContentItemContract | undefined;
      service.updateStatus('c-s', 'in-progress').subscribe((s) => {
        saved = s;
      });
      expect(saved?.status).toBe('in-progress');
    });

    it('advanceStage returns current item when already at terminal stage', () => {
      const row = indexRow({ id: 'c-post', stage: 'post' });
      itemsApi.getIndex.mockReturnValue(
        of({ items: [row], totalCount: 1, lastUpdated: '' }),
      );
      service.loadAll('ws-1');
      let saved: ContentItemContract | undefined;
      service.advanceStage('c-post').subscribe((s) => {
        saved = s;
      });
      expect(saved?.stage).toBe('post');
      // No API call — nothing to advance.
      expect(itemsApi.updateItem).not.toHaveBeenCalled();
    });

    it('loadArchiveIndex no-ops when workspaceId is empty', () => {
      // Not calling loadAll — workspaceId stays ''
      service.loadArchiveIndex();
      expect(itemsApi.getArchiveIndex).not.toHaveBeenCalled();
    });

    it('loadArchiveIndex falls back to empty envelope on HTTP error', () => {
      service.loadAll('ws-1');
      itemsApi.getArchiveIndex.mockReturnValue(
        throwError(() => new Error('net down')),
      );
      service.loadArchiveIndex();
      expect(service.archivedItems()).toEqual([]);
    });

    it('loadFullItem no-ops when item already cached', () => {
      service.loadAll('ws-1');
      const full = fullItem({ id: 'cached-1', title: 'Cached' });
      service.setItems([full]);
      service.loadFullItem('cached-1');
      expect(itemsApi.getItem).not.toHaveBeenCalled();
    });

    it('loadFullItem no-ops when workspace is empty', () => {
      // never called loadAll — workspaceId stays ''
      service.loadFullItem('x');
      expect(itemsApi.getItem).not.toHaveBeenCalled();
    });
  });

  describe('reconcileLineageStatuses (runs automatically after loadAll)', () => {
    it('marks an idea with any child concept as used', () => {
      itemsApi.getIndex.mockReturnValue(
        of({
          items: [
            indexRow({ id: 'i-1', stage: 'idea', status: 'new' }),
            indexRow({
              id: 'c-1',
              stage: 'concept',
              status: 'new',
              parentIdeaId: 'i-1',
            }),
          ],
          totalCount: 2,
          lastUpdated: '',
        }),
      );
      service.loadAll('ws-1');
      expect(service.items().find((i) => i.id === 'i-1')?.status).toBe('used');
      expect(service.items().find((i) => i.id === 'c-1')?.status).toBe('new');
    });

    it('marks a concept with any child post as used', () => {
      itemsApi.getIndex.mockReturnValue(
        of({
          items: [
            indexRow({ id: 'c-1', stage: 'concept', status: 'new' }),
            indexRow({
              id: 'p-1',
              stage: 'post',
              status: 'in-progress',
              parentConceptId: 'c-1',
            }),
          ],
          totalCount: 2,
          lastUpdated: '',
        }),
      );
      service.loadAll('ws-1');
      expect(service.items().find((i) => i.id === 'c-1')?.status).toBe('used');
      expect(service.items().find((i) => i.id === 'p-1')?.status).toBe('in-progress');
    });

    it('flips a `used` idea back to `new` when it has zero child concepts (inverse pass)', () => {
      itemsApi.getIndex.mockReturnValue(
        of({
          items: [
            // Stale `used` idea with no live or archived concept children.
            indexRow({ id: 'i-stale', stage: 'idea', status: 'used' }),
          ],
          totalCount: 1,
          lastUpdated: '',
        }),
      );
      service.loadAll('ws-1');
      expect(service.items().find((i) => i.id === 'i-stale')?.status).toBe('new');
    });

    it('flips a `used` concept back to `new` when it has zero child posts', () => {
      itemsApi.getIndex.mockReturnValue(
        of({
          items: [
            indexRow({ id: 'c-stale', stage: 'concept', status: 'used' }),
          ],
          totalCount: 1,
          lastUpdated: '',
        }),
      );
      service.loadAll('ws-1');
      expect(service.items().find((i) => i.id === 'c-stale')?.status).toBe('new');
    });

    it('leaves standalone `new` ideas alone (idempotent)', () => {
      itemsApi.getIndex.mockReturnValue(
        of({
          items: [
            indexRow({ id: 'i-lone', stage: 'idea', status: 'new' }),
          ],
          totalCount: 1,
          lastUpdated: '',
        }),
      );
      service.loadAll('ws-1');
      expect(service.items().find((i) => i.id === 'i-lone')?.status).toBe('new');
    });
  });

  describe('syncIdeaConceptStatus (kept for legacy callers + reconciler symmetry)', () => {
    beforeEach(() => {
      itemsApi.updateItem.mockImplementation(
        (_wid: string, id: string, patch: Partial<ContentItemContract>) =>
          of({ id, ...patch, updatedAt: '2026-05-01T00:00:00Z' }),
      );
      service.loadAll('ws-1');
    });

    it('propagates `used` across idea + linked concepts when called from a concept', () => {
      service.setItems([
        fullItem({ id: 'i-1', stage: 'idea', status: 'new' }),
        fullItem({
          id: 'c-1',
          stage: 'concept',
          status: 'new',
          parentIdeaId: 'i-1',
        }),
        fullItem({
          id: 'c-2',
          stage: 'concept',
          status: 'new',
          parentIdeaId: 'i-1',
        }),
      ]);
      service.syncIdeaConceptStatus('c-1', 'used');
      expect(service.items().find((i) => i.id === 'i-1')?.status).toBe('used');
      expect(service.items().find((i) => i.id === 'c-1')?.status).toBe('used');
      expect(service.items().find((i) => i.id === 'c-2')?.status).toBe('used');
    });

    it('does not touch items already at the target status (no-op writes)', () => {
      service.setItems([
        fullItem({ id: 'i-1', stage: 'idea', status: 'used' }),
        fullItem({
          id: 'c-1',
          stage: 'concept',
          status: 'used',
          parentIdeaId: 'i-1',
        }),
      ]);
      itemsApi.updateItem.mockClear();
      service.syncIdeaConceptStatus('i-1', 'used');
      expect(itemsApi.updateItem).not.toHaveBeenCalled();
    });

    it('orphan concept (no parentIdeaId) updates only itself', () => {
      service.setItems([
        fullItem({ id: 'c-orphan', stage: 'concept', status: 'new' }),
      ]);
      service.syncIdeaConceptStatus('c-orphan', 'used');
      expect(service.items().find((i) => i.id === 'c-orphan')?.status).toBe('used');
    });

    it('never touches posts (post status is terminal)', () => {
      service.setItems([
        fullItem({ id: 'i-1', stage: 'idea', status: 'new' }),
        fullItem({
          id: 'c-1',
          stage: 'concept',
          status: 'new',
          parentIdeaId: 'i-1',
        }),
        fullItem({
          id: 'p-1',
          stage: 'post',
          status: 'in-progress',
          parentIdeaId: 'i-1',
          parentConceptId: 'c-1',
        }),
      ]);
      service.syncIdeaConceptStatus('c-1', 'used');
      expect(service.items().find((i) => i.id === 'p-1')?.status).toBe('in-progress');
    });
  });

  describe('applyLocalStatus', () => {
    beforeEach(() => {
      itemsApi.updateItem.mockImplementation(
        (_wid: string, id: string, patch: Partial<ContentItemContract>) =>
          of({ id, ...patch, updatedAt: '2026-05-01T00:00:00Z' }),
      );
      service.loadAll('ws-1');
    });

    it('flips a single item in the index without firing an API write', () => {
      itemsApi.updateItem.mockClear();
      service.setItems([
        fullItem({ id: 'i-1', stage: 'idea', status: 'new' }),
      ]);
      service.applyLocalStatus('i-1', 'used');
      expect(service.items().find((i) => i.id === 'i-1')?.status).toBe('used');
      expect(itemsApi.updateItem).not.toHaveBeenCalled();
    });
  });

  describe('indexEntryToItem nullish-fallback branches', () => {
    it('loads an index entry with minimal fields — every `?? defaultValue` falls through', () => {
      // Wire the API to return an index entry with optional fields undefined.
      // This exercises every `?? defaultValue` branch in indexEntryToItem.
      const lite = {
        id: 'lite-1',
        stage: 'concept',
        status: 'new',
        title: 'Lite entry',
        // Every optional field below is undefined → fallback path taken
      } as unknown as ContentItemsIndexEntryContract;
      itemsApi.getIndex.mockReturnValue(
        of({ items: [lite], totalCount: 1, lastUpdated: '' }),
      );
      service.loadAll('ws-1');
      const item = service.items().find((i) => i.id === 'lite-1');
      expect(item).toBeDefined();
      // Each fallback resolved
      expect(item?.pillarIds).toEqual([]);
      expect(item?.segmentIds).toEqual([]);
      expect(item?.platform).toBeUndefined();
      expect(item?.contentType).toBeUndefined();
      expect(item?.owner).toBeUndefined();
      expect(item?.parentIdeaId).toBeUndefined();
      expect(item?.parentConceptId).toBeUndefined();
      expect(item?.conceptId).toBeUndefined();
      expect(item?.scheduledAt).toBeUndefined();
      expect(item?.archived).toBe(false);
    });

    it('archive index entry with minimal fields hits the same fallback branches', () => {
      const lite = {
        id: 'arch-1',
        stage: 'concept',
        status: 'archived',
        title: 'Archived lite',
      } as unknown as ContentItemsIndexEntryContract;
      itemsApi.getArchiveIndex.mockReturnValue(
        of({ items: [lite], totalCount: 1, lastUpdated: '' }),
      );
      service.workspaceId.set('ws-1');
      service.loadArchiveIndex();
      const item = service.archivedItems().find((i) => i.id === 'arch-1');
      expect(item?.pillarIds).toEqual([]);
      expect(item?.archived).toBe(false);
    });
  });
});
