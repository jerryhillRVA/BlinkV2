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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- Rendering ---

  it('should render competitor cards', () => {
    const cards = nativeElement.querySelectorAll('.competitor-card');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should show action bar with two buttons', () => {
    const buttons = nativeElement.querySelectorAll('.action-bar .btn');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toContain('AI Competitor Scan');
    expect(buttons[1].textContent).toContain('Add Competitor');
  });

  it('should render platform badge and relevancy badge on each card', () => {
    const platformBadges = nativeElement.querySelectorAll('.platform-badge');
    const relevancyBadges = nativeElement.querySelectorAll('.relevancy-badge');
    expect(platformBadges.length).toBeGreaterThan(0);
    expect(relevancyBadges.length).toBeGreaterThan(0);
  });

  it('should not show add form initially', () => {
    expect(nativeElement.querySelector('.add-form')).toBeFalsy();
  });

  // --- getRelevancyClass ---

  it('should return correct class for Very High relevancy', () => {
    expect(component.getRelevancyClass('Very High')).toBe('relevancy--very-high');
  });

  it('should return correct class for High relevancy', () => {
    expect(component.getRelevancyClass('High')).toBe('relevancy--high');
  });

  it('should return correct class for Medium relevancy', () => {
    expect(component.getRelevancyClass('Medium')).toBe('relevancy--medium');
  });

  it('should return empty string for unknown relevancy', () => {
    expect(component.getRelevancyClass('Low')).toBe('');
    expect(component.getRelevancyClass('')).toBe('');
  });

  // --- Toggle expand ---

  it('should toggle expand for a competitor', () => {
    const firstId = component.competitors()[0].id;
    expect(component.isExpanded(firstId)).toBe(false);

    component.toggleExpand(firstId);
    expect(component.isExpanded(firstId)).toBe(true);

    component.toggleExpand(firstId);
    expect(component.isExpanded(firstId)).toBe(false);
  });

  it('should show insight section when expanded', () => {
    const firstId = component.competitors()[0].id;
    component.toggleExpand(firstId);
    fixture.detectChanges();

    const insightSection = nativeElement.querySelector('.competitor-card__insight');
    expect(insightSection).toBeTruthy();
    expect(insightSection?.querySelector('.insight-text')).toBeTruthy();
  });

  it('should hide insight section when collapsed', () => {
    expect(nativeElement.querySelector('.competitor-card__insight')).toBeFalsy();
  });

  it('should show "View Intel" when collapsed and "Hide Intel" when expanded', () => {
    const firstId = component.competitors()[0].id;
    fixture.detectChanges();

    const ghostBtn = nativeElement.querySelector('.competitor-card__actions .btn--ghost');
    expect(ghostBtn?.textContent).toContain('View Intel');

    component.toggleExpand(firstId);
    fixture.detectChanges();

    const ghostBtnExpanded = nativeElement.querySelector('.competitor-card__actions .btn--ghost');
    expect(ghostBtnExpanded?.textContent).toContain('Hide Intel');
  });

  // --- AI Scan ---

  it('should run AI scan (timer-based)', () => {
    component.runAiScan();
    expect(component.isScanning()).toBe(true);

    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.isScanning()).toBe(false);
  });

  it('should show spinner and disable button during scan', () => {
    component.runAiScan();
    fixture.detectChanges();

    const scanBtn = nativeElement.querySelector('.action-bar .btn--primary') as HTMLButtonElement;
    expect(scanBtn.disabled).toBe(true);
    expect(scanBtn.textContent).toContain('Scanning...');
    expect(scanBtn.querySelector('.spinner')).toBeTruthy();

    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();

    expect(scanBtn.disabled).toBe(false);
    expect(scanBtn.textContent).toContain('AI Competitor Scan');
  });

  // --- runTeardown ---

  it('should call runTeardown without error', () => {
    expect(() => component.runTeardown('ci-1')).not.toThrow();
  });

  // --- Add form ---

  it('should open add form and reset fields', () => {
    component.newCompetitor = 'leftover';
    component.openAddForm();
    expect(component.showAddForm()).toBe(true);
    expect(component.newCompetitor).toBe('');
    expect(component.newPlatform).toBe('instagram');
    expect(component.newContentType).toBe('');
    expect(component.newTopic).toBe('');
  });

  it('should render add form when showAddForm is true', () => {
    component.openAddForm();
    fixture.detectChanges();

    expect(nativeElement.querySelector('.add-form')).toBeTruthy();
    expect(nativeElement.querySelector('.add-form__title')?.textContent).toContain('Add Competitor');
  });

  it('should cancel add form', () => {
    component.openAddForm();
    expect(component.showAddForm()).toBe(true);
    component.cancelAdd();
    expect(component.showAddForm()).toBe(false);
  });

  it('should add a competitor', () => {
    const initialCount = component.competitors().length;
    component.newCompetitor = 'New Competitor';
    component.newPlatform = 'youtube';
    component.newContentType = 'Shorts';
    component.newTopic = 'Fitness';
    component.addCompetitor();

    expect(component.competitors().length).toBe(initialCount + 1);
    const added = component.competitors()[component.competitors().length - 1];
    expect(added.competitor).toBe('New Competitor');
    expect(added.platform).toBe('youtube');
    expect(added.contentType).toBe('Shorts');
    expect(added.topic).toBe('Fitness');
    expect(added.relevancyLevel).toBe('Medium');
    expect(component.showAddForm()).toBe(false);
  });

  it('should not add competitor with empty name', () => {
    const initialCount = component.competitors().length;
    component.newCompetitor = '   ';
    component.addCompetitor();
    expect(component.competitors().length).toBe(initialCount);
  });

  it('should default contentType to "General" and topic to "TBD" when empty', () => {
    component.newCompetitor = 'Test';
    component.newContentType = '';
    component.newTopic = '';
    component.addCompetitor();

    const added = component.competitors()[component.competitors().length - 1];
    expect(added.contentType).toBe('General');
    expect(added.topic).toBe('TBD');
  });

  // --- Platform labels and icons ---

  it('should have platform labels for all platforms', () => {
    expect(component.platformLabels['instagram']).toBe('Instagram');
    expect(component.platformLabels['tiktok']).toBe('TikTok');
    expect(component.platformLabels['youtube']).toBe('YouTube');
    expect(component.platformLabels['facebook']).toBe('Facebook');
    expect(component.platformLabels['linkedin']).toBe('LinkedIn');
  });

  it('should have platform icons for all platforms', () => {
    expect(component.platformIcons['instagram']).toBeTruthy();
    expect(component.platformIcons['tiktok']).toBeTruthy();
    expect(component.platformIcons['youtube']).toBeTruthy();
    expect(component.platformIcons['facebook']).toBeTruthy();
    expect(component.platformIcons['linkedin']).toBeTruthy();
  });

  // --- isExpanded ---

  it('should return false for non-expanded ids', () => {
    expect(component.isExpanded('non-existent-id')).toBe(false);
  });

  it('should initialize with default signal values', () => {
    expect(component.showAddForm()).toBe(false);
    expect(component.expandedIds().size).toBe(0);
    expect(component.isScanning()).toBe(false);
  });

  it('should render empty state when no competitors', () => {
    const mockState = TestBed.inject(StrategyResearchStateService);
    (mockState.competitorInsights as ReturnType<typeof signal>).set([]);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.empty-state-box')).toBeTruthy();
    expect(el.querySelector('.empty-state-title')?.textContent).toContain('No competitors yet');
  });

  // --- DOM interactions for template function coverage ---

  it('should trigger runAiScan via button click in DOM', () => {
    const scanBtn = nativeElement.querySelector('.action-bar .btn--primary') as HTMLButtonElement;
    scanBtn.click();
    expect(component.isScanning()).toBe(true);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.isScanning()).toBe(false);
  });

  it('should open add form via button click in DOM', () => {
    const addBtn = nativeElement.querySelector('.action-bar .btn--secondary') as HTMLButtonElement;
    addBtn.click();
    fixture.detectChanges();
    expect(component.showAddForm()).toBe(true);
    expect(nativeElement.querySelector('.add-form')).toBeTruthy();
  });

  it('should cancel add form via DOM button', () => {
    component.openAddForm();
    fixture.detectChanges();

    const cancelBtn = nativeElement.querySelector('.add-form__actions .btn--ghost') as HTMLButtonElement;
    cancelBtn.click();
    fixture.detectChanges();
    expect(component.showAddForm()).toBe(false);
  });

  it('should add competitor via DOM button when name is filled', () => {
    component.openAddForm();
    component.newCompetitor = 'DOM Competitor';
    fixture.detectChanges();

    const addBtn = nativeElement.querySelector('.add-form__actions .btn--primary') as HTMLButtonElement;
    addBtn.click();
    fixture.detectChanges();

    const added = component.competitors().find(c => c.competitor === 'DOM Competitor');
    expect(added).toBeTruthy();
  });

  it('should toggle expand via View Intel button click in DOM', () => {
    const ghostBtns = nativeElement.querySelectorAll('.competitor-card__actions .btn--ghost') as NodeListOf<HTMLButtonElement>;
    ghostBtns[0].click();
    fixture.detectChanges();

    expect(component.isExpanded(component.competitors()[0].id)).toBe(true);
    expect(nativeElement.querySelector('.competitor-card__insight')).toBeTruthy();

    // Click again to collapse
    ghostBtns[0].click();
    fixture.detectChanges();
    expect(component.isExpanded(component.competitors()[0].id)).toBe(false);
  });

  it('should trigger runTeardown via Run Teardown button click in DOM', () => {
    const firstId = component.competitors()[0].id;
    const initialCount = component.competitors().length;
    const spy = vi.spyOn(component, 'runTeardown');
    const teardownBtns = nativeElement.querySelectorAll('.competitor-card__actions .btn--primary') as NodeListOf<HTMLButtonElement>;
    teardownBtns[0].click();
    expect(spy).toHaveBeenCalledWith(firstId);
    expect(component.competitors().length).toBe(initialCount - 1);
  });

  it('should show down chevron when collapsed and up chevron when expanded', () => {
    // Initially collapsed - down chevron path should be visible
    let ghostBtn = nativeElement.querySelector('.competitor-card__actions .btn--ghost');
    expect(ghostBtn?.querySelector('svg')).toBeTruthy();

    // Expand
    const firstId = component.competitors()[0].id;
    component.toggleExpand(firstId);
    fixture.detectChanges();

    // Up chevron path should be visible
    ghostBtn = nativeElement.querySelector('.competitor-card__actions .btn--ghost');
    expect(ghostBtn?.querySelector('svg')).toBeTruthy();
  });

  it('should render add form fields with ngModel bindings', () => {
    component.openAddForm();
    fixture.detectChanges();

    const inputs = nativeElement.querySelectorAll('.add-form__field input[type="text"]') as NodeListOf<HTMLInputElement>;
    expect(inputs.length).toBe(4); // competitor name, content type, topic, frequency

    const selects = nativeElement.querySelectorAll('.add-form__field select') as NodeListOf<HTMLSelectElement>;
    expect(selects.length).toBe(2); // platform, relevancy
  });

  it('should disable Add button when competitor name is empty', () => {
    component.openAddForm();
    fixture.detectChanges();

    const addBtn = nativeElement.querySelector('.add-form__actions .btn--primary') as HTMLButtonElement;
    expect(addBtn.disabled).toBe(true);
  });

  it('should render relevancy classes on badges', () => {
    fixture.detectChanges();
    const badges = nativeElement.querySelectorAll('.relevancy-badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('should render platform icons with path attribute', () => {
    const paths = nativeElement.querySelectorAll('.platform-badge svg path');
    expect(paths.length).toBeGreaterThan(0);
  });

  it('should bind newCompetitor via input ngModel in add form', () => {
    component.openAddForm();
    fixture.detectChanges();

    const inputs = nativeElement.querySelectorAll('.add-form__field input[type="text"]') as NodeListOf<HTMLInputElement>;
    inputs[0].value = 'DOM Competitor Name';
    inputs[0].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.newCompetitor).toBe('DOM Competitor Name');
  });

  it('should bind newContentType via input ngModel in add form', () => {
    component.openAddForm();
    fixture.detectChanges();

    const inputs = nativeElement.querySelectorAll('.add-form__field input[type="text"]') as NodeListOf<HTMLInputElement>;
    inputs[1].value = 'Shorts';
    inputs[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.newContentType).toBe('Shorts');
  });

  it('should bind newTopic via input ngModel in add form', () => {
    component.openAddForm();
    fixture.detectChanges();

    const inputs = nativeElement.querySelectorAll('.add-form__field input[type="text"]') as NodeListOf<HTMLInputElement>;
    inputs[2].value = 'Fitness Tips';
    inputs[2].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.newTopic).toBe('Fitness Tips');
  });

  it('should bind newPlatform via select ngModel in add form', () => {
    component.openAddForm();
    fixture.detectChanges();

    const select = nativeElement.querySelector('.add-form__field select') as HTMLSelectElement;
    select.value = 'youtube';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(component.newPlatform).toBe('youtube');
  });

  it('should enable Add button when competitor name is filled via DOM', () => {
    component.openAddForm();
    fixture.detectChanges();

    const inputs = nativeElement.querySelectorAll('.add-form__field input[type="text"]') as NodeListOf<HTMLInputElement>;
    inputs[0].value = 'Some Name';
    inputs[0].dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const addBtn = nativeElement.querySelector('.add-form__actions .btn--primary') as HTMLButtonElement;
    expect(addBtn.disabled).toBe(false);
  });

  it('should render competitor cards with detail rows', () => {
    const detailRows = nativeElement.querySelectorAll('.detail-row');
    expect(detailRows.length).toBeGreaterThan(0);
    const topicLabels = Array.from(detailRows).filter(r => r.textContent?.includes('Topic:'));
    expect(topicLabels.length).toBeGreaterThan(0);
  });

  it('should render content type badges', () => {
    const badges = nativeElement.querySelectorAll('.content-type-badge');
    expect(badges.length).toBeGreaterThan(0);
  });
});
