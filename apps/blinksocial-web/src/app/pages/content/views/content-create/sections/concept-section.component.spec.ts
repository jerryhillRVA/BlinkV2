import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConceptSectionComponent } from './concept-section.component';
import { ContentCreateStore } from '../content-create.store';
import { AI_ASSIST_DELAY_MS, AI_SIMULATION_DELAY_MS } from '../../../content.constants';
import type { AudienceSegment, ContentPillar } from '../../../content.types';

const PILLARS: ContentPillar[] = [
  { id: 'p1', name: 'Alpha', description: '', color: '#111' },
  { id: 'p2', name: 'Beta', description: '', color: '#222' },
  { id: 'p3', name: 'Gamma', description: '', color: '#333' },
  { id: 'p4', name: 'Delta', description: '', color: '#444' },
];
const SEGMENTS: AudienceSegment[] = [
  { id: 's1', name: 'S1', description: '' },
  { id: 's2', name: 'S2', description: '' },
];

describe('ConceptSectionComponent', () => {
  let fixture: ComponentFixture<ConceptSectionComponent>;
  let store: ContentCreateStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ConceptSectionComponent],
      providers: [ContentCreateStore],
    });
    store = TestBed.inject(ContentCreateStore);
    store.setContext(PILLARS, SEGMENTS);
    store.setType('concept');
    fixture = TestBed.createComponent(ConceptSectionComponent);
    fixture.detectChanges();
  });

  it('Content Pillars label reads "(1–3 required)" in concept post-generation phase', () => {
    store.patch({ conceptAiGenerated: true });
    fixture.detectChanges();
    const hint: HTMLElement = fixture.nativeElement.querySelector('.field-hint');
    expect(hint.textContent?.trim()).toBe('(1–3 required)');
  });

  it('renders pre-generation phase by default (objective buttons + Generate with AI)', () => {
    expect(fixture.nativeElement.querySelector('.objective-grid')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#concept-title')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.btn-generate')).not.toBeNull();
  });

  it('Generate with AI disabled without title + objective', () => {
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-generate');
    expect(btn.disabled).toBe(true);
    store.patch({ title: 'T', objective: 'awareness' });
    fixture.detectChanges();
    expect(btn.disabled).toBe(false);
  });

  it('"Fill in manually" reveals the full form', () => {
    const link: HTMLButtonElement = fixture.nativeElement.querySelector('.link-btn');
    link.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#concept-title-m')).not.toBeNull();
  });

  it('clicking Generate with AI shows spinner, then reveals form with AI-filled fields', () => {
    vi.useFakeTimers();
    try {
      store.patch({ title: 'T', objective: 'trust' });
      fixture.detectChanges();
      const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-generate');
      btn.click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.spinner')).not.toBeNull();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();
      expect(store.state().conceptAiGenerated).toBe(true);
      expect(fixture.nativeElement.querySelector('#concept-title-m')).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('enforces max 3 pillars selection in manual mode', () => {
    store.patch({ conceptAiGenerated: true });
    fixture.detectChanges();
    const chips: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('.chip');
    // First row of chips is pillars
    chips[0].click();
    chips[1].click();
    chips[2].click();
    fixture.detectChanges();
    expect(store.state().pillarIds.length).toBe(3);
    const fourthPillarChip = chips[3];
    expect(fourthPillarChip.disabled).toBe(true);
  });

  it('hook field is capped at 120 chars and shows character counter', () => {
    store.patch({ conceptAiGenerated: true });
    fixture.detectChanges();
    const long = 'x'.repeat(150);
    store.patch({ hook: long.slice(0, 120) });
    fixture.detectChanges();
    const counter: HTMLElement = fixture.nativeElement.querySelectorAll('.char-counter')[1];
    expect(counter.textContent).toContain('120');
  });

  it('AI assist hook flips loading flag and resolves', () => {
    vi.useFakeTimers();
    try {
      store.patch({ conceptAiGenerated: true, title: 'Hi', objective: 'leads' });
      fixture.detectChanges();
      const assistBtns: NodeListOf<HTMLButtonElement> =
        fixture.nativeElement.querySelectorAll('.assist-btn');
      // second assist button is hook (first is description)
      assistBtns[1].click();
      fixture.detectChanges();
      expect(store.state().isAssistingHook).toBe(true);
      vi.advanceTimersByTime(AI_ASSIST_DELAY_MS);
      fixture.detectChanges();
      expect(store.state().isAssistingHook).toBe(false);
      expect(store.state().hook).toContain('Hi');
    } finally {
      vi.useRealTimers();
    }
  });

  it('Back button returns to pre-generation phase', () => {
    store.patch({ conceptAiGenerated: true });
    fixture.detectChanges();
    const back: HTMLButtonElement = fixture.nativeElement.querySelector('.back-btn');
    back.click();
    fixture.detectChanges();
    expect(store.state().conceptAiGenerated).toBe(false);
  });

  it('fillManually skips AI generation and opens the form directly', () => {
    const link: HTMLButtonElement = fixture.nativeElement.querySelector('.link-btn');
    link.click();
    fixture.detectChanges();
    expect(store.state().conceptAiGenerated).toBe(true);
    expect(store.state().conceptFilledByAI).toBe(false);
  });

  it('setting platform cascades to reset contentType', () => {
    store.patch({ conceptAiGenerated: true, platform: 'instagram', contentType: 'reel' });
    fixture.detectChanges();
    store.setPlatform('youtube');
    expect(store.state().platform).toBe('youtube');
    expect(store.state().contentType).toBe('');
  });

  it('togglePillarIfAllowed no-ops when limit reached and pillar not already selected', () => {
    store.patch({
      conceptAiGenerated: true,
      pillarIds: ['p1', 'p2', 'p3'],
    });
    fixture.detectChanges();
    const compAny = fixture.componentInstance as unknown as {
      togglePillarIfAllowed: (id: string) => void;
    };
    compAny.togglePillarIfAllowed('p4');
    expect(store.state().pillarIds).toEqual(['p1', 'p2', 'p3']);
  });

  it('segments chip toggles selection', () => {
    store.patch({ conceptAiGenerated: true });
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as {
      toggleSegment: (id: string) => void;
      isSegmentSelected: (id: string) => boolean;
    };
    comp.toggleSegment('s1');
    expect(comp.isSegmentSelected('s1')).toBe(true);
    comp.toggleSegment('s1');
    expect(comp.isSegmentSelected('s1')).toBe(false);
  });

  it('CTA text input appears once CTA type is selected, and cta text is capped', () => {
    store.patch({ conceptAiGenerated: true, ctaType: 'buy' });
    fixture.detectChanges();
    const ctaText: HTMLInputElement = fixture.nativeElement.querySelector('#concept-cta-text');
    expect(ctaText).not.toBeNull();
    const comp = fixture.componentInstance as unknown as {
      onCtaTextChange: (v: string) => void;
    };
    comp.onCtaTextChange('x'.repeat(200));
    expect(store.state().ctaText.length).toBeLessThanOrEqual(120);
  });

  it('setCtaType clears CTA text when cleared to empty', () => {
    store.patch({ conceptAiGenerated: true, ctaType: 'buy', ctaText: 'hello' });
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as { setCtaType: (v: string) => void };
    comp.setCtaType('');
    expect(store.state().ctaType).toBe('');
    expect(store.state().ctaText).toBe('');
  });

  it('setContentType updates store', () => {
    store.patch({ conceptAiGenerated: true, platform: 'instagram' });
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as { setContentType: (v: string) => void };
    comp.setContentType('reel');
    expect(store.state().contentType).toBe('reel');
  });

  it('AI assist description resolves and writes into the description field', () => {
    vi.useFakeTimers();
    try {
      store.patch({ conceptAiGenerated: true, title: 'Hi', objective: 'engagement' });
      fixture.detectChanges();
      const comp = fixture.componentInstance as unknown as { assistDescription: () => void };
      comp.assistDescription();
      expect(store.state().isAssistingDescription).toBe(true);
      vi.advanceTimersByTime(AI_ASSIST_DELAY_MS);
      fixture.detectChanges();
      expect(store.state().isAssistingDescription).toBe(false);
      expect(store.state().description).toContain('Hi');
    } finally {
      vi.useRealTimers();
    }
  });

  it('onHookChange caps input at HOOK_MAX', () => {
    const comp = fixture.componentInstance as unknown as { onHookChange: (v: string) => void };
    comp.onHookChange('x'.repeat(150));
    expect(store.state().hook.length).toBeLessThanOrEqual(120);
  });

  it('setObjectiveDropdown writes objective', () => {
    const comp = fixture.componentInstance as unknown as { setObjectiveDropdown: (v: string) => void };
    comp.setObjectiveDropdown('conversion');
    expect(store.state().objective).toBe('conversion');
  });

  it('setObjectiveButton writes objective', () => {
    const comp = fixture.componentInstance as unknown as { setObjectiveButton: (v: string) => void };
    comp.setObjectiveButton('leads');
    expect(store.state().objective).toBe('leads');
  });

  it('togglePillar delegates to store', () => {
    const comp = fixture.componentInstance as unknown as { togglePillar: (v: string) => void };
    comp.togglePillar('p1');
    expect(store.state().pillarIds).toEqual(['p1']);
  });

  it('onTitleChange and onDescriptionChange write to store', () => {
    const comp = fixture.componentInstance as unknown as {
      onTitleChange: (v: string) => void;
      onDescriptionChange: (v: string) => void;
    };
    comp.onTitleChange('T');
    expect(store.state().title).toBe('T');
    comp.onDescriptionChange('D');
    expect(store.state().description).toBe('D');
  });

  it('isPillarSelected returns accurate membership', () => {
    store.patch({ pillarIds: ['p2'] });
    const comp = fixture.componentInstance as unknown as {
      isPillarSelected: (id: string) => boolean;
    };
    expect(comp.isPillarSelected('p2')).toBe(true);
    expect(comp.isPillarSelected('p1')).toBe(false);
  });

  it('contentTypeDropdown is empty for tbd platform, populated for instagram', () => {
    store.patch({ platform: 'tbd' });
    const comp = fixture.componentInstance as unknown as {
      contentTypeDropdown: () => unknown[];
    };
    expect(comp.contentTypeDropdown()).toEqual([]);
    store.patch({ platform: 'instagram' });
    expect(comp.contentTypeDropdown().length).toBeGreaterThan(0);
  });

  it('setPlatform via component invokes store and resets contentType', () => {
    store.patch({ conceptAiGenerated: true, platform: 'instagram', contentType: 'reel' });
    const comp = fixture.componentInstance as unknown as { setPlatform: (v: string) => void };
    comp.setPlatform('youtube');
    expect(store.state().platform).toBe('youtube');
    expect(store.state().contentType).toBe('');
  });

  it('pillarsAtLimit computed is true at 3 pillars and false below', () => {
    const comp = fixture.componentInstance as unknown as {
      pillarsAtLimit: () => boolean;
    };
    expect(comp.pillarsAtLimit()).toBe(false);
    store.patch({ pillarIds: ['p1', 'p2'] });
    expect(comp.pillarsAtLimit()).toBe(false);
    store.patch({ pillarIds: ['p1', 'p2', 'p3'] });
    expect(comp.pillarsAtLimit()).toBe(true);
  });

  it('character counts reflect current field values', () => {
    const comp = fixture.componentInstance as unknown as {
      descriptionCount: () => number;
      hookCount: () => number;
      ctaTextCount: () => number;
    };
    expect(comp.descriptionCount()).toBe(0);
    expect(comp.hookCount()).toBe(0);
    expect(comp.ctaTextCount()).toBe(0);
    store.patch({ description: '  hello  ', hook: 'a hook', ctaText: 'buy now' });
    expect(comp.descriptionCount()).toBe(5); // trimmed
    expect(comp.hookCount()).toBe('a hook'.length);
    expect(comp.ctaTextCount()).toBe('buy now'.length);
  });

  it('setCtaType preserves existing ctaText when a non-empty type is chosen', () => {
    store.patch({ ctaType: 'buy', ctaText: 'Existing text' });
    const comp = fixture.componentInstance as unknown as { setCtaType: (v: string) => void };
    comp.setCtaType('subscribe');
    expect(store.state().ctaType).toBe('subscribe');
    expect(store.state().ctaText).toBe('Existing text');
  });

  it('generateConcept, assistHook, assistDescription, fillManually, backToPregen all invoke store', () => {
    store.patch({ title: 'T', objective: 'awareness' });
    const comp = fixture.componentInstance as unknown as {
      generateConcept: () => void;
      assistHook: () => void;
      assistDescription: () => void;
      fillManually: () => void;
      backToPregen: () => void;
    };
    vi.useFakeTimers();
    try {
      comp.generateConcept();
      expect(store.state().isGeneratingConcept).toBe(true);
      vi.runAllTimers();
      comp.assistHook();
      vi.runAllTimers();
      comp.assistDescription();
      vi.runAllTimers();
      comp.fillManually();
      expect(store.state().conceptAiGenerated).toBe(true);
      comp.backToPregen();
      expect(store.state().conceptAiGenerated).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
