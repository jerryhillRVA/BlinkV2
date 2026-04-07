import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/icon/icon.component';
import type { AudienceSegment, SegmentJourneyStage, JourneyStage } from '../../strategy-research.types';
import { AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';
import { DEFAULT_SEGMENTS } from '../../strategy-research.mock-data';
import { safeTimeout, toggleSetItem } from '../../strategy-research.utils';

const JOURNEY_STAGES: JourneyStage[] = ['awareness', 'consideration', 'conversion', 'retention'];

const STAGE_LABELS: Record<JourneyStage, string> = {
  awareness: 'Awareness',
  consideration: 'Consideration',
  conversion: 'Conversion',
  retention: 'Retention',
};

@Component({
  selector: 'app-audience',
  imports: [FormsModule, IconComponent],
  templateUrl: './audience.component.html',
  styleUrl: './audience.component.scss',
})
export class AudienceComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly segments = signal<AudienceSegment[]>(
    DEFAULT_SEGMENTS.map(s => ({
      ...s,
      journeyStages: JOURNEY_STAGES.map(stage => ({
        stage,
        primaryGoal: '',
        contentTypes: [],
        hookAngles: [],
        successMetric: '',
      })),
    }))
  );

  readonly expandedSegments = signal<Set<string>>(new Set());
  readonly mappingSegmentId = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);

  readonly journeyStages = JOURNEY_STAGES;
  readonly stageLabels = STAGE_LABELS;

  editName = '';
  editDescription = '';

  toggleJourney(segmentId: string): void {
    this.expandedSegments.update(set => toggleSetItem(set, segmentId));
  }

  isExpanded(segmentId: string): boolean {
    return this.expandedSegments().has(segmentId);
  }

  startEdit(segment: AudienceSegment): void {
    this.editingId.set(segment.id);
    this.editName = segment.name;
    this.editDescription = segment.description;
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveEdit(id: string): void {
    this.segments.update(list =>
      list.map(s =>
        s.id === id
          ? { ...s, name: this.editName.trim(), description: this.editDescription.trim() }
          : s
      )
    );
    this.editingId.set(null);
  }

  deleteSegment(id: string): void {
    this.segments.update(list => list.filter(s => s.id !== id));
  }

  mapJourney(segmentId: string): void {
    this.mappingSegmentId.set(segmentId);
    safeTimeout(() => {
      this.segments.update(list =>
        list.map(s => {
          if (s.id !== segmentId) return s;
          return {
            ...s,
            journeyStages: JOURNEY_STAGES.map(stage => ({
              stage,
              primaryGoal: `AI-generated goal for ${STAGE_LABELS[stage]}`,
              contentTypes: ['Short-form video', 'Carousel', 'Story'],
              hookAngles: ['Pain point', 'Transformation', 'Quick tip'],
              successMetric: `${STAGE_LABELS[stage]} engagement rate > 5%`,
            })),
          };
        })
      );
      this.mappingSegmentId.set(null);
      // Auto-expand after mapping
      this.expandedSegments.update(set => {
        const next = new Set(set);
        next.add(segmentId);
        return next;
      });
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }

  getStage(segment: AudienceSegment, stage: JourneyStage): SegmentJourneyStage | undefined {
    return segment.journeyStages?.find(s => s.stage === stage);
  }
}
