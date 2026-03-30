export class UIAudienceSegment {
  readonly id: number;
  readonly name: string;

  constructor(data: { id: number; name: string }) {
    this.id = data.id;
    this.name = data.name;
  }
}
