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
  BusinessObjective,
  ChannelStrategyEntry,
  ContentMixTarget,
  AudienceInsight,
  ResearchSource,
  CompetitorInsight,
} from './strategy-research.types';

// --- Brand Voice ---

export function mapBrandVoiceFromContract(
  contract: BrandVoiceSettingsContract | null,
): BrandVoiceData {
  if (!contract) {
    return {
      missionStatement: '',
      voiceAttributes: [],
      toneByContext: [],
      platformToneAdjustments: [],
      vocabulary: { preferred: [], avoid: [] },
    };
  }
  return {
    missionStatement: contract.brandVoiceDescription ?? '',
    voiceAttributes: (contract.voiceAttributes ?? []).map((a) => ({
      id: a.id,
      label: a.label,
      description: a.description,
      doExample: a.doExample,
      dontExample: a.dontExample,
    })),
    toneByContext: (contract.toneByContext ?? []).map((t) => ({
      id: t.id,
      context: t.context,
      tone: t.tone,
      example: t.example,
    })),
    platformToneAdjustments: (contract.platformToneAdjustments ?? []).map((p) => ({
      platform: p.platform as BrandVoiceData['platformToneAdjustments'][0]['platform'],
      adjustment: p.adjustment,
    })),
    vocabulary: contract.vocabulary ?? { preferred: [], avoid: [] },
  };
}

export function mapBrandVoiceToContract(
  data: BrandVoiceData,
  existing: BrandVoiceSettingsContract | null,
): BrandVoiceSettingsContract {
  return {
    ...(existing ?? {}),
    brandVoiceDescription: data.missionStatement,
    voiceAttributes: data.voiceAttributes,
    toneByContext: data.toneByContext,
    platformToneAdjustments: data.platformToneAdjustments,
    vocabulary: data.vocabulary,
  };
}

// --- Content Pillars ---

export function mapPillarsFromContract(
  contracts: ContentPillarContract[],
): ContentPillar[] {
  return contracts.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    color: c.color,
    goals: (c.goals ?? []).map((g) => ({
      id: g.id,
      metric: g.metric,
      target: g.target,
      unit: g.unit,
      period: g.period,
      current: g.current,
    })),
    objectiveIds: c.objectiveIds,
  }));
}

export function mapPillarsToContract(
  pillars: ContentPillar[],
  existing: ContentPillarContract[],
): ContentPillarContract[] {
  const existingMap = new Map(existing.map((e) => [e.id, e]));
  return pillars.map((p) => {
    const prev = existingMap.get(p.id);
    return {
      ...(prev ?? {}),
      id: p.id,
      name: p.name,
      description: p.description,
      color: p.color,
      goals: p.goals,
      objectiveIds: p.objectiveIds,
    };
  });
}

// --- Audience Segments ---

export function mapSegmentsFromContract(
  contracts: AudienceSegmentContract[],
): AudienceSegment[] {
  return contracts.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    journeyStages: c.journeyStages?.map((s) => ({
      stage: s.stage as AudienceSegment['journeyStages'] extends (infer U)[] | undefined ? U extends { stage: infer S } ? S : string : string,
      primaryGoal: s.primaryGoal,
      contentTypes: s.contentTypes,
      hookAngles: s.hookAngles,
      successMetric: s.successMetric,
    })),
  }));
}

export function mapSegmentsToContract(
  segments: AudienceSegment[],
  existing: AudienceSegmentContract[],
): AudienceSegmentContract[] {
  const existingMap = new Map(existing.map((e) => [e.id, e]));
  return segments.map((s) => {
    const prev = existingMap.get(s.id);
    return {
      ...(prev ?? {}),
      id: s.id,
      name: s.name,
      description: s.description,
      journeyStages: s.journeyStages,
    };
  });
}

// --- Business Objectives (1:1 mapping) ---

export function mapObjectivesFromContract(
  contracts: BusinessObjectiveContract[],
): BusinessObjective[] {
  return contracts.map((c) => ({
    id: c.id,
    category: c.category,
    statement: c.statement,
    target: c.target,
    unit: c.unit,
    timeframe: c.timeframe,
    currentValue: c.currentValue,
    status: c.status ?? 'on-track',
  }));
}

// --- Channel Strategy ---

export function mapChannelStrategyFromContract(
  contract: ChannelStrategySettingsContract | null,
): ChannelStrategyEntry[] {
  if (!contract?.channels) return [];
  return contract.channels.map((c) => ({
    platform: c.platform as ChannelStrategyEntry['platform'],
    active: c.active,
    role: c.role,
    primaryContentTypes: c.primaryContentTypes,
    toneAdjustment: c.toneAdjustment,
    postingCadence: c.postingCadence,
    primaryAudience: c.primaryAudience,
    primaryGoal: c.primaryGoal,
    notes: c.notes,
  }));
}

// --- Content Mix ---

export function mapContentMixFromContract(
  contract: ContentMixSettingsContract | null,
): ContentMixTarget[] {
  if (!contract?.targets) return [];
  return contract.targets.map((t) => ({
    category: t.category as ContentMixTarget['category'],
    label: t.label,
    targetPercent: t.targetPercent,
    color: t.color,
    description: t.description,
  }));
}

// --- Audience Insights (1:1) ---

export function mapAudienceInsightsFromContract(
  contract: AudienceInsightsSettingsContract | null,
): AudienceInsight[] {
  if (!contract?.insights) return [];
  return contract.insights.map((i) => ({
    segmentId: i.segmentId,
    interests: i.interests,
    painPoints: i.painPoints,
    peakActivityTimes: i.peakActivityTimes,
    preferredPlatforms: i.preferredPlatforms.map((p) => ({
      platform: p.platform as AudienceInsight['preferredPlatforms'][0]['platform'],
      preference: p.preference,
    })),
    contentPreferences: i.contentPreferences,
  }));
}

// --- Research Sources (1:1) ---

export function mapResearchSourcesFromContract(
  contracts: ResearchSourceContract[],
): ResearchSource[] {
  return contracts.map((c) => ({
    id: c.id,
    title: c.title,
    url: c.url,
    type: c.type,
    relevance: c.relevance,
    pillarIds: c.pillarIds,
    summary: c.summary,
    discoveredAt: c.discoveredAt,
  }));
}

// --- Competitor Insights (1:1) ---

export function mapCompetitorInsightsFromContract(
  contracts: CompetitorInsightContract[],
): CompetitorInsight[] {
  return contracts.map((c) => ({
    id: c.id,
    competitor: c.competitor,
    platform: c.platform as CompetitorInsight['platform'],
    contentType: c.contentType,
    topic: c.topic,
    relevancyLevel: c.relevancyLevel,
    frequency: c.frequency,
    insight: c.insight,
  }));
}
