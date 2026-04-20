import { TestBed } from '@angular/core/testing';
import { PostDetailStore } from './post-detail.store';
import { ContentStateService } from '../../content-state.service';
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
  { id: 's1', name: 'Seg 1', description: '' },
  { id: 's2', name: 'Seg 2', description: '' },
];

function makeItem(partial: Partial<ContentItem> = {}): ContentItem {
  const now = new Date().toISOString();
  return {
    id: 'post-1',
    conceptId: 'concept-1',
    stage: 'post',
    status: 'in-progress',
    title: 'Post title',
    description: 'x'.repeat(80),
    pillarIds: ['p1'],
    segmentIds: ['s1'],
    hook: 'A hook',
    objective: 'engagement',
    platform: 'instagram',
    contentType: 'reel',
    keyMessage: 'The one thing the audience should remember.',
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function setup(item: ContentItem = makeItem()): {
  store: PostDetailStore;
  state: ContentStateService;
} {
  TestBed.configureTestingModule({
    providers: [ContentStateService, PostDetailStore],
  });
  const state = TestBed.inject(ContentStateService);
  state.items.set([item]);
  state.pillars.set(PILLARS);
  state.segments.set(SEGMENTS);
  const store = TestBed.inject(PostDetailStore);
  store.setItemId(item.id);
  return { store, state };
}

describe('PostDetailStore — item resolution + active step', () => {
  it('resolves item by id', () => {
    const { store } = setup();
    expect(store.item()?.id).toBe('post-1');
  });

  it('returns null for unknown id', () => {
    const { store } = setup();
    store.setItemId('missing');
    expect(store.item()).toBeNull();
  });

  it('setItemId resets activeStep to brief', () => {
    const { store } = setup();
    store.setActiveStep('qa');
    expect(store.activeStep()).toBe('qa');
    store.setItemId('post-1');
    expect(store.activeStep()).toBe('brief');
  });

  it('setActiveStep updates signal', () => {
    const { store } = setup();
    store.setActiveStep('builder');
    expect(store.activeStep()).toBe('builder');
  });
});

describe('PostDetailStore — field mutations (unapproved brief)', () => {
  it('updateTitle trims and ignores empty', () => {
    const { store } = setup();
    store.updateTitle('   New title  ');
    expect(store.item()?.title).toBe('New title');
    store.updateTitle('   ');
    expect(store.item()?.title).toBe('New title');
  });

  it('updateDescription persists (preserves whitespace)', () => {
    const { store } = setup();
    store.updateDescription('  line1\nline2  ');
    expect(store.item()?.description).toBe('  line1\nline2  ');
  });

  it('setObjective sets and clears', () => {
    const { store } = setup();
    store.setObjective('leads');
    expect(store.item()?.objective).toBe('leads');
    store.setObjective('');
    expect(store.item()?.objective).toBeUndefined();
  });

  it('setTonePreset sets and clears', () => {
    const { store } = setup();
    store.setTonePreset('friendly');
    expect(store.item()?.tonePreset).toBe('friendly');
    store.setTonePreset('');
    expect(store.item()?.tonePreset).toBeUndefined();
  });

  it('setKeyMessage caps at max and clears when empty', () => {
    const { store } = setup();
    store.setKeyMessage('x'.repeat(200));
    expect(store.item()?.keyMessage?.length).toBeLessThanOrEqual(140);
    store.setKeyMessage('');
    expect(store.item()?.keyMessage).toBeUndefined();
  });

  it('togglePillar enforces MAX_PILLARS_PER_ITEM', () => {
    const { store } = setup(makeItem({ pillarIds: [] }));
    store.togglePillar('p1');
    store.togglePillar('p2');
    store.togglePillar('p3');
    store.togglePillar('p4'); // blocked
    expect(store.item()?.pillarIds).toEqual(['p1', 'p2', 'p3']);
    store.togglePillar('p2'); // removes
    expect(store.item()?.pillarIds).toEqual(['p1', 'p3']);
  });

  it('toggleSegment toggles membership', () => {
    const { store } = setup(makeItem({ segmentIds: [] }));
    store.toggleSegment('s1');
    expect(store.item()?.segmentIds).toEqual(['s1']);
    store.toggleSegment('s1');
    expect(store.item()?.segmentIds).toEqual([]);
  });

  it('setCtaType inits cta with empty text; setCtaText caps length; empty clears', () => {
    const { store } = setup();
    store.setCtaType('buy');
    expect(store.item()?.cta).toEqual({ type: 'buy', text: '' });
    store.setCtaText('x'.repeat(200));
    expect(store.item()?.cta?.text.length).toBeLessThanOrEqual(120);
    store.setCtaType('');
    expect(store.item()?.cta).toBeUndefined();
  });

  it('setCtaText is a no-op without a cta type', () => {
    const { store } = setup();
    store.setCtaText('hi');
    expect(store.item()?.cta).toBeUndefined();
  });

  it('all mutations are no-ops when item is missing', () => {
    const { store } = setup();
    store.setItemId('missing');
    store.updateTitle('x');
    store.updateDescription('x');
    store.setObjective('leads');
    store.setTonePreset('friendly');
    store.setKeyMessage('x');
    store.togglePillar('p1');
    store.toggleSegment('s1');
    store.setCtaType('buy');
    store.setCtaText('x');
    expect(store.item()).toBeNull();
  });
});

describe('PostDetailStore — brief approval lifecycle', () => {
  it('approveBrief stamps the three fields', () => {
    const { store } = setup();
    store.approveBrief('Alice');
    expect(store.item()?.briefApproved).toBe(true);
    expect(store.item()?.briefApprovedAt).toBeTruthy();
    expect(store.item()?.briefApprovedBy).toBe('Alice');
  });

  it('approveBrief defaults approvedBy to "You"', () => {
    const { store } = setup();
    store.approveBrief();
    expect(store.item()?.briefApprovedBy).toBe('You');
  });

  it('field mutations are blocked while briefApproved is true', () => {
    const { store } = setup();
    store.approveBrief();
    const titleBefore = store.item()?.title;
    store.updateTitle('Blocked');
    expect(store.item()?.title).toBe(titleBefore);
    store.togglePillar('p2');
    expect(store.item()?.pillarIds).toEqual(['p1']);
  });

  it('unlockBrief clears the three fields so edits resume', () => {
    const { store } = setup();
    store.approveBrief();
    store.unlockBrief();
    expect(store.item()?.briefApproved).toBe(false);
    expect(store.item()?.briefApprovedAt).toBeUndefined();
    expect(store.item()?.briefApprovedBy).toBeUndefined();
    store.updateTitle('Editable again');
    expect(store.item()?.title).toBe('Editable again');
  });

  it('approve/unlock are no-ops when item is missing', () => {
    const { store } = setup();
    store.setItemId('missing');
    store.approveBrief();
    store.unlockBrief();
    expect(store.item()).toBeNull();
  });
});

describe('PostDetailStore — validation', () => {
  it('all valid on fully populated post', () => {
    const { store } = setup();
    expect(store.canApprove()).toBe(true);
    expect(store.errors()).toEqual([]);
  });

  it('collects errors for missing required fields', () => {
    const { store } = setup(
      makeItem({
        title: '',
        description: 'short',
        platform: 'tbd',
        contentType: undefined,
        objective: undefined,
        keyMessage: undefined,
        pillarIds: [],
        segmentIds: [],
      }),
    );
    const fields = store.errors().map((e) => e.field);
    expect(fields).toContain('title');
    expect(fields).toContain('description');
    expect(fields).toContain('platform');
    expect(fields).toContain('contentType');
    expect(fields).toContain('objective');
    expect(fields).toContain('keyMessage');
    expect(fields).toContain('pillars');
    expect(fields).toContain('segments');
    expect(store.canApprove()).toBe(false);
  });

  it('cta error when type set but text empty', () => {
    const { store } = setup(makeItem({ cta: { type: 'buy', text: '' } }));
    expect(store.errors().some((e) => e.field === 'cta')).toBe(true);
  });

  it('requiredFieldsDone reflects valid count', () => {
    const { store } = setup(
      makeItem({
        title: '',
        keyMessage: undefined,
      }),
    );
    expect(store.requiredFieldsDone()).toBe(store.requiredFieldsTotal - 2);
  });

  it('keyMessage near-max warning appears', () => {
    const { store } = setup(makeItem({ keyMessage: 'x'.repeat(130) }));
    expect(store.warnings().some((w) => w.field === 'keyMessage')).toBe(true);
  });

  it('pillar limit warning appears when at MAX', () => {
    const { store } = setup(makeItem({ pillarIds: ['p1', 'p2', 'p3'] }));
    expect(store.warnings().some((w) => w.field === 'pillars')).toBe(true);
  });

  it('all validation computeds are safely false and errors listed when item is null', () => {
    const { store } = setup();
    store.setItemId('missing');
    expect(store.titleValid()).toBe(false);
    expect(store.descriptionInRange()).toBe(false);
    expect(store.platformValid()).toBe(false);
    expect(store.contentTypeValid()).toBe(false);
    expect(store.objectiveValid()).toBe(false);
    expect(store.keyMessageValid()).toBe(false);
    expect(store.pillarsValid()).toBe(false);
    expect(store.segmentsValid()).toBe(false);
    expect(store.ctaValid()).toBe(true);
    expect(store.canApprove()).toBe(false);
    expect(store.warnings()).toEqual([]);
    expect(store.requiredFieldsDone()).toBe(0);
  });
});

describe('PostDetailStore — menu actions', () => {
  it('archive flips archived=true', () => {
    const { store } = setup();
    store.archive();
    expect(store.item()?.archived).toBe(true);
  });

  it('archive is a no-op when item missing', () => {
    const { store } = setup();
    store.setItemId('missing');
    store.archive();
    expect(store.item()).toBeNull();
  });

  it('duplicate creates a copy with "(copy)" title, unapproved', () => {
    const { store, state } = setup(makeItem({ briefApproved: true }));
    const before = state.items().length;
    const copy = store.duplicate();
    expect(copy).not.toBeNull();
    expect(copy!.title).toContain('(copy)');
    expect(copy!.briefApproved).toBe(false);
    expect(copy!.id).not.toBe('post-1');
    expect(state.items().length).toBe(before + 1);
  });

  it('duplicate returns null when item missing', () => {
    const { store } = setup();
    store.setItemId('missing');
    expect(store.duplicate()).toBeNull();
  });

  it('deleteSelf removes the item', () => {
    const { store, state } = setup();
    store.deleteSelf();
    expect(state.items().some((i) => i.id === 'post-1')).toBe(false);
    store.deleteSelf();
    expect(state.items().length).toBe(0);
  });
});
