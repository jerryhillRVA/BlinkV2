import type { BrandVoiceSettingsContract } from '@blinksocial/contracts';

export class BrandVoiceSettings implements BrandVoiceSettingsContract {
  readonly brandVoiceDescription?: string;
  readonly toneGuidelines?: string[];
  readonly brandColor?: string;
  readonly logoUrl?: string;
  readonly visualGuidelines?: string;
  readonly typographyGuidelines?: string;
  readonly photographyGuidelines?: string;

  constructor(data: BrandVoiceSettingsContract) {
    this.brandVoiceDescription = data.brandVoiceDescription;
    this.toneGuidelines = data.toneGuidelines;
    this.brandColor = data.brandColor;
    this.logoUrl = data.logoUrl;
    this.visualGuidelines = data.visualGuidelines;
    this.typographyGuidelines = data.typographyGuidelines;
    this.photographyGuidelines = data.photographyGuidelines;
  }
}
