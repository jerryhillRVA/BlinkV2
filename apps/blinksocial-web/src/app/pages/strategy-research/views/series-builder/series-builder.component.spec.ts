import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeriesBuilderComponent } from './series-builder.component';
import { AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';

describe('SeriesBuilderComponent', () => {
  let fixture: ComponentFixture<SeriesBuilderComponent>;
  let component: SeriesBuilderComponent;
  let nativeElement: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SeriesBuilderComponent] });
    fixture = TestBed.createComponent(SeriesBuilderComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  function buildAndAdvance() {
    vi.useFakeTimers();
    component.buildSeries();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();
  }

  it('creates with sensible defaults', () => {
    expect(component).toBeTruthy();
    expect(component.canBuild()).toBe(true);
    expect(component.series()).toBeNull();
    expect(component.selectedLength()).toBe('5');
    expect(component.selectedPlatform()).toBe('instagram');
  });

  it('renders five setup dropdowns and the build button', () => {
    expect(nativeElement.querySelectorAll('.setup-field').length).toBe(5);
    const btn = nativeElement.querySelector('.btn-build') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.disabled).toBe(false);
  });

  it('shows the empty state before generation', () => {
    expect(nativeElement.querySelector('.empty-state')).toBeTruthy();
    expect(nativeElement.querySelector('.series-overview')).toBeNull();
  });

  it('canBuild flips to false when a selection is cleared', () => {
    component.setSegment('');
    expect(component.canBuild()).toBe(false);
    component.setSegment('s1');
    component.setPillar('');
    expect(component.canBuild()).toBe(false);
  });

  it('typed setters update the matching signal', () => {
    component.setGoal('Drive Profile Follows');
    expect(component.selectedGoal()).toBe('Drive Profile Follows');
    component.setLength('7');
    expect(component.selectedLength()).toBe('7');
    component.setPlatform('tiktok');
    expect(component.selectedPlatform()).toBe('tiktok');
    component.setSegment('s2');
    expect(component.selectedSegmentId()).toBe('s2');
    component.setPillar('p2');
    expect(component.selectedPillarId()).toBe('p2');
  });

  it('getRoleClass maps every role plus a fallback', () => {
    expect(component.getRoleClass('Hook')).toBe('role--hook');
    expect(component.getRoleClass('Value')).toBe('role--value');
    expect(component.getRoleClass('Proof')).toBe('role--proof');
    expect(component.getRoleClass('Pivot')).toBe('role--pivot');
    expect(component.getRoleClass('Conversion')).toBe('role--conversion');
    expect(component.getRoleClass('Other' as never)).toBe('');
  });

  it('buildSeries sets isGenerating then populates the series after the timer', () => {
    vi.useFakeTimers();
    component.buildSeries();
    expect(component.isGenerating()).toBe(true);
    fixture.detectChanges();
    expect(nativeElement.querySelector('.loading-card')).toBeTruthy();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();
    expect(component.isGenerating()).toBe(false);
    expect(component.series()).not.toBeNull();
    expect(component.series()!.posts.length).toBe(5);
    expect(Object.keys(component.postTitles()).length).toBe(5);
    expect(nativeElement.querySelectorAll('.post-card').length).toBe(5);
    vi.useRealTimers();
  });

  it('buildSeries respects the selected length and platform', () => {
    component.setLength('3');
    component.setPlatform('youtube');
    component.setGoal('Launch a New Topic or Offer');
    buildAndAdvance();
    const s = component.series()!;
    expect(s.posts.length).toBe(3);
    expect(s.platform).toBe('youtube');
    expect(s.goal).toBe('Launch a New Topic or Offer');
    vi.useRealTimers();
  });

  it('buildSeries is a no-op when canBuild is false', () => {
    component.setSegment('');
    component.buildSeries();
    expect(component.isGenerating()).toBe(false);
    expect(component.series()).toBeNull();
  });

  it('setPostTitle clears the error when the title becomes non-blank', () => {
    buildAndAdvance();
    const post = component.series()!.posts[0];
    component.setPostTitle(post.number, '');
    component.createPost(post);
    expect(component.titleErrors().has(post.number)).toBe(true);
    component.setPostTitle(post.number, 'Real');
    expect(component.titleErrors().has(post.number)).toBe(false);
    vi.useRealTimers();
  });

  it('createPost saves when the title is set, errors when blank', () => {
    buildAndAdvance();
    const a = component.series()!.posts[0];
    const b = component.series()!.posts[1];
    component.setPostTitle(b.number, '   ');
    component.createPost(b);
    expect(component.savedPosts().has(b.number)).toBe(false);
    expect(component.titleErrors().has(b.number)).toBe(true);
    component.setPostTitle(a.number, 'Day 1');
    component.createPost(a);
    expect(component.savedPosts().has(a.number)).toBe(true);
    vi.useRealTimers();
  });

  it('createAllPosts saves every visible post with a non-blank title', () => {
    buildAndAdvance();
    component.createAllPosts();
    expect(component.unsavedCount()).toBe(0);
    vi.useRealTimers();
  });

  it('createAllPosts is a no-op when no series has been built', () => {
    component.createAllPosts();
    expect(component.savedPosts().size).toBe(0);
  });

  it('renders bridge connectors between consecutive posts that have a bridge note', () => {
    buildAndAdvance();
    expect(nativeElement.querySelectorAll('.bridge-connector').length).toBeGreaterThan(0);
    vi.useRealTimers();
  });

  it('renders the series overview with badges and Create All button', () => {
    buildAndAdvance();
    expect(nativeElement.querySelector('.series-overview')).toBeTruthy();
    expect(nativeElement.querySelectorAll('.series-badge').length).toBeGreaterThan(0);
    const createAll = nativeElement.querySelector('.btn-create-all') as HTMLButtonElement;
    expect(createAll).toBeTruthy();
    createAll.click();
    fixture.detectChanges();
    expect(component.unsavedCount()).toBe(0);
    expect(nativeElement.querySelector('.btn-create-all')).toBeNull();
    vi.useRealTimers();
  });

  it('createPost via the per-card DOM button flips the card into a saved state', () => {
    buildAndAdvance();
    const button = nativeElement.querySelector('.btn-create-post') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    expect(component.savedPosts().has(component.series()!.posts[0].number)).toBe(true);
    vi.useRealTimers();
  });

  it('createPost falls back to a missing title entry being treated as blank', () => {
    buildAndAdvance();
    const post = component.series()!.posts[0];
    component.postTitles.set({});
    component.createPost(post);
    expect(component.titleErrors().has(post.number)).toBe(true);
    vi.useRealTimers();
  });

  it('pillarColor / pillarName / segmentName fall back when missing', () => {
    expect(component.pillarColor('missing')).toBe('var(--blink-on-surface-muted)');
    expect(component.pillarName('missing')).toBe('missing');
    expect(component.segmentName('missing')).toBe('missing');
  });

  it('selectedPillar resolves to the active pillar object', () => {
    expect(component.selectedPillar()).not.toBeNull();
    component.setPillar('missing');
    expect(component.selectedPillar()).toBeNull();
  });
});
