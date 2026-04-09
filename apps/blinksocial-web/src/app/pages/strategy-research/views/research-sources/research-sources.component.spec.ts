import { TestBed } from '@angular/core/testing';
import { ResearchSourcesComponent } from './research-sources.component';
import { AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';

describe('ResearchSourcesComponent', () => {
  let component: ResearchSourcesComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<ResearchSourcesComponent>>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [ResearchSourcesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResearchSourcesComponent);
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

  it('should render source cards', () => {
    const cards = nativeElement.querySelectorAll('.source-card');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should render section header', () => {
    expect(nativeElement.querySelector('.section-header h2')?.textContent).toContain('Research Sources');
  });

  it('should show filter dropdown with All Pillars and individual pillars', () => {
    const select = nativeElement.querySelector('select');
    expect(select).toBeTruthy();
    const options = select?.querySelectorAll('option');
    expect(options?.length).toBe(6); // "All Pillars" + 5 pillars
  });

  it('should render discover button', () => {
    const btn = nativeElement.querySelector('.btn-discover');
    expect(btn).toBeTruthy();
    expect(btn?.textContent).toContain('AI Discover Sources');
  });

  it('should display type badges on source cards', () => {
    const badges = nativeElement.querySelectorAll('.type-badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('should display relevance badges', () => {
    const badges = nativeElement.querySelectorAll('.relevance-badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('should display pillar chips on source cards', () => {
    const chips = nativeElement.querySelectorAll('.pillar-chip');
    expect(chips.length).toBeGreaterThan(0);
  });

  it('should render action buttons on each card', () => {
    const createBtns = nativeElement.querySelectorAll('.btn-create-idea');
    const prodBtns = nativeElement.querySelectorAll('.btn-start-prod');
    expect(createBtns.length).toBeGreaterThan(0);
    expect(prodBtns.length).toBeGreaterThan(0);
  });

  // --- Filtering ---

  it('should show all sources when filter is "all"', () => {
    component.filterPillarId.set('all');
    expect(component.filteredSources().length).toBe(component.sources().length);
  });

  it('should filter sources by pillar', () => {
    const allCount = component.filteredSources().length;
    component.filterPillarId.set('p1');
    const filtered = component.filteredSources();
    expect(filtered.length).toBeLessThanOrEqual(allCount);
    filtered.forEach(s => {
      expect(s.pillarIds).toContain('p1');
    });
  });

  it('should show empty state when no sources match filter', () => {
    component.filterPillarId.set('non-existent-pillar');
    fixture.detectChanges();

    expect(component.filteredSources().length).toBe(0);
    const emptyState = nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState?.textContent).toContain('No sources found');
  });

  // --- getPillarName ---

  it('should return pillar name for valid pillar id', () => {
    const name = component.getPillarName('p1');
    expect(name).toBeTruthy();
    expect(name).not.toBe('p1'); // Should return actual name, not the id
  });

  it('should return pillar id for unknown pillar id', () => {
    const name = component.getPillarName('unknown-id');
    expect(name).toBe('unknown-id');
  });

  // --- getPillarColor ---

  it('should return pillar color for valid pillar id', () => {
    const color = component.getPillarColor('p1');
    expect(color).toBeTruthy();
    expect(color).not.toBe('var(--blink-on-surface-muted)');
  });

  it('should return fallback color for unknown pillar id', () => {
    const color = component.getPillarColor('unknown-id');
    expect(color).toBe('var(--blink-on-surface-muted)');
  });

  // --- getTypeBadgeStyle ---

  it('should return correct style for article type', () => {
    const style = component.getTypeBadgeStyle('article');
    expect(style.background).toBe('var(--blink-icon-blue-bg)');
    expect(style.color).toBe('var(--blink-icon-blue)');
  });

  it('should return correct style for report type', () => {
    const style = component.getTypeBadgeStyle('report');
    expect(style.background).toBe('var(--blink-icon-purple-bg)');
    expect(style.color).toBe('var(--blink-icon-purple)');
  });

  it('should return correct style for social type', () => {
    const style = component.getTypeBadgeStyle('social');
    expect(style.background).toBe('var(--blink-icon-green-bg)');
    expect(style.color).toBe('var(--blink-icon-green)');
  });

  it('should return correct style for news type', () => {
    const style = component.getTypeBadgeStyle('news');
    expect(style.background).toBe('var(--blink-icon-orange-bg)');
    expect(style.color).toBe('var(--blink-icon-orange)');
  });

  it('should return correct style for video type', () => {
    const style = component.getTypeBadgeStyle('video');
    expect(style.background).toBe('var(--blink-brand-primary-lightest-bg)');
    expect(style.color).toBe('var(--blink-brand-primary)');
  });

  // --- formatDate ---

  it('should format date correctly', () => {
    const formatted = component.formatDate('2026-01-15T12:00:00.000Z');
    expect(formatted).toContain('Jan');
    expect(formatted).toContain('2026');
  });

  it('should handle different date strings', () => {
    const formatted = component.formatDate('2025-12-25T12:00:00.000Z');
    expect(formatted).toContain('Dec');
    expect(formatted).toContain('2025');
  });

  // --- discoverSources ---

  it('should discover sources with AI (timer-based)', () => {
    const initialCount = component.sources().length;
    component.discoverSources();
    expect(component.isDiscovering()).toBe(true);

    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.isDiscovering()).toBe(false);
    expect(component.sources().length).toBe(initialCount + 1);
    expect(component.sources()[0].title).toContain('AI-Discovered');
  });

  it('should show spinner during discovery', () => {
    component.discoverSources();
    fixture.detectChanges();

    const btn = nativeElement.querySelector('.btn-discover') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toContain('Discovering...');
    expect(btn.querySelector('.spinner')).toBeTruthy();

    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();

    expect(btn.disabled).toBe(false);
    expect(btn.textContent).toContain('AI Discover Sources');
  });

  it('should add discovered source at beginning of list', () => {
    component.discoverSources();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);

    const first = component.sources()[0];
    expect(first.title).toContain('AI-Discovered');
    expect(first.type).toBe('report');
    expect(first.relevance).toBe(94);
    expect(first.pillarIds).toEqual(['p1', 'p3']);
  });

  // --- createIdea / startProduction ---

  it('should call createIdea without error', () => {
    const source = component.sources()[0];
    expect(() => component.createIdea(source)).not.toThrow();
  });

  it('should call startProduction without error', () => {
    const source = component.sources()[0];
    expect(() => component.startProduction(source)).not.toThrow();
  });

  // --- DOM interactions for template function coverage ---

  it('should trigger discoverSources via button click in DOM', () => {
    const btn = nativeElement.querySelector('.btn-discover') as HTMLButtonElement;
    btn.click();
    expect(component.isDiscovering()).toBe(true);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();
    expect(component.isDiscovering()).toBe(false);
  });

  it('should trigger createIdea via Create Idea button click in DOM', () => {
    const createBtn = nativeElement.querySelector('.btn-create-idea') as HTMLButtonElement;
    expect(() => createBtn.click()).not.toThrow();
  });

  it('should trigger startProduction via Start Production button click in DOM', () => {
    const prodBtn = nativeElement.querySelector('.btn-start-prod') as HTMLButtonElement;
    expect(() => prodBtn.click()).not.toThrow();
  });

  it('should change filter via select ngModelChange in DOM', () => {
    const select = nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'p1';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(component.filterPillarId()).toBe('p1');
  });

  it('should render filtered source cards after changing filter in DOM', () => {
    component.filterPillarId.set('p1');
    fixture.detectChanges();
    const cards = nativeElement.querySelectorAll('.source-card');
    expect(cards.length).toBeLessThanOrEqual(component.sources().length);
  });

  it('should render source title and summary text', () => {
    const titles = nativeElement.querySelectorAll('.source-title');
    const summaries = nativeElement.querySelectorAll('.source-summary');
    expect(titles.length).toBeGreaterThan(0);
    expect(summaries.length).toBeGreaterThan(0);
    expect(titles[0].textContent?.trim().length).toBeGreaterThan(0);
  });

  it('should render source date', () => {
    const dates = nativeElement.querySelectorAll('.source-date');
    expect(dates.length).toBeGreaterThan(0);
    expect(dates[0].textContent?.trim().length).toBeGreaterThan(0);
  });

  it('should render pillar chips with CSS variable for color', () => {
    const chips = nativeElement.querySelectorAll('.pillar-chip') as NodeListOf<HTMLElement>;
    expect(chips.length).toBeGreaterThan(0);
    // Should have --chip-color CSS variable set via inline style
    expect(chips[0].style.getPropertyValue('--chip-color')).toBeTruthy();
  });
});
