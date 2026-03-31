export class UIAudienceSegment {
  readonly id: number;
  readonly description: string;
  readonly ageRange: string;
  /** Original rich demographics text from the blueprint (e.g. "Ages 30-45, $80-150k salary…"). */
  readonly demographics?: string;

  constructor(data: { id: number; description: string; ageRange: string; demographics?: string }) {
    this.id = data.id;
    this.description = data.description;
    this.ageRange = data.ageRange;
    this.demographics = data.demographics;
  }
}
