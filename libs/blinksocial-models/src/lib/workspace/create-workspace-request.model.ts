import type {
  CreateWorkspaceRequestContract,
  ContentPillarContract,
  AudienceSegmentContract,
  BusinessObjectiveContract,
  ChannelStrategySettingsContract,
  ContentMixSettingsContract,
} from '@blinksocial/contracts';
import { GeneralSettings } from './general-settings.model.js';
import { PlatformSettings } from './platform-settings.model.js';
import { BrandVoiceSettings } from './brand-voice.model.js';
import { ContentPillar } from './content-pillar.model.js';
import { AudienceSegment } from './audience-segment.model.js';
import { SkillSettings } from './skill-config.model.js';
import { BusinessObjective } from './business-objective.model.js';
import { BrandPositioning } from './brand-positioning.model.js';

export class CreateWorkspaceRequest implements CreateWorkspaceRequestContract {
  readonly general: GeneralSettings;
  readonly platforms: PlatformSettings;
  readonly brandVoice: BrandVoiceSettings;
  readonly contentPillars: ContentPillar[];
  readonly audienceSegments: AudienceSegment[];
  readonly skills?: SkillSettings;
  readonly businessObjectives?: BusinessObjective[];
  readonly brandPositioning?: BrandPositioning;
  readonly channelStrategy?: ChannelStrategySettingsContract;
  readonly contentMix?: ContentMixSettingsContract;

  constructor(data: CreateWorkspaceRequestContract) {
    this.general = new GeneralSettings(data.general);
    this.platforms = new PlatformSettings(data.platforms);
    this.brandVoice = new BrandVoiceSettings(data.brandVoice);
    this.contentPillars = data.contentPillars.map((p: ContentPillarContract) => new ContentPillar(p));
    this.audienceSegments = data.audienceSegments.map((s: AudienceSegmentContract) => new AudienceSegment(s));
    if (data.skills) {
      this.skills = new SkillSettings(data.skills);
    }
    if (data.businessObjectives) {
      this.businessObjectives = data.businessObjectives.map((o: BusinessObjectiveContract) => new BusinessObjective(o));
    }
    if (data.brandPositioning) {
      this.brandPositioning = new BrandPositioning(data.brandPositioning);
    }
    if (data.channelStrategy) {
      this.channelStrategy = data.channelStrategy;
    }
    if (data.contentMix) {
      this.contentMix = data.contentMix;
    }
  }
}
