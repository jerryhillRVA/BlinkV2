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
    component.addContentType(id, 'awareness'); // newContentType[key] is undefined
    component.addHookAngle(id, 'awareness'); // newHookAngle[key] is undefined
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

  it('analyzeAudience populates insights for a known segment', () => {
    vi.useFakeTimers();
    const id = component.segments()[0].id;
    component.selectedAnalyzeId.set(id);
    component.analyzeAudience();
    expect(component.isAnalyzing()).toBe(true);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.isAnalyzing()).toBe(false);
    expect(component.currentInsight()).toBeTruthy();
    expect(component.currentSegmentName()).toBeTruthy();
    vi.useRealTimers();
  });

  it('analyzeAudience is a no-op when no segment is selected', () => {
    component.selectedAnalyzeId.set('');
    component.analyzeAudience();
    expect(component.isAnalyzing()).toBe(false);
  });

  it('analyzeAudience falls back for unknown segment id', () => {
    vi.useFakeTimers();
    component.addSegment();
    const newId = component.segments().at(-1)?.id ?? '';
    component.selectedAnalyzeId.set(newId);
    component.analyzeAudience();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.currentInsight()?.segmentId).toBe(newId);
    vi.useRealTimers();
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

  it('renders journey stages, modal, and analyzer states (template coverage)', () => {
    vi.useFakeTimers();
    // Expand all segments
    for (const seg of component.segments()) {
      component.toggleJourney(seg.id);
    }
    // Map a journey to populate stage data
    const id = component.segments()[0].id;
    component.mapJourney(id);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    // Run analyzer
    component.selectedAnalyzeId.set(id);
    component.analyzeAudience();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    // Put first segment into inline edit mode so the edit form renders
    component.startEdit(component.segments()[0]);
    fixture.detectChanges();
    // Open modal
    component.openAddSegmentModal();
    component.newSegmentName = 'X';
    component.newSegmentDescription = 'Y';
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.stage-card').length).toBeGreaterThan(0);
    expect(el.querySelector('.insights-grid')).toBeTruthy();
    expect(document.body.querySelector('.app-modal')).toBeTruthy();
    component.cancelAddSegment();
    component.cancelEdit();
    fixture.detectChanges();
    vi.useRealTimers();
  });

  it('renders analyzer empty and loading states', () => {
    vi.useFakeTimers();
    let el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.analyzer-empty')).toBeTruthy();
    component.selectedAnalyzeId.set(component.segments()[0].id);
    component.analyzeAudience();
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.analyzer-loading')).toBeTruthy();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.insights-grid')).toBeTruthy();
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

  it('currentSegmentName falls back to empty for unknown id', () => {
    component.selectedAnalyzeId.set('nonexistent');
    expect(component.currentSegmentName()).toBe('');
  });

  it('exercises null/fallback branches across helpers', () => {
    // segmentOptions: empty-name segment uses "Untitled segment" label
    component.addSegment();
    expect(component.segmentOptions().some(o => o.label === 'Untitled segment')).toBe(true);
    // updateStage on a segment without journeyStages no-ops gracefully
    component.segments.update(list => [
      ...list,
      { id: 'no-stages', name: 'NS', description: 'd' },
    ]);
    component.setStageGoal('no-stages', 'awareness', 'X');
    // addContentType / addHookAngle on segment without journeyStages
    component.newContentType['no-stages:awareness:type'] = 'X';
    component.addContentType('no-stages', 'awareness');
    component.newHookAngle['no-stages:awareness:hook'] = 'Y';
    component.addHookAngle('no-stages', 'awareness');
    // removeContentType / removeHookAngle on segment without journeyStages
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
