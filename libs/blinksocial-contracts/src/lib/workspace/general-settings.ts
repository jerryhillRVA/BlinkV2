export interface AudienceSegment {
  id: string;
  description: string;
  ageRange: string;
}

export interface GeneralSettingsContract {
  workspaceName: string;
  purpose?: string;
  mission?: string;
  audienceSegments?: AudienceSegment[];
  brandVoice?: string;
  timezone?: string;
  language?: string;
  brandColor?: string;
  logoUrl?: string;
  website?: string;
  contactEmail?: string;
  status?: 'active' | 'archived';
}
