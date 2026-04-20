import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BriefSectionComponent } from './brief-section.component';
import { ContentCreateStore } from '../content-create.store';
import type { AudienceSegment, ContentPillar } from '../../../content.types';

const PILLARS: ContentPillar[] = [
  { id: 'p1', name: 'A', description: '', color: '#111' },
];
const SEGMENTS: AudienceSegment[] = [
  { id: 's1', name: 'S1', description: '' },
  { id: 's2', name: 'S2', description: '' },
];

describe('BriefSectionComponent', () => {
  let fixture: ComponentFixture<BriefSectionComponent>;
  let store: ContentCreateStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BriefSectionComponent],
      providers: [ContentCreateStore],
    });
    store = TestBed.inject(ContentCreateStore);
    store.setContext(PILLARS, SEGMENTS);
    store.setType('production-brief');
    fixture = TestBed.createComponent(BriefSectionComponent);
    fixture.detectChanges();
  });

  function labelTexts(): string[] {
    const nodes = Array.from(
      fixture.nativeElement.querySelectorAll('.field-label'),
    ) as HTMLElement[];
    return nodes.map((el) => el.textContent ?? '');
  }

  it('renders all required fields: title, platform, objective, key message', () => {
    expect(fixture.nativeElement.querySelector('#brief-title')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#brief-key-message')).not.toBeNull();
    const texts = labelTexts();
    expect(texts.some((t) => t.includes('Platform'))).toBe(true);
    expect(texts.some((t) => t.includes('Objective'))).toBe(true);
  });

  it('title typing writes to store', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#brief-title');
    input.value = 'Hello';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(store.state().title).toBe('Hello');
  });

  it('key message respects max 140 chars cap', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#brief-key-message');
    input.value = 'x'.repeat(200);
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(store.state().keyMessage.length).toBeLessThanOrEqual(140);
  });

  it('Content Type field only appears when platform selected (non-tbd)', () => {
    expect(labelTexts().some((t) => t.includes('Content Type'))).toBe(false);
    store.patch({ platform: 'instagram' });
    fixture.detectChanges();
    expect(labelTexts().some((t) => t.includes('Content Type'))).toBe(true);
  });

  it('renders audience segment chips and toggles selection', () => {
    const chips = Array.from(
      fixture.nativeElement.querySelectorAll('.chip:not(.pillar-chip)') as NodeListOf<HTMLButtonElement>,
    );
    expect(chips.length).toBe(SEGMENTS.length);
    chips[0].click();
    fixture.detectChanges();
    expect(store.state().segmentIds).toEqual(['s1']);
  });

  it('renders Content Pillars chip row after Description and toggles selection', () => {
    const texts = labelTexts();
    expect(texts.some((t) => t.includes('Content Pillars'))).toBe(true);
    const chips = Array.from(
      fixture.nativeElement.querySelectorAll('.pillar-chip') as NodeListOf<HTMLButtonElement>,
    );
    expect(chips.length).toBe(PILLARS.length);
    chips[0].click();
    fixture.detectChanges();
    expect(store.state().pillarIds).toEqual(['p1']);
  });

  it('pillar chip is disabled once the MAX_PILLARS limit is hit', () => {
    const LOTS: ContentPillar[] = [
      { id: 'p1', name: 'A', description: '', color: '#111' },
      { id: 'p2', name: 'B', description: '', color: '#222' },
      { id: 'p3', name: 'C', description: '', color: '#333' },
      { id: 'p4', name: 'D', description: '', color: '#444' },
    ];
    store.setContext(LOTS, SEGMENTS);
    fixture.detectChanges();
    store.togglePillar('p1');
    store.togglePillar('p2');
    store.togglePillar('p3');
    fixture.detectChanges();
    const chips = Array.from(
      fixture.nativeElement.querySelectorAll('.pillar-chip') as NodeListOf<HTMLButtonElement>,
    );
    expect(chips[3].disabled).toBe(true);
    chips[3].click();
    fixture.detectChanges();
    expect(store.state().pillarIds).not.toContain('p4');
  });

  it('CTA text field appears only when CTA type selected', () => {
    expect(fixture.nativeElement.querySelector('#brief-cta-text')).toBeNull();
    store.patch({ ctaType: 'buy' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#brief-cta-text')).not.toBeNull();
  });

  it('character counters reflect keyMessage and ctaText lengths', () => {
    const comp = fixture.componentInstance as unknown as {
      keyMessageCount: () => number;
      ctaTextCount: () => number;
    };
    expect(comp.keyMessageCount()).toBe(0);
    expect(comp.ctaTextCount()).toBe(0);
    store.patch({ keyMessage: 'hello', ctaText: 'buy' });
    expect(comp.keyMessageCount()).toBe(5);
    expect(comp.ctaTextCount()).toBe(3);
  });

  it('contentTypeDropdown returns platform-specific options, empty for tbd', () => {
    const comp = fixture.componentInstance as unknown as {
      contentTypeDropdown: () => unknown[];
    };
    expect(comp.contentTypeDropdown()).toEqual([]);
    store.patch({ platform: 'tbd' });
    expect(comp.contentTypeDropdown()).toEqual([]);
    store.patch({ platform: 'linkedin' });
    expect(comp.contentTypeDropdown().length).toBeGreaterThan(0);
  });

  it('setContentType, setObjective, setTone, setCtaType write to store', () => {
    const comp = fixture.componentInstance as unknown as {
      setContentType: (v: string) => void;
      setObjective: (v: string) => void;
      setTone: (v: string) => void;
      setCtaType: (v: string) => void;
    };
    store.patch({ platform: 'instagram' });
    comp.setContentType('reel');
    comp.setObjective('engagement');
    comp.setTone('friendly');
    comp.setCtaType('buy');
    expect(store.state().contentType).toBe('reel');
    expect(store.state().objective).toBe('engagement');
    expect(store.state().tonePreset).toBe('friendly');
    expect(store.state().ctaType).toBe('buy');
    comp.setTone('');
    expect(store.state().tonePreset).toBe('');
    comp.setCtaType('');
    expect(store.state().ctaType).toBe('');
  });

  it('onKeyMessageChange caps at max and onCtaTextChange caps at max', () => {
    const comp = fixture.componentInstance as unknown as {
      onKeyMessageChange: (v: string) => void;
      onCtaTextChange: (v: string) => void;
    };
    comp.onKeyMessageChange('x'.repeat(200));
    expect(store.state().keyMessage.length).toBeLessThanOrEqual(140);
    comp.onCtaTextChange('x'.repeat(200));
    expect(store.state().ctaText.length).toBeLessThanOrEqual(120);
  });
});
