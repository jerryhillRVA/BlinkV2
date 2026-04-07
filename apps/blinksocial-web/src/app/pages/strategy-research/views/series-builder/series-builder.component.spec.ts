import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeriesBuilderComponent } from './series-builder.component';

describe('SeriesBuilderComponent', () => {
  let component: SeriesBuilderComponent;
  let fixture: ComponentFixture<SeriesBuilderComponent>;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [SeriesBuilderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SeriesBuilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should not be generating', () => {
      expect(component.isGenerating()).toBe(false);
    });

    it('should have null series', () => {
      expect(component.series()).toBeNull();
    });

    it('should have default selected goal', () => {
      expect(component.selectedGoal).toBe('Grow Followers');
    });

    it('should have default series length of 5', () => {
      expect(component.seriesLength).toBe(5);
    });

    it('should have default selected platform', () => {
      expect(component.selectedPlatform).toBe('instagram');
    });

    it('should have goal options', () => {
      expect(component.goalOptions.length).toBe(5);
      expect(component.goalOptions).toContain('Grow Followers');
      expect(component.goalOptions).toContain('Drive Sales');
    });

    it('should have platform options', () => {
      expect(component.platformOptions.length).toBe(5);
    });

    it('should have length options', () => {
      expect(component.lengthOptions).toEqual([3, 5, 7]);
    });
  });

  describe('template rendering', () => {
    it('should render input form with title', () => {
      const title = fixture.nativeElement.querySelector('.input-form__title');
      expect(title).toBeTruthy();
      expect(title.textContent).toContain('Build a Content Series');
    });

    it('should render goal select with options', () => {
      const selects = fixture.nativeElement.querySelectorAll('select');
      expect(selects.length).toBe(2);
      const goalSelect = selects[0];
      expect(goalSelect.options.length).toBe(5);
    });

    it('should render platform select with options', () => {
      const selects = fixture.nativeElement.querySelectorAll('select');
      const platformSelect = selects[1];
      expect(platformSelect.options.length).toBe(5);
    });

    it('should render length option buttons', () => {
      const lengthBtns = fixture.nativeElement.querySelectorAll('.length-btn');
      expect(lengthBtns.length).toBe(3);
      expect(lengthBtns[0].textContent).toContain('3 posts');
      expect(lengthBtns[1].textContent).toContain('5 posts');
      expect(lengthBtns[2].textContent).toContain('7 posts');
    });

    it('should highlight default length option (5)', () => {
      const activeBtns = fixture.nativeElement.querySelectorAll('.length-btn--active');
      expect(activeBtns.length).toBe(1);
      expect(activeBtns[0].textContent).toContain('5 posts');
    });

    it('should render build series button', () => {
      const button = fixture.nativeElement.querySelector('.btn--primary');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Build Series with AI');
    });

    it('should not show series output initially', () => {
      const output = fixture.nativeElement.querySelector('.series-output');
      expect(output).toBeFalsy();
    });

    it('should show SVG icon when not generating', () => {
      const svg = fixture.nativeElement.querySelector('.btn--primary svg');
      expect(svg).toBeTruthy();
    });

    it('should not show spinner when not generating', () => {
      const spinner = fixture.nativeElement.querySelector('.spinner');
      expect(spinner).toBeFalsy();
    });

    it('should change series length when clicking length button', () => {
      const lengthBtns = fixture.nativeElement.querySelectorAll('.length-btn');
      lengthBtns[0].click();
      fixture.detectChanges();
      expect(component.seriesLength).toBe(3);
      const activeBtns = fixture.nativeElement.querySelectorAll('.length-btn--active');
      expect(activeBtns.length).toBe(1);
      expect(activeBtns[0].textContent).toContain('3 posts');
    });
  });

  describe('getRoleClass()', () => {
    it('should return role--hook for Hook', () => {
      expect(component.getRoleClass('Hook')).toBe('role--hook');
    });

    it('should return role--value for Value', () => {
      expect(component.getRoleClass('Value')).toBe('role--value');
    });

    it('should return role--proof for Proof', () => {
      expect(component.getRoleClass('Proof')).toBe('role--proof');
    });

    it('should return role--pivot for Pivot', () => {
      expect(component.getRoleClass('Pivot')).toBe('role--pivot');
    });

    it('should return role--conversion for Conversion', () => {
      expect(component.getRoleClass('Conversion')).toBe('role--conversion');
    });

    it('should return empty string for unknown role', () => {
      expect(component.getRoleClass('Unknown' as any)).toBe('');
    });
  });

  describe('buildSeries()', () => {
    it('should set isGenerating to true', () => {
      component.buildSeries();
      expect(component.isGenerating()).toBe(true);
    });

    it('should clear previous series', () => {
      component.buildSeries();
      expect(component.series()).toBeNull();
    });

    it('should show spinner and building text during generation', () => {
      component.buildSeries();
      fixture.detectChanges();
      const spinner = fixture.nativeElement.querySelector('.spinner');
      expect(spinner).toBeTruthy();
      const button = fixture.nativeElement.querySelector('.btn--primary');
      expect(button.textContent).toContain('Building Series...');
      expect(button.disabled).toBe(true);
    });

    it('should set series result after timeout', () => {
      component.buildSeries();
      vi.advanceTimersByTime(2500);
      expect(component.series()).not.toBeNull();
      expect(component.isGenerating()).toBe(false);
    });

    it('should use selected platform in result', () => {
      component.selectedPlatform = 'tiktok';
      component.buildSeries();
      vi.advanceTimersByTime(2500);
      expect(component.series()!.platform).toBe('tiktok');
    });

    it('should use selected goal in result', () => {
      component.selectedGoal = 'Drive Sales';
      component.buildSeries();
      vi.advanceTimersByTime(2500);
      expect(component.series()!.goal).toBe('Drive Sales');
    });

    it('should use selected series length in result', () => {
      component.seriesLength = 3;
      component.buildSeries();
      vi.advanceTimersByTime(2500);
      expect(component.series()!.postCount).toBe(3);
      expect(component.series()!.posts.length).toBe(3);
    });

    it('should render series output after generation completes', () => {
      component.buildSeries();
      vi.advanceTimersByTime(2500);
      fixture.detectChanges();
      const output = fixture.nativeElement.querySelector('.series-output');
      expect(output).toBeTruthy();
    });

    it('should display overview card with title and narrative arc', () => {
      component.buildSeries();
      vi.advanceTimersByTime(2500);
      fixture.detectChanges();
      const title = fixture.nativeElement.querySelector('.overview-card__title');
      expect(title.textContent).toContain('5-Day Strength After 40 Challenge');
      const arc = fixture.nativeElement.querySelector('.overview-card__arc');
      expect(arc).toBeTruthy();
    });

    it('should display badges for platform, count, and goal', () => {
      component.buildSeries();
      vi.advanceTimersByTime(2500);
      fixture.detectChanges();
      const badges = fixture.nativeElement.querySelectorAll('.badge');
      expect(badges.length).toBe(3);
    });

    it('should display post cards with correct content', () => {
      component.buildSeries();
      vi.advanceTimersByTime(2500);
      fixture.detectChanges();
      const postCards = fixture.nativeElement.querySelectorAll('.post-card');
      expect(postCards.length).toBe(5);
    });

    it('should display post numbers', () => {
      component.buildSeries();
      vi.advanceTimersByTime(2500);
      fixture.detectChanges();
      const postNumbers = fixture.nativeElement.querySelectorAll('.post-number');
      expect(postNumbers.length).toBe(5);
      expect(postNumbers[0].textContent).toContain('1');
    });

    it('should display role tags with correct classes', () => {
      component.buildSeries();
      vi.advanceTimersByTime(2500);
      fixture.detectChanges();
      const roleTags = fixture.nativeElement.querySelectorAll('.role-tag');
      expect(roleTags.length).toBe(5);
      expect(roleTags[0].textContent).toContain('Hook');
    });

    it('should display hook, caption direction, and CTA for each post', () => {
      component.buildSeries();
      vi.advanceTimersByTime(2500);
      fixture.detectChanges();
      const hooks = fixture.nativeElement.querySelectorAll('.hook-text');
      expect(hooks.length).toBe(5);
      const directions = fixture.nativeElement.querySelectorAll('.direction-text');
      expect(directions.length).toBe(5);
      const ctas = fixture.nativeElement.querySelectorAll('.cta-text');
      expect(ctas.length).toBe(5);
    });

    it('should display bridge connectors between posts (not after last)', () => {
      component.buildSeries();
      vi.advanceTimersByTime(2500);
      fixture.detectChanges();
      const connectors = fixture.nativeElement.querySelectorAll('.bridge-connector');
      expect(connectors.length).toBe(4); // 5 posts - 1
    });

    it('should display Create in Ideation button for each post', () => {
      component.buildSeries();
      vi.advanceTimersByTime(2500);
      fixture.detectChanges();
      const ideationBtns = fixture.nativeElement.querySelectorAll('.post-card__actions .btn--sm');
      expect(ideationBtns.length).toBe(5);
    });

    it('should limit posts to 3 when series length is 3', () => {
      component.seriesLength = 3;
      component.buildSeries();
      vi.advanceTimersByTime(2500);
      fixture.detectChanges();
      const postCards = fixture.nativeElement.querySelectorAll('.post-card');
      expect(postCards.length).toBe(3);
      const connectors = fixture.nativeElement.querySelectorAll('.bridge-connector');
      expect(connectors.length).toBe(2);
    });
  });

  describe('createInIdeation()', () => {
    it('should be callable without error (placeholder)', () => {
      expect(() => component.createInIdeation(1)).not.toThrow();
    });

    it('should be callable via button click in DOM', () => {
      component.buildSeries();
      vi.advanceTimersByTime(2500);
      fixture.detectChanges();
      const ideationBtn = fixture.nativeElement.querySelector('.post-card__actions .btn--sm');
      expect(() => ideationBtn.click()).not.toThrow();
    });
  });

  // --- DOM interactions ---

  describe('DOM interactions', () => {
    it('should trigger buildSeries via button click in DOM', () => {
      const button = fixture.nativeElement.querySelector('.btn--primary') as HTMLButtonElement;
      button.click();
      expect(component.isGenerating()).toBe(true);

      vi.advanceTimersByTime(2500);
      fixture.detectChanges();
      expect(component.series()).not.toBeNull();
    });

    it('should change series length via length button click', () => {
      const lengthBtns = fixture.nativeElement.querySelectorAll('.length-btn') as NodeListOf<HTMLButtonElement>;
      lengthBtns[2].click(); // 7 posts
      fixture.detectChanges();
      expect(component.seriesLength).toBe(7);

      const activeBtns = fixture.nativeElement.querySelectorAll('.length-btn--active');
      expect(activeBtns.length).toBe(1);
      expect(activeBtns[0].textContent).toContain('7 posts');
    });

    it('should render goal options in select dropdown', () => {
      const selects = fixture.nativeElement.querySelectorAll('select');
      const goalSelect = selects[0];
      expect(goalSelect.options.length).toBe(5);
      expect(goalSelect.options[0].textContent?.trim()).toBe('Grow Followers');
    });

    it('should render platform options in select dropdown', () => {
      const selects = fixture.nativeElement.querySelectorAll('select');
      const platformSelect = selects[1];
      expect(platformSelect.options.length).toBe(5);
    });

    it('should render role tag classes correctly in DOM', () => {
      component.buildSeries();
      vi.advanceTimersByTime(2500);
      fixture.detectChanges();

      const roleTags = fixture.nativeElement.querySelectorAll('.role-tag');
      expect(roleTags[0].classList.contains('role--hook')).toBe(true);
      expect(roleTags[1].classList.contains('role--value')).toBe(true);
      expect(roleTags[2].classList.contains('role--proof')).toBe(true);
      expect(roleTags[3].classList.contains('role--pivot')).toBe(true);
      expect(roleTags[4].classList.contains('role--conversion')).toBe(true);
    });

    it('should render bridge connector SVGs between posts', () => {
      component.buildSeries();
      vi.advanceTimersByTime(2500);
      fixture.detectChanges();

      const connectors = fixture.nativeElement.querySelectorAll('.bridge-connector');
      expect(connectors.length).toBe(4);
      const svg = connectors[0].querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('should not render bridge connector after the last post', () => {
      component.buildSeries();
      vi.advanceTimersByTime(2500);
      fixture.detectChanges();

      const postCards = fixture.nativeElement.querySelectorAll('.post-card');
      const lastCard = postCards[postCards.length - 1];
      // Next sibling should not be a bridge-connector
      expect(lastCard.nextElementSibling?.classList.contains('bridge-connector')).toBeFalsy();
    });

    it('should display CTA text for each post', () => {
      component.buildSeries();
      vi.advanceTimersByTime(2500);
      fixture.detectChanges();

      const ctaTexts = fixture.nativeElement.querySelectorAll('.cta-text');
      expect(ctaTexts[0].textContent).toContain('Save this for Day 2');
    });

    it('should display overview badges with correct content', () => {
      component.buildSeries();
      vi.advanceTimersByTime(2500);
      fixture.detectChanges();

      const badges = fixture.nativeElement.querySelectorAll('.badge');
      expect(badges[0].textContent).toContain('instagram');
      expect(badges[1].textContent).toContain('5 posts');
      expect(badges[2].textContent).toContain('Grow Followers');
    });

    it('should show SVG icon when not generating', () => {
      const svg = fixture.nativeElement.querySelector('.btn--primary svg');
      expect(svg).toBeTruthy();
    });

    it('should show spinner and hide SVG when generating', () => {
      component.buildSeries();
      fixture.detectChanges();

      const spinner = fixture.nativeElement.querySelector('.spinner');
      expect(spinner).toBeTruthy();
      const svg = fixture.nativeElement.querySelector('.btn--primary svg');
      expect(svg).toBeFalsy();
    });

    it('should render 3 posts and 2 connectors for series length 3', () => {
      component.seriesLength = 3;
      component.buildSeries();
      vi.advanceTimersByTime(2500);
      fixture.detectChanges();

      const postCards = fixture.nativeElement.querySelectorAll('.post-card');
      expect(postCards.length).toBe(3);
      const connectors = fixture.nativeElement.querySelectorAll('.bridge-connector');
      expect(connectors.length).toBe(2);
    });

    it('should call createInIdeation for each post via button click', () => {
      const spy = vi.spyOn(component, 'createInIdeation');
      component.buildSeries();
      vi.advanceTimersByTime(2500);
      fixture.detectChanges();

      const ideationBtns = fixture.nativeElement.querySelectorAll('.post-card__actions .btn--sm');
      ideationBtns[2].click();
      expect(spy).toHaveBeenCalledWith(3);
    });

    it('should change selectedGoal via select dropdown in DOM', () => {
      const selects = fixture.nativeElement.querySelectorAll('select');
      const goalSelect = selects[0] as HTMLSelectElement;
      goalSelect.value = 'Drive Sales';
      goalSelect.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      expect(component.selectedGoal).toBe('Drive Sales');
    });

    it('should change selectedPlatform via select dropdown in DOM', () => {
      const selects = fixture.nativeElement.querySelectorAll('select');
      const platformSelect = selects[1] as HTMLSelectElement;
      platformSelect.value = 'youtube';
      platformSelect.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      expect(component.selectedPlatform).toBe('youtube');
    });

    it('should hide SVG and show spinner during generation then restore', () => {
      component.buildSeries();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.spinner')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.btn--primary svg')).toBeFalsy();

      vi.advanceTimersByTime(2500);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.spinner')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('.btn--primary svg')).toBeTruthy();
    });

    it('should render narrative arc text', () => {
      component.buildSeries();
      vi.advanceTimersByTime(2500);
      fixture.detectChanges();

      const arc = fixture.nativeElement.querySelector('.overview-card__arc');
      expect(arc.textContent).toContain('Takes the audience from awareness');
    });

    it('should render caption direction and CTA labels', () => {
      component.buildSeries();
      vi.advanceTimersByTime(2500);
      fixture.detectChanges();

      const directionLabels = fixture.nativeElement.querySelectorAll('.direction-label');
      const ctaLabels = fixture.nativeElement.querySelectorAll('.cta-label');
      expect(directionLabels.length).toBe(5);
      expect(ctaLabels.length).toBe(5);
    });
  });
});
