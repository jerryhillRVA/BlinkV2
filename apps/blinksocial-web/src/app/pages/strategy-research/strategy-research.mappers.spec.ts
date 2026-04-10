import {
  mapBrandVoiceFromContract,
  mapBrandVoiceToContract,
  mapPillarsFromContract,
  mapPillarsToContract,
  mapSegmentsFromContract,
  mapSegmentsToContract,
  mapObjectivesFromContract,
  mapChannelStrategyFromContract,
  mapContentMixFromContract,
  mapAudienceInsightsFromContract,
  mapResearchSourcesFromContract,
  mapCompetitorInsightsFromContract,
} from './strategy-research.mappers';
import type {
  BrandVoiceSettingsContract,
  ContentPillarContract,
  AudienceSegmentContract,
  BusinessObjectiveContract,
  ChannelStrategySettingsContract,
  ContentMixSettingsContract,
  AudienceInsightsSettingsContract,
  ResearchSourceContract,
  CompetitorInsightContract,
} from '@blinksocial/contracts';
import type {
  BrandVoiceData,
  ContentPillar,
  AudienceSegment,
} from './strategy-research.types';

describe('strategy-research mappers', () => {
  // --- Brand Voice ---

  describe('mapBrandVoiceFromContract', () => {
    it('should return defaults when contract is null', () => {
      const result = mapBrandVoiceFromContract(null);
      expect(result).toEqual({
        missionStatement: '',
        voiceAttributes: [],
        toneByContext: [],
        platformToneAdjustments: [],
        vocabulary: { preferred: [], avoid: [] },
      });
    });

    it('should map populated contract correctly', () => {
      const contract: BrandVoiceSettingsContract = {
        brandVoiceDescription: 'Our mission is quality',
        voiceAttributes: [
          { id: 'v1', label: 'Bold', description: 'Be bold', doExample: 'Do this', dontExample: 'Not that' },
        ],
        toneByContext: [
          { id: 't1', context: 'social', tone: 'casual', example: 'Hey there' },
        ],
        platformToneAdjustments: [
          { platform: 'instagram', adjustment: 'more visual' },
        ],
        vocabulary: { preferred: ['innovative'], avoid: ['cheap'] },
      };

      const result = mapBrandVoiceFromContract(contract);
      expect(result.missionStatement).toBe('Our mission is quality');
      expect(result.voiceAttributes).toHaveLength(1);
      expect(result.voiceAttributes[0].label).toBe('Bold');
      expect(result.toneByContext).toHaveLength(1);
      expect(result.toneByContext[0].context).toBe('social');
      expect(result.platformToneAdjustments).toHaveLength(1);
      expect(result.platformToneAdjustments[0].platform).toBe('instagram');
      expect(result.vocabulary).toEqual({ preferred: ['innovative'], avoid: ['cheap'] });
    });

    it('should handle missing optional arrays gracefully', () => {
      const contract = {} as BrandVoiceSettingsContract;
      const result = mapBrandVoiceFromContract(contract);
      expect(result.missionStatement).toBe('');
      expect(result.voiceAttributes).toEqual([]);
      expect(result.toneByContext).toEqual([]);
      expect(result.platformToneAdjustments).toEqual([]);
    });
  });

  describe('mapBrandVoiceToContract', () => {
    it('should map data back to contract format', () => {
      const data: BrandVoiceData = {
        missionStatement: 'Be great',
        voiceAttributes: [{ id: 'v1', label: 'Bold', description: 'desc', doExample: 'do', dontExample: 'dont' }],
        toneByContext: [{ id: 't1', context: 'formal', tone: 'serious', example: 'ex' }],
        platformToneAdjustments: [{ platform: 'linkedin', adjustment: 'professional' }],
        vocabulary: { preferred: ['yes'], avoid: ['no'] },
      };
      const result = mapBrandVoiceToContract(data, null);
      expect(result.brandVoiceDescription).toBe('Be great');
      expect(result.voiceAttributes).toHaveLength(1);
      expect(result.toneByContext).toHaveLength(1);
      expect(result.platformToneAdjustments).toHaveLength(1);
      expect(result.vocabulary).toEqual({ preferred: ['yes'], avoid: ['no'] });
    });

    it('should preserve existing contract fields', () => {
      const existing: BrandVoiceSettingsContract = {
        brandVoiceDescription: 'old',
        voiceAttributes: [],
        toneByContext: [],
        platformToneAdjustments: [],
        vocabulary: { preferred: [], avoid: [] },
        extraField: 'preserved',
      } as BrandVoiceSettingsContract & { extraField: string };

      const data: BrandVoiceData = {
        missionStatement: 'new mission',
        voiceAttributes: [],
        toneByContext: [],
        platformToneAdjustments: [],
        vocabulary: { preferred: [], avoid: [] },
      };

      const result = mapBrandVoiceToContract(data, existing) as Record<string, unknown>;
      expect(result['brandVoiceDescription']).toBe('new mission');
      expect(result['extraField']).toBe('preserved');
    });
  });

  // --- Pillars ---

  describe('mapPillarsFromContract', () => {
    it('should map contracts with goals and objectiveIds', () => {
      const contracts: ContentPillarContract[] = [
        {
          id: 'p1',
          name: 'Education',
          description: 'Teach stuff',
          color: '#ff0000',
          goals: [{ id: 'g1', metric: 'views', target: 1000, unit: 'views', period: 'monthly', current: 500 }],
          objectiveIds: ['obj1', 'obj2'],
        },
      ];
      const result = mapPillarsFromContract(contracts);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Education');
      expect(result[0].goals).toHaveLength(1);
      expect(result[0].goals![0].metric).toBe('views');
      expect(result[0].objectiveIds).toEqual(['obj1', 'obj2']);
    });

    it('should handle missing goals gracefully', () => {
      const contracts = [{ id: 'p1', name: 'Test', description: '', color: '#000' }] as ContentPillarContract[];
      const result = mapPillarsFromContract(contracts);
      expect(result[0].goals).toEqual([]);
    });

    it('should return empty array for empty input', () => {
      expect(mapPillarsFromContract([])).toEqual([]);
    });
  });

  describe('mapPillarsToContract', () => {
    it('should preserve existing extra fields from raw contracts', () => {
      const pillars: ContentPillar[] = [
        { id: 'p1', name: 'Updated', description: 'New desc', color: '#fff', goals: [], objectiveIds: [] },
      ];
      const existing: ContentPillarContract[] = [
        {
          id: 'p1',
          name: 'Old',
          description: 'Old desc',
          color: '#000',
          goals: [],
          objectiveIds: [],
          themes: ['theme1'],
          audienceSegmentIds: ['seg1'],
        },
      ];

      const result = mapPillarsToContract(pillars, existing);
      expect(result[0].name).toBe('Updated');
      expect((result[0] as unknown as Record<string, unknown>)['themes']).toEqual(['theme1']);
      expect((result[0] as unknown as Record<string, unknown>)['audienceSegmentIds']).toEqual(['seg1']);
    });

    it('should handle new pillars without existing data', () => {
      const pillars: ContentPillar[] = [
        { id: 'new1', name: 'Brand New', description: 'desc', color: '#abc' },
      ];
      const result = mapPillarsToContract(pillars, []);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('new1');
      expect(result[0].name).toBe('Brand New');
    });
  });

  // --- Segments ---

  describe('mapSegmentsFromContract', () => {
    it('should map contracts with journeyStages', () => {
      const contracts: AudienceSegmentContract[] = [
        {
          id: 's1',
          name: 'Millennials',
          description: 'Young adults',
          journeyStages: [
            {
              stage: 'awareness',
              primaryGoal: 'Discover brand',
              contentTypes: ['video'],
              hookAngles: ['trending'],
              successMetric: 'impressions',
            },
          ],
        },
      ];
      const result = mapSegmentsFromContract(contracts);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Millennials');
      expect(result[0].journeyStages).toHaveLength(1);
      expect(result[0].journeyStages![0].stage).toBe('awareness');
    });

    it('should handle missing journeyStages', () => {
      const contracts = [{ id: 's1', name: 'Test', description: '' }] as AudienceSegmentContract[];
      const result = mapSegmentsFromContract(contracts);
      expect(result[0].journeyStages).toBeUndefined();
    });

    it('should return empty array for empty input', () => {
      expect(mapSegmentsFromContract([])).toEqual([]);
    });
  });

  describe('mapSegmentsToContract', () => {
    it('should preserve existing extra fields from raw contracts', () => {
      const segments: AudienceSegment[] = [
        { id: 's1', name: 'Updated Seg', description: 'New' },
      ];
      const existing: AudienceSegmentContract[] = [
        {
          id: 's1',
          name: 'Old Seg',
          description: 'Old',
          demographics: 'age 25-35',
          interests: ['tech'],
        },
      ];

      const result = mapSegmentsToContract(segments, existing);
      expect(result[0].name).toBe('Updated Seg');
      expect(result[0].demographics).toBe('age 25-35');
      expect(result[0].interests).toEqual(['tech']);
    });

    it('should handle new segments without existing data', () => {
      const segments: AudienceSegment[] = [
        { id: 'new1', name: 'New Seg', description: 'Fresh' },
      ];
      const result = mapSegmentsToContract(segments, []);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('new1');
    });
  });

  // --- Objectives ---

  describe('mapObjectivesFromContract', () => {
    it('should map all fields correctly', () => {
      const contracts: BusinessObjectiveContract[] = [
        {
          id: 'o1',
          category: 'growth',
          statement: 'Grow followers',
          target: 10000,
          unit: 'followers',
          timeframe: 'Q1 2026',
          currentValue: 5000,
          status: 'on-track',
        },
      ];
      const result = mapObjectivesFromContract(contracts);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('o1');
      expect(result[0].category).toBe('growth');
      expect(result[0].target).toBe(10000);
      expect(result[0].currentValue).toBe(5000);
      expect(result[0].status).toBe('on-track');
    });

    it('should default status to on-track when missing', () => {
      const contracts = [
        { id: 'o1', category: 'growth', statement: 'Grow', target: 100, unit: 'u', timeframe: 'Q1' },
      ] as BusinessObjectiveContract[];
      const result = mapObjectivesFromContract(contracts);
      expect(result[0].status).toBe('on-track');
    });

    it('should return empty array for empty input', () => {
      expect(mapObjectivesFromContract([])).toEqual([]);
    });
  });

  // --- Channel Strategy ---

  describe('mapChannelStrategyFromContract', () => {
    it('should return empty array for null contract', () => {
      expect(mapChannelStrategyFromContract(null)).toEqual([]);
    });

    it('should return empty array when channels is missing', () => {
      expect(mapChannelStrategyFromContract({} as ChannelStrategySettingsContract)).toEqual([]);
    });

    it('should map populated contract correctly', () => {
      const contract: ChannelStrategySettingsContract = {
        channels: [
          {
            platform: 'instagram',
            active: true,
            role: 'Primary visual',
            primaryContentTypes: ['reels', 'stories'],
            toneAdjustment: 'casual',
            postingCadence: 'daily',
            primaryAudience: 'gen-z',
            primaryGoal: 'engagement',
            notes: 'Focus on reels',
          },
        ],
      };
      const result = mapChannelStrategyFromContract(contract);
      expect(result).toHaveLength(1);
      expect(result[0].platform).toBe('instagram');
      expect(result[0].active).toBe(true);
      expect(result[0].primaryContentTypes).toEqual(['reels', 'stories']);
    });
  });

  // --- Content Mix ---

  describe('mapContentMixFromContract', () => {
    it('should return empty array for null contract', () => {
      expect(mapContentMixFromContract(null)).toEqual([]);
    });

    it('should return empty array when targets is missing', () => {
      expect(mapContentMixFromContract({} as ContentMixSettingsContract)).toEqual([]);
    });

    it('should map populated contract correctly', () => {
      const contract: ContentMixSettingsContract = {
        targets: [
          {
            category: 'educational',
            label: 'How-to',
            targetPercent: 40,
            color: '#4CAF50',
            description: 'Educational content',
          },
        ],
      };
      const result = mapContentMixFromContract(contract);
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('educational');
      expect(result[0].targetPercent).toBe(40);
    });
  });

  // --- Audience Insights ---

  describe('mapAudienceInsightsFromContract', () => {
    it('should return empty array for null contract', () => {
      expect(mapAudienceInsightsFromContract(null)).toEqual([]);
    });

    it('should return empty array when insights is missing', () => {
      expect(mapAudienceInsightsFromContract({} as AudienceInsightsSettingsContract)).toEqual([]);
    });

    it('should map populated contract correctly', () => {
      const contract: AudienceInsightsSettingsContract = {
        insights: [
          {
            segmentId: 's1',
            interests: ['tech', 'design'],
            painPoints: ['time management'],
            peakActivityTimes: [{ day: 'Monday', hour: '9am', engagement: 'high' }],
            preferredPlatforms: [{ platform: 'instagram', preference: 0.8 }],
            contentPreferences: ['video', 'carousel'],
          },
        ],
      };
      const result = mapAudienceInsightsFromContract(contract);
      expect(result).toHaveLength(1);
      expect(result[0].segmentId).toBe('s1');
      expect(result[0].interests).toEqual(['tech', 'design']);
      expect(result[0].preferredPlatforms[0].platform).toBe('instagram');
      expect(result[0].preferredPlatforms[0].preference).toBe(0.8);
      expect(result[0].contentPreferences).toEqual(['video', 'carousel']);
    });
  });

  // --- Research Sources ---

  describe('mapResearchSourcesFromContract', () => {
    it('should map all fields correctly', () => {
      const contracts: ResearchSourceContract[] = [
        {
          id: 'r1',
          title: 'Social Media Trends 2026',
          url: 'https://example.com/trends',
          type: 'article',
          relevance: 0.95,
          pillarIds: ['p1', 'p2'],
          summary: 'Key trends in social media',
          discoveredAt: '2026-01-15T00:00:00Z',
        },
      ];
      const result = mapResearchSourcesFromContract(contracts);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('r1');
      expect(result[0].title).toBe('Social Media Trends 2026');
      expect(result[0].type).toBe('article');
      expect(result[0].relevance).toBe(0.95);
      expect(result[0].pillarIds).toEqual(['p1', 'p2']);
    });

    it('should return empty array for empty input', () => {
      expect(mapResearchSourcesFromContract([])).toEqual([]);
    });
  });

  // --- Competitor Insights ---

  describe('mapCompetitorInsightsFromContract', () => {
    it('should map all fields correctly', () => {
      const contracts: CompetitorInsightContract[] = [
        {
          id: 'c1',
          competitor: 'Rival Co',
          platform: 'tiktok',
          contentType: 'short-form video',
          topic: 'Product demos',
          relevancyLevel: 'High',
          frequency: 'daily',
          insight: 'Strong engagement on demos',
        },
      ];
      const result = mapCompetitorInsightsFromContract(contracts);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('c1');
      expect(result[0].competitor).toBe('Rival Co');
      expect(result[0].platform).toBe('tiktok');
      expect(result[0].relevancyLevel).toBe('High');
    });

    it('should return empty array for empty input', () => {
      expect(mapCompetitorInsightsFromContract([])).toEqual([]);
    });
  });
});
