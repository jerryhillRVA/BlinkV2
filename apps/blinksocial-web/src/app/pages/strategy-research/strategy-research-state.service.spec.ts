import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { StrategyResearchStateService } from './strategy-research-state.service';
import { WorkspaceSettingsApiService } from '../workspace-settings/workspace-settings-api.service';
import { MockDataService } from '../../core/mock-data/mock-data.service';

describe('StrategyResearchStateService', () => {
  let service: StrategyResearchStateService;
  let mockApi: Record<string, ReturnType<typeof vi.fn>>;
  let mockMockData: { markReal: ReturnType<typeof vi.fn>; markMock: ReturnType<typeof vi.fn>; isMock: ReturnType<typeof vi.fn>; snapshot: ReturnType<typeof vi.fn> };

  const brandVoiceResponse = {
    brandVoiceDescription: 'Our mission',
    voiceAttributes: [{ id: 'v1', label: 'Bold', description: 'd', doExample: 'do', dontExample: 'dont' }],
    toneByContext: [],
    platformToneAdjustments: [],
    vocabulary: { preferred: ['good'], avoid: ['bad'] },
    contentPillars: [
      { id: 'p1', name: 'Education', description: 'Teach', color: '#f00', goals: [], objectiveIds: [] },
    ],
    audienceSegments: [
      { id: 's1', name: 'Youth', description: 'Young people' },
    ],
  };

  const objectivesResponse = [
    { id: 'o1', category: 'growth', statement: 'Grow', target: 100, unit: 'followers', timeframe: 'Q1', status: 'on-track' },
  ];

  const channelStrategyResponse = {
    channels: [
      { platform: 'instagram', active: true, role: 'Visual', primaryContentTypes: ['reels'], toneAdjustment: 'casual', postingCadence: 'daily', primaryAudience: 'gen-z', primaryGoal: 'engagement', notes: '' },
    ],
  };

  const contentMixResponse = {
    targets: [
      { category: 'educational', label: 'How-to', targetPercent: 40, color: '#4CAF50', description: 'Educational' },
    ],
  };

  const audienceInsightsResponse = {
    insights: [
      { segmentId: 's1', interests: ['tech'], painPoints: ['time'], peakActivityTimes: [], preferredPlatforms: [{ platform: 'instagram', preference: 0.8 }], contentPreferences: ['video'] },
    ],
  };

  const researchSourcesResponse = [
    { id: 'r1', title: 'Trends', url: 'https://example.com', type: 'article', relevance: 0.9, pillarIds: ['p1'], summary: 'Summary', discoveredAt: '2026-01-01' },
  ];

  const competitorInsightsResponse = [
    { id: 'c1', competitor: 'Rival', platform: 'tiktok', contentType: 'video', topic: 'Demo', relevancyLevel: 'High', frequency: 'daily', insight: 'Strong' },
  ];

  beforeEach(() => {
    mockApi = {
      getSettings: vi.fn().mockReturnValue(of({})),
      saveSettings: vi.fn().mockReturnValue(of({})),
      getNamespaceEntities: vi.fn().mockReturnValue(of([])),
      saveNamespaceEntities: vi.fn().mockReturnValue(of([])),
      getNamespaceAggregate: vi.fn().mockReturnValue(of({})),
      saveNamespaceAggregate: vi.fn().mockReturnValue(of({})),
    };

    mockMockData = {
      markReal: vi.fn(),
      markMock: vi.fn(),
      isMock: vi.fn().mockReturnValue(true),
      snapshot: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        StrategyResearchStateService,
        { provide: WorkspaceSettingsApiService, useValue: mockApi },
        { provide: MockDataService, useValue: mockMockData },
      ],
    });

    service = TestBed.inject(StrategyResearchStateService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should have default signal values', () => {
    expect(service.workspaceId()).toBe('');
    expect(service.loading()).toBe(false);
    expect(service.saving()).toBe(false);
    expect(service.brandVoice().missionStatement).toBe('');
    expect(service.objectives()).toEqual([]);
    expect(service.pillars()).toEqual([]);
    expect(service.segments()).toEqual([]);
    expect(service.channelStrategy()).toEqual([]);
    expect(service.contentMix()).toEqual([]);
    expect(service.researchSources()).toEqual([]);
    expect(service.competitorInsights()).toEqual([]);
    expect(service.audienceInsights()).toEqual([]);
  });

  // --- loadAll ---

  describe('loadAll', () => {
    beforeEach(() => {
      mockApi['getSettings']
        .mockImplementation((_wsId: string, tab: string) => {
          if (tab === 'brand-voice') return of(brandVoiceResponse);
          if (tab === 'business-objectives') return of(objectivesResponse);
          if (tab === 'channel-strategy') return of(channelStrategyResponse);
          return of({});
        });
      mockApi['getNamespaceAggregate']
        .mockImplementation((_wsId: string, ns: string) => {
          if (ns === 'content-mix') return of(contentMixResponse);
          if (ns === 'audience-insights') return of(audienceInsightsResponse);
          return of(null);
        });
      mockApi['getNamespaceEntities']
        .mockImplementation((_wsId: string, ns: string) => {
          if (ns === 'research-sources') return of(researchSourcesResponse);
          if (ns === 'competitor-insights') return of(competitorInsightsResponse);
          return of([]);
        });
    });

    it('should set workspaceId and loading state', () => {
      service.loadAll('ws-1');
      expect(service.workspaceId()).toBe('ws-1');
      // loading becomes false after subscribe completes synchronously with of()
      expect(service.loading()).toBe(false);
    });

    it('should call all API methods', () => {
      service.loadAll('ws-1');
      expect(mockApi['getSettings']).toHaveBeenCalledWith('ws-1', 'brand-voice');
      expect(mockApi['getSettings']).toHaveBeenCalledWith('ws-1', 'business-objectives');
      expect(mockApi['getSettings']).toHaveBeenCalledWith('ws-1', 'channel-strategy');
      expect(mockApi['getNamespaceAggregate']).toHaveBeenCalledWith('ws-1', 'content-mix');
      expect(mockApi['getNamespaceAggregate']).toHaveBeenCalledWith('ws-1', 'audience-insights');
      expect(mockApi['getNamespaceEntities']).toHaveBeenCalledWith('ws-1', 'research-sources');
      expect(mockApi['getNamespaceEntities']).toHaveBeenCalledWith('ws-1', 'competitor-insights');
    });

    it('should populate brand voice signal', () => {
      service.loadAll('ws-1');
      expect(service.brandVoice().missionStatement).toBe('Our mission');
      expect(service.brandVoice().voiceAttributes).toHaveLength(1);
    });

    it('should populate pillars from hydrated brand-voice response', () => {
      service.loadAll('ws-1');
      expect(service.pillars()).toHaveLength(1);
      expect(service.pillars()[0].name).toBe('Education');
    });

    it('should populate segments from hydrated brand-voice response', () => {
      service.loadAll('ws-1');
      expect(service.segments()).toHaveLength(1);
      expect(service.segments()[0].name).toBe('Youth');
    });

    it('should populate objectives signal', () => {
      service.loadAll('ws-1');
      expect(service.objectives()).toHaveLength(1);
      expect(service.objectives()[0].statement).toBe('Grow');
    });

    it('should populate channel strategy signal', () => {
      service.loadAll('ws-1');
      expect(service.channelStrategy()).toHaveLength(1);
      expect(service.channelStrategy()[0].platform).toBe('instagram');
    });

    it('should populate content mix signal', () => {
      service.loadAll('ws-1');
      expect(service.contentMix()).toHaveLength(1);
      expect(service.contentMix()[0].category).toBe('educational');
    });

    it('should populate audience insights signal', () => {
      service.loadAll('ws-1');
      expect(service.audienceInsights()).toHaveLength(1);
      expect(service.audienceInsights()[0].segmentId).toBe('s1');
    });

    it('should populate research sources signal', () => {
      service.loadAll('ws-1');
      expect(service.researchSources()).toHaveLength(1);
      expect(service.researchSources()[0].title).toBe('Trends');
    });

    it('should populate competitor insights signal', () => {
      service.loadAll('ws-1');
      expect(service.competitorInsights()).toHaveLength(1);
      expect(service.competitorInsights()[0].competitor).toBe('Rival');
    });

    it('should call markReal for domains with data', () => {
      service.loadAll('ws-1');
      expect(mockMockData.markReal).toHaveBeenCalledWith('brand-voice');
      expect(mockMockData.markReal).toHaveBeenCalledWith('strategic-pillars');
      expect(mockMockData.markReal).toHaveBeenCalledWith('audience');
      expect(mockMockData.markReal).toHaveBeenCalledWith('business-objectives');
      expect(mockMockData.markReal).toHaveBeenCalledWith('channel-strategy');
      expect(mockMockData.markReal).toHaveBeenCalledWith('content-mix');
      expect(mockMockData.markReal).toHaveBeenCalledWith('research-sources');
      expect(mockMockData.markReal).toHaveBeenCalledWith('competitor-deep-dive');
    });

    it('should not call markReal for domains without data', () => {
      mockApi['getSettings'].mockReturnValue(of(null));
      mockApi['getNamespaceAggregate'].mockReturnValue(of(null));
      mockApi['getNamespaceEntities'].mockReturnValue(of([]));

      service.loadAll('ws-1');
      expect(mockMockData.markReal).not.toHaveBeenCalled();
    });

    it('should handle individual API errors via catchError fallbacks', () => {
      // Each observable has a catchError that returns a fallback value
      mockApi['getSettings'].mockReturnValue(throwError(() => new Error('fail')));
      mockApi['getNamespaceAggregate'].mockReturnValue(throwError(() => new Error('fail')));
      mockApi['getNamespaceEntities'].mockReturnValue(throwError(() => new Error('fail')));

      service.loadAll('ws-1');
      // catchError provides fallback values, so loadAll still completes
      expect(service.loading()).toBe(false);
      expect(service.brandVoice().missionStatement).toBe('');
      expect(service.objectives()).toEqual([]);
      expect(service.channelStrategy()).toEqual([]);
      expect(service.contentMix()).toEqual([]);
      expect(service.audienceInsights()).toEqual([]);
      expect(service.researchSources()).toEqual([]);
      expect(service.competitorInsights()).toEqual([]);
    });

    it('should handle null brandVoice response (no contentPillars or audienceSegments)', () => {
      mockApi['getSettings'].mockImplementation((_wsId: string, tab: string) => {
        if (tab === 'brand-voice') return of(null);
        if (tab === 'business-objectives') return of([]);
        if (tab === 'channel-strategy') return of(null);
        return of(null);
      });
      mockApi['getNamespaceAggregate'].mockReturnValue(of(null));
      mockApi['getNamespaceEntities'].mockReturnValue(of([]));

      service.loadAll('ws-1');
      expect(service.pillars()).toEqual([]);
      expect(service.segments()).toEqual([]);
      expect(service.brandVoice().missionStatement).toBe('');
    });

    it('should handle brandVoice response without contentPillars or audienceSegments', () => {
      // brandVoice exists but without the hydrated arrays
      mockApi['getSettings'].mockImplementation((_wsId: string, tab: string) => {
        if (tab === 'brand-voice') return of({ brandVoiceDescription: 'test' });
        if (tab === 'business-objectives') return of([]);
        if (tab === 'channel-strategy') return of(null);
        return of(null);
      });
      mockApi['getNamespaceAggregate'].mockReturnValue(of(null));
      mockApi['getNamespaceEntities'].mockReturnValue(of([]));

      service.loadAll('ws-1');
      expect(service.pillars()).toEqual([]);
      expect(service.segments()).toEqual([]);
    });

    it('should call markReal for brandVoice when voiceAttributes exist but missionStatement is empty', () => {
      const bvWithAttrsOnly = {
        voiceAttributes: [{ id: 'v1', label: 'Bold', description: 'd', doExample: 'do', dontExample: 'dont' }],
        toneByContext: [],
        platformToneAdjustments: [],
        vocabulary: { preferred: [], avoid: [] },
        // no brandVoiceDescription
      };
      mockApi['getSettings'].mockImplementation((_wsId: string, tab: string) => {
        if (tab === 'brand-voice') return of(bvWithAttrsOnly);
        if (tab === 'business-objectives') return of([]);
        if (tab === 'channel-strategy') return of(null);
        return of(null);
      });
      mockApi['getNamespaceAggregate'].mockReturnValue(of(null));
      mockApi['getNamespaceEntities'].mockReturnValue(of([]));

      service.loadAll('ws-1');
      expect(mockMockData.markReal).toHaveBeenCalledWith('brand-voice');
    });

    it('should not call markReal for brandVoice when both missionStatement and voiceAttributes are empty', () => {
      const emptyBv = {
        toneByContext: [],
        platformToneAdjustments: [],
        vocabulary: { preferred: [], avoid: [] },
      };
      mockApi['getSettings'].mockImplementation((_wsId: string, tab: string) => {
        if (tab === 'brand-voice') return of(emptyBv);
        if (tab === 'business-objectives') return of([]);
        if (tab === 'channel-strategy') return of(null);
        return of(null);
      });
      mockApi['getNamespaceAggregate'].mockReturnValue(of(null));
      mockApi['getNamespaceEntities'].mockReturnValue(of([]));

      service.loadAll('ws-1');
      // brand-voice should NOT be marked real since no mission statement and no voice attributes
      expect(mockMockData.markReal).not.toHaveBeenCalledWith('brand-voice');
    });

    it('should handle empty array responses for list-based domains', () => {
      mockApi['getSettings'].mockImplementation((_wsId: string, tab: string) => {
        if (tab === 'brand-voice') return of(null);
        if (tab === 'business-objectives') return of([]);
        if (tab === 'channel-strategy') return of(null);
        return of(null);
      });
      mockApi['getNamespaceAggregate'].mockReturnValue(of(null));
      mockApi['getNamespaceEntities'].mockReturnValue(of([]));

      service.loadAll('ws-1');
      expect(service.objectives()).toEqual([]);
      expect(service.researchSources()).toEqual([]);
      expect(service.competitorInsights()).toEqual([]);
    });

    it('should handle null namespace entity responses via ?? fallback', () => {
      mockApi['getSettings'].mockImplementation((_wsId: string, tab: string) => {
        if (tab === 'brand-voice') return of(null);
        if (tab === 'business-objectives') return of([]);
        if (tab === 'channel-strategy') return of(null);
        return of(null);
      });
      mockApi['getNamespaceAggregate'].mockReturnValue(of(null));
      // Return null instead of [] to trigger the ?? [] fallback
      mockApi['getNamespaceEntities'].mockReturnValue(of(null as unknown));

      service.loadAll('ws-1');
      expect(service.researchSources()).toEqual([]);
      expect(service.competitorInsights()).toEqual([]);
    });
  });

  // --- isDirty ---

  describe('isDirty', () => {
    it('should return false when no data is loaded', () => {
      expect(service.isDirty()).toBe(false);
    });

    it('should return false right after loadAll', () => {
      mockApi['getSettings'].mockImplementation((_wsId: string, tab: string) => {
        if (tab === 'brand-voice') return of(brandVoiceResponse);
        if (tab === 'business-objectives') return of(objectivesResponse);
        if (tab === 'channel-strategy') return of(channelStrategyResponse);
        return of(null);
      });
      mockApi['getNamespaceAggregate'].mockReturnValue(of(null));
      mockApi['getNamespaceEntities'].mockReturnValue(of([]));

      service.loadAll('ws-1');
      expect(service.isDirty()).toBe(false);
    });

    it('should return true after brand voice signal change', () => {
      mockApi['getSettings']
        .mockImplementation((_wsId: string, tab: string) => {
          if (tab === 'brand-voice') return of(brandVoiceResponse);
          if (tab === 'business-objectives') return of(objectivesResponse);
          if (tab === 'channel-strategy') return of(channelStrategyResponse);
          return of({});
        });
      mockApi['getNamespaceAggregate']
        .mockImplementation((_wsId: string, ns: string) => {
          if (ns === 'content-mix') return of(contentMixResponse);
          if (ns === 'audience-insights') return of(audienceInsightsResponse);
          return of(null);
        });
      mockApi['getNamespaceEntities']
        .mockImplementation((_wsId: string, ns: string) => {
          if (ns === 'research-sources') return of(researchSourcesResponse);
          if (ns === 'competitor-insights') return of(competitorInsightsResponse);
          return of([]);
        });

      service.loadAll('ws-1');
      expect(service.isDirty()).toBe(false);

      service.brandVoice.set({
        ...service.brandVoice(),
        missionStatement: 'Changed mission',
      });
      expect(service.isDirty()).toBe(true);
    });

    it('should detect dirty state for objectives', () => {
      mockApi['getSettings']
        .mockImplementation((_wsId: string, tab: string) => {
          if (tab === 'brand-voice') return of(null);
          if (tab === 'business-objectives') return of(objectivesResponse);
          if (tab === 'channel-strategy') return of(null);
          return of(null);
        });
      mockApi['getNamespaceAggregate'].mockReturnValue(of(null));
      mockApi['getNamespaceEntities'].mockReturnValue(of([]));

      service.loadAll('ws-1');
      expect(service.isDirty()).toBe(false);

      service.objectives.set([]);
      expect(service.isDirty()).toBe(true);
    });

    it('should detect dirty state for pillars, segments, channels, contentMix, audienceInsights, researchSources, competitorInsights', () => {
      mockApi['getSettings']
        .mockImplementation((_wsId: string, tab: string) => {
          if (tab === 'brand-voice') return of(brandVoiceResponse);
          if (tab === 'business-objectives') return of([]);
          if (tab === 'channel-strategy') return of(channelStrategyResponse);
          return of(null);
        });
      mockApi['getNamespaceAggregate']
        .mockImplementation((_wsId: string, ns: string) => {
          if (ns === 'content-mix') return of(contentMixResponse);
          if (ns === 'audience-insights') return of(audienceInsightsResponse);
          return of(null);
        });
      mockApi['getNamespaceEntities']
        .mockImplementation((_wsId: string, ns: string) => {
          if (ns === 'research-sources') return of(researchSourcesResponse);
          if (ns === 'competitor-insights') return of(competitorInsightsResponse);
          return of([]);
        });

      service.loadAll('ws-1');
      expect(service.isDirty()).toBe(false);

      // Modify each domain and verify isDirty
      service.pillars.set([]);
      expect(service.isDirty()).toBe(true);

      // Reset pillars to original, modify segments
      service.loadAll('ws-1');
      service.segments.set([]);
      expect(service.isDirty()).toBe(true);

      service.loadAll('ws-1');
      service.channelStrategy.set([]);
      expect(service.isDirty()).toBe(true);

      service.loadAll('ws-1');
      service.contentMix.set([]);
      expect(service.isDirty()).toBe(true);

      service.loadAll('ws-1');
      service.audienceInsights.set([]);
      expect(service.isDirty()).toBe(true);

      service.loadAll('ws-1');
      service.researchSources.set([]);
      expect(service.isDirty()).toBe(true);

      service.loadAll('ws-1');
      service.competitorInsights.set([]);
      expect(service.isDirty()).toBe(true);
    });
  });

  // --- Save methods ---

  describe('saveBrandVoice', () => {
    it('should call saveSettings and update signal', () => {
      const savedContract = { brandVoiceDescription: 'Saved' };
      mockApi['saveSettings'].mockReturnValue(of(savedContract));
      service.workspaceId.set('ws-1');

      const data = {
        missionStatement: 'New mission',
        voiceAttributes: [],
        toneByContext: [],
        platformToneAdjustments: [],
        vocabulary: { preferred: [], avoid: [] },
      };

      service.saveBrandVoice(data);

      expect(mockApi['saveSettings']).toHaveBeenCalledWith(
        'ws-1',
        'brand-voice',
        expect.objectContaining({ brandVoiceDescription: 'New mission' }),
      );
      expect(service.brandVoice().missionStatement).toBe('New mission');
      expect(service.saving()).toBe(false);
    });

    it('should handle save error gracefully', () => {
      mockApi['saveSettings'].mockReturnValue(throwError(() => new Error('fail')));
      service.workspaceId.set('ws-1');

      service.saveBrandVoice({
        missionStatement: 'Test',
        voiceAttributes: [],
        toneByContext: [],
        platformToneAdjustments: [],
        vocabulary: { preferred: [], avoid: [] },
      });

      expect(service.saving()).toBe(false);
    });
  });

  describe('saveObjectives', () => {
    it('should call saveSettings with objectives data', () => {
      mockApi['saveSettings'].mockReturnValue(of({}));
      service.workspaceId.set('ws-1');

      const data = [
        { id: 'o1', category: 'growth' as const, statement: 'Grow', target: 100, unit: 'followers', timeframe: 'Q1', status: 'on-track' as const },
      ];

      service.saveObjectives(data);

      expect(mockApi['saveSettings']).toHaveBeenCalledWith('ws-1', 'business-objectives', data);
      expect(service.objectives()).toEqual(data);
      expect(service.saving()).toBe(false);
    });

    it('should handle save error gracefully', () => {
      mockApi['saveSettings'].mockReturnValue(throwError(() => new Error('fail')));
      service.workspaceId.set('ws-1');
      service.saveObjectives([]);
      expect(service.saving()).toBe(false);
    });
  });

  describe('savePillars', () => {
    it('should call brand-voice endpoint with contentPillars', () => {
      mockApi['saveSettings'].mockReturnValue(of({}));
      service.workspaceId.set('ws-1');

      const data = [
        { id: 'p1', name: 'Pillar', description: 'desc', color: '#fff' },
      ];

      service.savePillars(data);

      expect(mockApi['saveSettings']).toHaveBeenCalledWith(
        'ws-1',
        'brand-voice',
        expect.objectContaining({
          contentPillars: expect.arrayContaining([
            expect.objectContaining({ id: 'p1', name: 'Pillar' }),
          ]),
        }),
      );
      expect(service.pillars()).toEqual(data);
      expect(service.saving()).toBe(false);
    });

    it('should handle save error gracefully', () => {
      mockApi['saveSettings'].mockReturnValue(throwError(() => new Error('fail')));
      service.workspaceId.set('ws-1');
      service.savePillars([]);
      expect(service.saving()).toBe(false);
    });
  });

  describe('saveSegments', () => {
    it('should call general endpoint with audienceSegments', () => {
      const generalData = { workspaceName: 'Test' };
      mockApi['getSettings'].mockReturnValue(of(generalData));
      mockApi['saveSettings'].mockReturnValue(of({}));
      service.workspaceId.set('ws-1');

      const data = [
        { id: 's1', name: 'Segment', description: 'desc' },
      ];

      service.saveSegments(data);

      expect(mockApi['getSettings']).toHaveBeenCalledWith('ws-1', 'general');
      expect(mockApi['saveSettings']).toHaveBeenCalledWith(
        'ws-1',
        'general',
        expect.objectContaining({
          workspaceName: 'Test',
          audienceSegments: expect.arrayContaining([
            expect.objectContaining({ id: 's1', name: 'Segment' }),
          ]),
        }),
      );
      expect(service.segments()).toEqual(data);
      expect(service.saving()).toBe(false);
    });

    it('should handle getSettings error gracefully', () => {
      mockApi['getSettings'].mockReturnValue(throwError(() => new Error('fail')));
      service.workspaceId.set('ws-1');
      service.saveSegments([]);
      expect(service.saving()).toBe(false);
    });

    it('should handle saveSettings error gracefully', () => {
      mockApi['getSettings'].mockReturnValue(of({}));
      mockApi['saveSettings'].mockReturnValue(throwError(() => new Error('fail')));
      service.workspaceId.set('ws-1');
      service.saveSegments([{ id: 's1', name: 'Seg', description: '' }]);
      expect(service.saving()).toBe(false);
    });
  });

  describe('saveChannelStrategy', () => {
    it('should call saveSettings with channel strategy contract', () => {
      mockApi['saveSettings'].mockReturnValue(of({}));
      service.workspaceId.set('ws-1');

      const data = [
        { platform: 'instagram' as const, active: true, role: 'Visual', primaryContentTypes: ['reels'], toneAdjustment: 'casual', postingCadence: 'daily', primaryAudience: 'gen-z', primaryGoal: 'engagement', notes: '' },
      ];

      service.saveChannelStrategy(data);

      expect(mockApi['saveSettings']).toHaveBeenCalledWith(
        'ws-1',
        'channel-strategy',
        { channels: data },
      );
      expect(service.channelStrategy()).toEqual(data);
      expect(service.saving()).toBe(false);
    });

    it('should handle save error gracefully', () => {
      mockApi['saveSettings'].mockReturnValue(throwError(() => new Error('fail')));
      service.workspaceId.set('ws-1');
      service.saveChannelStrategy([]);
      expect(service.saving()).toBe(false);
    });
  });

  describe('saveContentMix', () => {
    it('should call saveNamespaceAggregate with content mix contract', () => {
      mockApi['saveNamespaceAggregate'].mockReturnValue(of({}));
      service.workspaceId.set('ws-1');

      const data = [
        { category: 'educational' as const, label: 'How-to', targetPercent: 40, color: '#4CAF50', description: 'Educational' },
      ];

      service.saveContentMix(data);

      expect(mockApi['saveNamespaceAggregate']).toHaveBeenCalledWith(
        'ws-1',
        'content-mix',
        { targets: data },
      );
      expect(service.contentMix()).toEqual(data);
      expect(service.saving()).toBe(false);
    });

    it('should handle save error gracefully', () => {
      mockApi['saveNamespaceAggregate'].mockReturnValue(throwError(() => new Error('fail')));
      service.workspaceId.set('ws-1');
      service.saveContentMix([]);
      expect(service.saving()).toBe(false);
    });
  });

  describe('saveAudienceInsights', () => {
    it('should call saveNamespaceAggregate with audience insights contract', () => {
      mockApi['saveNamespaceAggregate'].mockReturnValue(of({}));
      service.workspaceId.set('ws-1');

      const data = [
        { segmentId: 's1', interests: ['tech'], painPoints: ['time'], peakActivityTimes: [], preferredPlatforms: [{ platform: 'instagram' as const, preference: 0.8 }], contentPreferences: ['video'] },
      ];

      service.saveAudienceInsights(data);

      expect(mockApi['saveNamespaceAggregate']).toHaveBeenCalledWith(
        'ws-1',
        'audience-insights',
        { insights: data },
      );
      expect(service.audienceInsights()).toEqual(data);
      expect(service.saving()).toBe(false);
    });

    it('should handle save error gracefully', () => {
      mockApi['saveNamespaceAggregate'].mockReturnValue(throwError(() => new Error('fail')));
      service.workspaceId.set('ws-1');
      service.saveAudienceInsights([]);
      expect(service.saving()).toBe(false);
    });
  });

  describe('saveResearchSources', () => {
    it('should call saveNamespaceEntities with research sources', () => {
      mockApi['saveNamespaceEntities'].mockReturnValue(of([]));
      service.workspaceId.set('ws-1');

      const data = [
        { id: 'r1', title: 'Source', url: 'https://example.com', type: 'article' as const, relevance: 0.9, pillarIds: ['p1'], summary: 'Summary', discoveredAt: '2026-01-01' },
      ];

      service.saveResearchSources(data);

      expect(mockApi['saveNamespaceEntities']).toHaveBeenCalledWith('ws-1', 'research-sources', data);
      expect(service.researchSources()).toEqual(data);
      expect(service.saving()).toBe(false);
    });

    it('should handle save error gracefully', () => {
      mockApi['saveNamespaceEntities'].mockReturnValue(throwError(() => new Error('fail')));
      service.workspaceId.set('ws-1');
      service.saveResearchSources([]);
      expect(service.saving()).toBe(false);
    });
  });

  describe('influencer marketing', () => {
    beforeEach(() => {
      window.localStorage.clear();
    });

    afterEach(() => {
      window.localStorage.clear();
    });

    it('loadInfluencerData loads empty arrays when storage is empty', () => {
      service.loadInfluencerData();
      expect(service.shortlistedInfluencers()).toEqual([]);
      expect(service.influencerCampaigns()).toEqual([]);
      expect(service.dismissedInfluencers()).toEqual([]);
    });

    it('loadInfluencerData restores data from localStorage', () => {
      window.localStorage.setItem('blink_shortlisted_influencers', JSON.stringify([{ handle: '@a' }]));
      window.localStorage.setItem('blink_influencer_campaigns', JSON.stringify([{ id: 'c1' }]));
      window.localStorage.setItem('blink_dismissed_influencer_profiles', JSON.stringify([{ handle: '@b' }]));
      service.loadInfluencerData();
      expect(service.shortlistedInfluencers()).toHaveLength(1);
      expect(service.influencerCampaigns()).toHaveLength(1);
      expect(service.dismissedInfluencers()).toHaveLength(1);
      expect(mockMockData.markReal).toHaveBeenCalledWith('influencer-marketing');
    });

    it('saveShortlist persists to localStorage and updates signal', () => {
      const data = [{
        id: 'x', name: 'Maya', handle: '@maya', platforms: ['instagram' as const],
        tier: 'micro' as const, followers: 1000, engagementRate: 5, niche: [],
        audienceAlignment: 70, objectiveFit: [], bio: '', avatarColor: '#000',
        status: 'new' as const, addedAt: '2026-01-01T00:00:00Z',
      }];
      service.saveShortlist(data);
      expect(service.shortlistedInfluencers()).toEqual(data);
      expect(JSON.parse(window.localStorage.getItem('blink_shortlisted_influencers') ?? '[]')).toHaveLength(1);
      expect(mockMockData.markReal).toHaveBeenCalledWith('influencer-marketing');
    });

    it('saveShortlist with empty array does not mark real', () => {
      mockMockData.markReal.mockClear();
      service.saveShortlist([]);
      expect(mockMockData.markReal).not.toHaveBeenCalled();
    });

    it('saveCampaigns persists and updates signal', () => {
      const data = [{
        id: 'c1', name: 'Campaign', influencerId: 'x', influencerName: 'M',
        influencerHandle: '@m', influencerTier: 'micro' as const,
        platforms: ['instagram' as const], status: 'active' as const,
        startDate: '', createdAt: '',
      }];
      service.saveCampaigns(data);
      expect(service.influencerCampaigns()).toEqual(data);
      expect(JSON.parse(window.localStorage.getItem('blink_influencer_campaigns') ?? '[]')).toHaveLength(1);
    });

    it('saveCampaigns with empty array does not mark real', () => {
      mockMockData.markReal.mockClear();
      service.saveCampaigns([]);
      expect(mockMockData.markReal).not.toHaveBeenCalled();
    });

    it('saveDismissedInfluencers persists and updates signal', () => {
      const data = [{
        id: 'x', name: 'Hidden', handle: '@hidden', platforms: ['instagram' as const],
        tier: 'nano' as const, followers: 100, engagementRate: 10, niche: [],
        audienceAlignment: 60, objectiveFit: [], bio: '', avatarColor: '#000',
      }];
      service.saveDismissedInfluencers(data);
      expect(service.dismissedInfluencers()).toEqual(data);
    });

    it('loadAll invokes loadInfluencerData alongside api calls', () => {
      mockApi['getSettings'].mockImplementation((_: string, tab: string) =>
        tab === 'business-objectives' ? of([]) : of(null),
      );
      mockApi['getNamespaceAggregate'].mockReturnValue(of(null));
      mockApi['getNamespaceEntities'].mockReturnValue(of([]));
      window.localStorage.setItem('blink_influencer_campaigns', JSON.stringify([{ id: 'c1' }]));
      service.loadAll('ws-1');
      expect(service.influencerCampaigns()).toHaveLength(1);
    });

    it('isDirty detects change in influencer signals', () => {
      mockApi['getSettings'].mockImplementation((_: string, tab: string) =>
        tab === 'business-objectives' ? of([]) : of(null),
      );
      mockApi['getNamespaceAggregate'].mockReturnValue(of(null));
      mockApi['getNamespaceEntities'].mockReturnValue(of([]));
      service.loadAll('ws-1');
      expect(service.isDirty()).toBe(false);
      service.shortlistedInfluencers.set([{
        id: 'x', name: 'M', handle: '@m', platforms: ['instagram'],
        tier: 'micro', followers: 1, engagementRate: 1, niche: [],
        audienceAlignment: 60, objectiveFit: [], bio: '', avatarColor: '#000',
        status: 'new', addedAt: '',
      }]);
      expect(service.isDirty()).toBe(true);
      mockApi['getSettings'].mockImplementation((_: string, tab: string) =>
        tab === 'business-objectives' ? of([]) : of(null),
      );
      service.loadAll('ws-1');
      service.influencerCampaigns.set([{
        id: 'c1', name: 'X', influencerId: 'x', influencerName: 'M',
        influencerHandle: '@m', influencerTier: 'micro',
        platforms: ['instagram'], status: 'active', startDate: '', createdAt: '',
      }]);
      expect(service.isDirty()).toBe(true);
      mockApi['getSettings'].mockImplementation((_: string, tab: string) =>
        tab === 'business-objectives' ? of([]) : of(null),
      );
      service.loadAll('ws-1');
      service.dismissedInfluencers.set([{
        id: 'x', name: 'H', handle: '@h', platforms: ['instagram'],
        tier: 'nano', followers: 1, engagementRate: 1, niche: [],
        audienceAlignment: 60, objectiveFit: [], bio: '', avatarColor: '#000',
      }]);
      expect(service.isDirty()).toBe(true);
    });
  });

  describe('saveCompetitorInsights', () => {
    it('should call saveNamespaceEntities with competitor insights', () => {
      mockApi['saveNamespaceEntities'].mockReturnValue(of([]));
      service.workspaceId.set('ws-1');

      const data = [
        { id: 'c1', competitor: 'Rival', platform: 'tiktok' as const, contentType: 'video', topic: 'Demo', relevancyLevel: 'High' as const, frequency: 'daily', insight: 'Strong' },
      ];

      service.saveCompetitorInsights(data);

      expect(mockApi['saveNamespaceEntities']).toHaveBeenCalledWith('ws-1', 'competitor-insights', data);
      expect(service.competitorInsights()).toEqual(data);
      expect(service.saving()).toBe(false);
    });

    it('should handle save error gracefully', () => {
      mockApi['saveNamespaceEntities'].mockReturnValue(throwError(() => new Error('fail')));
      service.workspaceId.set('ws-1');
      service.saveCompetitorInsights([]);
      expect(service.saving()).toBe(false);
    });
  });
});
