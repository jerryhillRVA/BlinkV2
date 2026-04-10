import { Injectable, inject, signal, computed } from '@angular/core';
import { forkJoin, catchError, of } from 'rxjs';
import { WorkspaceSettingsApiService } from '../workspace-settings/workspace-settings-api.service';
import { MockDataService } from '../../core/mock-data/mock-data.service';
import type {
  BrandVoiceSettingsContract,
  BusinessObjectiveContract,
  ChannelStrategySettingsContract,
  ContentMixSettingsContract,
  AudienceInsightsSettingsContract,
  ResearchSourceContract,
  CompetitorInsightContract,
  ContentPillarContract,
  AudienceSegmentContract,
} from '@blinksocial/contracts';
import type {
  BrandVoiceData,
  BusinessObjective,
  ContentPillar,
  AudienceSegment,
  ChannelStrategyEntry,
  ContentMixTarget,
  AudienceInsight,
  ResearchSource,
  CompetitorInsight,
} from './strategy-research.types';
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

type DataDomain =
  | 'brandVoice'
  | 'objectives'
  | 'pillars'
  | 'segments'
  | 'channelStrategy'
  | 'contentMix'
  | 'researchSources'
  | 'competitorInsights'
  | 'audienceInsights';

const DOMAIN_TO_MOCK_FEATURE: Record<DataDomain, string> = {
  brandVoice: 'brand-voice',
  objectives: 'business-objectives',
  pillars: 'strategic-pillars',
  segments: 'audience',
  channelStrategy: 'channel-strategy',
  contentMix: 'content-mix',
  researchSources: 'research-sources',
  competitorInsights: 'competitor-deep-dive',
  audienceInsights: 'audience',
};

@Injectable()
export class StrategyResearchStateService {
  private readonly api = inject(WorkspaceSettingsApiService);
  private readonly mockData = inject(MockDataService);

  readonly workspaceId = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);

  // Raw contract data (for round-trip preservation)
  private rawBrandVoice: BrandVoiceSettingsContract | null = null;
  private rawPillars: ContentPillarContract[] = [];
  private rawSegments: AudienceSegmentContract[] = [];

  // Mapped frontend signals
  readonly brandVoice = signal<BrandVoiceData>({
    missionStatement: '',
    voiceAttributes: [],
    toneByContext: [],
    platformToneAdjustments: [],
    vocabulary: { preferred: [], avoid: [] },
  });
  readonly objectives = signal<BusinessObjective[]>([]);
  readonly pillars = signal<ContentPillar[]>([]);
  readonly segments = signal<AudienceSegment[]>([]);
  readonly channelStrategy = signal<ChannelStrategyEntry[]>([]);
  readonly contentMix = signal<ContentMixTarget[]>([]);
  readonly researchSources = signal<ResearchSource[]>([]);
  readonly competitorInsights = signal<CompetitorInsight[]>([]);
  readonly audienceInsights = signal<AudienceInsight[]>([]);

  private readonly originalData = new Map<DataDomain, string>();

  readonly isDirty = computed(() => {
    for (const [domain, original] of this.originalData) {
      const current = this.getDomainData(domain);
      if (JSON.stringify(current) !== original) return true;
    }
    return false;
  });

  loadAll(workspaceId: string): void {
    this.workspaceId.set(workspaceId);
    this.loading.set(true);

    forkJoin({
      brandVoice: this.api.getSettings<BrandVoiceSettingsContract>(workspaceId, 'brand-voice').pipe(catchError(() => of(null))),
      objectives: this.api.getSettings<BusinessObjectiveContract[]>(workspaceId, 'business-objectives').pipe(catchError(() => of([]))),
      channelStrategy: this.api.getSettings<ChannelStrategySettingsContract>(workspaceId, 'channel-strategy').pipe(catchError(() => of(null))),
      contentMix: this.api.getNamespaceAggregate<ContentMixSettingsContract>(workspaceId, 'content-mix').pipe(catchError(() => of(null))),
      audienceInsights: this.api.getNamespaceAggregate<AudienceInsightsSettingsContract>(workspaceId, 'audience-insights').pipe(catchError(() => of(null))),
      researchSources: this.api.getNamespaceEntities<ResearchSourceContract>(workspaceId, 'research-sources').pipe(catchError(() => of([]))),
      competitorInsights: this.api.getNamespaceEntities<CompetitorInsightContract>(workspaceId, 'competitor-insights').pipe(catchError(() => of([]))),
    }).subscribe({
      next: (data) => {
        // Brand voice (includes contentPillars and audienceSegments from hydration)
        this.rawBrandVoice = data.brandVoice;
        const bv = mapBrandVoiceFromContract(data.brandVoice);
        this.brandVoice.set(bv);
        this.snapshot('brandVoice', bv);
        this.markRealIfData('brandVoice', !!bv.missionStatement || bv.voiceAttributes.length > 0);

        // Pillars (hydrated in brand-voice response)
        const bvRecord = data.brandVoice as (BrandVoiceSettingsContract & { contentPillars?: ContentPillarContract[]; audienceSegments?: AudienceSegmentContract[] }) | null;
        this.rawPillars = bvRecord?.contentPillars ?? [];
        const pillars = mapPillarsFromContract(this.rawPillars);
        this.pillars.set(pillars);
        this.snapshot('pillars', pillars);
        this.markRealIfData('pillars', pillars.length > 0);

        // Segments (hydrated in brand-voice response)
        this.rawSegments = bvRecord?.audienceSegments ?? [];
        const segments = mapSegmentsFromContract(this.rawSegments);
        this.segments.set(segments);
        this.snapshot('segments', segments);
        this.markRealIfData('segments', segments.length > 0);

        // Objectives
        const objectives = mapObjectivesFromContract(data.objectives ?? []);
        this.objectives.set(objectives);
        this.snapshot('objectives', objectives);
        this.markRealIfData('objectives', objectives.length > 0);

        // Channel Strategy
        const channels = mapChannelStrategyFromContract(data.channelStrategy);
        this.channelStrategy.set(channels);
        this.snapshot('channelStrategy', channels);
        this.markRealIfData('channelStrategy', channels.length > 0);

        // Content Mix
        const mix = mapContentMixFromContract(data.contentMix);
        this.contentMix.set(mix);
        this.snapshot('contentMix', mix);
        this.markRealIfData('contentMix', mix.length > 0);

        // Audience Insights
        const insights = mapAudienceInsightsFromContract(data.audienceInsights);
        this.audienceInsights.set(insights);
        this.snapshot('audienceInsights', insights);
        this.markRealIfData('audienceInsights', insights.length > 0);

        // Research Sources
        const sources = mapResearchSourcesFromContract(data.researchSources ?? []);
        this.researchSources.set(sources);
        this.snapshot('researchSources', sources);
        this.markRealIfData('researchSources', sources.length > 0);

        // Competitor Insights
        const competitors = mapCompetitorInsightsFromContract(data.competitorInsights ?? []);
        this.competitorInsights.set(competitors);
        this.snapshot('competitorInsights', competitors);
        this.markRealIfData('competitorInsights', competitors.length > 0);

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  // --- Save methods ---

  saveBrandVoice(data: BrandVoiceData): void {
    this.brandVoice.set(data);
    const contract = mapBrandVoiceToContract(data, this.rawBrandVoice);
    this.saving.set(true);
    this.api.saveSettings(this.workspaceId(), 'brand-voice', contract).subscribe({
      next: (saved) => {
        this.rawBrandVoice = saved;
        this.snapshot('brandVoice', data);
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  saveObjectives(data: BusinessObjective[]): void {
    this.objectives.set(data);
    this.saving.set(true);
    this.api.saveSettings(this.workspaceId(), 'business-objectives', data).subscribe({
      next: () => {
        this.snapshot('objectives', data);
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  savePillars(data: ContentPillar[]): void {
    this.pillars.set(data);
    const contracts = mapPillarsToContract(data, this.rawPillars);
    // Pillars are saved via the brand-voice endpoint (which syncs the content-pillars namespace)
    const brandVoicePayload = {
      ...mapBrandVoiceToContract(this.brandVoice(), this.rawBrandVoice),
      contentPillars: contracts,
    };
    this.saving.set(true);
    this.api.saveSettings(this.workspaceId(), 'brand-voice', brandVoicePayload).subscribe({
      next: () => {
        this.rawPillars = contracts;
        this.snapshot('pillars', data);
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  saveSegments(data: AudienceSegment[]): void {
    this.segments.set(data);
    const contracts = mapSegmentsToContract(data, this.rawSegments);
    // Segments are saved via the general endpoint (which syncs the audience-segments namespace)
    this.saving.set(true);
    this.api.getSettings<Record<string, unknown>>(this.workspaceId(), 'general').subscribe({
      next: (general) => {
        const payload = { ...general, audienceSegments: contracts };
        this.api.saveSettings(this.workspaceId(), 'general', payload).subscribe({
          next: () => {
            this.rawSegments = contracts;
            this.snapshot('segments', data);
            this.saving.set(false);
          },
          error: () => this.saving.set(false),
        });
      },
      error: () => this.saving.set(false),
    });
  }

  saveChannelStrategy(data: ChannelStrategyEntry[]): void {
    this.channelStrategy.set(data);
    const contract: ChannelStrategySettingsContract = { channels: data };
    this.saving.set(true);
    this.api.saveSettings(this.workspaceId(), 'channel-strategy', contract).subscribe({
      next: () => {
        this.snapshot('channelStrategy', data);
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  saveContentMix(data: ContentMixTarget[]): void {
    this.contentMix.set(data);
    const contract: ContentMixSettingsContract = { targets: data };
    this.saving.set(true);
    this.api.saveNamespaceAggregate(this.workspaceId(), 'content-mix', contract).subscribe({
      next: () => {
        this.snapshot('contentMix', data);
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  saveAudienceInsights(data: AudienceInsight[]): void {
    this.audienceInsights.set(data);
    const contract: AudienceInsightsSettingsContract = { insights: data };
    this.saving.set(true);
    this.api.saveNamespaceAggregate(this.workspaceId(), 'audience-insights', contract).subscribe({
      next: () => {
        this.snapshot('audienceInsights', data);
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  saveResearchSources(data: ResearchSource[]): void {
    this.researchSources.set(data);
    this.saving.set(true);
    this.api.saveNamespaceEntities(this.workspaceId(), 'research-sources', data).subscribe({
      next: () => {
        this.snapshot('researchSources', data);
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  saveCompetitorInsights(data: CompetitorInsight[]): void {
    this.competitorInsights.set(data);
    this.saving.set(true);
    this.api.saveNamespaceEntities(this.workspaceId(), 'competitor-insights', data).subscribe({
      next: () => {
        this.snapshot('competitorInsights', data);
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  // --- Helpers ---

  private snapshot(domain: DataDomain, data: unknown): void {
    this.originalData.set(domain, JSON.stringify(data));
  }

  private markRealIfData(domain: DataDomain, hasData: boolean): void {
    const feature = DOMAIN_TO_MOCK_FEATURE[domain];
    if (hasData) {
      this.mockData.markReal(feature);
    }
  }

  private getDomainData(domain: DataDomain): unknown {
    switch (domain) {
      case 'brandVoice': return this.brandVoice();
      case 'objectives': return this.objectives();
      case 'pillars': return this.pillars();
      case 'segments': return this.segments();
      case 'channelStrategy': return this.channelStrategy();
      case 'contentMix': return this.contentMix();
      case 'researchSources': return this.researchSources();
      case 'competitorInsights': return this.competitorInsights();
      case 'audienceInsights': return this.audienceInsights();
    }
  }
}
