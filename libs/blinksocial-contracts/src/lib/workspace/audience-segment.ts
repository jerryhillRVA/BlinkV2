export interface SegmentJourneyStageContract {
  stage: string;
  primaryGoal: string;
  contentTypes: string[];
  hookAngles: string[];
  successMetric: string;
}

export interface AudienceSegmentContract {
  id: string;
  name: string;
  description: string;
  demographics?: string;
  interests?: string[];
  painPoints?: string[];
  peakTimes?: string[];
  journeyStages?: SegmentJourneyStageContract[];
}
