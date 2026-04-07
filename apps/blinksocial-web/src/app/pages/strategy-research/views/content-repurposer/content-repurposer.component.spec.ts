import { TestBed } from '@angular/core/testing';
import { ContentRepurposerComponent } from './content-repurposer.component';
import { AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';

describe('ContentRepurposerComponent', () => {
  let component: ContentRepurposerComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<ContentRepurposerComponent>>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [ContentRepurposerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ContentRepurposerComponent);
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

  it('should render input textarea', () => {
    const textarea = nativeElement.querySelector('.input-panel__textarea');
    expect(textarea).toBeTruthy();
  });

  it('should render 5 platform toggle chips', () => {
    const chips = nativeElement.querySelectorAll('.platform-chip');
    expect(chips.length).toBe(5);
  });

  it('should render repurpose button', () => {
    const btn = nativeElement.querySelector('.btn--primary') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Repurpose with AI');
  });

  it('should not show output grid initially', () => {
    expect(nativeElement.querySelector('.output-grid')).toBeFalsy();
  });

  // --- Initial state ---

  it('should initialize with default values', () => {
    expect(component.sourceContent()).toBe('');
    expect(component.isGenerating()).toBe(false);
    expect(component.outputs().length).toBe(0);
    expect(component.copiedIndex()).toBeNull();
    expect(component.selectedPlatforms().has('instagram')).toBe(true);
    expect(component.selectedPlatforms().has('tiktok')).toBe(true);
    expect(component.selectedPlatforms().has('youtube')).toBe(false);
  });

  // --- Platform selection ---

  it('should check if a platform is selected', () => {
    expect(component.isPlatformSelected('instagram')).toBe(true);
    expect(component.isPlatformSelected('youtube')).toBe(false);
  });

  it('should toggle platform on and off', () => {
    component.togglePlatform('youtube');
    expect(component.isPlatformSelected('youtube')).toBe(true);

    component.togglePlatform('youtube');
    expect(component.isPlatformSelected('youtube')).toBe(false);
  });

  it('should deselect an already selected platform', () => {
    expect(component.isPlatformSelected('instagram')).toBe(true);
    component.togglePlatform('instagram');
    expect(component.isPlatformSelected('instagram')).toBe(false);
  });

  it('should apply active class to selected platform chips', () => {
    fixture.detectChanges();
    const chips = nativeElement.querySelectorAll('.platform-chip');
    const activeChips = nativeElement.querySelectorAll('.platform-chip--active');
    expect(activeChips.length).toBe(2); // instagram and tiktok
    expect(chips.length).toBe(5);
  });

  // --- Source content ---

  it('should update source content', () => {
    component.updateSource('Test content');
    expect(component.sourceContent()).toBe('Test content');
  });

  // --- Repurpose ---

  it('should not repurpose with empty source content', () => {
    component.sourceContent.set('   ');
    component.repurpose();
    expect(component.isGenerating()).toBe(false);
    expect(component.outputs().length).toBe(0);
  });

  it('should repurpose content with selected platforms (timer-based)', () => {
    component.sourceContent.set('Test blog post content here');
    component.repurpose();
    expect(component.isGenerating()).toBe(true);
    expect(component.outputs().length).toBe(0);

    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.isGenerating()).toBe(false);
    expect(component.outputs().length).toBeGreaterThan(0);
  });

  it('should filter outputs by selected platforms', () => {
    component.selectedPlatforms.set(new Set(['instagram']));
    component.sourceContent.set('Test content');
    component.repurpose();

    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    const outputs = component.outputs();
    outputs.forEach(o => {
      expect(o.platform).toBe('instagram');
    });
  });

  it('should fall back to first 2 outputs when no matching platforms', () => {
    component.selectedPlatforms.set(new Set());
    component.sourceContent.set('Test content');
    component.repurpose();

    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.outputs().length).toBe(2);
  });

  it('should show spinner and disable button during generation', () => {
    component.sourceContent.set('Test content');
    component.repurpose();
    fixture.detectChanges();

    const btn = nativeElement.querySelector('.btn--primary') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toContain('Repurposing...');
    expect(nativeElement.querySelector('.spinner')).toBeTruthy();

    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();

    expect(btn.disabled).toBe(false);
    expect(btn.textContent).toContain('Repurpose with AI');
  });

  it('should disable repurpose button when source is empty', () => {
    fixture.detectChanges();
    const btn = nativeElement.querySelector('.btn--primary') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('should render output cards after repurposing', () => {
    component.sourceContent.set('Test content');
    component.repurpose();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();

    const outputCards = nativeElement.querySelectorAll('.output-card');
    expect(outputCards.length).toBeGreaterThan(0);
    expect(nativeElement.querySelector('.output-card__platform')).toBeTruthy();
    expect(nativeElement.querySelector('.output-card__format')).toBeTruthy();
    expect(nativeElement.querySelector('.output-card__text')).toBeTruthy();
  });

  // --- Copy content ---

  it('should set copiedIndex and reset after timeout', () => {
    component.sourceContent.set('Test content');
    component.repurpose();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);

    // Mock clipboard
    Object.assign(navigator, { clipboard: { writeText: vi.fn() } });

    component.copyContent(0);
    expect(component.copiedIndex()).toBe(0);

    vi.advanceTimersByTime(2000);
    expect(component.copiedIndex()).toBeNull();
  });

  it('should not crash when copying invalid index', () => {
    component.copyContent(99);
    expect(component.copiedIndex()).toBeNull();
  });

  it('should show "Copied!" text when copiedIndex matches', () => {
    component.sourceContent.set('Test content');
    component.repurpose();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);

    Object.assign(navigator, { clipboard: { writeText: vi.fn() } });
    component.copyContent(0);
    fixture.detectChanges();

    const copyBtn = nativeElement.querySelector('.output-card__actions .btn--secondary');
    expect(copyBtn?.textContent).toContain('Copied!');
  });

  // --- Save as idea ---

  it('should call saveAsIdea without error', () => {
    expect(() => component.saveAsIdea(0)).not.toThrow();
  });

  // --- platformOptions ---

  it('should have 5 platform options', () => {
    expect(component.platformOptions.length).toBe(5);
    expect(component.platformOptions.map(p => p.id)).toEqual(['instagram', 'tiktok', 'youtube', 'linkedin', 'facebook']);
  });

  // --- DOM interactions ---

  it('should toggle platform when clicking platform chip in DOM', () => {
    const chips = nativeElement.querySelectorAll('.platform-chip') as NodeListOf<HTMLButtonElement>;
    // youtube is index 2, not selected by default
    expect(component.isPlatformSelected('youtube')).toBe(false);
    chips[2].click();
    fixture.detectChanges();
    expect(component.isPlatformSelected('youtube')).toBe(true);
    expect(chips[2].classList.contains('platform-chip--active')).toBe(true);
  });

  it('should deselect platform when clicking active platform chip in DOM', () => {
    const chips = nativeElement.querySelectorAll('.platform-chip') as NodeListOf<HTMLButtonElement>;
    // instagram is index 0, selected by default
    expect(component.isPlatformSelected('instagram')).toBe(true);
    chips[0].click();
    fixture.detectChanges();
    expect(component.isPlatformSelected('instagram')).toBe(false);
  });

  it('should trigger repurpose via button click in DOM', () => {
    component.sourceContent.set('Test content');
    fixture.detectChanges();

    const btn = nativeElement.querySelector('.btn--primary') as HTMLButtonElement;
    btn.click();
    expect(component.isGenerating()).toBe(true);

    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();
    expect(component.outputs().length).toBeGreaterThan(0);
  });

  it('should render Save as Idea button for each output card', () => {
    component.sourceContent.set('Test content');
    component.repurpose();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();

    const ghostBtns = nativeElement.querySelectorAll('.btn--ghost');
    expect(ghostBtns.length).toBe(component.outputs().length);
  });

  it('should call saveAsIdea when clicking Save as Idea button in DOM', () => {
    component.sourceContent.set('Test content');
    component.repurpose();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();

    const spy = vi.spyOn(component, 'saveAsIdea');
    const ghostBtn = nativeElement.querySelector('.btn--ghost') as HTMLButtonElement;
    ghostBtn.click();
    expect(spy).toHaveBeenCalledWith(0);
  });

  it('should call copyContent when clicking Copy button in DOM', () => {
    component.sourceContent.set('Test content');
    component.repurpose();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();

    Object.assign(navigator, { clipboard: { writeText: vi.fn() } });

    const copyBtn = nativeElement.querySelector('.output-card__actions .btn--secondary') as HTMLButtonElement;
    copyBtn.click();
    fixture.detectChanges();

    expect(component.copiedIndex()).toBe(0);
  });

  it('should show SVG icon when not generating', () => {
    component.sourceContent.set('Test content');
    fixture.detectChanges();
    const svg = nativeElement.querySelector('.btn--primary svg');
    expect(svg).toBeTruthy();
  });

  it('should hide SVG icon and show spinner when generating', () => {
    component.sourceContent.set('Test content');
    component.repurpose();
    fixture.detectChanges();

    const svg = nativeElement.querySelector('.btn--primary svg');
    expect(svg).toBeFalsy();
    const spinner = nativeElement.querySelector('.spinner');
    expect(spinner).toBeTruthy();
  });

  it('should not show output grid when outputs is empty', () => {
    expect(nativeElement.querySelector('.output-grid')).toBeFalsy();
  });

  it('should render output card platform and format', () => {
    component.sourceContent.set('Test content');
    component.repurpose();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();

    const platforms = nativeElement.querySelectorAll('.output-card__platform');
    const formats = nativeElement.querySelectorAll('.output-card__format');
    expect(platforms.length).toBeGreaterThan(0);
    expect(formats.length).toBeGreaterThan(0);
  });

  it('should show "Copy" text when copiedIndex does not match', () => {
    component.sourceContent.set('Test content');
    component.repurpose();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();

    const copyBtn = nativeElement.querySelector('.output-card__actions .btn--secondary');
    expect(copyBtn?.textContent).toContain('Copy');
  });

  it('should handle copyContent with clipboard unavailable', () => {
    component.sourceContent.set('Test content');
    component.repurpose();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);

    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    // Should not throw, copiedIndex should still be set
    expect(() => component.copyContent(0)).not.toThrow();
    expect(component.copiedIndex()).toBe(0);
  });

  it('should generate outputs for multiple selected platforms', () => {
    component.selectedPlatforms.set(new Set(['instagram', 'tiktok', 'youtube', 'linkedin']));
    component.sourceContent.set('Test content');
    component.repurpose();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);

    expect(component.outputs().length).toBe(4);
  });

  it('should render pre element with content text', () => {
    component.sourceContent.set('Test content');
    component.repurpose();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();

    const preElement = nativeElement.querySelector('.output-card__text');
    expect(preElement).toBeTruthy();
    expect(preElement?.textContent?.length).toBeGreaterThan(0);
  });

  it('should trigger updateSource via textarea ngModelChange in DOM', () => {
    const textarea = nativeElement.querySelector('.input-panel__textarea') as HTMLTextAreaElement;
    textarea.value = 'DOM typed content';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.sourceContent()).toBe('DOM typed content');
  });

  it('should enable repurpose button after typing in textarea via DOM', () => {
    const textarea = nativeElement.querySelector('.input-panel__textarea') as HTMLTextAreaElement;
    textarea.value = 'Some content';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const btn = nativeElement.querySelector('.btn--primary') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('should render output cards with all action buttons', () => {
    component.sourceContent.set('Test content');
    component.repurpose();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();

    const outputCards = nativeElement.querySelectorAll('.output-card');
    outputCards.forEach((card: Element) => {
      expect(card.querySelector('.btn--secondary')).toBeTruthy(); // Copy
      expect(card.querySelector('.btn--ghost')).toBeTruthy(); // Save as Idea
    });
  });
});
