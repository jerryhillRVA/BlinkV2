import type { GeneralSettingsContract } from '@blinksocial/contracts';

export class GeneralSettings implements GeneralSettingsContract {
  readonly workspaceName: string;
  readonly purpose?: string;
  readonly mission?: string;
  readonly timezone?: string;
  readonly language?: string;
  readonly brandColor?: string;
  readonly logoUrl?: string;
  readonly website?: string;
  readonly contactEmail?: string;
  readonly status?: 'active' | 'archived' | 'onboarding' | 'creating';

  constructor(data: GeneralSettingsContract) {
    this.workspaceName = data.workspaceName;
    this.purpose = data.purpose;
    this.mission = data.mission;
    this.timezone = data.timezone;
    this.language = data.language;
    this.brandColor = data.brandColor;
    this.logoUrl = data.logoUrl;
    this.website = data.website;
    this.contactEmail = data.contactEmail;
    this.status = data.status;
  }
}
