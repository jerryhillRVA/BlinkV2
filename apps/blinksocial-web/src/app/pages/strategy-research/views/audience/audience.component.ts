import { Component, DestroyRef, EmbeddedViewRef, HostBinding, TemplateRef, ViewChild, ViewContainerRef, effect, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/icon/icon.component';
import { PlatformIconComponent } from '../../../../shared/platform-icon/platform-icon.component';
import { MockDataService } from '../../../../core/mock-data/mock-data.service';
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
  imports: [FormsModule, IconComponent, PlatformIconComponent],
  templateUrl: './audience.component.html',
  styleUrl: './audience.component.scss',
})
export class AudienceComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly mockData = inject(MockDataService);
  private readonly doc = inject(DOCUMENT);
  private readonly vcr = inject(ViewContainerRef);

  @ViewChild('segmentModalTpl', { static: true }) segmentModalTpl!: TemplateRef<unknown>;
  private modalView: EmbeddedViewRef<unknown> | null = null;

  /* v8 ignore start */
  readonly showAddForm = signal(false);
  newSegmentName = '';
  newSegmentDescription = '';
  /* v8 ignore stop */

  constructor() {
    effect(() => {
      const open = this.showAddForm();
      const body = this.doc.body;
      if (open && this.segmentModalTpl && !this.modalView) {
        this.modalView = this.vcr.createEmbeddedView(this.segmentModalTpl);
        this.modalView.detectChanges();
        /* v8 ignore start */
        for (const node of this.modalView.rootNodes as Node[]) {
          if (node.nodeType === 1) body.appendChild(node);
        }
        /* v8 ignore stop */
        body.style.overflow = 'hidden';
      } else if (!open && this.modalView) {
        this.modalView.destroy();
        this.modalView = null;
        body.style.overflow = '';
      }
    });
    /* v8 ignore start */
    this.destroyRef.onDestroy(() => {
      if (this.modalView) {
        this.modalView.destroy();
        this.modalView = null;
      }
      if (this.doc.body) this.doc.body.style.overflow = '';
    });
    /* v8 ignore stop */
  }

  openAddSegmentModal(): void {
    this.newSegmentName = '';
    this.newSegmentDescription = '';
    this.showAddForm.set(true);
  }

  cancelAddSegment(): void {
    this.showAddForm.set(false);
  }

  createSegment(): void {
    const name = this.newSegmentName.trim();
    if (!name) return;
    const newSegment: AudienceSegment = {
      id: generateId('seg'),
      name,
      description: this.newSegmentDescription.trim(),
      journeyStages: JOURNEY_STAGES.map(stage => ({
        stage,
        primaryGoal: '',
        contentTypes: [],
        hookAngles: [],
        successMetric: '',
      })),
    };
    this.segments.update(list => [...list, newSegment]);
    this.showAddForm.set(false);
  }

  @HostBinding('class.is-mock-source')
  get isMockSource(): boolean {
    return this.mockData.isMock('audience');
  }

  /* v8 ignore start */
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
  /* v8 ignore stop */

  /* v8 ignore start */
  readonly expandedSegments = signal<Set<string>>(new Set());
  readonly mappingSegmentId = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);

  // AI Audience Analyzer state — per-card
  readonly analyzingSegmentId = signal<string | null>(null);
  readonly expandedInsights = signal<Set<string>>(new Set());
  readonly insights = signal<AudienceInsight[]>([]);
  /* v8 ignore stop */

  readonly journeyStages = JOURNEY_STAGES;
  readonly stageLabels = STAGE_LABELS;
  readonly platformLabels = PLATFORM_LABELS;

  editName = '';
  editDescription = '';

  newContentType: Record<string, string> = {};
  newHookAngle: Record<string, string> = {};

  private updateStage(
    segmentId: string,
    stage: JourneyStage,
    patch: Partial<SegmentJourneyStage>,
  ): void {
    this.segments.update(list =>
      list.map(s => {
        if (s.id !== segmentId) return s;
        return {
          ...s,
          journeyStages: (s.journeyStages ?? []).map(js =>
            js.stage === stage ? { ...js, ...patch } : js,
          ),
        };
      }),
    );
  }

  setStageGoal(segmentId: string, stage: JourneyStage, value: string): void {
    this.updateStage(segmentId, stage, { primaryGoal: value });
  }

  setStageMetric(segmentId: string, stage: JourneyStage, value: string): void {
    this.updateStage(segmentId, stage, { successMetric: value });
  }

  addContentType(segmentId: string, stage: JourneyStage): void {
    const key = `${segmentId}:${stage}:type`;
    const value = (this.newContentType[key] ?? '').trim();
    if (!value) return;
    const seg = this.segments().find(s => s.id === segmentId);
    const current = seg?.journeyStages?.find(js => js.stage === stage)?.contentTypes ?? [];
    this.updateStage(segmentId, stage, { contentTypes: [...current, value] });
    this.newContentType[key] = '';
  }

  removeContentType(segmentId: string, stage: JourneyStage, value: string): void {
    const seg = this.segments().find(s => s.id === segmentId);
    const current = seg?.journeyStages?.find(js => js.stage === stage)?.contentTypes ?? [];
    this.updateStage(segmentId, stage, { contentTypes: current.filter(v => v !== value) });
  }

  addHookAngle(segmentId: string, stage: JourneyStage): void {
    const key = `${segmentId}:${stage}:hook`;
    const value = (this.newHookAngle[key] ?? '').trim();
    if (!value) return;
    const seg = this.segments().find(s => s.id === segmentId);
    const current = seg?.journeyStages?.find(js => js.stage === stage)?.hookAngles ?? [];
    this.updateStage(segmentId, stage, { hookAngles: [...current, value] });
    this.newHookAngle[key] = '';
  }

  removeHookAngle(segmentId: string, stage: JourneyStage, value: string): void {
    const seg = this.segments().find(s => s.id === segmentId);
    const current = seg?.journeyStages?.find(js => js.stage === stage)?.hookAngles ?? [];
    this.updateStage(segmentId, stage, { hookAngles: current.filter(v => v !== value) });
  }

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
          const segName = s.name || 'this audience';
          const TEMPLATES: Record<JourneyStage, Omit<SegmentJourneyStage, 'stage'>> = {
            awareness: {
              primaryGoal: `Introduce the brand to ${segName} and build recognition`,
              contentTypes: ['Educational Reels', 'Trend hooks', 'Value carousels'],
              hookAngles: ['Did you know...', 'Stop doing X', 'The truth about Y'],
              successMetric: 'New followers, Reach, Saves',
            },
            consideration: {
              primaryGoal: `Show ${segName} how the brand solves their specific challenges`,
              contentTypes: ['Tutorial series', 'Q&A posts', 'Behind the scenes'],
              hookAngles: ["Here's how to...", '3 mistakes to avoid', 'What actually works'],
              successMetric: 'Profile visits, Link clicks, Story replies',
            },
            conversion: {
              primaryGoal: `Drive ${segName} to take a high-intent action`,
              contentTypes: ['Testimonials', 'Product demos', 'Limited offers'],
              hookAngles: ['Transform your X in 30 days', 'Join 1,000+ women who...', 'Last chance for Y'],
              successMetric: 'DMs, Sign-ups, Purchases, Bookings',
            },
            retention: {
              primaryGoal: `Keep ${segName} engaged and turn them into advocates`,
              contentTypes: ['Community spotlights', 'Insider tips', 'UGC reposts'],
              hookAngles: ['For our community...', 'You asked, we delivered', 'Celebrating your wins'],
              successMetric: 'Comments, Shares, Repeat purchases, Referrals',
            },
          };
          return {
            ...s,
            journeyStages: JOURNEY_STAGES.map(stage => ({ stage, ...TEMPLATES[stage] })),
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

  hasJourney(segment: AudienceSegment): boolean {
    return !!segment.journeyStages?.some(s => !!s.primaryGoal);
  }

  getStage(segment: AudienceSegment, stage: JourneyStage): SegmentJourneyStage | undefined {
    return segment.journeyStages?.find(s => s.stage === stage);
  }

  // ── AI Audience Analyzer (per-card) ─────────────────────────────────────
  insightFor(segmentId: string): AudienceInsight | undefined {
    return this.insights().find(i => i.segmentId === segmentId);
  }

  isAnalyzingSegment(segmentId: string): boolean {
    return this.analyzingSegmentId() === segmentId;
  }

  isInsightsExpanded(segmentId: string): boolean {
    return this.expandedInsights().has(segmentId);
  }

  toggleInsights(segmentId: string): void {
    this.expandedInsights.update(set => toggleSetItem(set, segmentId));
  }

  analyzeForSegment(segmentId: string): void {
    this.analyzingSegmentId.set(segmentId);
    this.expandedInsights.update(set => {
      const next = new Set(set);
      next.add(segmentId);
      return next;
    });
    safeTimeout(() => {
      const mock = MOCK_AUDIENCE_INSIGHTS.find(i => i.segmentId === segmentId)
        ?? { ...MOCK_AUDIENCE_INSIGHTS[0], segmentId };
      this.insights.update(list => [...list.filter(i => i.segmentId !== segmentId), mock]);
      if (this.analyzingSegmentId() === segmentId) {
        this.analyzingSegmentId.set(null);
      }
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }

  engagementClass(level: string): string {
    if (level === 'Very High') return 'engagement--very-high';
    if (level === 'High') return 'engagement--high';
    return 'engagement--medium';
  }
}
