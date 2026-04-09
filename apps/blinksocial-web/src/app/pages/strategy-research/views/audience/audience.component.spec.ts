import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AudienceComponent } from './audience.component';
import { AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';

describe('AudienceComponent', () => {
  let fixture: ComponentFixture<AudienceComponent>;
  let component: AudienceComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AudienceComponent] });
    fixture = TestBed.createComponent(AudienceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (component.showAddForm()) component.cancelAddSegment();
    fixture.destroy();
    document.body.style.overflow = '';
  });

  it('should create with default segments', () => {
    expect(component).toBeTruthy();
    expect(component.segments().length).toBeGreaterThan(0);
  });

  it('toggleJourney expands and collapses a segment', () => {
    const id = component.segments()[0].id;
    expect(component.isExpanded(id)).toBe(false);
    component.toggleJourney(id);
    expect(component.isExpanded(id)).toBe(true);
    component.toggleJourney(id);
    expect(component.isExpanded(id)).toBe(false);
  });

  it('startEdit / saveEdit / cancelEdit cycle', () => {
    const target = component.segments()[0];
    component.startEdit(target);
    expect(component.editingId()).toBe(target.id);
    component.editName = 'Renamed';
    component.editDescription = 'New desc';
    component.saveEdit(target.id);
    expect(component.segments().find(s => s.id === target.id)?.name).toBe('Renamed');
    component.startEdit(target);
    component.cancelEdit();
    expect(component.editingId()).toBeNull();
  });

  it('deleteSegment removes the segment', () => {
    const id = component.segments()[0].id;
    component.deleteSegment(id);
    expect(component.segments().find(s => s.id === id)).toBeUndefined();
  });

  it('addSegment appends a blank segment in inline edit mode', () => {
    const before = component.segments().length;
    component.addSegment();
    expect(component.segments().length).toBe(before + 1);
    expect(component.editingId()).toBeTruthy();
  });

  it('openAddSegmentModal / cancelAddSegment toggles modal', () => {
    component.openAddSegmentModal();
    expect(component.showAddForm()).toBe(true);
    component.cancelAddSegment();
    expect(component.showAddForm()).toBe(false);
  });

  it('createSegment adds a segment from modal state', () => {
    component.openAddSegmentModal();
    const before = component.segments().length;
    component.newSegmentName = 'Modal Segment';
    component.newSegmentDescription = 'desc';
    component.createSegment();
    expect(component.segments().length).toBe(before + 1);
    expect(component.showAddForm()).toBe(false);
    expect(component.segments().at(-1)?.name).toBe('Modal Segment');
  });

  it('createSegment is a no-op when name is blank', () => {
    component.openAddSegmentModal();
    component.newSegmentName = '   ';
    const before = component.segments().length;
    component.createSegment();
    expect(component.segments().length).toBe(before);
  });

  it('mapJourney populates stage data and auto-expands', () => {
    vi.useFakeTimers();
    const id = component.segments()[0].id;
    component.mapJourney(id);
    expect(component.mappingSegmentId()).toBe(id);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.mappingSegmentId()).toBeNull();
    expect(component.isExpanded(id)).toBe(true);
    const seg = component.segments().find(s => s.id === id);
    expect(seg?.journeyStages?.[0].primaryGoal).toContain('Introduce');
    expect(seg?.journeyStages?.[0].contentTypes.length).toBeGreaterThan(0);
    vi.useRealTimers();
  });

  it('hasJourney is false before mapping and true after', () => {
    vi.useFakeTimers();
    const seg = component.segments()[0];
    expect(component.hasJourney(seg)).toBe(false);
    component.mapJourney(seg.id);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    const after = component.segments().find(s => s.id === seg.id)!;
    expect(component.hasJourney(after)).toBe(true);
    expect(component.hasJourney({ id: 'x', name: '', description: '' })).toBe(false);
    vi.useRealTimers();
  });

  it('getStage returns matching stage or undefined', () => {
    const seg = component.segments()[0];
    expect(component.getStage(seg, 'awareness')?.stage).toBe('awareness');
    expect(component.getStage({ id: 'x', name: '', description: '' }, 'awareness')).toBeUndefined();
  });

  it('stage helpers update content types and hook angles', () => {
    const id = component.segments()[0].id;
    component.newContentType[`${id}:awareness:type`] = 'New Type';
    component.addContentType(id, 'awareness');
    expect(component.getStage(component.segments().find(s => s.id === id)!, 'awareness')?.contentTypes).toContain('New Type');
    component.removeContentType(id, 'awareness', 'New Type');
    expect(component.getStage(component.segments().find(s => s.id === id)!, 'awareness')?.contentTypes).not.toContain('New Type');

    component.newHookAngle[`${id}:awareness:hook`] = 'New Hook';
    component.addHookAngle(id, 'awareness');
    expect(component.getStage(component.segments().find(s => s.id === id)!, 'awareness')?.hookAngles).toContain('New Hook');
    component.removeHookAngle(id, 'awareness', 'New Hook');
    expect(component.getStage(component.segments().find(s => s.id === id)!, 'awareness')?.hookAngles).not.toContain('New Hook');
  });

  it('addContentType / addHookAngle no-op when no input set (?? fallback)', () => {
    const id = component.segments()[0].id;
    component.addContentType(id, 'awareness');
    component.addHookAngle(id, 'awareness');
  });

  it('addContentType and addHookAngle ignore empty input', () => {
    const id = component.segments()[0].id;
    const before = component.getStage(component.segments().find(s => s.id === id)!, 'awareness')?.contentTypes.length ?? 0;
    component.newContentType[`${id}:awareness:type`] = '   ';
    component.addContentType(id, 'awareness');
    component.newHookAngle[`${id}:awareness:hook`] = '';
    component.addHookAngle(id, 'awareness');
    const after = component.getStage(component.segments().find(s => s.id === id)!, 'awareness')?.contentTypes.length ?? 0;
    expect(after).toBe(before);
  });

  it('setStageGoal and setStageMetric update the right fields', () => {
    const id = component.segments()[0].id;
    component.setStageGoal(id, 'awareness', 'Goal!');
    component.setStageMetric(id, 'awareness', 'Metric!');
    const seg = component.segments().find(s => s.id === id);
    const stage = seg?.journeyStages?.find(j => j.stage === 'awareness');
    expect(stage?.primaryGoal).toBe('Goal!');
    expect(stage?.successMetric).toBe('Metric!');
  });

  // ── Per-card AI Audience Analyzer ──────────────────────────────────
  it('analyzeForSegment populates insights and auto-expands', () => {
    vi.useFakeTimers();
    const id = component.segments()[0].id;
    component.analyzeForSegment(id);
    expect(component.isAnalyzingSegment(id)).toBe(true);
    expect(component.isInsightsExpanded(id)).toBe(true);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.isAnalyzingSegment(id)).toBe(false);
    expect(component.insightFor(id)).toBeTruthy();
    vi.useRealTimers();
  });

  it('analyzeForSegment falls back for unknown segment id', () => {
    vi.useFakeTimers();
    component.addSegment();
    const newId = component.segments().at(-1)?.id ?? '';
    component.analyzeForSegment(newId);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.insightFor(newId)?.segmentId).toBe(newId);
    vi.useRealTimers();
  });

  it('analyzeForSegment supports concurrent per-card runs', () => {
    vi.useFakeTimers();
    const a = component.segments()[0].id;
    const b = component.segments()[1].id;
    component.analyzeForSegment(a);
    component.analyzeForSegment(b);
    expect(component.isAnalyzingSegment(b)).toBe(true);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.insightFor(a)).toBeTruthy();
    expect(component.insightFor(b)).toBeTruthy();
    expect(component.analyzingSegmentId()).toBeNull();
    vi.useRealTimers();
  });

  it('toggleInsights flips expanded state', () => {
    const id = component.segments()[0].id;
    expect(component.isInsightsExpanded(id)).toBe(false);
    component.toggleInsights(id);
    expect(component.isInsightsExpanded(id)).toBe(true);
    component.toggleInsights(id);
    expect(component.isInsightsExpanded(id)).toBe(false);
  });

  it('insightFor returns undefined before analysis', () => {
    const id = component.segments()[0].id;
    expect(component.insightFor(id)).toBeUndefined();
  });

  it('engagementClass maps levels', () => {
    expect(component.engagementClass('Very High')).toBe('engagement--very-high');
    expect(component.engagementClass('High')).toBe('engagement--high');
    expect(component.engagementClass('Low')).toBe('engagement--medium');
  });

  it('renders header and segments grid', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.page-header-title')?.textContent).toContain('Audience Segments');
    expect(el.querySelectorAll('.segment-card').length).toBeGreaterThan(0);
  });

  it('renders a per-card AI Analyze button and populates insights on click', () => {
    vi.useFakeTimers();
    const btn = (fixture.nativeElement as HTMLElement).querySelector('.btn-ai-analyze') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    btn.click();
    fixture.detectChanges();
    expect(component.analyzingSegmentId()).toBeTruthy();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.insights-expanded')).toBeTruthy();
    expect(el.querySelectorAll('.insight-title').length).toBeGreaterThan(0);
    vi.useRealTimers();
  });

  it('renders segment cards with mapped journey stages (template coverage)', () => {
    vi.useFakeTimers();
    for (const seg of component.segments()) component.toggleJourney(seg.id);
    const id = component.segments()[0].id;
    component.mapJourney(id);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    component.startEdit(component.segments()[0]);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.stage-card').length).toBeGreaterThan(0);
    component.cancelEdit();
    fixture.detectChanges();
    vi.useRealTimers();
  });

  it('renders journey stages and exercises stage chip remove buttons', () => {
    vi.useFakeTimers();
    const id = component.segments()[0].id;
    component.toggleJourney(id);
    component.mapJourney(id);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const removes = el.querySelectorAll('.stage-chip-remove');
    expect(removes.length).toBeGreaterThan(0);
    (removes[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    vi.useRealTimers();
  });

  it('mapJourney uses "this audience" fallback when segment name is blank', () => {
    vi.useFakeTimers();
    component.addSegment();
    const newId = component.segments().at(-1)?.id ?? '';
    component.mapJourney(newId);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    const seg = component.segments().find(s => s.id === newId);
    expect(seg?.journeyStages?.[0].primaryGoal).toContain('this audience');
    vi.useRealTimers();
  });

  it('exercises null/fallback branches across helpers', () => {
    component.segments.update(list => [
      ...list,
      { id: 'no-stages', name: 'NS', description: 'd' },
    ]);
    component.setStageGoal('no-stages', 'awareness', 'X');
    component.newContentType['no-stages:awareness:type'] = 'X';
    component.addContentType('no-stages', 'awareness');
    component.newHookAngle['no-stages:awareness:hook'] = 'Y';
    component.addHookAngle('no-stages', 'awareness');
    component.removeContentType('no-stages', 'awareness', 'X');
    component.removeHookAngle('no-stages', 'awareness', 'Y');
  });

  it('Add Segment button opens the modal', () => {
    const btn = (fixture.nativeElement as HTMLElement).querySelector('.btn-add') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    expect(component.showAddForm()).toBe(true);
    expect(document.body.querySelector('.app-modal')).toBeTruthy();
    component.cancelAddSegment();
  });
});
