import type { AudienceSegmentContract } from '@blinksocial/contracts';

export class AudienceSegment implements AudienceSegmentContract {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly demographics?: string;
  readonly interests?: string[];
  readonly painPoints?: string[];
  readonly peakTimes?: string[];

  constructor(data: AudienceSegmentContract) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.demographics = data.demographics;
    this.interests = data.interests;
    this.painPoints = data.painPoints;
    this.peakTimes = data.peakTimes;
  }
}
