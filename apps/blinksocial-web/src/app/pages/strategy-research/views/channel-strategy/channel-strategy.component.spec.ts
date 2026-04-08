import { TestBed } from '@angular/core/testing';
import { ChannelStrategyComponent } from './channel-strategy.component';
import { AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';

describe('ChannelStrategyComponent', () => {
  let component: ChannelStrategyComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<ChannelStrategyComponent>>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [ChannelStrategyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChannelStrategyComponent);
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

  it('should render 5 platform cards', () => {
    const cards = nativeElement.querySelectorAll('.platform-card');
    expect(cards.length).toBe(5);
  });

  it('should render section header', () => {
    expect(nativeElement.querySelector('.section-header h2')?.textContent).toContain('Channel Strategy');
  });

  it('should mark inactive platforms with inactive class', () => {
    const inactiveCards = nativeElement.querySelectorAll('.platform-card.inactive');
    expect(inactiveCards.length).toBe(2); // facebook and linkedin
  });

  it('should render platform names from platformLabels', () => {
    const names = nativeElement.querySelectorAll('.platform-name');
    const nameTexts = Array.from(names).map(n => n.textContent?.trim());
    expect(nameTexts).toContain('Instagram');
    expect(nameTexts).toContain('TikTok');
    expect(nameTexts).toContain('YouTube');
    expect(nameTexts).toContain('Facebook');
    expect(nameTexts).toContain('LinkedIn');
  });

  // --- Initial state ---

  it('should have instagram expanded by default', () => {
    expect(component.isExpanded('instagram')).toBe(true);
    expect(component.isExpanded('tiktok')).toBe(false);
  });

  it('should have 3 active and 2 inactive channels', () => {
    const active = component.channels().filter(c => c.active);
    const inactive = component.channels().filter(c => !c.active);
    expect(active.length).toBe(3);
    expect(inactive.length).toBe(2);
  });

  // --- Expand / Collapse ---

  it('should toggle expand for a platform', () => {
    expect(component.isExpanded('tiktok')).toBe(false);
    component.toggleExpand('tiktok');
    expect(component.isExpanded('tiktok')).toBe(true);
    component.toggleExpand('tiktok');
    expect(component.isExpanded('tiktok')).toBe(false);
  });

  it('should show platform-content when expanded', () => {
    // Instagram is expanded by default
    expect(nativeElement.querySelector('.platform-content')).toBeTruthy();
  });

  it('should show strategy form for active expanded platform', () => {
    // Instagram is active and expanded
    expect(nativeElement.querySelector('.strategy-form')).toBeTruthy();
  });

  it('should show inactive message for inactive expanded platform', () => {
    component.toggleExpand('facebook');
    fixture.detectChanges();

    const inactiveMsg = nativeElement.querySelector('.inactive-message');
    expect(inactiveMsg).toBeTruthy();
    expect(inactiveMsg?.textContent).toContain('Mark as active');
  });

  it('should apply rotated class to chevron when expanded', () => {
    fixture.detectChanges();
    const chevron = nativeElement.querySelector('.chevron.rotated');
    expect(chevron).toBeTruthy();
  });

  // --- Toggle active ---

  it('should toggle platform active state', () => {
    const fb = component.channels().find(c => c.platform === 'facebook')!;
    expect(fb.active).toBe(false);

    component.toggleActive('facebook');
    const updated = component.channels().find(c => c.platform === 'facebook')!;
    expect(updated.active).toBe(true);

    component.toggleActive('facebook');
    const toggled = component.channels().find(c => c.platform === 'facebook')!;
    expect(toggled.active).toBe(false);
  });

  // --- Update channel ---

  it('should update channel field', () => {
    component.updateChannel('instagram', 'role', 'New Role');
    const ig = component.channels().find(c => c.platform === 'instagram')!;
    expect(ig.role).toBe('New Role');
  });

  it('should update posting cadence', () => {
    component.updateChannel('tiktok', 'postingCadence', '7x/week');
    const tk = component.channels().find(c => c.platform === 'tiktok')!;
    expect(tk.postingCadence).toBe('7x/week');
  });

  it('should update tone adjustment', () => {
    component.updateChannel('instagram', 'toneAdjustment', 'Very warm');
    const ig = component.channels().find(c => c.platform === 'instagram')!;
    expect(ig.toneAdjustment).toBe('Very warm');
  });

  it('should update notes', () => {
    component.updateChannel('instagram', 'notes', 'Some notes');
    const ig = component.channels().find(c => c.platform === 'instagram')!;
    expect(ig.notes).toBe('Some notes');
  });

  it('should update primary audience', () => {
    component.updateChannel('instagram', 'primaryAudience', 'New Audience');
    const ig = component.channels().find(c => c.platform === 'instagram')!;
    expect(ig.primaryAudience).toBe('New Audience');
  });

  // --- Content types ---

  it('should check if content type is active', () => {
    const ig = component.getChannel('instagram');
    expect(component.isContentTypeActive(ig, 'Reels')).toBe(true);
    expect(component.isContentTypeActive(ig, 'Lives')).toBe(false);
  });

  it('should toggle content type on', () => {
    component.toggleContentType('instagram', 'Lives');
    const ig = component.getChannel('instagram');
    expect(ig.primaryContentTypes).toContain('Lives');
  });

  it('should toggle content type off', () => {
    component.toggleContentType('instagram', 'Reels');
    const ig = component.getChannel('instagram');
    expect(ig.primaryContentTypes).not.toContain('Reels');
  });

  it('should render content type chip toggles when expanded', () => {
    fixture.detectChanges();
    const chipToggles = nativeElement.querySelectorAll('.chip-toggle');
    expect(chipToggles.length).toBe(10); // 10 content type options
  });

  // --- getChannel ---

  it('should get channel by platform', () => {
    const ig = component.getChannel('instagram');
    expect(ig.platform).toBe('instagram');
    expect(ig.active).toBe(true);
  });

  // --- AI Generate ---

  it('should run AI generate for a platform (timer-based)', () => {
    component.aiGenerate('facebook');
    expect(component.generatingPlatform()).toBe('facebook');

    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.generatingPlatform()).toBeNull();

    const fb = component.getChannel('facebook');
    expect(fb.active).toBe(true);
    expect(fb.role).toContain('AI-generated role for Facebook');
    expect(fb.primaryContentTypes).toEqual(['Reels', 'Stories', 'Tutorials']);
    expect(fb.toneAdjustment).toBe('Warm, authentic, and encouraging');
    expect(fb.postingCadence).toBe('3x/week');
    expect(fb.notes).toContain('AI-generated strategy');
  });

  it('should show spinner and "Generating..." during AI generation', () => {
    component.aiGenerate('instagram');
    fixture.detectChanges();

    const genBtn = nativeElement.querySelector('.btn-ai-generate') as HTMLButtonElement;
    expect(genBtn.disabled).toBe(true);
    expect(genBtn.textContent).toContain('Generating...');
    expect(genBtn.querySelector('.spinner')).toBeTruthy();

    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();

    expect(genBtn.disabled).toBe(false);
    expect(genBtn.textContent).toContain('AI Generate');
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

  it('should have 10 content type options', () => {
    expect(component.contentTypeOptions.length).toBe(10);
  });

  // --- DOM interactions for template function coverage ---

  it('should toggle expand via platform header click in DOM', () => {
    const headers = nativeElement.querySelectorAll('.platform-header') as NodeListOf<HTMLElement>;
    // Click tiktok header (index 1) to expand
    headers[1].click();
    fixture.detectChanges();
    expect(component.isExpanded('tiktok')).toBe(true);
    expect(nativeElement.querySelectorAll('.platform-content').length).toBe(2); // instagram + tiktok

    // Click again to collapse
    headers[1].click();
    fixture.detectChanges();
    expect(component.isExpanded('tiktok')).toBe(false);
  });

  it('should toggle active via checkbox change in DOM', () => {
    const checkbox = nativeElement.querySelector('.toggle-switch input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox).toBeTruthy();
    checkbox.click();
    fixture.detectChanges();
    // Instagram was active, now should be inactive
    expect(component.channels().find(c => c.platform === 'instagram')!.active).toBe(false);
  });

  it('should trigger AI generate via button click in DOM', () => {
    const genBtn = nativeElement.querySelector('.btn-ai-generate') as HTMLButtonElement;
    genBtn.click();
    expect(component.generatingPlatform()).toBe('instagram');
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.generatingPlatform()).toBeNull();
  });

  it('should update role via input ngModelChange in DOM', () => {
    const roleInput = nativeElement.querySelector('.strategy-form input[type="text"]') as HTMLInputElement;
    roleInput.value = 'Updated role via DOM';
    roleInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.channels().find(c => c.platform === 'instagram')!.role).toBe('Updated role via DOM');
  });

  it('should update toneAdjustment via textarea ngModelChange in DOM', () => {
    const textareas = nativeElement.querySelectorAll('.strategy-form textarea') as NodeListOf<HTMLTextAreaElement>;
    textareas[0].value = 'Updated tone via DOM';
    textareas[0].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.channels().find(c => c.platform === 'instagram')!.toneAdjustment).toBe('Updated tone via DOM');
  });

  it('should update notes via textarea ngModelChange in DOM', () => {
    const textareas = nativeElement.querySelectorAll('.strategy-form textarea') as NodeListOf<HTMLTextAreaElement>;
    textareas[1].value = 'Updated notes via DOM';
    textareas[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.channels().find(c => c.platform === 'instagram')!.notes).toBe('Updated notes via DOM');
  });

  it('should toggle content type via chip toggle click in DOM', () => {
    const chips = nativeElement.querySelectorAll('.chip-toggle') as NodeListOf<HTMLButtonElement>;
    // Find a chip that is not active for instagram (e.g. "Lives")
    const livesChip = Array.from(chips).find(c => c.textContent?.trim() === 'Lives');
    expect(livesChip).toBeTruthy();
    livesChip!.click();
    fixture.detectChanges();
    expect(component.channels().find(c => c.platform === 'instagram')!.primaryContentTypes).toContain('Lives');
  });

  it('should show inactive message when expanding an inactive platform via DOM', () => {
    // Click facebook header to expand (index 3)
    const headers = nativeElement.querySelectorAll('.platform-header') as NodeListOf<HTMLElement>;
    headers[3].click();
    fixture.detectChanges();
    const inactiveMsg = nativeElement.querySelector('.inactive-message');
    expect(inactiveMsg).toBeTruthy();
  });

  it('should stop propagation and generate via AI button within actions', () => {
    // Expand tiktok first
    component.toggleExpand('tiktok');
    fixture.detectChanges();

    const genBtns = nativeElement.querySelectorAll('.btn-ai-generate') as NodeListOf<HTMLButtonElement>;
    // Click tiktok generate button (index 1)
    genBtns[1].click();
    expect(component.generatingPlatform()).toBe('tiktok');
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();
  });

  it('should update primaryAudience via input ngModelChange in DOM', () => {
    const inputs = nativeElement.querySelectorAll('.strategy-form input[type="text"]') as NodeListOf<HTMLInputElement>;
    // primaryAudience is the 3rd text input (role, postingCadence, primaryAudience)
    inputs[2].value = 'Updated audience via DOM';
    inputs[2].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.channels().find(c => c.platform === 'instagram')!.primaryAudience).toBe('Updated audience via DOM');
  });

  it('should update primaryGoal via input ngModelChange in DOM', () => {
    const inputs = nativeElement.querySelectorAll('.strategy-form input[type="text"]') as NodeListOf<HTMLInputElement>;
    // primaryGoal is the 4th text input (role, postingCadence, primaryAudience, primaryGoal)
    inputs[3].value = 'Engagement & Growth';
    inputs[3].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.channels().find(c => c.platform === 'instagram')!.primaryGoal).toBe('Engagement & Growth');
  });

  it('should render the Strategy Notes label', () => {
    const labels = Array.from(nativeElement.querySelectorAll('.form-group span')).map(s => s.textContent?.trim());
    expect(labels).toContain('Strategy Notes');
    expect(labels).toContain('Primary Goal');
  });

  it('should update postingCadence via input ngModelChange in DOM', () => {
    const inputs = nativeElement.querySelectorAll('.strategy-form input[type="text"]') as NodeListOf<HTMLInputElement>;
    inputs[1].value = '10x/week';
    inputs[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.channels().find(c => c.platform === 'instagram')!.postingCadence).toBe('10x/week');
  });

  it('should render active chip toggles with correct active class', () => {
    const activeChips = nativeElement.querySelectorAll('.chip-toggle.active');
    // Instagram has ['Reels', 'Stories', 'Carousels'] = 3 active
    expect(activeChips.length).toBe(3);
  });
});
