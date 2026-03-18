import type { GeneralSettingsContract } from './general-settings.js';
import type { PlatformSettingsContract } from './platform-settings.js';
import type { BrandVoiceSettingsContract } from './brand-voice.js';
import type { ContentPillarContract } from './content-pillar.js';
import type { AudienceSegmentContract } from './audience-segment.js';
import type { SkillSettingsContract } from './skill-config.js';

export interface CreateWorkspaceRequestContract {
  general: GeneralSettingsContract;
  platforms: PlatformSettingsContract;
  brandVoice: BrandVoiceSettingsContract;
  contentPillars: ContentPillarContract[];
  audienceSegments: AudienceSegmentContract[];
  skills: SkillSettingsContract;
}
