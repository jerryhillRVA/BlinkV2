import { Component, DestroyRef, EmbeddedViewRef, HostBinding, TemplateRef, ViewChild, ViewContainerRef, effect, inject, input, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/icon/icon.component';
import { DropdownComponent, DropdownOption } from '../../../../shared/dropdown/dropdown.component';
import { MockDataService } from '../../../../core/mock-data/mock-data.service';
import type { ContentPillar, PillarGoal, AudienceSegment, BusinessObjective } from '../../strategy-research.types';
import { PRESET_COLORS, AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';
import { DEFAULT_PILLARS, DEFAULT_SEGMENTS } from '../../strategy-research.mock-data';
import { safeTimeout, generateId, toggleSetItem } from '../../strategy-research.utils';

interface PillarAllocation {
  pillarId: string;
  postsPerWeek: number;
  percentage: number;
  rationale: string;
}

interface PlatformAllocation {
  platform: string;
  postsPerWeek: number;
  rationale: string;
}

interface InvestmentPlan {
  pillarAllocations: PillarAllocation[];
  platformAllocations: PlatformAllocation[];
  quickWins: string[];
}

interface QuickGoalForm {
  metric: string;
  target: number | null;
  unit: string;
  period: PillarGoal['period'];
  current: number | undefined;
}

const BLANK_QUICK_GOAL: QuickGoalForm = {
  metric: '',
  target: null,
  unit: '%',
  period: 'monthly',
  current: undefined,
};

const DEFAULT_PILLAR_WEIGHTS: { weight: number; rationale: string }[] = [
  { weight: 30, rationale: 'Top engagement driver for your segments' },
  { weight: 25, rationale: 'Highest save rate content type' },
  { weight: 20, rationale: 'Strong share signal' },
  { weight: 15, rationale: 'Trust & credibility builder' },
  { weight: 10, rationale: 'Community & belonging driver' },
];

@Component({
  selector: 'app-strategic-pillars',
  imports: [FormsModule, IconComponent, DropdownComponent],
  templateUrl: './strategic-pillars.component.html',
  styleUrl: './strategic-pillars.component.scss',
})
export class StrategicPillarsComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly mockData = inject(MockDataService);
  private readonly doc = inject(DOCUMENT);
  private readonly vcr = inject(ViewContainerRef);

  @ViewChild('modalTpl', { static: true }) modalTpl!: TemplateRef<unknown>;
  @ViewChild('goalsDialogTpl', { static: true }) goalsDialogTpl!: TemplateRef<unknown>;
  @ViewChild('objectivesDialogTpl', { static: true }) objectivesDialogTpl!: TemplateRef<unknown>;
  private modalView: EmbeddedViewRef<unknown> | null = null;
  private goalsView: EmbeddedViewRef<unknown> | null = null;
  private objectivesView: EmbeddedViewRef<unknown> | null = null;

  constructor() {
    effect(() => {
      const open = this.showAddForm();
      const body = this.doc.body;
      if (open && this.modalTpl && !this.modalView) {
        this.modalView = this.vcr.createEmbeddedView(this.modalTpl);
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
        /* v8 ignore next */
        if (!this.goalsDialogPillarId() && !this.objectivesDialogPillarId()) body.style.overflow = '';
      }
    });

    effect(() => {
      const pillarId = this.goalsDialogPillarId();
      const body = this.doc.body;
      if (pillarId && this.goalsDialogTpl && !this.goalsView) {
        this.goalsView = this.vcr.createEmbeddedView(this.goalsDialogTpl);
        this.goalsView.detectChanges();
        /* v8 ignore start */
        for (const node of this.goalsView.rootNodes as Node[]) {
          if (node.nodeType === 1) body.appendChild(node);
        }
        /* v8 ignore stop */
        body.style.overflow = 'hidden';
      } else if (!pillarId && this.goalsView) {
        this.goalsView.destroy();
        this.goalsView = null;
        /* v8 ignore next */
        if (!this.showAddForm() && !this.objectivesDialogPillarId()) body.style.overflow = '';
      }
    });

    effect(() => {
      const pillarId = this.objectivesDialogPillarId();
      const body = this.doc.body;
      /* v8 ignore start */
      if (pillarId && this.objectivesDialogTpl && !this.objectivesView) {
        this.objectivesView = this.vcr.createEmbeddedView(this.objectivesDialogTpl);
        this.objectivesView.detectChanges();
        for (const node of this.objectivesView.rootNodes as Node[]) {
          if (node.nodeType === 1) body.appendChild(node);
        }
        body.style.overflow = 'hidden';
      } else if (!pillarId && this.objectivesView) {
        this.objectivesView.destroy();
        this.objectivesView = null;
        if (!this.showAddForm() && !this.goalsDialogPillarId()) body.style.overflow = '';
      }
      /* v8 ignore stop */
    });

    /* v8 ignore start */
    this.destroyRef.onDestroy(() => {
      if (this.modalView) { this.modalView.destroy(); this.modalView = null; }
      if (this.goalsView) { this.goalsView.destroy(); this.goalsView = null; }
      if (this.objectivesView) { this.objectivesView.destroy(); this.objectivesView = null; }
      if (this.doc.body) this.doc.body.style.overflow = '';
    });
    /* v8 ignore stop */
  }

  @HostBinding('class.is-mock-source')
  get isMockSource(): boolean {
    return this.mockData.isMock('strategic-pillars');
  }

  /* v8 ignore start */
  readonly linkedObjectives = input<BusinessObjective[]>([]);

  readonly pillars = signal<ContentPillar[]>([...DEFAULT_PILLARS]);
  readonly showAddForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly isAnalyzing = signal(false);
  readonly postsPerWeek = signal<number | null>(null);
  /* v8 ignore stop */

  readonly presetColors = PRESET_COLORS;

  readonly periodOptions: DropdownOption[] = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  /* v8 ignore start */
  readonly audienceSegments = signal<AudienceSegment[]>([...DEFAULT_SEGMENTS]);
  readonly selectedSegmentIds = signal<Set<string>>(
    new Set(DEFAULT_SEGMENTS.map((s) => s.id)),
  );

  readonly investmentPlan = signal<InvestmentPlan | null>(null);
  /* v8 ignore stop */

  isSegmentSelected(id: string): boolean {
    return this.selectedSegmentIds().has(id);
  }

  toggleSegment(id: string): void {
    this.selectedSegmentIds.update((set) => toggleSetItem(set, id));
  }

  getPillarById(id: string): ContentPillar | undefined {
    return this.pillars().find((p) => p.id === id);
  }

  // Add/Edit pillar form state
  newPillarName = '';
  newPillarDescription = '';
  newPillarColor = PRESET_COLORS[0];

  /* v8 ignore start */
  modalEditingId = signal<string | null>(null);

  // Manage Goals dialog state
  readonly goalsDialogPillarId = signal<string | null>(null);
  quickGoalForm: QuickGoalForm = { ...BLANK_QUICK_GOAL };

  // Link Objectives dialog state
  readonly objectivesDialogPillarId = signal<string | null>(null);
  readonly quickObjectiveIds = signal<Set<string>>(new Set());
  /* v8 ignore stop */

  // ── Pillar modal (Name / Description / Color only) ────────────────
  openAddForm(): void {
    this.modalEditingId.set(null);
    this.newPillarName = '';
    this.newPillarDescription = '';
    this.newPillarColor = PRESET_COLORS[0];
    this.showAddForm.set(true);
    this.editingId.set(null);
  }

  openEditModal(pillar: ContentPillar): void {
    this.modalEditingId.set(pillar.id);
    this.newPillarName = pillar.name;
    this.newPillarDescription = pillar.description;
    this.newPillarColor = pillar.color;
    this.showAddForm.set(true);
    this.editingId.set(null);
  }

  cancelAdd(): void {
    this.showAddForm.set(false);
  }

  addPillar(): void {
    if (!this.newPillarName.trim()) return;
    const editingId = this.modalEditingId();
    if (editingId) {
      this.pillars.update((list) =>
        list.map((p) =>
          p.id === editingId
            ? {
                ...p,
                name: this.newPillarName.trim(),
                description: this.newPillarDescription.trim(),
                color: this.newPillarColor,
              }
            : p,
        ),
      );
    } else {
      const pillar: ContentPillar = {
        id: generateId('p'),
        name: this.newPillarName.trim(),
        description: this.newPillarDescription.trim(),
        color: this.newPillarColor,
        goals: [],
        objectiveIds: [],
      };
      this.pillars.update((list) => [...list, pillar]);
    }
    this.showAddForm.set(false);
    this.modalEditingId.set(null);
  }

  // ── Manage Goals dialog ──────────────────────────────────────────
  openGoalsDialog(pillar: ContentPillar): void {
    this.quickGoalForm = { ...BLANK_QUICK_GOAL };
    this.goalsDialogPillarId.set(pillar.id);
  }

  closeGoalsDialog(): void {
    this.goalsDialogPillarId.set(null);
    this.quickGoalForm = { ...BLANK_QUICK_GOAL };
  }

  goalsDialogPillar(): ContentPillar | undefined {
    const id = this.goalsDialogPillarId();
    /* v8 ignore next */
    return id ? this.pillars().find((p) => p.id === id) : undefined;
  }

  updateQuickGoalPeriod(period: PillarGoal['period']): void {
    this.quickGoalForm = { ...this.quickGoalForm, period };
  }

  addQuickGoal(): void {
    const pillarId = this.goalsDialogPillarId();
    if (!pillarId) return;
    const metric = this.quickGoalForm.metric.trim();
    const target = this.quickGoalForm.target;
    if (!metric || target === null || target === undefined || target <= 0) return;
    const goal: PillarGoal = {
      id: generateId('g'),
      metric,
      target,
      unit: this.quickGoalForm.unit.trim() || '%',
      period: this.quickGoalForm.period,
      current: this.quickGoalForm.current ?? 0,
    };
    this.pillars.update((list) =>
      list.map((p) =>
        p.id === pillarId ? { ...p, goals: [...(p.goals ?? []), goal] } : p,
      ),
    );
    this.quickGoalForm = { ...BLANK_QUICK_GOAL };
  }

  removeGoalFromPillar(pillarId: string, goalId: string): void {
    this.pillars.update((list) =>
      list.map((p) =>
        p.id === pillarId
          /* v8 ignore next */
          ? { ...p, goals: (p.goals ?? []).filter((g) => g.id !== goalId) }
          : p,
      ),
    );
  }

  // ── Link Objectives dialog ───────────────────────────────────────
  openObjectivesDialog(pillar: ContentPillar): void {
    this.quickObjectiveIds.set(new Set(pillar.objectiveIds ?? []));
    this.objectivesDialogPillarId.set(pillar.id);
  }

  closeObjectivesDialog(): void {
    this.objectivesDialogPillarId.set(null);
  }

  isQuickObjectiveLinked(id: string): boolean {
    return this.quickObjectiveIds().has(id);
  }

  toggleQuickObjective(id: string): void {
    this.quickObjectiveIds.update((set) => toggleSetItem(set, id));
  }

  saveQuickObjectives(): void {
    const pillarId = this.objectivesDialogPillarId();
    if (!pillarId) return;
    const ids = Array.from(this.quickObjectiveIds());
    this.pillars.update((list) =>
      list.map((p) => (p.id === pillarId ? { ...p, objectiveIds: ids } : p)),
    );
    this.closeObjectivesDialog();
  }

  linkedObjectivesFor(pillar: ContentPillar): BusinessObjective[] {
    const ids = new Set(pillar.objectiveIds ?? []);
    return this.linkedObjectives().filter((o) => ids.has(o.id));
  }

  // ── Inline edit (legacy) ─────────────────────────────────────────
  editName = '';
  editDescription = '';
  editColor = '';

  startEdit(pillar: ContentPillar): void {
    this.editingId.set(pillar.id);
    this.editName = pillar.name;
    this.editDescription = pillar.description;
    this.editColor = pillar.color;
    this.showAddForm.set(false);
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveEdit(id: string): void {
    this.pillars.update((list) =>
      list.map((p) =>
        p.id === id
          ? { ...p, name: this.editName.trim(), description: this.editDescription.trim(), color: this.editColor }
          : p,
      ),
    );
    this.editingId.set(null);
  }

  deletePillar(id: string): void {
    this.pillars.update((list) => list.filter((p) => p.id !== id));
  }

  getGoalProgress(goal: PillarGoal): number {
    if (!goal.current || goal.target <= 0) return 0;
    return Math.min(100, Math.round((goal.current / goal.target) * 100));
  }

  analyzeDistribution(): void {
    const total = Number(this.postsPerWeek());
    if (!total || total < 1) return;
    this.isAnalyzing.set(true);
    safeTimeout(
      () => {
        const pillarList = this.pillars();
        const equalSplit = this.selectedSegmentIds().size === 0;
        const weights = pillarList.map((_, i) =>
          equalSplit
            ? 1
            : DEFAULT_PILLAR_WEIGHTS[i % DEFAULT_PILLAR_WEIGHTS.length].weight,
        );
        /* v8 ignore next */
        const weightSum = weights.reduce((a, b) => a + b, 0) || 1;
        const allocations: PillarAllocation[] = pillarList.map((p, i) => {
          const share = weights[i] / weightSum;
          const posts = Math.max(1, Math.round(share * total));
          return {
            pillarId: p.id,
            postsPerWeek: posts,
            percentage: Math.round(share * 100),
            rationale:
              DEFAULT_PILLAR_WEIGHTS[i % DEFAULT_PILLAR_WEIGHTS.length].rationale,
          };
        });
        const platformSplit: PlatformAllocation[] = [
          { platform: 'instagram', postsPerWeek: Math.max(1, Math.round(total * 0.45)), rationale: 'Highest reach for wellness content; visual-first audience' },
          { platform: 'tiktok',    postsPerWeek: Math.max(1, Math.round(total * 0.30)), rationale: 'Top discovery channel for new followers' },
          { platform: 'youtube',   postsPerWeek: Math.max(1, Math.round(total * 0.15)), rationale: 'Long-form trust builder; SEO compounding' },
          { platform: 'pinterest', postsPerWeek: Math.max(1, Math.round(total * 0.10)), rationale: 'Evergreen traffic for tutorials and saves' },
        ];
        const quickWins = [
          'Repurpose your top-performing pillar into a 3-part Reels series this week',
          'Cross-post the highest engagement Reel to TikTok within 24 hours of publishing',
          'Batch 5 carousel posts around the trust-building pillar to drive saves',
        ];
        this.investmentPlan.set({ pillarAllocations: allocations, platformAllocations: platformSplit, quickWins });
        this.isAnalyzing.set(false);
      },
      AI_SIMULATION_DELAY_MS,
      this.destroyRef,
    );
  }
}
