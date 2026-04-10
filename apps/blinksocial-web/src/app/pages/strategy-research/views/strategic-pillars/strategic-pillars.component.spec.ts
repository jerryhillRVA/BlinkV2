import { TestBed, ComponentFixture } from '@angular/core/testing';
import { StrategicPillarsComponent } from './strategic-pillars.component';
import { AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';
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
    TestBed.configureTestingModule({ imports: [StrategicPillarsComponent] });
    fixture = TestBed.createComponent(StrategicPillarsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (component.showAddForm()) component.cancelAdd();
    if (component.goalsDialogPillarId()) component.closeGoalsDialog();
    if (component.objectivesDialogPillarId()) component.closeObjectivesDialog();
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
    component.cancelAdd();
    expect(component.showAddForm()).toBe(false);
  });

  it('openEditModal preloads pillar data without touching goals/objectives', () => {
    const pillar = makePillar({
      goals: [{ id: 'g1', metric: 'X', target: 10, unit: '%', period: 'monthly', current: 2 }],
      objectiveIds: ['o1'],
    });
    component.openEditModal(pillar);
    expect(component.modalEditingId()).toBe('p-test');
    expect(component.newPillarName).toBe('Test Pillar');
    component.cancelAdd();
  });

  it('addPillar creates a new pillar with empty goals/objectives in create mode', () => {
    const before = component.pillars().length;
    component.openAddForm();
    component.newPillarName = 'New Pillar';
    component.newPillarDescription = 'desc';
    component.addPillar();
    expect(component.pillars().length).toBe(before + 1);
    const created = component.pillars().at(-1);
    expect(created?.goals).toEqual([]);
    expect(created?.objectiveIds).toEqual([]);
  });

  it('addPillar is a no-op when name is blank', () => {
    const before = component.pillars().length;
    component.openAddForm();
    component.newPillarName = '   ';
    component.addPillar();
    expect(component.pillars().length).toBe(before);
  });

  it('addPillar updates an existing pillar in edit mode and preserves goals/objectives', () => {
    const target = component.pillars()[0];
    component.pillars.update(list =>
      list.map(p => p.id === target.id
        ? { ...p, goals: [{ id: 'g1', metric: 'X', target: 10, unit: '%', period: 'monthly' }], objectiveIds: ['o1'] }
        : p),
    );
    component.openEditModal({ ...target, goals: [{ id: 'g1', metric: 'X', target: 10, unit: '%', period: 'monthly' }], objectiveIds: ['o1'] });
    component.newPillarName = 'Edited';
    component.addPillar();
    const updated = component.pillars().find(p => p.id === target.id);
    expect(updated?.name).toBe('Edited');
    expect(updated?.goals?.length).toBe(1);
    expect(updated?.objectiveIds).toEqual(['o1']);
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

  it('analyzeDistribution splits equally when no segments are selected', () => {
    vi.useFakeTimers();
    component.selectedSegmentIds.set(new Set());
    component.postsPerWeek.set(10);
    component.analyzeDistribution();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    const pcts = component.investmentPlan()?.pillarAllocations.map(a => a.percentage) ?? [];
    expect(pcts.length).toBeGreaterThan(0);
    const first = pcts[0];
    for (const p of pcts) expect(Math.abs(p - first)).toBeLessThanOrEqual(1);
    vi.useRealTimers();
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

  it('renders modal content when opened (covers Name/Description/Color fields)', () => {
    component.openAddForm();
    component.newPillarName = 'Pillar';
    component.newPillarDescription = 'Desc';
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

  // ── Manage Goals dialog ─────────────────────────────────────────────
  it('openGoalsDialog / closeGoalsDialog toggles the manage goals dialog', () => {
    const pillar = component.pillars()[0];
    component.openGoalsDialog(pillar);
    expect(component.goalsDialogPillarId()).toBe(pillar.id);
    expect(component.goalsDialogPillar()?.id).toBe(pillar.id);
    component.closeGoalsDialog();
    expect(component.goalsDialogPillarId()).toBeNull();
  });

  it('addQuickGoal appends a goal to the target pillar', () => {
    const pillar = component.pillars()[0];
    component.openGoalsDialog(pillar);
    component.quickGoalForm = { metric: 'Engagement', target: 5, unit: '%', period: 'monthly', current: 1 };
    component.addQuickGoal();
    const updated = component.pillars().find(p => p.id === pillar.id);
    expect(updated?.goals?.at(-1)?.metric).toBe('Engagement');
    expect(updated?.goals?.at(-1)?.target).toBe(5);
    expect(component.quickGoalForm.metric).toBe('');
    component.closeGoalsDialog();
  });

  it('addQuickGoal is a no-op without metric or target or when not open', () => {
    const pillar = component.pillars()[0];
    const before = pillar.goals?.length ?? 0;
    // Not open
    component.addQuickGoal();
    // Open with missing metric
    component.openGoalsDialog(pillar);
    component.quickGoalForm = { metric: '   ', target: 5, unit: '%', period: 'monthly', current: undefined };
    component.addQuickGoal();
    // Missing target
    component.quickGoalForm = { metric: 'X', target: null, unit: '%', period: 'monthly', current: undefined };
    component.addQuickGoal();
    // Zero target
    component.quickGoalForm = { metric: 'X', target: 0, unit: '%', period: 'monthly', current: undefined };
    component.addQuickGoal();
    const after = component.pillars().find(p => p.id === pillar.id)?.goals?.length ?? 0;
    expect(after).toBe(before);
    component.closeGoalsDialog();
  });

  it('addQuickGoal falls back to default unit when empty', () => {
    const pillar = component.pillars()[0];
    component.openGoalsDialog(pillar);
    component.quickGoalForm = { metric: 'X', target: 1, unit: '   ', period: 'monthly', current: undefined };
    component.addQuickGoal();
    expect(component.pillars().find(p => p.id === pillar.id)?.goals?.at(-1)?.unit).toBe('%');
    component.closeGoalsDialog();
  });

  it('updateQuickGoalPeriod patches the form period', () => {
    component.updateQuickGoalPeriod('yearly');
    expect(component.quickGoalForm.period).toBe('yearly');
  });

  it('removeGoalFromPillar removes a goal by id', () => {
    const pillar = component.pillars()[0];
    component.openGoalsDialog(pillar);
    component.quickGoalForm = { metric: 'Temp', target: 1, unit: '%', period: 'monthly', current: undefined };
    component.addQuickGoal();
    const goalId = component.pillars().find(p => p.id === pillar.id)?.goals?.at(-1)?.id ?? '';
    component.removeGoalFromPillar(pillar.id, goalId);
    expect(component.pillars().find(p => p.id === pillar.id)?.goals?.some(g => g.id === goalId)).toBe(false);
    component.closeGoalsDialog();
  });

  it('opens the goals dialog teleported to body', () => {
    const pillar = component.pillars()[0];
    component.openGoalsDialog(pillar);
    fixture.detectChanges();
    const modals = document.body.querySelectorAll('.app-modal');
    expect(modals.length).toBeGreaterThan(0);
    component.closeGoalsDialog();
    fixture.detectChanges();
  });

  // ── Link Objectives dialog ──────────────────────────────────────────
  it('openObjectivesDialog primes quickObjectiveIds from the pillar', () => {
    fixture.componentRef.setInput('linkedObjectives', [
      { id: 'o1', category: 'growth' as const, statement: 'Grow', target: 100, unit: 'f', timeframe: 'Q1', status: 'on-track' as const },
      { id: 'o2', category: 'engagement' as const, statement: 'Engage', target: 5, unit: '%', timeframe: 'Q2', status: 'on-track' as const },
    ]);
    fixture.detectChanges();
    const pillar: ContentPillar = { ...component.pillars()[0], objectiveIds: ['o1'] };
    component.openObjectivesDialog(pillar);
    expect(component.objectivesDialogPillarId()).toBe(pillar.id);
    expect(component.isQuickObjectiveLinked('o1')).toBe(true);
    expect(component.isQuickObjectiveLinked('o2')).toBe(false);
    component.closeObjectivesDialog();
    expect(component.objectivesDialogPillarId()).toBeNull();
  });

  it('toggleQuickObjective flips set membership', () => {
    const pillar = makePillar();
    component.openObjectivesDialog(pillar);
    component.toggleQuickObjective('new-obj');
    expect(component.isQuickObjectiveLinked('new-obj')).toBe(true);
    component.toggleQuickObjective('new-obj');
    expect(component.isQuickObjectiveLinked('new-obj')).toBe(false);
    component.closeObjectivesDialog();
  });

  it('saveQuickObjectives writes the draft ids onto the pillar and closes', () => {
    const pillar = component.pillars()[0];
    component.openObjectivesDialog(pillar);
    component.toggleQuickObjective('obj-x');
    component.toggleQuickObjective('obj-y');
    component.saveQuickObjectives();
    const updated = component.pillars().find(p => p.id === pillar.id);
    expect(updated?.objectiveIds).toEqual(expect.arrayContaining(['obj-x', 'obj-y']));
    expect(component.objectivesDialogPillarId()).toBeNull();
  });

  it('saveQuickObjectives is a no-op when no dialog is open', () => {
    const snapshot = JSON.stringify(component.pillars());
    component.saveQuickObjectives();
    expect(JSON.stringify(component.pillars())).toBe(snapshot);
  });

  it('linkedObjectivesFor filters parent objectives by the pillar ids', () => {
    fixture.componentRef.setInput('linkedObjectives', [
      { id: 'o1', category: 'growth' as const, statement: 'A', target: 1, unit: 'x', timeframe: 'Q1', status: 'on-track' as const },
      { id: 'o2', category: 'engagement' as const, statement: 'B', target: 1, unit: 'x', timeframe: 'Q1', status: 'on-track' as const },
    ]);
    fixture.detectChanges();
    expect(component.linkedObjectivesFor(makePillar({ objectiveIds: ['o2'] })).map(o => o.id)).toEqual(['o2']);
    expect(component.linkedObjectivesFor(makePillar({ objectiveIds: [] }))).toEqual([]);
    expect(component.linkedObjectivesFor(makePillar({ objectiveIds: undefined }))).toEqual([]);
  });
});
