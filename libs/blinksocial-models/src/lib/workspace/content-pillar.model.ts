import type { ContentPillarContract } from '@blinksocial/contracts';

export class ContentPillar implements ContentPillarContract {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly color: string;
  readonly themes?: string[];
  readonly audienceSegmentIds?: string[];
  readonly platformDistribution?: Record<string, number>;
  readonly targetPlatforms?: string[];
  readonly objectiveIds?: string[];

  constructor(data: ContentPillarContract) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.color = data.color;
    this.themes = data.themes;
    this.audienceSegmentIds = data.audienceSegmentIds;
    this.platformDistribution = data.platformDistribution;
    this.targetPlatforms = data.targetPlatforms;
    this.objectiveIds = data.objectiveIds;
  }
}
