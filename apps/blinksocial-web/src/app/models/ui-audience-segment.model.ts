export class UIAudienceSegment {
  readonly id: number;
  readonly description: string;
  readonly ageRange: string;

  constructor(data: { id: number; description: string; ageRange: string }) {
    this.id = data.id;
    this.description = data.description;
    this.ageRange = data.ageRange;
  }
}
