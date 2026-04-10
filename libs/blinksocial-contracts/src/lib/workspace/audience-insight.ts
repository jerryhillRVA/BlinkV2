export interface AudienceInsightContract {
  segmentId: string;
  interests: string[];
  painPoints: string[];
  peakActivityTimes: { day: string; hour: string; engagement: string }[];
  preferredPlatforms: { platform: string; preference: number }[];
  contentPreferences: string[];
}

export interface AudienceInsightsSettingsContract {
  insights: AudienceInsightContract[];
}
