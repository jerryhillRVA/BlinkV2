import type { ContentPillarContract } from './content-pillar.js';

export interface BrandVoiceSettingsContract {
  brandVoiceDescription?: string;
  toneGuidelines?: string[];
  brandColor?: string;
  logoUrl?: string;
  visualGuidelines?: string;
  typographyGuidelines?: string;
  photographyGuidelines?: string;
  contentPillars?: ContentPillarContract[];
  audienceOptions?: string[];
}
