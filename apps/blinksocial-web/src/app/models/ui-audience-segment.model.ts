export class UIAudienceSegment {
  readonly id: number;
  readonly name: string;
  /** Original rich demographics text from the blueprint (e.g. "Ages 30-45, $80-150k salary…"). */
  readonly demographics?: string;

  constructor(data: { id: number; name: string; demographics?: string }) {
    this.id = data.id;
    this.name = data.name;
    this.demographics = data.demographics;
  }
}
