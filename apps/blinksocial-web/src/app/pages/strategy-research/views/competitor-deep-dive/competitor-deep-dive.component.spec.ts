import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CompetitorDeepDiveComponent } from './competitor-deep-dive.component';
import { StrategyResearchStateService } from '../../strategy-research-state.service';
import { AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';
import { MOCK_COMPETITOR_INSIGHTS } from '../../strategy-research.mock-data';
import type { CompetitorInsight } from '../../strategy-research.types';

describe('CompetitorDeepDiveComponent', () => {
  let component: CompetitorDeepDiveComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<CompetitorDeepDiveComponent>>;
  let nativeElement: HTMLElement;
  let mockCompetitorInsights: ReturnType<typeof signal<CompetitorInsight[]>>;

  beforeEach(async () => {
    vi.useFakeTimers();
    mockCompetitorInsights = signal<CompetitorInsight[]>([...MOCK_COMPETITOR_INSIGHTS]);
    const mockStateService = {
      competitorInsights: mockCompetitorInsights,
      brandVoice: signal({
        missionStatement: '',
        voiceAttributes: [],
        toneByContext: [],
        platformToneAdjustments: [],
        vocabulary: { preferred: [], avoid: [] },
      }),
      objectives: signal([]),
      pillars: signal([]),
      segments: signal([]),
      channelStrategy: signal([]),
      contentMix: signal([]),
      researchSources: signal([]),
      audienceInsights: signal([]),
      loading: signal(false),
      saving: signal(false),
      workspaceId: signal('test-workspace'),
      saveCompetitorInsights: vi.fn((data: CompetitorInsight[]) => { mockCompetitorInsights.set(data); }),
      loadAll: vi.fn(),
      isDirty: signal(false),
    };
    await TestBed.configureTestingModule({
      imports: [CompetitorDeepDiveComponent],
      providers: [
        { provide: StrategyResearchStateService, useValue: mockStateService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CompetitorDeepDiveComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates with seeded competitors', () => {
    expect(component).toBeTruthy();
    expect(component.competitors().length).toBeGreaterThan(0);
    expect(nativeElement.querySelectorAll('.competitor-card').length).toBeGreaterThan(0);
  });

  it('renders header CTAs', () => {
    expect(nativeElement.querySelector('.btn-refresh-all')).toBeTruthy();
    expect(nativeElement.querySelector('.btn-find-competitors')).toBeTruthy();
    expect(nativeElement.querySelector('.btn-add')).toBeTruthy();
  });

  it('renders the AI Insight box on every card without expansion', () => {
    const boxes = nativeElement.querySelectorAll('.ai-insight-box');
    expect(boxes.length).toBe(component.competitors().length);
  });

  // ── Helpers ──────────────────────────────────────────────
  it('getRelevancyClass maps levels', () => {
    expect(component.getRelevancyClass('Very High')).toBe('relevancy--very-high');
    expect(component.getRelevancyClass('High')).toBe('relevancy--high');
    expect(component.getRelevancyClass('Medium')).toBe('relevancy--medium');
    expect(component.getRelevancyClass('Low')).toBe('');
  });

  it('engagementClass maps levels', () => {
    expect(component.engagementClass('Very High')).toBe('engagement--very-high');
    expect(component.engagementClass('High')).toBe('engagement--high');
    expect(component.engagementClass('Other')).toBe('engagement--medium');
  });

  it('formatDate produces a readable string', () => {
    expect(component.formatDate('2026-04-01T12:00:00.000Z')).toContain('2026');
  });

  it('platformLabels exposes the constant map', () => {
    expect(component.platformLabels['instagram']).toBe('Instagram');
  });

  // ── Find Competitors ─────────────────────────────────────
  it('findCompetitors prepends a new competitor after the timer', () => {
    const before = component.competitors().length;
    component.findCompetitors();
    expect(component.isFinding()).toBe(true);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.isFinding()).toBe(false);
    expect(component.competitors().length).toBe(before + 1);
    expect(component.competitors()[0].competitor).toContain('AI-Discovered');
  });

  it('triggers findCompetitors via the header button', () => {
    (nativeElement.querySelector('.btn-find-competitors') as HTMLButtonElement).click();
    expect(component.isFinding()).toBe(true);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();
    expect(component.isFinding()).toBe(false);
  });

  // ── Refresh All ──────────────────────────────────────────
  it('refreshAll updates lastUpdated on every competitor with intel', () => {
    const stale = component.competitors().filter(c => c.intel).map(c => c.intel!.lastUpdated);
    component.refreshAll();
    expect(component.isRefreshingAll()).toBe(true);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.isRefreshingAll()).toBe(false);
    const fresh = component.competitors().filter(c => c.intel).map(c => c.intel!.lastUpdated);
    expect(fresh.every((s, i) => s !== stale[i])).toBe(true);
  });

  it('triggers refreshAll via the header button', () => {
    (nativeElement.querySelector('.btn-refresh-all') as HTMLButtonElement).click();
    expect(component.isRefreshingAll()).toBe(true);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
  });

  // ── Generate / toggle / refresh intel ────────────────────
  it('hasIntel reflects the seeded data', () => {
    expect(component.hasIntel(component.competitors()[0])).toBe(true);
  });

  it('toggleIntel flips isIntelOpen', () => {
    const id = component.competitors()[0].id;
    expect(component.isIntelOpen(id)).toBe(false);
    component.toggleIntel(id);
    expect(component.isIntelOpen(id)).toBe(true);
    component.toggleIntel(id);
    expect(component.isIntelOpen(id)).toBe(false);
  });

  it('generateIntel populates intel and opens the panel for a competitor without one', () => {
    component.competitors.update(list => [...list, {
      id: 'fresh-1', competitor: 'Fresh', platform: 'instagram', contentType: 'TBD', topic: 'TBD',
      relevancyLevel: 'Medium', frequency: 'Unknown', insight: 'Pending analysis...',
    }]);
    fixture.detectChanges();
    component.generateIntel('fresh-1');
    expect(component.isRunningIntel('fresh-1')).toBe(true);
    expect(component.isIntelOpen('fresh-1')).toBe(true);
    fixture.detectChanges();
    expect(nativeElement.querySelector('.intel-loading')).toBeTruthy();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();
    expect(component.isRunningIntel('fresh-1')).toBe(false);
    expect(nativeElement.querySelector('.intel-loading')).toBeNull();
    const fresh = component.competitors().find(c => c.id === 'fresh-1');
    expect(fresh?.intel).toBeTruthy();
    expect(component.isIntelOpen('fresh-1')).toBe(true);
  });

  it('refreshIntel updates only the targeted competitor lastUpdated', () => {
    const id = component.competitors()[0].id;
    const before = component.competitors()[0].intel!.lastUpdated;
    component.refreshIntel(id);
    const after = component.competitors().find(c => c.id === id)!.intel!.lastUpdated;
    expect(after).not.toBe(before);
  });

  it('refreshIntel is a no-op when the competitor has no intel', () => {
    component.competitors.update(list => [...list, {
      id: 'noi', competitor: 'No Intel', platform: 'tiktok', contentType: 'TBD', topic: 'TBD',
      relevancyLevel: 'Medium', frequency: 'Unknown', insight: 'Pending...',
    }]);
    component.refreshIntel('noi');
    expect(component.competitors().find(c => c.id === 'noi')?.intel).toBeUndefined();
  });

  it('renders the intel panel when intel is open', () => {
    const id = component.competitors()[0].id;
    component.toggleIntel(id);
    fixture.detectChanges();
    expect(nativeElement.querySelector('.intel-panel')).toBeTruthy();
    expect(nativeElement.querySelector('.intel-section--positioning')).toBeTruthy();
    expect(nativeElement.querySelector('.intel-section--strategy')).toBeTruthy();
    expect(nativeElement.querySelector('.intel-section--gaps')).toBeTruthy();
    expect(nativeElement.querySelector('.intel-section--actions')).toBeTruthy();
  });

  it('renders Generate Intel for a competitor without intel', () => {
    component.competitors.update(list => [...list, {
      id: 'fresh-2', competitor: 'Fresh 2', platform: 'instagram', contentType: 'TBD', topic: 'TBD',
      relevancyLevel: 'Medium', frequency: 'Unknown', insight: 'Pending...',
    }]);
    fixture.detectChanges();
    const intelButtons = nativeElement.querySelectorAll('.btn-intel');
    const last = intelButtons[intelButtons.length - 1];
    expect(last.textContent).toContain('Generate Intel');
  });

  // ── Delete flow ──────────────────────────────────────────
  it('requestDelete sets the confirm id and renders the inline confirm', () => {
    const id = component.competitors()[0].id;
    component.requestDelete(id);
    fixture.detectChanges();
    expect(component.deleteConfirmId()).toBe(id);
    expect(nativeElement.querySelector('.delete-confirm')).toBeTruthy();
  });

  it('confirmDelete removes the competitor and clears state', () => {
    const id = component.competitors()[0].id;
    component.requestDelete(id);
    component.confirmDelete(id);
    expect(component.competitors().find(c => c.id === id)).toBeUndefined();
    expect(component.deleteConfirmId()).toBeNull();
  });

  it('cancelDelete clears state without removing', () => {
    const id = component.competitors()[0].id;
    const before = component.competitors().length;
    component.requestDelete(id);
    component.cancelDelete();
    expect(component.deleteConfirmId()).toBeNull();
    expect(component.competitors().length).toBe(before);
  });

  it('renders the empty state when there are no competitors', () => {
    component.competitors.set([]);
    fixture.detectChanges();
    expect(nativeElement.querySelector('.empty-state')).toBeTruthy();
  });

  // ── Add form (slimmed) ───────────────────────────────────
  it('openAddForm resets fields and shows the form', () => {
    component.newCompetitor = 'leftover';
    component.openAddForm();
    expect(component.showAddForm()).toBe(true);
    expect(component.newCompetitor).toBe('');
    expect(component.newPlatform).toBe('instagram');
    fixture.detectChanges();
    expect(nativeElement.querySelector('.add-form')).toBeTruthy();
  });

  it('cancelAdd hides the form', () => {
    component.openAddForm();
    component.cancelAdd();
    expect(component.showAddForm()).toBe(false);
  });

  it('addCompetitor uses TBD defaults and appends the new entry', () => {
    const before = component.competitors().length;
    component.openAddForm();
    component.newCompetitor = 'New One';
    component.newPlatform = 'youtube';
    component.addCompetitor();
    expect(component.competitors().length).toBe(before + 1);
    const added = component.competitors().at(-1)!;
    expect(added.competitor).toBe('New One');
    expect(added.platform).toBe('youtube');
    expect(added.contentType).toBe('TBD');
    expect(added.topic).toBe('TBD');
    expect(component.showAddForm()).toBe(false);
  });

  it('addCompetitor is a no-op when the name is blank', () => {
    const before = component.competitors().length;
    component.openAddForm();
    component.newCompetitor = '   ';
    component.addCompetitor();
    expect(component.competitors().length).toBe(before);
  });

  it('renders only Name + Platform inputs in the add form', () => {
    component.openAddForm();
    fixture.detectChanges();
    expect(nativeElement.querySelectorAll('.add-form__input').length).toBe(1);
    expect(nativeElement.querySelectorAll('.add-form__dropdown').length).toBe(1);
  });

  it('setNewPlatform updates the bound platform value', () => {
    component.setNewPlatform('youtube');
    expect(component.newPlatform).toBe('youtube');
  });

  it('triggers add via the Add Competitor header button', () => {
    (nativeElement.querySelector('.btn-add') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.showAddForm()).toBe(true);
  });

  // ── createIdeaFromAction stub ────────────────────────────
  it('createIdeaFromAction is a callable no-op', () => {
    expect(() => component.createIdeaFromAction('id', 'action')).not.toThrow();
  });
});
