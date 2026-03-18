export interface AudienceSegmentContract {
  id: string;
  name: string;
  description: string;
  demographics?: string;
  interests?: string[];
  painPoints?: string[];
  peakTimes?: string[];
}
