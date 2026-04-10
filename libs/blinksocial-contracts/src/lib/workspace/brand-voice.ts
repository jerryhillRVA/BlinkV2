import type { ContentPillarContract } from './content-pillar.js';

export interface VoiceAttributeContract {
  id: string;
  label: string;
  description: string;
  doExample: string;
  dontExample: string;
}

export interface ToneContextContract {
  id: string;
  context: string;
  tone: string;
  example: string;
}

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
  toneTags?: string[];
  voiceAttributes?: VoiceAttributeContract[];
  toneByContext?: ToneContextContract[];
  platformToneAdjustments?: { platform: string; adjustment: string }[];
  vocabulary?: { preferred: string[]; avoid: string[] };
}
