export class UIContentPillar {
  readonly id: number;
  readonly name: string;
  readonly themes: string;
  readonly description: string;
  readonly audienceSegments: string[];
  readonly platforms: string[];
  readonly objectiveId: string;

  constructor(data: {
    id: number;
    name: string;
    themes: string;
    description: string;
    audienceSegments: string[];
    platforms: string[];
    objectiveId?: string;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.themes = data.themes;
    this.description = data.description;
    this.audienceSegments = data.audienceSegments;
    this.platforms = data.platforms;
    this.objectiveId = data.objectiveId ?? '';
  }
}
