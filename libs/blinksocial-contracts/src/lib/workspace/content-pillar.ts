export interface ContentPillarContract {
  id: string;
  name: string;
  description: string;
  color: string;
  themes?: string[];
  audienceSegmentIds?: string[];
  platformDistribution?: Record<string, number>;
}
