import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeoHashtagsComponent } from './seo-hashtags.component';
import { AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';

describe('SeoHashtagsComponent', () => {
  let component: SeoHashtagsComponent;
  let fixture: ComponentFixture<SeoHashtagsComponent>;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [SeoHashtagsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SeoHashtagsComponent);
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

    it('should have null seoData', () => {
      expect(component.seoData()).toBeNull();
    });

    it('should have reach as default active tab', () => {
      expect(component.activeTab()).toBe('reach');
    });

    it('should have empty checked items', () => {
      expect(component.checkedItems().size).toBe(0);
    });

    it('should have default selected pillar', () => {
      expect(component.selectedPillar).toBeTruthy();
    });

    it('should have default selected platform', () => {
      expect(component.selectedPlatform).toBe('instagram');
    });

    it('should have default selected goal', () => {
      expect(component.selectedGoal).toBe('Engagement');
    });

    it('should have pillar options', () => {
      expect(component.pillarOptions.length).toBeGreaterThan(0);
    });

    it('should have goal options', () => {
      expect(component.goalOptions.length).toBe(5);
    });

    it('should have platform options', () => {
      expect(component.platformOptions.length).toBe(5);
    });

    it('should have hashtag tabs', () => {
      expect(component.hashtagTabs.length).toBe(3);
      expect(component.hashtagTabs[0].id).toBe('reach');
      expect(component.hashtagTabs[1].id).toBe('niche');
      expect(component.hashtagTabs[2].id).toBe('community');
    });
  });

  describe('template rendering', () => {
    it('should render input panel with title', () => {
      const title = fixture.nativeElement.querySelector('.input-panel__title');
      expect(title).toBeTruthy();
      expect(title.textContent).toContain('SEO & Hashtag Strategy');
    });

    it('should render three select dropdowns', () => {
      const selects = fixture.nativeElement.querySelectorAll('select');
      expect(selects.length).toBe(3);
    });

    it('should render generate button', () => {
      const button = fixture.nativeElement.querySelector('.btn--primary');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Generate SEO Strategy');
    });

    it('should not show results section initially', () => {
      const results = fixture.nativeElement.querySelector('.results');
      expect(results).toBeFalsy();
    });

    it('should show SVG icon when not generating', () => {
      const svg = fixture.nativeElement.querySelector('.btn--primary svg');
      expect(svg).toBeTruthy();
    });

    it('should not show spinner when not generating', () => {
      const spinner = fixture.nativeElement.querySelector('.spinner');
      expect(spinner).toBeFalsy();
    });
  });

  describe('generate()', () => {
    it('should set isGenerating to true', () => {
      component.generate();
      expect(component.isGenerating()).toBe(true);
    });

    it('should clear previous seoData', () => {
      component.generate();
      expect(component.seoData()).toBeNull();
    });

    it('should show spinner and generating text during generation', () => {
      component.generate();
      fixture.detectChanges();
      const spinner = fixture.nativeElement.querySelector('.spinner');
      expect(spinner).toBeTruthy();
      const button = fixture.nativeElement.querySelector('.btn--primary');
      expect(button.textContent).toContain('Generating...');
      expect(button.disabled).toBe(true);
    });

    it('should set seoData after timeout', () => {
      component.generate();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      expect(component.seoData()).not.toBeNull();
      expect(component.isGenerating()).toBe(false);
    });

    it('should render results section after generation completes', () => {
      component.generate();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();
      const results = fixture.nativeElement.querySelector('.results');
      expect(results).toBeTruthy();
    });

    it('should display hashtag card with tabs', () => {
      component.generate();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();
      const tabBtns = fixture.nativeElement.querySelectorAll('.tab-btn');
      expect(tabBtns.length).toBe(3);
    });

    it('should display hashtag chips for reach tab', () => {
      component.generate();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();
      const chips = fixture.nativeElement.querySelectorAll('.hashtag-chip');
      expect(chips.length).toBe(3);
    });

    it('should display keyword chips', () => {
      component.generate();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();
      const keywords = fixture.nativeElement.querySelectorAll('.keyword-chip');
      expect(keywords.length).toBe(4);
    });

    it('should display example bio', () => {
      component.generate();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();
      const bio = fixture.nativeElement.querySelector('.example-bio__text');
      expect(bio).toBeTruthy();
      expect(bio.textContent).toContain('Helping women 40+');
    });

    it('should display checklist items', () => {
      component.generate();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();
      const items = fixture.nativeElement.querySelectorAll('.checklist-item');
      expect(items.length).toBe(8);
    });

    it('should display trending angles', () => {
      component.generate();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();
      const trending = fixture.nativeElement.querySelectorAll('.trending-item');
      expect(trending.length).toBe(2);
    });

    it('should display virality badges on trending items', () => {
      component.generate();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();
      const badges = fixture.nativeElement.querySelectorAll('.virality-badge');
      expect(badges.length).toBe(2);
    });
  });

  describe('setTab()', () => {
    it('should set active tab to niche', () => {
      component.setTab('niche');
      expect(component.activeTab()).toBe('niche');
    });

    it('should set active tab to community', () => {
      component.setTab('community');
      expect(component.activeTab()).toBe('community');
    });

    it('should set active tab back to reach', () => {
      component.setTab('niche');
      component.setTab('reach');
      expect(component.activeTab()).toBe('reach');
    });

    it('should update displayed hashtags when tab changes', () => {
      component.generate();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();

      component.setTab('niche');
      fixture.detectChanges();
      const chips = fixture.nativeElement.querySelectorAll('.hashtag-chip');
      expect(chips.length).toBe(3);
      expect(chips[0].textContent).toContain('#over40fitness');
    });

    it('should highlight the active tab button', () => {
      component.generate();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();
      const activeTabs = fixture.nativeElement.querySelectorAll('.tab-btn--active');
      expect(activeTabs.length).toBe(1);
      expect(activeTabs[0].textContent).toContain('Reach');
    });
  });

  describe('getActiveHashtags()', () => {
    it('should return empty array when seoData is null', () => {
      expect(component.getActiveHashtags()).toEqual([]);
    });

    it('should return reach hashtags by default', () => {
      component.generate();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      const hashtags = component.getActiveHashtags();
      expect(hashtags.length).toBe(3);
      expect(hashtags[0].tag).toBe('#fitness');
    });

    it('should return niche hashtags when niche tab is active', () => {
      component.generate();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      component.setTab('niche');
      const hashtags = component.getActiveHashtags();
      expect(hashtags.length).toBe(3);
      expect(hashtags[0].tag).toBe('#over40fitness');
    });

    it('should return community hashtags when community tab is active', () => {
      component.generate();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      component.setTab('community');
      const hashtags = component.getActiveHashtags();
      expect(hashtags.length).toBe(3);
      expect(hashtags[0].tag).toBe('#strongafter40');
    });
  });

  describe('toggleCheckItem()', () => {
    it('should add item to checked set', () => {
      component.toggleCheckItem(0);
      expect(component.isChecked(0)).toBe(true);
    });

    it('should remove item from checked set when toggled again', () => {
      component.toggleCheckItem(0);
      component.toggleCheckItem(0);
      expect(component.isChecked(0)).toBe(false);
    });

    it('should handle multiple checked items', () => {
      component.toggleCheckItem(0);
      component.toggleCheckItem(2);
      component.toggleCheckItem(5);
      expect(component.isChecked(0)).toBe(true);
      expect(component.isChecked(1)).toBe(false);
      expect(component.isChecked(2)).toBe(true);
      expect(component.isChecked(5)).toBe(true);
    });

    it('should render checkmark SVG for checked items in DOM', () => {
      component.generate();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();

      component.toggleCheckItem(0);
      fixture.detectChanges();
      const firstItem = fixture.nativeElement.querySelector('.checklist-item--checked');
      expect(firstItem).toBeTruthy();
      const svg = firstItem.querySelector('.checklist-checkbox svg');
      expect(svg).toBeTruthy();
    });
  });

  describe('isChecked()', () => {
    it('should return false for unchecked items', () => {
      expect(component.isChecked(0)).toBe(false);
    });

    it('should return true for checked items', () => {
      component.toggleCheckItem(3);
      expect(component.isChecked(3)).toBe(true);
    });
  });

  describe('getViralityClass()', () => {
    it('should return virality--very-high for Very High', () => {
      expect(component.getViralityClass('Very High')).toBe('virality--very-high');
    });

    it('should return virality--high for High', () => {
      expect(component.getViralityClass('High')).toBe('virality--high');
    });

    it('should return virality--medium for Medium', () => {
      expect(component.getViralityClass('Medium')).toBe('virality--medium');
    });

    it('should return empty string for unknown virality', () => {
      expect(component.getViralityClass('Low')).toBe('');
    });
  });

  describe('copyTag()', () => {
    it('should call navigator.clipboard.writeText when available', () => {
      const writeTextSpy = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextSpy },
        writable: true,
        configurable: true,
      });
      component.copyTag('#fitness');
      expect(writeTextSpy).toHaveBeenCalledWith('#fitness');
    });

    it('should not throw when clipboard is unavailable', () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      expect(() => component.copyTag('#fitness')).not.toThrow();
    });
  });

  // --- DOM interactions ---

  describe('DOM interactions', () => {
    it('should switch tab when clicking tab button in DOM', () => {
      component.generate();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();

      const tabBtns = fixture.nativeElement.querySelectorAll('.tab-btn') as NodeListOf<HTMLButtonElement>;
      // Click "Niche" tab (index 1)
      tabBtns[1].click();
      fixture.detectChanges();

      expect(component.activeTab()).toBe('niche');
      expect(tabBtns[1].classList.contains('tab-btn--active')).toBe(true);
    });

    it('should copy tag when clicking hashtag chip in DOM', () => {
      component.generate();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();

      const writeTextSpy = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextSpy },
        writable: true,
        configurable: true,
      });

      const chip = fixture.nativeElement.querySelector('.hashtag-chip') as HTMLButtonElement;
      chip.click();
      expect(writeTextSpy).toHaveBeenCalledWith('#fitness');
    });

    it('should toggle checklist item when clicking in DOM', () => {
      component.generate();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();

      const item = fixture.nativeElement.querySelector('.checklist-item') as HTMLElement;
      item.click();
      fixture.detectChanges();

      expect(component.isChecked(0)).toBe(true);
      expect(item.classList.contains('checklist-item--checked')).toBe(true);
    });

    it('should uncheck checklist item when clicking again in DOM', () => {
      component.generate();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();

      const item = fixture.nativeElement.querySelector('.checklist-item') as HTMLElement;
      item.click();
      fixture.detectChanges();
      expect(component.isChecked(0)).toBe(true);

      item.click();
      fixture.detectChanges();
      expect(component.isChecked(0)).toBe(false);
    });

    it('should trigger generate via button click in DOM', () => {
      const button = fixture.nativeElement.querySelector('.btn--primary') as HTMLButtonElement;
      button.click();
      expect(component.isGenerating()).toBe(true);

      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();
      expect(component.seoData()).not.toBeNull();
    });

    it('should render pillar options in select dropdown', () => {
      const selects = fixture.nativeElement.querySelectorAll('select');
      const pillarSelect = selects[0];
      expect(pillarSelect.options.length).toBe(component.pillarOptions.length);
    });

    it('should render platform options in select dropdown', () => {
      const selects = fixture.nativeElement.querySelectorAll('select');
      const platformSelect = selects[1];
      expect(platformSelect.options.length).toBe(5);
    });

    it('should render goal options in select dropdown', () => {
      const selects = fixture.nativeElement.querySelectorAll('select');
      const goalSelect = selects[2];
      expect(goalSelect.options.length).toBe(5);
    });

    it('should switch to community tab and display community hashtags', () => {
      component.generate();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();

      component.setTab('community');
      fixture.detectChanges();

      const chips = fixture.nativeElement.querySelectorAll('.hashtag-chip');
      expect(chips.length).toBe(3);
      expect(chips[0].textContent).toContain('#strongafter40');
    });

    it('should render virality classes correctly on trending items', () => {
      component.generate();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();

      const badges = fixture.nativeElement.querySelectorAll('.virality-badge');
      expect(badges[0].classList.contains('virality--very-high')).toBe(true);
      expect(badges[1].classList.contains('virality--high')).toBe(true);
    });

    it('should render checklist checkbox SVG only for checked items', () => {
      component.generate();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();

      // No items checked initially
      const svgs = fixture.nativeElement.querySelectorAll('.checklist-checkbox svg');
      expect(svgs.length).toBe(0);

      // Check first item
      component.toggleCheckItem(0);
      fixture.detectChanges();
      const svgsAfter = fixture.nativeElement.querySelectorAll('.checklist-checkbox svg');
      expect(svgsAfter.length).toBe(1);
    });

    it('should display trending item titles and hooks', () => {
      component.generate();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();

      const titles = fixture.nativeElement.querySelectorAll('.trending-item__title');
      expect(titles[0].textContent).toContain('Perimenopause Fitness Myths');
      const hooks = fixture.nativeElement.querySelectorAll('.hook-text');
      expect(hooks[0].textContent).toContain('Everything you were told');
    });

    it('should change selectedPillar via select dropdown', () => {
      const selects = fixture.nativeElement.querySelectorAll('select');
      const pillarSelect = selects[0] as HTMLSelectElement;
      pillarSelect.value = component.pillarOptions[1];
      pillarSelect.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      expect(component.selectedPillar).toBe(component.pillarOptions[1]);
    });

    it('should change selectedPlatform via select dropdown', () => {
      const selects = fixture.nativeElement.querySelectorAll('select');
      const platformSelect = selects[1] as HTMLSelectElement;
      platformSelect.value = 'tiktok';
      platformSelect.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      expect(component.selectedPlatform).toBe('tiktok');
    });

    it('should change selectedGoal via select dropdown', () => {
      const selects = fixture.nativeElement.querySelectorAll('select');
      const goalSelect = selects[2] as HTMLSelectElement;
      goalSelect.value = 'Reach';
      goalSelect.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      expect(component.selectedGoal).toBe('Reach');
    });

    it('should hide SVG and show spinner during generation', () => {
      component.generate();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.spinner')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.btn--primary svg')).toBeFalsy();

      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.spinner')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('.btn--primary svg')).toBeTruthy();
    });

    it('should render all keyword chips with text', () => {
      component.generate();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();

      const kwChips = fixture.nativeElement.querySelectorAll('.keyword-chip');
      expect(kwChips.length).toBe(4);
      expect(kwChips[0].textContent).toContain('perimenopause fitness');
    });

    it('should render checklist text for all items', () => {
      component.generate();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();

      const texts = fixture.nativeElement.querySelectorAll('.checklist-text');
      expect(texts.length).toBe(8);
      expect(texts[0].textContent).toContain('Open with primary keyword');
    });
  });
});
