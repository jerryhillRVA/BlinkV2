import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/icon/icon.component';
import type { AudienceInsight, AudienceSegment, SegmentJourneyStage, JourneyStage } from '../../strategy-research.types';
import { AI_SIMULATION_DELAY_MS, PLATFORM_LABELS } from '../../strategy-research.constants';
import { DEFAULT_SEGMENTS, MOCK_AUDIENCE_INSIGHTS } from '../../strategy-research.mock-data';
import { generateId, safeTimeout, toggleSetItem } from '../../strategy-research.utils';

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

  // AI Audience Analyzer state
  readonly selectedAnalyzeId = signal<string>(DEFAULT_SEGMENTS[0]?.id ?? '');
  readonly isAnalyzing = signal(false);
  readonly insights = signal<AudienceInsight[]>([]);

  readonly journeyStages = JOURNEY_STAGES;
  readonly stageLabels = STAGE_LABELS;
  readonly platformLabels = PLATFORM_LABELS;

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

  addSegment(): void {
    const id = generateId('seg');
    const newSegment: AudienceSegment = {
      id,
      name: '',
      description: '',
      journeyStages: JOURNEY_STAGES.map(stage => ({
        stage,
        primaryGoal: '',
        contentTypes: [],
        hookAngles: [],
        successMetric: '',
      })),
    };
    this.segments.update(list => [...list, newSegment]);
    this.editingId.set(id);
    this.editName = '';
    this.editDescription = '';
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

  // ── AI Audience Analyzer ────────────────────────────────────────────────
  currentInsight(): AudienceInsight | undefined {
    return this.insights().find(i => i.segmentId === this.selectedAnalyzeId());
  }

  currentSegmentName(): string {
    return this.segments().find(s => s.id === this.selectedAnalyzeId())?.name ?? '';
  }

  analyzeAudience(): void {
    const id = this.selectedAnalyzeId();
    if (!id) return;
    this.isAnalyzing.set(true);
    safeTimeout(() => {
      // Use mock if available for this segment id, otherwise synthesize a fallback.
      const mock = MOCK_AUDIENCE_INSIGHTS.find(i => i.segmentId === id)
        ?? { ...MOCK_AUDIENCE_INSIGHTS[0], segmentId: id };
      this.insights.update(list => [...list.filter(i => i.segmentId !== id), mock]);
      this.isAnalyzing.set(false);
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }

  engagementClass(level: string): string {
    if (level === 'Very High') return 'engagement--very-high';
    if (level === 'High') return 'engagement--high';
    return 'engagement--medium';
  }
}
