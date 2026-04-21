import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IdeaSectionComponent } from './idea-section.component';
import { ContentCreateStore } from '../content-create.store';
import { AI_SIMULATION_DELAY_MS } from '../../../content.constants';
import type { ContentPillar, AudienceSegment } from '../../../content.types';

const PILLARS: ContentPillar[] = [
  { id: 'p1', name: 'Alpha', description: '', color: '#111' },
  { id: 'p2', name: 'Beta', description: '', color: '#222' },
  { id: 'p3', name: 'Gamma', description: '', color: '#333' },
];
const SEGMENTS: AudienceSegment[] = [];

describe('IdeaSectionComponent', () => {
  let fixture: ComponentFixture<IdeaSectionComponent>;
  let store: ContentCreateStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [IdeaSectionComponent],
      providers: [ContentCreateStore],
    });
    store = TestBed.inject(ContentCreateStore);
    store.setContext(PILLARS, SEGMENTS);
    fixture = TestBed.createComponent(IdeaSectionComponent);
    fixture.detectChanges();
  });

  it('renders the Quick Add title field in manual mode by default', () => {
    const input: HTMLInputElement | null = fixture.nativeElement.querySelector('#idea-title');
    expect(input).not.toBeNull();
  });

  it('typing into the title field updates the store', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#idea-title');
    input.value = 'Hello';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(store.state().title).toBe('Hello');
  });

  it('switching to generate mode hides the title field and shows focus-pillar chips', () => {
    const generateBtn: HTMLButtonElement = fixture.nativeElement.querySelectorAll('.mode-toggle-btn')[1];
    generateBtn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#idea-title')).toBeNull();
    const chips = fixture.nativeElement.querySelectorAll('.chip');
    expect(chips.length).toBe(PILLARS.length);
  });

  it('enforces max focus pillars (MAX_FOCUS_PILLARS)', () => {
    store.setIdeaMode('generate');
    fixture.detectChanges();
    const chips: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('.chip');
    chips[0].click();
    chips[1].click();
    fixture.detectChanges();
    expect(store.state().generatePillarIds.length).toBe(2);
    const thirdChip = chips[2];
    expect(thirdChip.disabled).toBe(true);
  });

  it('generate button is disabled without focus pillars', () => {
    store.setIdeaMode('generate');
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-generate');
    expect(btn.disabled).toBe(true);
  });

  it('clicking generate triggers AI and shows spinner, then ideas render', () => {
    vi.useFakeTimers();
    try {
      store.setIdeaMode('generate');
      store.patch({ generatePillarIds: ['p1'] });
      fixture.detectChanges();
      const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-generate');
      btn.click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.spinner')).not.toBeNull();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();
      const cards = fixture.nativeElement.querySelectorAll('.idea-card');
      expect(cards.length).toBe(6);
    } finally {
      vi.useRealTimers();
    }
  });

  it('clicking an idea card toggles selection', () => {
    store.setIdeaMode('generate');
    store.patch({
      generatedIdeas: [
        { id: 'gi-a', title: 'A', rationale: 'r', pillarId: 'p1' },
      ],
    });
    fixture.detectChanges();
    const card: HTMLButtonElement = fixture.nativeElement.querySelector('.idea-card');
    card.click();
    fixture.detectChanges();
    expect(store.state().selectedGeneratedIds).toEqual(['gi-a']);
    card.click();
    fixture.detectChanges();
    expect(store.state().selectedGeneratedIds).toEqual([]);
  });

  it('description input in manual mode writes to store', () => {
    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('#idea-description');
    textarea.value = 'A short blurb';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(store.state().description).toBe('A short blurb');
  });

  it('toggleFocusPillar deselects an already-selected pillar even at the limit', () => {
    store.setIdeaMode('generate');
    store.patch({ generatePillarIds: ['p1', 'p2'] });
    fixture.detectChanges();
    // At limit (2/2) — clicking an already-selected pillar should deselect it
    const comp = fixture.componentInstance as unknown as {
      toggleFocusPillar: (id: string) => void;
    };
    comp.toggleFocusPillar('p1');
    expect(store.state().generatePillarIds).toEqual(['p2']);
  });

  it('pillarName returns the pillar name for an id', () => {
    const comp = fixture.componentInstance as unknown as {
      pillarName: (id: string) => string;
    };
    expect(comp.pillarName('p1')).toBe('Alpha');
    expect(comp.pillarName('unknown')).toBe('');
  });

  it('setMode toggles idea mode', () => {
    const comp = fixture.componentInstance as unknown as {
      setMode: (m: 'manual' | 'generate') => void;
    };
    comp.setMode('generate');
    expect(store.state().ideaMode).toBe('generate');
    comp.setMode('manual');
    expect(store.state().ideaMode).toBe('manual');
  });

  it('toggleGenerated delegates to store.toggleGeneratedSelected', () => {
    const comp = fixture.componentInstance as unknown as {
      toggleGenerated: (id: string) => void;
    };
    comp.toggleGenerated('xyz');
    expect(store.state().selectedGeneratedIds).toEqual(['xyz']);
  });

  it('onTitleChange writes title through helper', () => {
    const comp = fixture.componentInstance as unknown as {
      onTitleChange: (v: string) => void;
    };
    comp.onTitleChange('Hello');
    expect(store.state().title).toBe('Hello');
  });

  it('onDescriptionChange writes description through helper', () => {
    const comp = fixture.componentInstance as unknown as {
      onDescriptionChange: (v: string) => void;
    };
    comp.onDescriptionChange('d');
    expect(store.state().description).toBe('d');
  });

  it('generateIdeas delegates to the store (no-op without focus pillars)', () => {
    const comp = fixture.componentInstance as unknown as {
      generateIdeas: () => void;
    };
    comp.generateIdeas();
    expect(store.state().isGeneratingIdeas).toBe(false);
  });

  it('renders the selected check svg when an idea is selected, and pillar badge resolves', () => {
    store.setIdeaMode('generate');
    store.patch({
      generatedIdeas: [
        { id: 'gi-a', title: 'A', rationale: 'r', pillarId: 'p1' },
      ],
      selectedGeneratedIds: ['gi-a'],
    });
    fixture.detectChanges();
    const badge: HTMLElement = fixture.nativeElement.querySelector('.idea-pillar-badge');
    expect(badge?.textContent).toContain('Alpha');
    const check = fixture.nativeElement.querySelector('.idea-check svg');
    expect(check).not.toBeNull();
  });

  it('chip disabled attribute toggles in sync with focusPillarsAtLimit', () => {
    store.setIdeaMode('generate');
    fixture.detectChanges();
    const chips: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.chip');
    // initially none are disabled
    expect(chips[2].disabled).toBe(false);
    chips[0].click();
    chips[1].click();
    fixture.detectChanges();
    expect(chips[2].disabled).toBe(true);
    // deselecting one re-enables
    chips[0].click();
    fixture.detectChanges();
    expect(chips[2].disabled).toBe(false);
  });

  it('toggling pillar selection does not change font-weight (layout-stability regression)', () => {
    const chip: HTMLButtonElement = fixture.nativeElement.querySelector('.pillar-chip');
    const inactiveWeight = getComputedStyle(chip).fontWeight;
    chip.click();
    fixture.detectChanges();
    expect(chip.classList.contains('is-active')).toBe(true);
    const activeWeight = getComputedStyle(chip).fontWeight;
    expect(activeWeight).toBe(inactiveWeight);
  });

  it('renders Content Pillars chips in Quick Add mode and toggles selection (max 3)', () => {
    // Manual mode is default
    const pillarChips = fixture.nativeElement.querySelectorAll('.pillar-chip');
    expect(pillarChips.length).toBe(PILLARS.length);
    (pillarChips[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(store.state().pillarIds).toEqual(['p1']);
    (pillarChips[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(store.state().pillarIds).toEqual([]);
  });

  it('does NOT render Content Pillars chips in Generate mode', () => {
    store.setIdeaMode('generate');
    fixture.detectChanges();
    const pillarChips = fixture.nativeElement.querySelectorAll('.pillar-chip');
    expect(pillarChips.length).toBe(0);
  });

  it('focusPillarsAtLimit computed returns true when at max and false below', () => {
    const comp = fixture.componentInstance as unknown as {
      focusPillarsAtLimit: () => boolean;
    };
    expect(comp.focusPillarsAtLimit()).toBe(false);
    store.patch({ generatePillarIds: ['p1'] });
    expect(comp.focusPillarsAtLimit()).toBe(false);
    store.patch({ generatePillarIds: ['p1', 'p2'] });
    expect(comp.focusPillarsAtLimit()).toBe(true);
    store.patch({ generatePillarIds: ['p1', 'p2', 'p3'] });
    expect(comp.focusPillarsAtLimit()).toBe(true);
  });
});
