import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ContentStateService } from './content-state.service';
import { WorkspaceSettingsApiService } from '../workspace-settings/workspace-settings-api.service';
import { MockDataService } from '../../core/mock-data/mock-data.service';
import { MOCK_CONTENT_ITEMS, MOCK_PILLARS, MOCK_SEGMENTS } from './content.mock-data';

describe('ContentStateService', () => {
  let service: ContentStateService;
  let mockApi: {
    getNamespaceEntities: ReturnType<typeof vi.fn>;
    getSettings: ReturnType<typeof vi.fn>;
  };
  let mockDataService: { markReal: ReturnType<typeof vi.fn>; isMock: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockApi = {
      getNamespaceEntities: vi.fn().mockReturnValue(of([])),
      getSettings: vi.fn().mockReturnValue(of(null)),
    };
    mockDataService = {
      markReal: vi.fn(),
      isMock: vi.fn().mockReturnValue(true),
    };

    TestBed.configureTestingModule({
      providers: [
        ContentStateService,
        { provide: WorkspaceSettingsApiService, useValue: mockApi },
        { provide: MockDataService, useValue: mockDataService },
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

    it('should call API for content-items and brand-voice', () => {
      service.loadAll('ws-1');
      expect(mockApi.getNamespaceEntities).toHaveBeenCalledWith('ws-1', 'content-items');
      expect(mockApi.getSettings).toHaveBeenCalledWith('ws-1', 'brand-voice');
    });

    it('should fall back to mock items when API returns empty', () => {
      service.loadAll('ws-1');
      expect(service.items()).toEqual(MOCK_CONTENT_ITEMS);
    });

    it('should fall back to mock items on API error', () => {
      mockApi.getNamespaceEntities.mockReturnValue(throwError(() => new Error('fail')));
      service.loadAll('ws-1');
      expect(service.items()).toEqual(MOCK_CONTENT_ITEMS);
    });

    it('should use API content items when available and mark real', () => {
      const apiItems = [{
        id: 'api-1', stage: 'idea', status: 'draft', title: 'From API',
        description: '', pillarIds: [], segmentIds: [], createdAt: '', updatedAt: '',
      }];
      mockApi.getNamespaceEntities.mockReturnValue(of(apiItems));
      service.loadAll('ws-1');
      expect(service.items().length).toBe(1);
      expect(service.items()[0].title).toBe('From API');
      expect(mockDataService.markReal).toHaveBeenCalledWith('content-items');
    });

    it('should fall back to mock items when API returns null', () => {
      mockApi.getNamespaceEntities.mockReturnValue(of(null));
      service.loadAll('ws-1');
      expect(service.items()).toEqual(MOCK_CONTENT_ITEMS);
    });

    it('should fall back to mock pillars when brand-voice returns null', () => {
      service.loadAll('ws-1');
      expect(service.pillars()).toEqual(MOCK_PILLARS);
    });

    it('should fall back to mock segments when brand-voice returns null', () => {
      service.loadAll('ws-1');
      expect(service.segments()).toEqual(MOCK_SEGMENTS);
    });

    it('should use API pillars when real content items and brand-voice pillars exist', () => {
      const apiItems = [{ id: 'api-1', stage: 'idea', status: 'draft', title: 'Real', description: '', pillarIds: ['p-api'], segmentIds: [], createdAt: '', updatedAt: '' }];
      mockApi.getNamespaceEntities.mockReturnValue(of(apiItems));
      mockApi.getSettings.mockReturnValue(of({
        contentPillars: [
          { id: 'p-api', name: 'API Pillar', description: 'From API', color: '#ff0000' },
        ],
        audienceSegments: [],
      }));
      service.loadAll('ws-1');
      expect(service.pillars().length).toBe(1);
      expect(service.pillars()[0].name).toBe('API Pillar');
    });

    it('should use API segments when real content items and brand-voice segments exist', () => {
      const apiItems = [{ id: 'api-1', stage: 'idea', status: 'draft', title: 'Real', description: '', pillarIds: [], segmentIds: ['s-api'], createdAt: '', updatedAt: '' }];
      mockApi.getNamespaceEntities.mockReturnValue(of(apiItems));
      mockApi.getSettings.mockReturnValue(of({
        contentPillars: [],
        audienceSegments: [
          { id: 's-api', name: 'API Segment', description: 'From API' },
        ],
      }));
      service.loadAll('ws-1');
      expect(service.segments().length).toBe(1);
      expect(service.segments()[0].name).toBe('API Segment');
    });

    it('should use mock pillars when content items are mock even if brand-voice has pillars', () => {
      mockApi.getNamespaceEntities.mockReturnValue(of([]));
      mockApi.getSettings.mockReturnValue(of({
        contentPillars: [
          { id: 'p-api', name: 'API Pillar', description: 'From API', color: '#ff0000' },
        ],
      }));
      service.loadAll('ws-1');
      expect(service.pillars()).toEqual(MOCK_PILLARS);
    });

    it('should set loading to false after load', () => {
      service.loadAll('ws-1');
      expect(service.loading()).toBe(false);
    });
  });

  describe('saveItem', () => {
    beforeEach(() => {
      service.loadAll('ws-1');
    });

    it('should add a new item', () => {
      const newItem = {
        id: 'new-1', stage: 'idea' as const, status: 'draft' as const,
        title: 'New Idea', description: 'Test', pillarIds: [], segmentIds: [],
        createdAt: '', updatedAt: '',
      };
      const initialCount = service.items().length;
      service.saveItem(newItem);
      expect(service.items().length).toBe(initialCount + 1);
      expect(service.items()[0].title).toBe('New Idea');
    });

    it('should update an existing item', () => {
      const existing = service.items()[0];
      const updated = { ...existing, title: 'Updated Title' };
      service.saveItem(updated);
      expect(service.items().find((i) => i.id === existing.id)?.title).toBe('Updated Title');
    });
  });

  describe('deleteItem', () => {
    beforeEach(() => {
      service.loadAll('ws-1');
    });

    it('should remove an item by id', () => {
      const firstId = service.items()[0].id;
      const initialCount = service.items().length;
      service.deleteItem(firstId);
      expect(service.items().length).toBe(initialCount - 1);
      expect(service.items().find((i) => i.id === firstId)).toBeUndefined();
    });
  });

  describe('updateStatus', () => {
    beforeEach(() => {
      service.loadAll('ws-1');
    });

    it('should update item status', () => {
      const firstId = service.items()[0].id;
      service.updateStatus(firstId, 'in-progress');
      expect(service.items().find((i) => i.id === firstId)?.status).toBe('in-progress');
    });

    it('should update the updatedAt timestamp', () => {
      const firstId = service.items()[0].id;
      const before = service.items().find((i) => i.id === firstId)?.updatedAt;
      service.updateStatus(firstId, 'review');
      const after = service.items().find((i) => i.id === firstId)?.updatedAt;
      expect(after).not.toBe(before);
    });
  });

  describe('advanceStage', () => {
    beforeEach(() => {
      service.loadAll('ws-1');
    });

    it('should advance idea to concept', () => {
      const idea = service.items().find((i) => i.stage === 'idea');
      if (!idea) throw new Error('No idea found in mock data');
      service.advanceStage(idea.id);
      expect(service.items().find((i) => i.id === idea.id)?.stage).toBe('concept');
    });

    it('should advance concept to post', () => {
      const concept = service.items().find((i) => i.stage === 'concept');
      if (!concept) throw new Error('No concept found in mock data');
      service.advanceStage(concept.id);
      expect(service.items().find((i) => i.id === concept.id)?.stage).toBe('post');
    });

    it('should not advance post stage', () => {
      const post = service.items().find((i) => i.stage === 'post');
      if (!post) throw new Error('No post found in mock data');
      service.advanceStage(post.id);
      expect(service.items().find((i) => i.id === post.id)?.stage).toBe('post');
    });
  });

  describe('stepCounts', () => {
    it('should compute step counts from items', () => {
      service.loadAll('ws-1');
      const counts = service.stepCounts();
      expect(counts.overview).toBe(MOCK_CONTENT_ITEMS.length);
      expect(counts.performance).toBeGreaterThan(0);
    });
  });
});
