import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BriefStepComponent } from './brief-step.component';
import { PostDetailStore } from '../post-detail.store';
import { ContentStateService } from '../../../content-state.service';
import type {
  AudienceSegment,
  ContentItem,
  ContentPillar,
} from '../../../content.types';

const PILLARS: ContentPillar[] = [
  { id: 'p1', name: 'Alpha', description: '', color: '#111' },
  { id: 'p2', name: 'Beta', description: '', color: '#222' },
  { id: 'p3', name: 'Gamma', description: '', color: '#333' },
  { id: 'p4', name: 'Delta', description: '', color: '#444' },
];
const SEGMENTS: AudienceSegment[] = [
  { id: 's1', name: 'Seg 1', description: '' },
];

function makeItem(partial: Partial<ContentItem> = {}): ContentItem {
  const now = new Date().toISOString();
  return {
    id: 'post-1',
    stage: 'post',
    status: 'in-progress',
    title: 'Post title',
    description: 'x'.repeat(80),
    pillarIds: ['p1'],
    segmentIds: ['s1'],
    objective: 'engagement',
    platform: 'instagram',
    contentType: 'reel',
    keyMessage: 'The audience should remember this',
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function setup(item: ContentItem = makeItem()): {
  fixture: ComponentFixture<BriefStepComponent>;
  state: ContentStateService;
  store: PostDetailStore;
} {
  TestBed.configureTestingModule({
    imports: [BriefStepComponent],
    providers: [ContentStateService, PostDetailStore],
  });
  const state = TestBed.inject(ContentStateService);
  state.items.set([item]);
  state.pillars.set(PILLARS);
  state.segments.set(SEGMENTS);
  const store = TestBed.inject(PostDetailStore);
  store.setItemId(item.id);
  const fixture = TestBed.createComponent(BriefStepComponent);
  fixture.detectChanges();
  return { fixture, state, store };
}

describe('BriefStepComponent — composition', () => {
  it('renders all 10 panels', () => {
    const { fixture } = setup();
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.panel-label') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent ?? '');
    ['Title', 'Description', 'Format', 'Content Pillars', 'Audience Segments', 'Content Goal', 'Tone Preset', 'Key Message', 'Call-to-Action'].forEach((name) => {
      expect(labels.some((t) => t.includes(name))).toBe(true);
    });
  });

  it('renders the Format panel as locked (shows Platform + Content Type read-only)', () => {
    const { fixture } = setup();
    const panel = fixture.nativeElement.querySelector('.panel-format') as HTMLElement;
    expect(panel).not.toBeNull();
    const cells = panel.querySelectorAll('.format-cell-value');
    expect(cells.length).toBe(2);
    expect(cells[0].textContent).toContain('Instagram');
    expect(cells[1].textContent).toContain('Reel');
  });

  it('Format panel shows "Not set" when platform/contentType are missing', () => {
    const { fixture } = setup(makeItem({ platform: undefined, contentType: undefined }));
    const cells = fixture.nativeElement.querySelectorAll(
      '.format-cell-value',
    ) as NodeListOf<HTMLElement>;
    expect(cells[0].textContent).toContain('Not set');
    expect(cells[1].textContent).toContain('Not set');
  });

  it('hides CTA text panel until a CTA type is chosen', () => {
    const { fixture, store } = setup();
    expect(fixture.nativeElement.querySelector('.brief-cta-text')).toBeNull();
    store.setCtaType('buy');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.brief-cta-text')).not.toBeNull();
  });

  it('renders an empty-state when no pillars configured', () => {
    const { fixture, state } = setup();
    state.pillars.set([]);
    fixture.detectChanges();
    const pillarsPanel = Array.from(
      fixture.nativeElement.querySelectorAll('.panel') as NodeListOf<HTMLElement>,
    ).find((el) => el.textContent?.includes('Content Pillars'));
    expect(pillarsPanel?.querySelector('.panel-empty')).not.toBeNull();
  });

  it('renders an empty-state when no segments configured', () => {
    const { fixture, state } = setup();
    state.segments.set([]);
    fixture.detectChanges();
    const segPanel = Array.from(
      fixture.nativeElement.querySelectorAll('.panel') as NodeListOf<HTMLElement>,
    ).find((el) => el.textContent?.includes('Audience Segments'));
    expect(segPanel?.querySelector('.panel-empty')).not.toBeNull();
  });
});

describe('BriefStepComponent — interactions', () => {
  it('pillar chip toggles selection via store', () => {
    const { fixture, store } = setup(makeItem({ pillarIds: [] }));
    const chips = fixture.nativeElement.querySelectorAll(
      '.pillar-chip',
    ) as NodeListOf<HTMLButtonElement>;
    chips[0].click();
    fixture.detectChanges();
    expect(store.item()?.pillarIds).toEqual(['p1']);
  });

  it('pillar chip is disabled once the pillar limit is reached', () => {
    const { fixture } = setup(makeItem({ pillarIds: ['p1', 'p2', 'p3'] }));
    const chips = fixture.nativeElement.querySelectorAll(
      '.pillar-chip',
    ) as NodeListOf<HTMLButtonElement>;
    expect(chips[3].disabled).toBe(true);
  });

  it('Content Goal button sets objective on the store', () => {
    const { fixture, store } = setup();
    const btn = Array.from(
      fixture.nativeElement.querySelectorAll('.objective-btn') as NodeListOf<HTMLButtonElement>,
    ).find((b) => b.textContent?.includes('Leads')) as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    expect(store.item()?.objective).toBe('leads');
  });

  it('AI Assist fills the key message with the placeholder sentence', () => {
    const { fixture, store } = setup(makeItem({ keyMessage: '' }));
    const comp = fixture.componentInstance as unknown as {
      onKeyMessageAssist: () => void;
    };
    comp.onKeyMessageAssist();
    fixture.detectChanges();
    expect(store.item()?.keyMessage?.length).toBeGreaterThan(20);
  });

  it('AI Assist is a no-op when the brief is approved', () => {
    const { fixture, store } = setup();
    store.approveBrief();
    fixture.detectChanges();
    const msgBefore = store.item()?.keyMessage;
    const comp = fixture.componentInstance as unknown as {
      onKeyMessageAssist: () => void;
    };
    comp.onKeyMessageAssist();
    expect(store.item()?.keyMessage).toBe(msgBefore);
  });

  it('all edit controls become disabled when the brief is approved', () => {
    const { fixture, store } = setup();
    store.approveBrief();
    fixture.detectChanges();
    const pillar = fixture.nativeElement.querySelector(
      '.pillar-chip',
    ) as HTMLButtonElement;
    const objective = fixture.nativeElement.querySelector(
      '.objective-btn',
    ) as HTMLButtonElement;
    const assist = fixture.nativeElement.querySelector(
      '.assist-btn',
    ) as HTMLButtonElement;
    expect(pillar.disabled).toBe(true);
    expect(objective.disabled).toBe(true);
    expect(assist.disabled).toBe(true);
  });

  it('field-change handlers route to the store', () => {
    const { fixture, store } = setup();
    const comp = fixture.componentInstance as unknown as {
      onTitleChange: (v: string) => void;
      onDescriptionChange: (v: string) => void;
      onKeyMessageChange: (v: string) => void;
      onTonePresetChange: (v: string) => void;
      onSetCtaType: (v: string) => void;
      onCtaTextChange: (v: string) => void;
    };
    comp.onTitleChange('Renamed');
    comp.onDescriptionChange('A new description');
    comp.onKeyMessageChange('A new key message');
    comp.onTonePresetChange('friendly');
    comp.onSetCtaType('buy');
    comp.onCtaTextChange('Read more');
    expect(store.item()?.title).toBe('Renamed');
    expect(store.item()?.description).toBe('A new description');
    expect(store.item()?.keyMessage).toBe('A new key message');
    expect(store.item()?.tonePreset).toBe('friendly');
    expect(store.item()?.cta?.type).toBe('buy');
    expect(store.item()?.cta?.text).toBe('Read more');
    comp.onSetCtaType('');
    expect(store.item()?.cta).toBeUndefined();
    comp.onTonePresetChange('');
    expect(store.item()?.tonePreset).toBeUndefined();
  });
});

describe('BriefStepComponent — formatters', () => {
  it('descriptionInvalid is true when description is short', () => {
    const { fixture } = setup(makeItem({ description: 'too short' }));
    const comp = fixture.componentInstance as unknown as {
      descriptionInvalid: () => boolean;
    };
    expect(comp.descriptionInvalid()).toBe(true);
  });

  it('descriptionInvalid is false when description is empty', () => {
    const { fixture } = setup(makeItem({ description: '' }));
    const comp = fixture.componentInstance as unknown as {
      descriptionInvalid: () => boolean;
    };
    expect(comp.descriptionInvalid()).toBe(false);
  });

  it('contentTypeLabel returns null when platform missing', () => {
    const { fixture } = setup(makeItem({ platform: undefined }));
    const comp = fixture.componentInstance as unknown as {
      contentTypeLabel: () => string | null;
    };
    expect(comp.contentTypeLabel()).toBeNull();
  });
});

describe('BriefStepComponent — empty item', () => {
  it('renders nothing when the store has no item', () => {
    TestBed.configureTestingModule({
      imports: [BriefStepComponent],
      providers: [ContentStateService, PostDetailStore],
    });
    const fixture = TestBed.createComponent(BriefStepComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.brief-step')).toBeNull();
  });

  it('defensive helpers return false/0 when store item is null', () => {
    TestBed.configureTestingModule({
      imports: [BriefStepComponent],
      providers: [ContentStateService, PostDetailStore],
    });
    const fixture = TestBed.createComponent(BriefStepComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as {
      isPillarSelected: (id: string) => boolean;
      isSegmentSelected: (id: string) => boolean;
      pillarsAtLimit: () => boolean;
      descriptionCount: () => number;
      keyMessageCount: () => number;
      ctaTextCount: () => number;
      togglePillar: (id: string) => void;
    };
    expect(comp.isPillarSelected('p1')).toBe(false);
    expect(comp.isSegmentSelected('s1')).toBe(false);
    expect(comp.pillarsAtLimit()).toBe(false);
    expect(comp.descriptionCount()).toBe(0);
    expect(comp.keyMessageCount()).toBe(0);
    expect(comp.ctaTextCount()).toBe(0);
    comp.togglePillar('p1');
  });
});
