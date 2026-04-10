import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { StrategicPillarsComponent } from './strategic-pillars.component';
import { StrategyResearchStateService } from '../../strategy-research-state.service';
import { AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';
import { DEFAULT_PILLARS, DEFAULT_SEGMENTS } from '../../strategy-research.mock-data';
import type { ContentPillar, PillarGoal } from '../../strategy-research.types';

function makePillar(overrides: Partial<ContentPillar> = {}): ContentPillar {
  return {
    id: 'p-test',
    name: 'Test Pillar',
    description: 'Desc',
    color: '#abcdef',
    goals: [],
    objectiveIds: [],
    ...overrides,
  };
}

describe('StrategicPillarsComponent', () => {
  let fixture: ComponentFixture<StrategicPillarsComponent>;
  let component: StrategicPillarsComponent;

  beforeEach(() => {
    const mockStateService = {
      pillars: signal([...DEFAULT_PILLARS]),
      segments: signal([...DEFAULT_SEGMENTS]),
      objectives: signal([]),
      channelStrategy: signal([]),
      audienceInsights: signal([]),
      savePillars: vi.fn(),
      saveSegments: vi.fn(),
      saveChannelStrategy: vi.fn(),
      saveAudienceInsights: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [StrategicPillarsComponent],
      providers: [{ provide: StrategyResearchStateService, useValue: mockStateService }],
    });
    fixture = TestBed.createComponent(StrategicPillarsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (component.showAddForm()) component.cancelAdd();
    fixture.destroy();
    document.body.style.overflow = '';
  });

  it('should create with default pillars and segments', () => {
    expect(component).toBeTruthy();
    expect(component.pillars().length).toBeGreaterThan(0);
    expect(component.audienceSegments().length).toBeGreaterThan(0);
  });

  it('toggleSegment flips selection', () => {
    const id = component.audienceSegments()[0].id;
    expect(component.isSegmentSelected(id)).toBe(true);
    component.toggleSegment(id);
    expect(component.isSegmentSelected(id)).toBe(false);
    component.toggleSegment(id);
    expect(component.isSegmentSelected(id)).toBe(true);
  });

  it('getPillarById returns matching pillar or undefined', () => {
    const id = component.pillars()[0].id;
    expect(component.getPillarById(id)?.id).toBe(id);
    expect(component.getPillarById('missing')).toBeUndefined();
  });

  it('openAddForm initializes blank state and opens modal', () => {
    component.openAddForm();
    expect(component.showAddForm()).toBe(true);
    expect(component.modalEditingId()).toBeNull();
    expect(component.newPillarName).toBe('');
    expect(component.newGoals().length).toBe(0);
    component.cancelAdd();
    expect(component.showAddForm()).toBe(false);
  });

  it('openEditModal preloads pillar data and saves goal ids', () => {
    const pillar = makePillar({
      goals: [{ id: 'g1', metric: 'X', target: 10, unit: '%', period: 'monthly' }],
      objectiveIds: ['o1'],
    });
    component.openEditModal(pillar);
    expect(component.modalEditingId()).toBe('p-test');
    expect(component.newPillarName).toBe('Test Pillar');
    expect(component.isObjectiveLinked('o1')).toBe(true);
    expect(component.isGoalSaved('g1')).toBe(true);
    component.cancelAdd();
  });

  it('openEditModalAddGoal opens edit modal with a new draft goal', () => {
    const pillar = makePillar();
    component.openEditModalAddGoal(pillar);
    expect(component.showAddForm()).toBe(true);
    expect(component.newGoals().length).toBe(1);
    expect(component.hasDraftGoal()).toBe(true);
    component.cancelAdd();
  });

  it('toggleLinkedObjective adds and removes id', () => {
    component.toggleLinkedObjective('obj-1');
    expect(component.isObjectiveLinked('obj-1')).toBe(true);
    component.toggleLinkedObjective('obj-1');
    expect(component.isObjectiveLinked('obj-1')).toBe(false);
  });

  it('addGoal appends a draft goal and removeGoal drops it', () => {
    component.addGoal();
    const goal = component.newGoals()[0];
    expect(goal.unit).toBe('%');
    component.removeGoal(goal.id);
    expect(component.newGoals().length).toBe(0);
  });

  it('saveGoal marks the draft as saved', () => {
    component.addGoal();
    const id = component.newGoals()[0].id;
    expect(component.isGoalSaved(id)).toBe(false);
    component.saveGoal(id);
    expect(component.isGoalSaved(id)).toBe(true);
    expect(component.hasDraftGoal()).toBe(false);
  });

  it('updateGoalPeriod patches the goal period and leaves siblings alone', () => {
    component.addGoal();
    component.addGoal();
    const id = component.newGoals()[0].id;
    component.updateGoalPeriod(id, 'yearly');
    expect(component.newGoals()[0].period).toBe('yearly');
    expect(component.newGoals()[1].period).toBe('monthly');
  });

  it('suggestGoals appends two pre-saved goals after timer', () => {
    vi.useFakeTimers();
    component.suggestGoals();
    expect(component.isSuggestingGoals()).toBe(true);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.isSuggestingGoals()).toBe(false);
    expect(component.newGoals().length).toBe(2);
    expect(component.hasDraftGoal()).toBe(false);
    vi.useRealTimers();
  });

  it('addPillar creates a new pillar in create mode', () => {
    const before = component.pillars().length;
    component.openAddForm();
    component.newPillarName = 'New Pillar';
    component.newPillarDescription = 'desc';
    component.addPillar();
    expect(component.pillars().length).toBe(before + 1);
    expect(component.showAddForm()).toBe(false);
  });

  it('addPillar is a no-op when name is blank', () => {
    const before = component.pillars().length;
    component.openAddForm();
    component.newPillarName = '   ';
    component.addPillar();
    expect(component.pillars().length).toBe(before);
  });

  it('addPillar updates an existing pillar in edit mode', () => {
    const target = component.pillars()[0];
    component.openEditModal(target);
    component.newPillarName = 'Edited';
    component.addPillar();
    const updated = component.pillars().find(p => p.id === target.id);
    expect(updated?.name).toBe('Edited');
    expect(component.modalEditingId()).toBeNull();
  });

  it('addPillar drops draft goals with empty metric', () => {
    component.openAddForm();
    component.newPillarName = 'X';
    component.addGoal(); // metric is ''
    component.addPillar();
    const created = component.pillars().at(-1);
    expect(created?.goals?.length).toBe(0);
  });

  it('startEdit / saveEdit / cancelEdit on a pillar inline', () => {
    const target = component.pillars()[0];
    component.startEdit(target);
    expect(component.editingId()).toBe(target.id);
    component.editName = 'Renamed';
    component.editDescription = 'New';
    component.editColor = '#000';
    component.saveEdit(target.id);
    expect(component.pillars().find(p => p.id === target.id)?.name).toBe('Renamed');
    component.startEdit(target);
    component.cancelEdit();
    expect(component.editingId()).toBeNull();
  });

  it('deletePillar removes the pillar', () => {
    const id = component.pillars()[0].id;
    component.deletePillar(id);
    expect(component.pillars().find(p => p.id === id)).toBeUndefined();
  });

  it('getGoalProgress handles missing/zero values and clamps to 100', () => {
    const partial: PillarGoal = { id: 'g', metric: '', target: 10, unit: '', period: 'monthly', current: 5 };
    expect(component.getGoalProgress(partial)).toBe(50);
    expect(component.getGoalProgress({ ...partial, current: 100 })).toBe(100);
    expect(component.getGoalProgress({ ...partial, target: 0 })).toBe(0);
    expect(component.getGoalProgress({ ...partial, current: undefined })).toBe(0);
  });

  it('analyzeDistribution is a no-op when postsPerWeek is invalid', () => {
    component.postsPerWeek.set(null);
    component.analyzeDistribution();
    expect(component.investmentPlan()).toBeNull();
    component.postsPerWeek.set(0);
    component.analyzeDistribution();
    expect(component.investmentPlan()).toBeNull();
  });

  it('analyzeDistribution populates investment plan after timer', () => {
    vi.useFakeTimers();
    component.postsPerWeek.set(10);
    component.analyzeDistribution();
    expect(component.isAnalyzing()).toBe(true);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.isAnalyzing()).toBe(false);
    const plan = component.investmentPlan();
    expect(plan).toBeTruthy();
    expect(plan?.pillarAllocations.length).toBe(component.pillars().length);
    expect(plan?.platformAllocations.length).toBe(4);
    expect(plan?.quickWins.length).toBeGreaterThan(0);
    vi.useRealTimers();
  });

  it('renders header and add pillar button', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.page-header-title')?.textContent).toContain('Content Pillars');
    expect(el.querySelector('.btn-add')).toBeTruthy();
  });

  it('clicking add button opens the modal (teleported to body)', () => {
    const btn = (fixture.nativeElement as HTMLElement).querySelector('.btn-add') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    expect(component.showAddForm()).toBe(true);
    expect(document.body.querySelector('.app-modal')).toBeTruthy();
    component.cancelAdd();
    fixture.detectChanges();
  });

  it('renders modal content when opened (covers template bindings)', () => {
    component.openAddForm();
    component.newPillarName = 'Pillar';
    component.newPillarDescription = 'Desc';
    component.toggleLinkedObjective('o1');
    component.addGoal();
    fixture.detectChanges();
    const modal = document.body.querySelector('.app-modal') as HTMLElement;
    expect(modal).toBeTruthy();
    expect(modal.querySelector('.modal-title')?.textContent).toContain('New Content Pillar');
    expect(modal.querySelector('.field-input')).toBeTruthy();
    expect(modal.querySelectorAll('.color-swatch').length).toBeGreaterThan(0);
    component.cancelAdd();
    fixture.detectChanges();
  });

  it('modal title flips to Edit Pillar in edit mode', () => {
    const target = component.pillars()[0];
    component.openEditModal(target);
    fixture.detectChanges();
    const modal = document.body.querySelector('.app-modal') as HTMLElement;
    expect(modal.querySelector('.modal-title')?.textContent).toContain('Edit Pillar');
    component.cancelAdd();
    fixture.detectChanges();
  });

  it('renders distribution results after analyze', () => {
    vi.useFakeTimers();
    component.postsPerWeek.set(10);
    component.analyzeDistribution();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.distribution-results')).toBeTruthy();
    expect(el.querySelectorAll('.alloc-row').length).toBeGreaterThan(0);
    expect(el.querySelectorAll('.platform-row').length).toBe(4);
    expect(el.querySelectorAll('.quick-win').length).toBeGreaterThan(0);
    vi.useRealTimers();
  });

  it('destroys cleanly while modal is open', () => {
    component.openAddForm();
    fixture.detectChanges();
    fixture.destroy();
    expect(document.body.style.overflow).toBe('');
  });

  it('accepts linkedObjectives input from parent', () => {
    fixture.componentRef.setInput('linkedObjectives', [
      { id: 'o1', category: 'growth' as const, statement: 'Grow', target: 1000, unit: 'followers', timeframe: 'Q1', status: 'on-track' as const },
    ]);
    fixture.detectChanges();
    expect(component.linkedObjectives().length).toBe(1);
  });

  it('analyzeDistribution handles >5 pillars (modulo wrap)', () => {
    vi.useFakeTimers();
    component.pillars.update(list => [
      ...list,
      { id: 'p-extra', name: 'Extra', description: 'd', color: '#000', goals: [], objectiveIds: [] },
    ]);
    component.postsPerWeek.set(20);
    component.analyzeDistribution();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.investmentPlan()?.pillarAllocations.length).toBe(component.pillars().length);
    vi.useRealTimers();
  });

  it('openEditModal handles missing goals/objectiveIds via fallback', () => {
    component.openEditModal({ id: 'p', name: 'X', description: '', color: '#000' });
    expect(component.newGoals().length).toBe(0);
    expect(component.newLinkedObjectiveIds().size).toBe(0);
    component.cancelAdd();
  });

  // ── Goals Dialog tests ─────────────────────────────────────────
  it('openGoalsDialog sets goalsDialogPillarId', () => {
    const pillar = makePillar();
    component.openGoalsDialog(pillar);
    expect(component.goalsDialogPillarId()).toBe('p-test');
    component.closeGoalsDialog();
  });

  it('closeGoalsDialog clears goalsDialogPillarId and resets quickGoalForm', () => {
    const pillar = makePillar();
    component.openGoalsDialog(pillar);
    component.quickGoalForm.metric = 'Test';
    component.closeGoalsDialog();
    expect(component.goalsDialogPillarId()).toBeNull();
    expect(component.quickGoalForm.metric).toBe('');
  });

  it('goalsDialogPillar returns the matching pillar or undefined', () => {
    expect(component.goalsDialogPillar()).toBeUndefined();
    const pillar = component.pillars()[0];
    component.openGoalsDialog(pillar);
    expect(component.goalsDialogPillar()?.id).toBe(pillar.id);
    component.closeGoalsDialog();
  });

  it('addQuickGoal adds a goal to the pillar and saves via state service', () => {
    const stateService = TestBed.inject(StrategyResearchStateService);
    const pillar = component.pillars()[0];
    component.openGoalsDialog(pillar);
    component.quickGoalForm = { metric: 'Engagement', target: 10, unit: '%', period: 'monthly', current: 5 };
    component.addQuickGoal();
    fixture.detectChanges();
    const updated = component.pillars().find(p => p.id === pillar.id);
    expect(updated?.goals?.some(g => g.metric === 'Engagement')).toBe(true);
    expect(stateService.savePillars).toHaveBeenCalled();
    component.closeGoalsDialog();
  });

  it('addQuickGoal is a no-op when metric is empty or target is invalid', () => {
    const pillar = component.pillars()[0];
    const goalsBefore = pillar.goals?.length ?? 0;
    component.openGoalsDialog(pillar);
    component.quickGoalForm = { metric: '', target: 10, unit: '%', period: 'monthly', current: undefined };
    component.addQuickGoal();
    expect(component.pillars().find(p => p.id === pillar.id)?.goals?.length ?? 0).toBe(goalsBefore);
    component.quickGoalForm = { metric: 'X', target: null, unit: '%', period: 'monthly', current: undefined };
    component.addQuickGoal();
    expect(component.pillars().find(p => p.id === pillar.id)?.goals?.length ?? 0).toBe(goalsBefore);
    component.quickGoalForm = { metric: 'X', target: 0, unit: '%', period: 'monthly', current: undefined };
    component.addQuickGoal();
    expect(component.pillars().find(p => p.id === pillar.id)?.goals?.length ?? 0).toBe(goalsBefore);
    component.closeGoalsDialog();
  });

  it('removeGoalFromPillar removes a goal and saves via state service', () => {
    const stateService = TestBed.inject(StrategyResearchStateService);
    const pillar = component.pillars()[0];
    component.openGoalsDialog(pillar);
    component.quickGoalForm = { metric: 'ToRemove', target: 5, unit: '%', period: 'monthly', current: 0 };
    component.addQuickGoal();
    const addedGoal = component.pillars().find(p => p.id === pillar.id)!.goals!.find(g => g.metric === 'ToRemove')!;
    component.removeGoalFromPillar(pillar.id, addedGoal.id);
    expect(component.pillars().find(p => p.id === pillar.id)?.goals?.find(g => g.id === addedGoal.id)).toBeUndefined();
    expect(stateService.savePillars).toHaveBeenCalled();
    component.closeGoalsDialog();
  });

  it('updateQuickGoalPeriod updates the period on quickGoalForm', () => {
    component.updateQuickGoalPeriod('yearly');
    expect(component.quickGoalForm.period).toBe('yearly');
  });

  // ── Objectives Dialog tests ──────────────────────────────────────
  it('openObjectivesDialog sets objectivesDialogPillarId and populates quickObjectiveIds', () => {
    const pillar = makePillar({ objectiveIds: ['o1', 'o2'] });
    component.openObjectivesDialog(pillar);
    expect(component.objectivesDialogPillarId()).toBe('p-test');
    expect(component.isQuickObjectiveLinked('o1')).toBe(true);
    expect(component.isQuickObjectiveLinked('o2')).toBe(true);
    component.closeObjectivesDialog();
  });

  it('closeObjectivesDialog clears objectivesDialogPillarId', () => {
    const pillar = makePillar();
    component.openObjectivesDialog(pillar);
    component.closeObjectivesDialog();
    expect(component.objectivesDialogPillarId()).toBeNull();
  });

  it('toggleQuickObjective toggles an ID in the set', () => {
    expect(component.isQuickObjectiveLinked('o1')).toBe(false);
    component.toggleQuickObjective('o1');
    expect(component.isQuickObjectiveLinked('o1')).toBe(true);
    component.toggleQuickObjective('o1');
    expect(component.isQuickObjectiveLinked('o1')).toBe(false);
  });

  it('saveQuickObjectives updates pillar objectiveIds and saves via state service', () => {
    const stateService = TestBed.inject(StrategyResearchStateService);
    const pillar = component.pillars()[0];
    component.openObjectivesDialog(pillar);
    component.toggleQuickObjective('o1');
    component.toggleQuickObjective('o2');
    component.saveQuickObjectives();
    const updated = component.pillars().find(p => p.id === pillar.id);
    expect(updated?.objectiveIds).toContain('o1');
    expect(updated?.objectiveIds).toContain('o2');
    expect(stateService.savePillars).toHaveBeenCalled();
    expect(component.objectivesDialogPillarId()).toBeNull();
  });

  it('saveQuickObjectives is a no-op when no pillar is selected', () => {
    const stateService = TestBed.inject(StrategyResearchStateService);
    const callsBefore = (stateService.savePillars as ReturnType<typeof vi.fn>).mock.calls.length;
    component.saveQuickObjectives();
    expect((stateService.savePillars as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsBefore);
  });

  it('linkedObjectivesFor returns matching objectives', () => {
    fixture.componentRef.setInput('linkedObjectives', [
      { id: 'o1', category: 'growth' as const, statement: 'Grow', target: 1000, unit: 'followers', timeframe: 'Q1', status: 'on-track' as const },
      { id: 'o2', category: 'engagement' as const, statement: 'Engage', target: 500, unit: 'likes', timeframe: 'Q1', status: 'on-track' as const },
      { id: 'o3', category: 'revenue' as const, statement: 'Revenue', target: 100, unit: '$', timeframe: 'Q2', status: 'on-track' as const },
    ]);
    fixture.detectChanges();
    const pillar = makePillar({ objectiveIds: ['o1', 'o3'] });
    const result = component.linkedObjectivesFor(pillar);
    expect(result.length).toBe(2);
    expect(result.map(o => o.id)).toEqual(['o1', 'o3']);
  });

  it('linkedObjectivesFor returns empty array when pillar has no objectiveIds', () => {
    const pillar = makePillar({ objectiveIds: undefined });
    expect(component.linkedObjectivesFor(pillar)).toEqual([]);
  });

  it('renders pillar cards with goals and progress bars', () => {
    component.pillars.update(list => list.map((p, i) => i === 0
      ? { ...p, goals: [{ id: 'g1', metric: 'X', target: 10, unit: '%', period: 'monthly', current: 5 }] }
      : p,
    ));
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.pillar-card').length).toBeGreaterThan(0);
    expect(el.querySelector('.progress-fill')).toBeTruthy();
  });
});
