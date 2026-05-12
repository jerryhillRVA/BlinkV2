import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IdeaDetailComponent } from './idea-detail.component';
import { IdeaDetailStore } from './idea-detail.store';
import { ContentStateService } from '../../content-state.service';
import { provideContentItemsApiStubs } from '../../content-items-api.test-util';
import type {
  AudienceSegment,
  ContentItem,
  ContentPillar,
} from '../../content.types';

const PILLARS: ContentPillar[] = [
  { id: 'p1', name: 'Alpha', description: '', color: '#111' },
  { id: 'p2', name: 'Beta', description: '', color: '#222' },
  { id: 'p3', name: 'Gamma', description: '', color: '#333' },
  { id: 'p4', name: 'Delta', description: '', color: '#444' },
];
const SEGMENTS: AudienceSegment[] = [
  { id: 's1', name: 'Seg One', description: '' },
];

function makeItem(partial: Partial<ContentItem> = {}): ContentItem {
  const now = new Date().toISOString();
  return {
    id: 'c-1',
    stage: 'idea',
    status: 'draft',
    title: 'An idea',
    description: 'A description',
    pillarIds: [],
    segmentIds: [],
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function setup(item: ContentItem = makeItem()): {
  fixture: ComponentFixture<IdeaDetailComponent>;
  store: IdeaDetailStore;
} {
  TestBed.configureTestingModule({
    imports: [IdeaDetailComponent],
    providers: [...provideContentItemsApiStubs(), ContentStateService],
  });
  const state = TestBed.inject(ContentStateService);
  state.setItems([item]);
  state.pillars.set(PILLARS);
  state.segments.set(SEGMENTS);
  const fixture = TestBed.createComponent(IdeaDetailComponent);
  fixture.componentRef.setInput('itemId', item.id);
  fixture.detectChanges();
  const store = (fixture.componentInstance as unknown as { store: IdeaDetailStore })
    .store;
  return { fixture, store };
}

describe('IdeaDetailComponent — composition', () => {
  it('renders the header, main description panel, options panel, and the new sidebar layout', () => {
    const { fixture } = setup();
    expect(fixture.nativeElement.querySelector('app-idea-detail-header')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-concept-options-panel')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-content-journey')).not.toBeNull();

    // Right column DOM order: Business Objective → Pillars → Audience → Content Journey.
    const sidebarLabels = Array.from(
      fixture.nativeElement.querySelectorAll(
        '.detail-sidebar .panel-label',
      ) as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '');
    expect(sidebarLabels[0]).toContain('Business Objective');
    expect(sidebarLabels[1]).toContain('Pillars');
    expect(sidebarLabels[1]).not.toContain('Content Pillars');
    expect(sidebarLabels[2]).toContain('Audience');
    expect(sidebarLabels[2]).not.toContain('Audience Segments');
    expect(sidebarLabels[3]).toContain('Content Journey');

    // Tags and the standalone Timestamps header are gone.
    expect(sidebarLabels.some((t) => t.includes('Tags'))).toBe(false);
    expect(sidebarLabels.some((t) => t.includes('Timestamps'))).toBe(false);

    // Description panel still in main column.
    const mainLabels = Array.from(
      fixture.nativeElement.querySelectorAll(
        '.detail-main .panel-label',
      ) as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent ?? '');
    expect(mainLabels.some((t) => t.includes('Description'))).toBe(true);
  });

  it('groups Business Objective, Pillars, and Audience inside a single .strategy-panel card', () => {
    const { fixture } = setup();
    const cards = fixture.nativeElement.querySelectorAll('.strategy-panel');
    expect(cards.length).toBe(1);
    const sections = cards[0].querySelectorAll('.strategy-section');
    expect(sections.length).toBe(3);
    expect(sections[0].textContent).toContain('Business Objective');
    expect(sections[1].textContent).toContain('Pillars');
    expect(sections[2].textContent).toContain('Audience');
  });

  it('every strategy section pairs its panel-label with an app-tooltip help sibling', () => {
    const { fixture } = setup();
    const rows = fixture.nativeElement.querySelectorAll(
      '.strategy-panel .panel-label-row',
    ) as NodeListOf<HTMLElement>;
    expect(rows.length).toBe(3);
    rows.forEach((row) => {
      expect(row.querySelector('h3.panel-label')).not.toBeNull();
      expect(row.querySelector('app-tooltip')).not.toBeNull();
    });
  });

  it('Business Objective and Pillars sections show a required asterisk; Audience does not', () => {
    const { fixture } = setup();
    const sections = fixture.nativeElement.querySelectorAll(
      '.strategy-panel .strategy-section',
    ) as NodeListOf<HTMLElement>;
    expect(sections[0].querySelector('.panel-required')).not.toBeNull();
    expect(sections[1].querySelector('.panel-required')).not.toBeNull();
    expect(sections[2].querySelector('.panel-required')).toBeNull();
  });

  it('does not render Tags input, tag-chips, or a Tags label anywhere', () => {
    const { fixture } = setup(makeItem({ tags: ['launch', 'Q2'] }));
    expect(fixture.nativeElement.querySelector('.tags-input')).toBeNull();
    expect(fixture.nativeElement.querySelector('.tag-chips')).toBeNull();
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.panel-label') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent ?? '');
    expect(labels.some((t) => t.toLowerCase().includes('tags'))).toBe(false);
  });

  it('does not render Source, Attachments, or Publish Date panels on Idea detail', () => {
    const { fixture } = setup(
      makeItem({
        sourceUrl: 'https://example.com',
        attachments: [{ name: 'draft.pdf', size: '2.4 MB' }],
        scheduledAt: '2026-06-01T15:30:00Z',
      }),
    );
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.panel-label') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent ?? '');
    expect(labels.some((t) => t.includes('Source'))).toBe(false);
    expect(labels.some((t) => t.includes('Attachments'))).toBe(false);
    expect(labels.some((t) => t.includes('Publish Date'))).toBe(false);
  });

  it('hides the Hook panel when item has no hook', () => {
    const { fixture } = setup();
    const hookLabel = Array.from(
      fixture.nativeElement.querySelectorAll('.panel-label') as NodeListOf<HTMLElement>,
    ).find((el) => el.textContent?.includes('Hook'));
    expect(hookLabel).toBeUndefined();
  });

  it('renders the Hook panel when item has a hook', () => {
    const { fixture } = setup(makeItem({ hook: 'A punchy hook' }));
    const hookLabel = Array.from(
      fixture.nativeElement.querySelectorAll('.panel-label') as NodeListOf<HTMLElement>,
    ).find((el) => el.textContent?.includes('Hook'));
    expect(hookLabel).toBeDefined();
    expect((fixture.nativeElement.textContent as string)).toContain('A punchy hook');
  });

  it('Business Objective shows the prototype warning when no objectives are configured', () => {
    const { fixture } = setup();
    const warning: HTMLElement = fixture.nativeElement.querySelector(
      '.strategy-panel .panel-warning',
    );
    expect(warning).not.toBeNull();
    expect(warning.textContent).toContain(
      'No business objectives have been set up. Add them in Strategy & Research first.',
    );
  });
});

describe('IdeaDetailComponent — Timestamps panel', () => {
  it('renders a header-less timestamps card with two clock-icon rows', () => {
    const { fixture } = setup();
    const ts = fixture.nativeElement.querySelector('.timestamps-panel');
    expect(ts).not.toBeNull();
    expect(ts.querySelector('.panel-label')).toBeNull();
    const rows = ts.querySelectorAll('.timestamp-row');
    expect(rows.length).toBe(2);
    rows.forEach((row: Element) => {
      expect(row.querySelector('svg')).not.toBeNull();
      expect(row.querySelector('.timestamp-label')).not.toBeNull();
      expect(row.querySelector('.timestamp-value')).not.toBeNull();
    });
    const labels = Array.from(
      ts.querySelectorAll('.timestamp-label') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim());
    expect(labels[0]).toBe('Created');
    expect(labels[1]).toBe('Last Updated');
  });
});

describe('IdeaDetailComponent — chip-grid variants (#108)', () => {
  it('pillar chip-grid carries the .chip-grid--pillar modifier; audience carries .chip-grid--segment', () => {
    const { fixture } = setup();
    const grids = fixture.nativeElement.querySelectorAll('.chip-grid');
    const pillarGrids = fixture.nativeElement.querySelectorAll('.chip-grid--pillar');
    const segmentGrids = fixture.nativeElement.querySelectorAll('.chip-grid--segment');
    expect(pillarGrids.length).toBe(1);
    expect(segmentGrids.length).toBe(1);
    // Both modifier grids are still .chip-grid
    expect(grids.length).toBe(2);
  });

  it('every pillar chip carries --chip-hover-color = pillar.color (drives hover border)', () => {
    const { fixture } = setup();
    const chips = Array.from(
      fixture.nativeElement.querySelectorAll(
        '.chip-grid--pillar .chip',
      ) as NodeListOf<HTMLButtonElement>,
    );
    expect(chips.length).toBe(PILLARS.length);
    chips.forEach((chip, i) => {
      expect(chip.style.getPropertyValue('--chip-hover-color')).toBe(PILLARS[i].color);
    });
  });

  it('no .chip-dot exists inside the pillar chip-grid (dot was removed)', () => {
    const { fixture } = setup();
    const dotsInPillars = fixture.nativeElement.querySelectorAll(
      '.chip-grid--pillar .chip-dot',
    );
    expect(dotsInPillars.length).toBe(0);
  });

  it('selected pillar chip carries non-empty inline style.color/backgroundColor/borderColor', () => {
    const { fixture, store } = setup();
    store.togglePillar('p1');
    fixture.detectChanges();
    const selectedChip = fixture.nativeElement.querySelector(
      '.chip-grid--pillar .chip.is-active',
    ) as HTMLButtonElement;
    expect(selectedChip).not.toBeNull();
    // Don't pin exact hex (jsdom serialization is brittle); just confirm bindings fired.
    expect(selectedChip.style.color.length).toBeGreaterThan(0);
    expect(selectedChip.style.backgroundColor.length).toBeGreaterThan(0);
    expect(selectedChip.style.borderColor.length).toBeGreaterThan(0);

    // Unselected pillar chips carry no inline color styles.
    const otherChips = Array.from(
      fixture.nativeElement.querySelectorAll(
        '.chip-grid--pillar .chip:not(.is-active)',
      ) as NodeListOf<HTMLButtonElement>,
    );
    for (const c of otherChips) {
      expect(c.style.color).toBe('');
      expect(c.style.backgroundColor).toBe('');
      expect(c.style.borderColor).toBe('');
    }
  });

  it('pillarBg/Border/Text helpers return null when unselected and rgba() when selected', () => {
    const { fixture, store } = setup();
    store.togglePillar('p2'); // p2 = '#222' → rgb(34, 34, 34)
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as {
      pillarBg: (p: ContentPillar) => string | null;
      pillarBorder: (p: ContentPillar) => string | null;
      pillarText: (p: ContentPillar) => string | null;
    };
    const p2 = PILLARS[1]; // selected, color #222
    const p1 = PILLARS[0]; // unselected
    // Helpers convert #RRGGBB to rgba(R, G, B, A) so jsdom accepts the value.
    expect(comp.pillarBg(p2)).toMatch(/^rgba\(34, 34, 34, 0\.0\d+\)$/);
    expect(comp.pillarBorder(p2)).toMatch(/^rgba\(34, 34, 34, 0\.2\d+\)$/);
    expect(comp.pillarText(p2)).toBe(p2.color);
    expect(comp.pillarBg(p1)).toBeNull();
    expect(comp.pillarBorder(p1)).toBeNull();
    expect(comp.pillarText(p1)).toBeNull();
  });
});

describe('IdeaDetailComponent — interactions', () => {
  it('pillar chip click toggles selection via store', () => {
    const { fixture, store } = setup();
    const chips = fixture.nativeElement.querySelectorAll(
      '.chip-grid .chip',
    ) as NodeListOf<HTMLButtonElement>;
    chips[0].click();
    fixture.detectChanges();
    expect(store.item()?.pillarIds).toEqual(['p1']);
  });

  it('does not cap pillar selection — every chip stays enabled even after several selections', () => {
    const { fixture, store } = setup();
    store.togglePillar('p1');
    store.togglePillar('p2');
    store.togglePillar('p3');
    fixture.detectChanges();
    const chips = fixture.nativeElement.querySelectorAll(
      '.chip-grid .chip',
    ) as NodeListOf<HTMLButtonElement>;
    // No upper-bound cap — the 4th chip is still selectable.
    expect(chips[3].disabled).toBe(false);
    chips[3].click();
    fixture.detectChanges();
    expect(store.item()?.pillarIds).toEqual(['p1', 'p2', 'p3', 'p4']);
  });

  it('segment chip click toggles selection', () => {
    const { fixture, store } = setup();
    const chips = Array.from(
      fixture.nativeElement.querySelectorAll(
        '.chip-grid .chip',
      ) as NodeListOf<HTMLButtonElement>,
    );
    const segChip = chips.find((c) => c.textContent?.includes('Seg One')) as HTMLButtonElement;
    segChip.click();
    fixture.detectChanges();
    expect(store.item()?.segmentIds).toEqual(['s1']);
  });
});

describe('IdeaDetailComponent — event forwarding', () => {
  it('header back event bubbles through back output', () => {
    const { fixture } = setup();
    const emitted: number[] = [];
    fixture.componentInstance.back.subscribe(() => emitted.push(1));
    (fixture.componentInstance as unknown as { onBack: () => void }).onBack();
    expect(emitted.length).toBe(1);
  });

  it('projects app-detail-back-button into the header with the bound aria-label, and clicking it fires the wrapper back output', () => {
    TestBed.configureTestingModule({
      imports: [IdeaDetailComponent],
      providers: [...provideContentItemsApiStubs(), ContentStateService],
    });
    const state = TestBed.inject(ContentStateService);
    state.setItems([makeItem()]);
    state.pillars.set(PILLARS);
    state.segments.set(SEGMENTS);
    const fixture = TestBed.createComponent(IdeaDetailComponent);
    fixture.componentRef.setInput('itemId', 'c-1');
    fixture.componentRef.setInput('backLabel', 'Back to calendar');
    fixture.detectChanges();

    const projected = fixture.nativeElement.querySelector(
      'app-idea-detail-header app-detail-back-button',
    );
    expect(projected).not.toBeNull();
    const btn = projected.querySelector('.detail-back') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.getAttribute('aria-label')).toBe('Back to calendar');

    let fired = 0;
    fixture.componentInstance.back.subscribe(() => fired++);
    btn.click();
    expect(fired).toBe(1);
  });

  it('default aria-label on the projected back button is "Back to pipeline"', () => {
    const { fixture } = setup();
    const btn = fixture.nativeElement.querySelector(
      'app-idea-detail-header app-detail-back-button .detail-back',
    ) as HTMLButtonElement;
    expect(btn.getAttribute('aria-label')).toBe('Back to pipeline');
  });

  it('header advance event bubbles through advance output', () => {
    const { fixture } = setup();
    const emitted: number[] = [];
    fixture.componentInstance.advance.subscribe(() => emitted.push(1));
    (fixture.componentInstance as unknown as { onAdvance: () => void }).onAdvance();
    expect(emitted.length).toBe(1);
  });

  it('archive and duplicate outputs fire', () => {
    const { fixture } = setup();
    const archived: number[] = [];
    const dup: number[] = [];
    const copied: number[] = [];
    fixture.componentInstance.archive.subscribe(() => archived.push(1));
    fixture.componentInstance.duplicate.subscribe(() => dup.push(1));
    fixture.componentInstance.copyLink.subscribe(() => copied.push(1));
    const comp = fixture.componentInstance as unknown as {
      onArchive: () => void;
      onDuplicate: () => void;
      onCopyLink: () => void;
    };
    comp.onArchive();
    comp.onDuplicate();
    comp.onCopyLink();
    expect(archived.length).toBe(1);
    expect(dup.length).toBe(1);
    expect(copied.length).toBe(1);
  });
});

describe('IdeaDetailComponent — empty item', () => {
  it('renders nothing when item is null', () => {
    TestBed.configureTestingModule({
      imports: [IdeaDetailComponent],
      providers: [...provideContentItemsApiStubs(), ContentStateService, IdeaDetailStore],
    });
    const fixture = TestBed.createComponent(IdeaDetailComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.idea-detail')).toBeNull();
  });

  it('defensive helpers return false/0 when store item is null', () => {
    TestBed.configureTestingModule({
      imports: [IdeaDetailComponent],
      providers: [...provideContentItemsApiStubs(), ContentStateService, IdeaDetailStore],
    });
    const fixture = TestBed.createComponent(IdeaDetailComponent);
    const comp = fixture.componentInstance as unknown as {
      isPillarSelected: (id: string) => boolean;
      isSegmentSelected: (id: string) => boolean;
      formatDate: (iso: string | undefined) => string;
    };
    expect(comp.isPillarSelected('p1')).toBe(false);
    expect(comp.isSegmentSelected('s1')).toBe(false);
    expect(comp.formatDate(undefined)).toBe('');
    expect(comp.formatDate('not-a-date')).toBe('');
  });
});

describe('IdeaDetailComponent — business-objective + status handlers', () => {
  it('onObjectiveClick toggles objectiveId', () => {
    const { fixture, store } = setup();
    const comp = fixture.componentInstance as unknown as {
      onObjectiveClick: (id: string) => void;
    };
    comp.onObjectiveClick('obj-42');
    expect(store.item()?.objectiveId).toBe('obj-42');
    comp.onObjectiveClick('obj-42');
    expect(store.item()?.objectiveId).toBeUndefined();
  });

  it('renders the status stepper in read-only mode (ticket #117)', () => {
    const { fixture } = setup();
    const btns = fixture.nativeElement.querySelectorAll(
      '.status-stepper-wrap button',
    );
    expect(btns.length).toBe(0);
  });

  it('onAdvance emits the new concept id when advance succeeds', () => {
    const { fixture } = setup();
    const emitted: string[] = [];
    fixture.componentInstance.advance.subscribe((id) => emitted.push(id));
    (fixture.componentInstance as unknown as { onAdvance: () => void }).onAdvance();
    expect(emitted.length).toBe(1);
    expect(emitted[0]).toMatch(/^c-/);
  });

  it('onUnarchive emits the unarchive event', () => {
    const { fixture } = setup();
    let count = 0;
    fixture.componentInstance.unarchive.subscribe(() => count++);
    (fixture.componentInstance as unknown as { onUnarchive: () => void }).onUnarchive();
    expect(count).toBe(1);
  });

  it('renders business-objective chips when objectives are loaded', () => {
    TestBed.configureTestingModule({
      imports: [IdeaDetailComponent],
      providers: [...provideContentItemsApiStubs(), ContentStateService],
    });
    const state = TestBed.inject(ContentStateService);
    state.setItems([makeItem()]);
    state.pillars.set(PILLARS);
    state.segments.set(SEGMENTS);
    state.businessObjectives.set([
      { id: 'obj-1', category: 'growth', statement: 'Grow fast', target: 1, unit: '', timeframe: '' },
    ]);
    const fixture = TestBed.createComponent(IdeaDetailComponent);
    fixture.componentRef.setInput('itemId', 'c-1');
    fixture.detectChanges();
    const chips = fixture.nativeElement.querySelectorAll('.objective-chips .chip');
    expect(chips.length).toBe(1);
    expect(fixture.nativeElement.querySelector('.panel-warning')).toBeNull();
  });

  it('renders the selected-objective chip with is-active when objectiveId matches', () => {
    TestBed.configureTestingModule({
      imports: [IdeaDetailComponent],
      providers: [...provideContentItemsApiStubs(), ContentStateService],
    });
    const state = TestBed.inject(ContentStateService);
    state.setItems([makeItem({ objectiveId: 'obj-a' })]);
    state.pillars.set(PILLARS);
    state.segments.set(SEGMENTS);
    state.businessObjectives.set([
      { id: 'obj-a', category: 'growth', statement: 'A', target: 1, unit: '', timeframe: '' },
      { id: 'obj-b', category: 'awareness', statement: 'B', target: 1, unit: '', timeframe: '' },
    ]);
    const fixture = TestBed.createComponent(IdeaDetailComponent);
    fixture.componentRef.setInput('itemId', 'c-1');
    fixture.detectChanges();
    const chips = Array.from(
      fixture.nativeElement.querySelectorAll('.objective-chips .chip') as NodeListOf<HTMLElement>,
    );
    expect(chips.length).toBe(2);
    expect(chips[0].classList.contains('is-active')).toBe(true);
    expect(chips[1].classList.contains('is-active')).toBe(false);
  });

  it('validObjectives() filters out objectives with empty / whitespace statements', () => {
    TestBed.configureTestingModule({
      imports: [IdeaDetailComponent],
      providers: [...provideContentItemsApiStubs(), ContentStateService],
    });
    const state = TestBed.inject(ContentStateService);
    state.setItems([makeItem()]);
    state.pillars.set(PILLARS);
    state.segments.set(SEGMENTS);
    state.businessObjectives.set([
      { id: 'obj-good', category: 'growth', statement: 'Real goal', target: 1, unit: '', timeframe: '' },
      { id: 'obj-empty', category: 'growth', statement: '', target: 1, unit: '', timeframe: '' },
      { id: 'obj-blank', category: 'growth', statement: '   ', target: 1, unit: '', timeframe: '' },
    ]);
    const fixture = TestBed.createComponent(IdeaDetailComponent);
    fixture.componentRef.setInput('itemId', 'c-1');
    fixture.detectChanges();
    const chips = fixture.nativeElement.querySelectorAll('.objective-chips .chip');
    expect(chips.length).toBe(1);
    expect((chips[0] as HTMLElement).textContent?.trim()).toBe('Real goal');
  });

  it('truncateStatement returns the original under 50 chars; truncates long with ellipsis to 51 chars total', () => {
    const { fixture } = setup();
    const comp = fixture.componentInstance as unknown as {
      truncateStatement: (s: string) => string;
    };
    expect(comp.truncateStatement('short')).toBe('short');
    const long = 'a'.repeat(60);
    const out = comp.truncateStatement(long);
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBe(51);
  });

  it('formatDate returns prototype-style "Wed, May 7, 2026" with no time-of-day', () => {
    const { fixture } = setup();
    const comp = fixture.componentInstance as unknown as {
      formatDate: (iso: string | undefined) => string;
    };
    const out = comp.formatDate('2026-05-07T18:42:00Z');
    expect(out).toContain('May');
    expect(out).toContain('2026');
    expect(out).toContain('7');
    expect(out).not.toMatch(/\bAM\b|\bPM\b/i);
    expect(out).not.toMatch(/:\d{2}/); // no HH:MM pattern
  });
});
