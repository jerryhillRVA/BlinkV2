export interface PillarGoalContract {
  id: string;
  metric: string;
  target: number;
  unit: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  current?: number;
}

export interface ContentPillarContract {
  id: string;
  name: string;
  description: string;
  color: string;
  themes?: string[];
  audienceSegmentIds?: string[];
  platformDistribution?: Record<string, number>;
  targetPlatforms?: string[];
  objectiveIds?: string[];
  goals?: PillarGoalContract[];
}
