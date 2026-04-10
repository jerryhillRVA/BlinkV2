import type { GeneralSettingsContract } from './general-settings.js';
import type { PlatformSettingsContract } from './platform-settings.js';
import type { BrandVoiceSettingsContract } from './brand-voice.js';
import type { ContentPillarContract } from './content-pillar.js';
import type { AudienceSegmentContract } from './audience-segment.js';
import type { SkillSettingsContract } from './skill-config.js';
import type { BusinessObjectiveContract } from './business-objective.js';
import type { BrandPositioningContract } from './brand-positioning.js';
import type { ChannelStrategySettingsContract } from './channel-strategy.js';
import type { ContentMixSettingsContract } from './content-mix.js';
import type { CompetitorInsightContract } from './competitor-insight.js';
import type { ResearchSourceContract } from './research-source.js';

export interface CreateWorkspaceRequestContract {
  general: GeneralSettingsContract;
  platforms: PlatformSettingsContract;
  brandVoice: BrandVoiceSettingsContract;
  contentPillars: ContentPillarContract[];
  audienceSegments: AudienceSegmentContract[];
  skills?: SkillSettingsContract;
  businessObjectives?: BusinessObjectiveContract[];
  brandPositioning?: BrandPositioningContract;
  channelStrategy?: ChannelStrategySettingsContract;
  contentMix?: ContentMixSettingsContract;
  competitorInsights?: CompetitorInsightContract[];
  researchSources?: ResearchSourceContract[];
}
