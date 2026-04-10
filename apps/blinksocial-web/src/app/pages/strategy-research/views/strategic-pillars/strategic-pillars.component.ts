import { Component, DestroyRef, EmbeddedViewRef, HostBinding, TemplateRef, ViewChild, ViewContainerRef, effect, inject, input, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/icon/icon.component';
import { DropdownComponent, DropdownOption } from '../../../../shared/dropdown/dropdown.component';
import { MockDataService } from '../../../../core/mock-data/mock-data.service';
import { StrategyResearchStateService } from '../../strategy-research-state.service';
import type { ContentPillar, PillarGoal, BusinessObjective } from '../../strategy-research.types';
import { PRESET_COLORS, AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';
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

// Default weights — used to scale postsPerWeek across pillars.
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
  private readonly stateService = inject(StrategyResearchStateService);
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
        /* v8 ignore next 3 */
        for (const node of this.modalView.rootNodes as Node[]) {
          if (node.nodeType === 1) body.appendChild(node);
        }
        body.style.overflow = 'hidden';
      } else if (!open && this.modalView) {
        this.modalView.destroy();
        this.modalView = null;
        body.style.overflow = '';
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

    // Auto-select all segments when they load from state service
    effect(() => {
      const segs = this.audienceSegments();
      if (segs.length > 0 && this.selectedSegmentIds().size === 0) {
        this.selectedSegmentIds.set(new Set(segs.map(s => s.id)));
      }
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

  readonly pillars = this.stateService.pillars;
  readonly showAddForm = signal(false);
  readonly isSuggestingGoals = signal(false);
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
  // Audience Focus selection (chip toggles)
  readonly audienceSegments = this.stateService.segments;
  readonly selectedSegmentIds = signal<Set<string>>(new Set());

  // Investment plan output (populated by analyzeDistribution)
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

  // Add form state
  newPillarName = '';
  newPillarDescription = '';
  newPillarColor = PRESET_COLORS[0];
  /* v8 ignore start */
  newLinkedObjectiveIds = signal<Set<string>>(new Set());
  newGoals = signal<PillarGoal[]>([]);
  savedGoalIds = signal<Set<string>>(new Set());
  modalEditingId = signal<string | null>(null);

  // Manage Goals dialog state
  readonly goalsDialogPillarId = signal<string | null>(null);
  quickGoalForm: QuickGoalForm = { ...BLANK_QUICK_GOAL };

  // Link Objectives dialog state
  readonly objectivesDialogPillarId = signal<string | null>(null);
  readonly quickObjectiveIds = signal<Set<string>>(new Set());
  /* v8 ignore stop */

  isGoalSaved(id: string): boolean {
    return this.savedGoalIds().has(id);
  }

  hasDraftGoal(): boolean {
    const saved = this.savedGoalIds();
    return this.newGoals().some((g) => !saved.has(g.id));
  }

  saveGoal(id: string): void {
    this.savedGoalIds.update((set) => {
      const next = new Set(set);
      next.add(id);
      return next;
    });
  }

  updateGoalPeriod(id: string, period: PillarGoal['period']): void {
    this.newGoals.update((list) =>
      list.map((g) => (g.id === id ? { ...g, period } : g)),
    );
  }

  // Edit form state
  editName = '';
  editDescription = '';
  editColor = '';

  openAddForm(): void {
    this.modalEditingId.set(null);
    this.newPillarName = '';
    this.newPillarDescription = '';
    this.newPillarColor = PRESET_COLORS[0];
    this.newLinkedObjectiveIds.set(new Set());
    this.newGoals.set([]);
    this.savedGoalIds.set(new Set());
    this.showAddForm.set(true);
    this.editingId.set(null);
  }

  openEditModalAddGoal(pillar: ContentPillar): void {
    this.openEditModal(pillar);
    this.addGoal();
  }

  openEditModal(pillar: ContentPillar): void {
    this.modalEditingId.set(pillar.id);
    this.newPillarName = pillar.name;
    this.newPillarDescription = pillar.description;
    this.newPillarColor = pillar.color;
    this.newLinkedObjectiveIds.set(new Set(pillar.objectiveIds ?? []));
    const goals = (pillar.goals ?? []).map((g) => ({ ...g }));
    this.newGoals.set(goals);
    this.savedGoalIds.set(new Set(goals.map((g) => g.id)));
    this.showAddForm.set(true);
    this.editingId.set(null);
  }

  cancelAdd(): void {
    this.showAddForm.set(false);
  }

  isObjectiveLinked(id: string): boolean {
    return this.newLinkedObjectiveIds().has(id);
  }

  toggleLinkedObjective(id: string): void {
    this.newLinkedObjectiveIds.update((set) => toggleSetItem(set, id));
  }

  addGoal(): void {
    this.newGoals.update((list) => [
      ...list,
      { id: generateId('g'), metric: '', target: null as unknown as number, unit: '%', period: 'monthly', current: undefined },
    ]);
  }

  removeGoal(id: string): void {
    this.newGoals.update((list) => list.filter((g) => g.id !== id));
  }

  suggestGoals(): void {
    this.isSuggestingGoals.set(true);
    safeTimeout(
      () => {
        const suggested: PillarGoal[] = [
          { id: generateId('g'), metric: 'Engagement rate', target: 5, unit: '%', period: 'monthly', current: 0 },
          { id: generateId('g'), metric: 'Saves per post', target: 100, unit: 'saves', period: 'monthly', current: 0 },
        ];
        this.newGoals.update((list) => [...list, ...suggested]);
        this.savedGoalIds.update((set) => {
          const next = new Set(set);
          suggested.forEach((g) => next.add(g.id));
          return next;
        });
        this.isSuggestingGoals.set(false);
      },
      AI_SIMULATION_DELAY_MS,
      this.destroyRef,
    );
  }

  addPillar(): void {
    if (!this.newPillarName.trim()) return;
    const editingId = this.modalEditingId();
    const goals = this.newGoals().filter((g) => g.metric.trim());
    const objectiveIds = Array.from(this.newLinkedObjectiveIds());
    if (editingId) {
      this.pillars.update((list) =>
        list.map((p) =>
          p.id === editingId
            ? {
                ...p,
                name: this.newPillarName.trim(),
                description: this.newPillarDescription.trim(),
                color: this.newPillarColor,
                goals,
                objectiveIds,
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
        goals,
        objectiveIds,
      };
      this.pillars.update((list) => [...list, pillar]);
    }
    this.stateService.savePillars(this.pillars());
    this.showAddForm.set(false);
    this.modalEditingId.set(null);
  }

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
    this.pillars.update(list =>
      list.map(p =>
        p.id === id
          ? { ...p, name: this.editName.trim(), description: this.editDescription.trim(), color: this.editColor }
          : p
      )
    );
    this.stateService.savePillars(this.pillars());
    this.editingId.set(null);
  }

  deletePillar(id: string): void {
    this.pillars.update(list => list.filter(p => p.id !== id));
    this.stateService.savePillars(this.pillars());
  }

  getGoalProgress(goal: PillarGoal): number {
    if (!goal.current || goal.target <= 0) return 0;
    return Math.min(100, Math.round((goal.current / goal.target) * 100));
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
    this.stateService.savePillars(this.pillars());
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
    this.stateService.savePillars(this.pillars());
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
    this.stateService.savePillars(this.pillars());
    this.closeObjectivesDialog();
  }

  linkedObjectivesFor(pillar: ContentPillar): BusinessObjective[] {
    const ids = new Set(pillar.objectiveIds ?? []);
    return this.linkedObjectives().filter((o) => ids.has(o.id));
  }

  analyzeDistribution(): void {
    const total = Number(this.postsPerWeek());
    if (!total || total < 1) return;
    this.isAnalyzing.set(true);
    safeTimeout(
      () => {
        const pillarList = this.pillars();
        // Distribute by descending weights, scale to requested total.
        const weights = pillarList.map(
          (_, i) => DEFAULT_PILLAR_WEIGHTS[i % DEFAULT_PILLAR_WEIGHTS.length].weight,
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
        // Platform split — derived from active workspace channels
        const activeChannels = this.stateService.channelStrategy().filter(c => c.active);
        let platformSplit: PlatformAllocation[];
        if (activeChannels.length > 0) {
          const share = 1 / activeChannels.length;
          platformSplit = activeChannels.map(c => ({
            platform: c.platform,
            postsPerWeek: Math.max(1, Math.round(share * total)),
            rationale: c.role || `Strategy for ${c.platform}`,
          }));
        } else {
          platformSplit = [
            { platform: 'instagram', postsPerWeek: Math.max(1, Math.round(total * 0.45)), rationale: 'Highest reach; visual-first audience' },
            { platform: 'tiktok',    postsPerWeek: Math.max(1, Math.round(total * 0.30)), rationale: 'Top discovery channel for new followers' },
            { platform: 'youtube',   postsPerWeek: Math.max(1, Math.round(total * 0.15)), rationale: 'Long-form trust builder; SEO compounding' },
            { platform: 'facebook',  postsPerWeek: Math.max(1, Math.round(total * 0.10)), rationale: 'Community engagement and discussion' },
          ];
        }
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
