export interface GeneralSettingsContract {
  workspaceName: string;
  purpose?: string;
  mission?: string;
  timezone?: string;
  language?: string;
  brandColor?: string;
  logoUrl?: string;
  website?: string;
  contactEmail?: string;
  status?: 'active' | 'archived';
}
