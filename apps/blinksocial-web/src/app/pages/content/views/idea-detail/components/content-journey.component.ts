import { Component, computed, input } from '@angular/core';
import type { ContentStage } from '../../../content.types';

interface JourneyStep {
  stage: ContentStage;
  label: string;
  state: 'past' | 'current' | 'future';
  number: number;
}

const JOURNEY_ORDER: { stage: ContentStage; label: string }[] = [
  { stage: 'idea', label: 'Idea' },
  { stage: 'concept', label: 'Concept' },
  { stage: 'post', label: 'Post' },
];

@Component({
  selector: 'app-content-journey',
  templateUrl: './content-journey.component.html',
  styleUrl: './content-journey.component.scss',
})
export class ContentJourneyComponent {
  readonly stage = input.required<ContentStage>();

  protected readonly steps = computed<JourneyStep[]>(() => {
    const current = this.stage();
    const currentIdx = JOURNEY_ORDER.findIndex((s) => s.stage === current);
    // production-brief is off-ladder — render all as future.
    const idx = currentIdx < 0 ? -1 : currentIdx;
    return JOURNEY_ORDER.map((s, i) => ({
      stage: s.stage,
      label: s.label,
      number: i + 1,
      state: i < idx ? 'past' : i === idx ? 'current' : 'future',
    }));
  });

  protected readonly progressPercent = computed(() => {
    const idx = JOURNEY_ORDER.findIndex((s) => s.stage === this.stage());
    if (idx < 0) return 0;
    // 0 → 0%, 1 → 50%, 2 → 100%
    return (idx / (JOURNEY_ORDER.length - 1)) * 100;
  });
}
