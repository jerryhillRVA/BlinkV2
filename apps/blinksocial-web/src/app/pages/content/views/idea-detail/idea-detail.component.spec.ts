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
  it('renders the header, main description panel, options panel, and sidebar panels', () => {
    const { fixture } = setup();
    expect(fixture.nativeElement.querySelector('app-idea-detail-header')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-concept-options-panel')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-content-journey')).not.toBeNull();
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.panel-label') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent ?? '');
    expect(labels.some((t) => t.includes('Description'))).toBe(true);
    expect(labels.some((t) => t.includes('Content Pillars'))).toBe(true);
    expect(labels.some((t) => t.includes('Audience Segments'))).toBe(true);
    expect(labels.some((t) => t.includes('Business Objective'))).toBe(true);
    expect(labels.some((t) => t.includes('Content Journey'))).toBe(true);
    expect(labels.some((t) => t.includes('Timestamps'))).toBe(true);
  });

  it('does not render Source, Attachments, or Publish Date panels on Idea detail (those belong to Concept / In Production)', () => {
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

  it('Business Objective panel shows the empty-state warning', () => {
    const { fixture } = setup();
    const warning: HTMLElement = fixture.nativeElement.querySelector('.panel-warning');
    expect(warning).not.toBeNull();
    expect(warning.textContent).toContain('No business objectives');
  });
});

describe('IdeaDetailComponent — interactions', () => {
  it('pillar chip click toggles selection via store', () => {
    const { fixture, store } = setup();
    const chips = fixture.nativeElement.querySelectorAll('.chip') as NodeListOf<HTMLButtonElement>;
    // first four chips are pillars (4 pillars), then segment chips
    chips[0].click();
    fixture.detectChanges();
    expect(store.item()?.pillarIds).toEqual(['p1']);
  });

  it('enforces pillar max — 4th chip is disabled once three are selected', () => {
    const { fixture, store } = setup();
    store.togglePillar('p1');
    store.togglePillar('p2');
    store.togglePillar('p3');
    fixture.detectChanges();
    const chips = fixture.nativeElement.querySelectorAll('.chip') as NodeListOf<HTMLButtonElement>;
    expect(chips[3].disabled).toBe(true);
  });

  it('segment chip click toggles selection', () => {
    const { fixture, store } = setup();
    // Find the segment chip by the segment label "Seg One"
    const chips = Array.from(
      fixture.nativeElement.querySelectorAll('.chip') as NodeListOf<HTMLButtonElement>,
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
      pillarsAtLimit: () => boolean;
      formatDate: (iso: string | undefined) => string;
    };
    expect(comp.isPillarSelected('p1')).toBe(false);
    expect(comp.isSegmentSelected('s1')).toBe(false);
    expect(comp.pillarsAtLimit()).toBe(false);
    expect(comp.formatDate(undefined)).toBe('');
    expect(comp.formatDate('not-a-date')).toBe('');
  });
});
