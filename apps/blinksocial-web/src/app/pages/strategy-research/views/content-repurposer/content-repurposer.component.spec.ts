import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ContentRepurposerComponent } from './content-repurposer.component';
import { AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';

describe('ContentRepurposerComponent', () => {
  let fixture: ComponentFixture<ContentRepurposerComponent>;
  let component: ContentRepurposerComponent;
  let nativeElement: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ContentRepurposerComponent] });
    fixture = TestBed.createComponent(ContentRepurposerComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (component.showRegenerateDialog()) component.closeRegenerateDialog();
    fixture.destroy();
    document.body.style.overflow = '';
  });

  function fillSourceAndRun() {
    vi.useFakeTimers();
    component.updateSource(0, 'Some source content');
    component.repurpose();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();
  }

  it('creates with default state', () => {
    expect(component).toBeTruthy();
    expect(component.sources()).toEqual(['']);
    expect(component.selectedPlatforms().size).toBe(5);
    expect(component.output()).toBeNull();
    expect(component.canRepurpose()).toBe(false);
  });

  it('renders the input panel and disables Repurpose until source is filled', () => {
    const btn = nativeElement.querySelector('.btn-repurpose') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.disabled).toBe(true);
    component.updateSource(0, 'hello');
    fixture.detectChanges();
    expect(btn.disabled).toBe(false);
  });

  it('addSource caps at 3 and removeSource shrinks the list', () => {
    component.addSource();
    component.addSource();
    component.addSource();
    expect(component.sources().length).toBe(3);
    component.removeSource(1);
    expect(component.sources().length).toBe(2);
  });

  it('updateSource updates the indexed value', () => {
    component.addSource();
    component.updateSource(1, 'second');
    expect(component.sources()[1]).toBe('second');
  });

  it('formatChars formats with thousands separator', () => {
    expect(component.formatChars('a'.repeat(1234))).toBe('1,234');
  });

  it('togglePlatform / togglePillar / toggleSegment flip set membership', () => {
    component.togglePlatform('instagram');
    expect(component.isPlatformSelected('instagram')).toBe(false);
    component.togglePlatform('instagram');
    expect(component.isPlatformSelected('instagram')).toBe(true);

    const pillarId = component.pillars()[0].id;
    component.togglePillar(pillarId);
    expect(component.isPillarSelected(pillarId)).toBe(true);
    component.togglePillar(pillarId);
    expect(component.isPillarSelected(pillarId)).toBe(false);

    const segmentId = component.segments()[0].id;
    component.toggleSegment(segmentId);
    expect(component.isSegmentSelected(segmentId)).toBe(true);
    component.toggleSegment(segmentId);
    expect(component.isSegmentSelected(segmentId)).toBe(false);
  });

  it('repurpose populates output, auto-selects pillars+segment, builds card titles', () => {
    fillSourceAndRun();
    expect(component.output()).not.toBeNull();
    expect(component.isGenerating()).toBe(false);
    expect(component.cards().length).toBe(7);
    expect(component.selectedPillarIds().size).toBe(2);
    expect(component.selectedSegmentIds().size).toBe(1);
    expect(Object.keys(component.cardTitles()).length).toBe(7);
    vi.useRealTimers();
  });

  it('renders cards grid with platform badges after a run', () => {
    fillSourceAndRun();
    expect(nativeElement.querySelectorAll('.cards-grid .output-card').length).toBe(7);
    expect(nativeElement.querySelectorAll('.card-badge.badge--instagram').length).toBeGreaterThan(0);
    vi.useRealTimers();
  });

  it('dismissCard removes a card from visibleCards; restoreAll brings them back', () => {
    fillSourceAndRun();
    const id = component.cards()[0].key;
    component.dismissCard(id);
    expect(component.visibleCards().some(c => c.key === id)).toBe(false);
    component.restoreAll();
    expect(component.visibleCards().length).toBe(7);
    vi.useRealTimers();
  });

  it('shows the all-dismissed restore link when every card is dismissed', () => {
    fillSourceAndRun();
    for (const c of component.cards()) component.dismissCard(c.key);
    fixture.detectChanges();
    expect(nativeElement.querySelector('.all-dismissed')).toBeTruthy();
    const link = nativeElement.querySelector('.restore-all-link') as HTMLButtonElement;
    link.click();
    fixture.detectChanges();
    expect(component.visibleCards().length).toBe(7);
    vi.useRealTimers();
  });

  it('saveCard sets a title error when blank and saves when non-blank', () => {
    fillSourceAndRun();
    const card = component.cards()[0];
    component.setCardTitle(card.key, '   ');
    component.saveCard(card);
    expect(component.titleErrors().has(card.key)).toBe(true);
    expect(component.savedCards().has(card.key)).toBe(false);
    component.setCardTitle(card.key, 'Real title');
    component.saveCard(card);
    expect(component.savedCards().has(card.key)).toBe(true);
    expect(component.titleErrors().has(card.key)).toBe(false);
    vi.useRealTimers();
  });

  it('saveAllCards saves every visible card with a non-blank title', () => {
    fillSourceAndRun();
    component.saveAllCards();
    expect(component.unsavedCount()).toBe(0);
    vi.useRealTimers();
  });

  it('copyCard sets copiedCard then clears it after the timer', () => {
    fillSourceAndRun();
    const card = component.cards()[0];
    component.copyCard(card);
    expect(component.copiedCard()).toBe(card.key);
    vi.advanceTimersByTime(2000);
    expect(component.copiedCard()).toBeNull();
    vi.useRealTimers();
  });

  it('hasPendingChanges flips after toggling a pillar post-run', () => {
    fillSourceAndRun();
    expect(component.hasPendingChanges()).toBe(false);
    const otherPillar = component.pillars().find(p => !component.isPillarSelected(p.id));
    if (otherPillar) component.togglePillar(otherPillar.id);
    expect(component.hasPendingChanges()).toBe(true);
    vi.useRealTimers();
  });

  it('confirmRegenerate moves saved cards into savedIdeaRecords and runs again', () => {
    fillSourceAndRun();
    const first = component.cards()[0];
    component.setCardTitle(first.key, 'Keep this one');
    component.saveCard(first);
    expect(component.savedCards().size).toBe(1);
    component.openRegenerateDialog();
    expect(component.showRegenerateDialog()).toBe(true);
    component.confirmRegenerate();
    expect(component.showRegenerateDialog()).toBe(false);
    expect(component.savedIdeaRecords().length).toBe(1);
    expect(component.savedCards().size).toBe(0);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.output()).not.toBeNull();
    vi.useRealTimers();
  });

  it('openRegenerateDialog teleports the modal to body and closeRegenerateDialog tears it down', () => {
    component.openRegenerateDialog();
    fixture.detectChanges();
    expect(document.body.querySelector('.app-modal')).toBeTruthy();
    component.closeRegenerateDialog();
    fixture.detectChanges();
    expect(document.body.querySelector('.app-modal')).toBeNull();
  });

  it('pillarColor / pillarName / segmentName fall back when not found', () => {
    expect(component.pillarColor('missing')).toBe('var(--blink-on-surface-muted)');
    expect(component.pillarName('missing')).toBe('missing');
    expect(component.segmentName('missing')).toBe('missing');
  });

  it('renders the loading card while generating and the empty state otherwise', () => {
    expect(nativeElement.querySelector('.empty-state')).toBeTruthy();
    vi.useFakeTimers();
    component.updateSource(0, 'hi');
    component.repurpose();
    fixture.detectChanges();
    expect(nativeElement.querySelector('.loading-card')).toBeTruthy();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();
    expect(nativeElement.querySelector('.loading-card')).toBeNull();
    vi.useRealTimers();
  });

  it('repurpose is a no-op when no source is filled', () => {
    component.repurpose();
    expect(component.isGenerating()).toBe(false);
    expect(component.output()).toBeNull();
  });

  it('addSource refuses to add a 4th entry', () => {
    component.addSource();
    component.addSource();
    component.addSource();
    component.addSource();
    expect(component.sources().length).toBe(3);
  });

  it('saveCard treats a missing title entry as blank', () => {
    fillSourceAndRun();
    const card = component.cards()[0];
    component.cardTitles.set({});
    component.saveCard(card);
    expect(component.titleErrors().has(card.key)).toBe(true);
    expect(component.savedCards().has(card.key)).toBe(false);
    vi.useRealTimers();
  });

  it('saveAllCards skips already-saved cards', () => {
    fillSourceAndRun();
    const first = component.cards()[0];
    component.setCardTitle(first.key, 'Locked');
    component.saveCard(first);
    component.saveAllCards();
    expect(component.savedCards().has(first.key)).toBe(true);
    expect(component.unsavedCount()).toBe(0);
    vi.useRealTimers();
  });

  it('confirmRegenerate produces no new records when nothing was saved', () => {
    fillSourceAndRun();
    component.confirmRegenerate();
    expect(component.savedIdeaRecords().length).toBe(0);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.output()).not.toBeNull();
    vi.useRealTimers();
  });

  it('confirmRegenerate falls back to card label when title was cleared', () => {
    fillSourceAndRun();
    const first = component.cards()[0];
    component.setCardTitle(first.key, 'Real');
    component.saveCard(first);
    component.cardTitles.update(m => ({ ...m, [first.key]: '' }));
    component.confirmRegenerate();
    expect(component.savedIdeaRecords()[0].title).toBe(first.label);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    vi.useRealTimers();
  });

  it('copyCard timer no-op when copiedCard moved to a different card', () => {
    fillSourceAndRun();
    const a = component.cards()[0];
    const b = component.cards()[1];
    component.copyCard(a);
    component.copyCard(b);
    vi.advanceTimersByTime(2000);
    expect(component.copiedCard()).toBeNull();
    vi.useRealTimers();
  });
});
