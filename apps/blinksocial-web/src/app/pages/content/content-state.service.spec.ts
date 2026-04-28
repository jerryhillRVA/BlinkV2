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
    scheduledDate: overrides.scheduledDate ?? null,
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
    it('promotes parent idea and sibling concepts to posting when a child post exists', () => {
      itemsApi.getIndex.mockReturnValue(
        of({
          items: [
            indexRow({ id: 'i-1', stage: 'idea', status: 'draft' }),
            indexRow({
              id: 'c-1',
              stage: 'concept',
              status: 'draft',
              parentIdeaId: 'i-1',
            }),
            indexRow({
              id: 'p-1',
              stage: 'post',
              status: 'in-progress',
              parentConceptId: 'c-1',
              parentIdeaId: 'i-1',
            }),
          ],
          totalCount: 3,
          lastUpdated: '',
        }),
      );
      service.loadAll('ws-1');
      expect(service.items().find((i) => i.id === 'i-1')?.status).toBe('posting');
      expect(service.items().find((i) => i.id === 'c-1')?.status).toBe('posting');
      expect(service.items().find((i) => i.id === 'p-1')?.status).toBe('in-progress');
    });

    it('resolves anchor idea via dangling parentConceptId when the concept is missing', () => {
      itemsApi.getIndex.mockReturnValue(
        of({
          items: [
            indexRow({ id: 'i-1', stage: 'idea', status: 'draft' }),
            indexRow({
              id: 'c-keep',
              stage: 'concept',
              status: 'draft',
              parentIdeaId: 'i-1',
            }),
            // Post with a dangling parentConceptId ('c-gone') — its
            // parentIdeaId still resolves to idea i-1.
            indexRow({
              id: 'p-orphan',
              stage: 'post',
              status: 'in-progress',
              parentConceptId: 'c-gone',
              parentIdeaId: 'i-1',
            }),
          ],
          totalCount: 3,
          lastUpdated: '',
        }),
      );
      service.loadAll('ws-1');
      expect(service.items().find((i) => i.id === 'i-1')?.status).toBe('posting');
      expect(service.items().find((i) => i.id === 'c-keep')?.status).toBe('posting');
    });

    it('bumps drafted concepts and their parent ideas to concepting when no post exists', () => {
      itemsApi.getIndex.mockReturnValue(
        of({
          items: [
            indexRow({ id: 'i-2', stage: 'idea', status: 'draft' }),
            indexRow({
              id: 'c-2',
              stage: 'concept',
              status: 'draft',
              parentIdeaId: 'i-2',
            }),
          ],
          totalCount: 2,
          lastUpdated: '',
        }),
      );
      service.loadAll('ws-1');
      expect(service.items().find((i) => i.id === 'i-2')?.status).toBe('concepting');
      expect(service.items().find((i) => i.id === 'c-2')?.status).toBe('concepting');
    });

    it('leaves standalone drafted ideas alone', () => {
      itemsApi.getIndex.mockReturnValue(
        of({
          items: [
            indexRow({ id: 'i-lone', stage: 'idea', status: 'draft' }),
          ],
          totalCount: 1,
          lastUpdated: '',
        }),
      );
      service.loadAll('ws-1');
      expect(service.items().find((i) => i.id === 'i-lone')?.status).toBe('draft');
    });
  });

  describe('syncIdeaConceptStatus', () => {
    beforeEach(() => {
      itemsApi.updateItem.mockImplementation(
        (_wid: string, id: string, patch: Partial<ContentItemContract>) =>
          of({ id, ...patch, updatedAt: '2026-05-01T00:00:00Z' }),
      );
      service.loadAll('ws-1');
    });

    it('promotes idea + every linked concept when called from a concept', () => {
      service.setItems([
        fullItem({ id: 'i-1', stage: 'idea', status: 'draft' }),
        fullItem({
          id: 'c-1',
          stage: 'concept',
          status: 'draft',
          parentIdeaId: 'i-1',
        }),
        fullItem({
          id: 'c-2',
          stage: 'concept',
          status: 'draft',
          parentIdeaId: 'i-1',
        }),
      ]);
      service.syncIdeaConceptStatus('c-1', 'concepting');
      expect(service.items().find((i) => i.id === 'i-1')?.status).toBe('concepting');
      expect(service.items().find((i) => i.id === 'c-1')?.status).toBe('concepting');
      expect(service.items().find((i) => i.id === 'c-2')?.status).toBe('concepting');
    });

    it('does not touch items already at the target status (no-op writes)', () => {
      service.setItems([
        fullItem({ id: 'i-1', stage: 'idea', status: 'concepting' }),
        fullItem({
          id: 'c-1',
          stage: 'concept',
          status: 'concepting',
          parentIdeaId: 'i-1',
        }),
      ]);
      itemsApi.updateItem.mockClear();
      service.syncIdeaConceptStatus('i-1', 'concepting');
      expect(itemsApi.updateItem).not.toHaveBeenCalled();
    });

    it('orphan concept (no parentIdeaId) updates only itself', () => {
      service.setItems([
        fullItem({ id: 'c-orphan', stage: 'concept', status: 'draft' }),
      ]);
      service.syncIdeaConceptStatus('c-orphan', 'concepting');
      expect(service.items().find((i) => i.id === 'c-orphan')?.status).toBe('concepting');
    });

    it('never touches posts (post status is terminal)', () => {
      service.setItems([
        fullItem({ id: 'i-1', stage: 'idea', status: 'draft' }),
        fullItem({
          id: 'c-1',
          stage: 'concept',
          status: 'draft',
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
      service.syncIdeaConceptStatus('c-1', 'posting');
      expect(service.items().find((i) => i.id === 'p-1')?.status).toBe('in-progress');
    });
  });
});
