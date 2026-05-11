import { TestBed } from '@angular/core/testing';
import { PostDetailStore } from './post-detail.store';
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
    owner: 'user-sarah',
    cta: { type: 'learn-more', text: 'Read more' },
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
    providers: [
      ContentStateService,
      PostDetailStore,
      ...provideContentItemsApiStubs(),
    ],
  });
  const state = TestBed.inject(ContentStateService);
  state.setItems([item]);
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
    store.setActiveStep('draft');
    expect(store.activeStep()).toBe('draft');
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

  it('setKeyMessage caps at max and persists "" on clear (not undefined)', () => {
    const { store } = setup();
    store.setKeyMessage('x'.repeat(200));
    expect(store.item()?.keyMessage?.length).toBeLessThanOrEqual(140);
    store.setKeyMessage('');
    // Explicit '' so JSON.stringify keeps the key on the wire and the
    // mock-API merge actually clears the value. See #112 follow-up.
    expect(store.item()?.keyMessage).toBe('');
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
    const { store } = setup(makeItem({ cta: undefined }));
    store.setCtaType('buy');
    expect(store.item()?.cta).toEqual({ type: 'buy', text: '' });
    store.setCtaText('x'.repeat(200));
    expect(store.item()?.cta?.text.length).toBeLessThanOrEqual(120);
    store.setCtaType('');
    expect(store.item()?.cta).toBeUndefined();
  });

  it('setCtaText is a no-op without a cta type', () => {
    const { store } = setup(makeItem({ cta: undefined }));
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

  it('collects errors only for the post-detail brief fields (Key Message / Owner / CTA Type)', () => {
    const { store } = setup(
      makeItem({
        // Concept-stage fields stay populated — they're locked here.
        keyMessage: undefined,
        owner: null,
        cta: undefined,
      }),
    );
    const fields = store.errors().map((e) => e.field);
    expect(fields).toEqual(['keyMessage', 'owner', 'ctaType']);
    expect(store.canApprove()).toBe(false);
  });

  it('legacy "concept-stage" missing-field check (kept for backwards refactor coverage)', () => {
    // The post-detail brief errors() no longer surface concept-stage fields.
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
    // None of the concept-stage fields surface here — they're locked from the brief.
    expect(fields).not.toContain('title');
    expect(fields).not.toContain('description');
    expect(fields).not.toContain('platform');
    expect(fields).not.toContain('contentType');
    expect(fields).not.toContain('objective');
    expect(fields).not.toContain('pillars');
    expect(fields).not.toContain('segments');
    // Only keyMessage (which the brief edits) shows up.
    expect(fields).toContain('keyMessage');
  });

  it('cta-text-empty no longer produces an error (CTA text field was removed in #112)', () => {
    const { store } = setup(makeItem({ cta: { type: 'buy', text: '' } }));
    expect(store.errors().some((e) => e.field === 'cta')).toBe(false);
  });

  it('setKeyMessage("") persists an empty string (not undefined) so a delete actually clears the field', () => {
    const { store } = setup(
      makeItem({ keyMessage: 'The audience should remember this.' }),
    );
    store.setKeyMessage('');
    expect(store.item()?.keyMessage).toBe('');
    expect(store.keyMessageValid()).toBe(false);
    // And errors() now includes keyMessage
    expect(store.errors().map((e) => e.field)).toContain('keyMessage');
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

  it('unarchive flips archived back to false; is a no-op when item missing', () => {
    const { store } = setup(makeItem({ archived: true }));
    expect(store.item()?.archived).toBe(true);
    store.unarchive();
    expect(store.item()?.archived).toBe(false);
    store.setItemId('missing');
    // No throw / no error path — just exercises the early-return guard.
    expect(() => store.unarchive()).not.toThrow();
  });

  it('deleteSelf removes the item', () => {
    const { store, state } = setup();
    store.deleteSelf();
    expect(state.items().some((i) => i.id === 'post-1')).toBe(false);
    store.deleteSelf();
    expect(state.items().length).toBe(0);
  });

  it('setStatus persists the new status', () => {
    const { store } = setup();
    store.setStatus('scheduled');
    expect(store.item()?.status).toBe('scheduled');
    store.setStatus('published');
    expect(store.item()?.status).toBe('published');
  });

  describe('brief sub-field setters (#112)', () => {
    it('setReferenceLinks / addReferenceLink / removeReferenceLink round-trip', () => {
      const { store } = setup();
      store.setReferenceLinks(['https://a.com']);
      expect(store.referenceLinks()).toEqual(['https://a.com']);
      store.addReferenceLink('https://b.com');
      store.addReferenceLink('   '); // whitespace ignored
      expect(store.referenceLinks()).toEqual(['https://a.com', 'https://b.com']);
      store.removeReferenceLink(0);
      expect(store.referenceLinks()).toEqual(['https://b.com']);
    });

    it('setDueDate stores ISO date and clears via empty string; pastDueDate flips', () => {
      const { store } = setup();
      store.setDueDate('2020-01-01');
      expect(store.dueDate()).toBe('2020-01-01');
      expect(store.pastDueDate()).toBe(true);
      store.setDueDate('');
      expect(store.dueDate()).toBeUndefined();
      expect(store.pastDueDate()).toBe(false);
      store.setDueDate('not-a-date');
      // pastDueDate guards against bad input
      expect(store.pastDueDate()).toBe(false);
    });

    it('setCampaignName stores and clears', () => {
      const { store } = setup();
      store.setCampaignName('Instagram_reel_2026-05-09');
      expect(store.campaignName()).toBe('Instagram_reel_2026-05-09');
      store.setCampaignName('');
      expect(store.campaignName()).toBeUndefined();
    });

    it('setPublishingMode toggles paidBoosted', () => {
      const { store } = setup();
      expect(store.paidBoosted()).toBe(false);
      store.setPublishingMode('PAID_BOOSTED');
      expect(store.publishingMode()).toBe('PAID_BOOSTED');
      expect(store.paidBoosted()).toBe(true);
      store.setPublishingMode(undefined);
      expect(store.publishingMode()).toBeUndefined();
    });

    it('togglePrimaryCta sets, then clears when called again with the same value', () => {
      const { store } = setup();
      store.togglePrimaryCta('shop-now');
      expect(store.primaryCta()).toBe('shop-now');
      store.togglePrimaryCta('shop-now');
      expect(store.primaryCta()).toBeUndefined();
      store.togglePrimaryCta('learn-more');
      expect(store.primaryCta()).toBe('learn-more');
    });

    it('setApprovalNote stores non-empty values; empty clears', () => {
      const { store } = setup();
      store.setApprovalNote('Looks good.');
      expect(store.approvalNote()).toBe('Looks good.');
      store.setApprovalNote('');
      expect(store.approvalNote()).toBe('');
    });

    it('all brief sub-field setters respect the briefApproved write-lock', () => {
      const { store } = setup(makeItem({ briefApproved: true }));
      store.setReferenceLinks(['https://x.com']);
      store.setDueDate('2030-01-01');
      store.setCampaignName('blocked');
      store.setPublishingMode('PAID_BOOSTED');
      store.togglePrimaryCta('sign-up');
      store.setApprovalNote('blocked');
      expect(store.referenceLinks()).toEqual([]);
      expect(store.dueDate()).toBeUndefined();
      expect(store.campaignName()).toBeUndefined();
      expect(store.publishingMode()).toBeUndefined();
      expect(store.primaryCta()).toBeUndefined();
      expect(store.approvalNote()).toBe('');
    });

    it('unlockBrief writes unlockedAt onto production.brief (no prior production)', () => {
      const { store } = setup(makeItem({ briefApproved: true }));
      store.unlockBrief();
      expect(store.item()?.briefApproved).toBe(false);
      expect(store.brief()?.unlockedAt).toBeDefined();
      expect(typeof store.brief()?.unlockedAt).toBe('string');
    });

    it('unlockBrief preserves existing brief data and adds unlockedAt', () => {
      const seeded = makeItem({
        briefApproved: true,
        production: {
          brief: {
            referenceLinks: ['https://keep.com'],
            campaignName: 'Keep',
          },
        },
      });
      const { store } = setup(seeded);
      store.unlockBrief();
      expect(store.brief()?.referenceLinks).toEqual(['https://keep.com']);
      expect(store.brief()?.campaignName).toBe('Keep');
      expect(store.brief()?.unlockedAt).toBeDefined();
    });

    it('unlockBrief is a no-op when item is missing', () => {
      const { store } = setup();
      store.setItemId('missing');
      store.unlockBrief();
      expect(store.item()).toBeNull();
    });

    it('approveBrief is a no-op when item is missing', () => {
      const { store } = setup();
      store.setItemId('missing');
      store.approveBrief('Tester');
      expect(store.item()).toBeNull();
    });

    it('approveBrief writes timestamps and approver', () => {
      const { store } = setup();
      store.approveBrief('Tester');
      const item = store.item();
      expect(item?.briefApproved).toBe(true);
      expect(item?.briefApprovedBy).toBe('Tester');
      expect(item?.briefApprovedAt).toBeDefined();
    });

    it('persistBrief is a no-op when item is missing', () => {
      const { store } = setup();
      store.setItemId('missing');
      store.setDueDate('2030-01-01');
      expect(store.item()).toBeNull();
    });

    it('addReferenceLink is a no-op when item is missing', () => {
      const { store } = setup();
      store.setItemId('missing');
      store.addReferenceLink('https://x.com');
      expect(store.item()).toBeNull();
    });

    it('errors lists only the post-detail brief required fields (Key message / Owner / CTA type)', () => {
      const { store } = setup(
        makeItem({
          // Strip every field the brief actually owns; concept-stage fields
          // (title, description, etc.) should NOT contribute even when blank.
          keyMessage: undefined,
          owner: null,
          cta: undefined,
          // These would have failed the old combined validator but aren't
          // editable from the brief, so they must NOT appear in errors().
          title: '',
          description: '',
          platform: undefined,
          contentType: undefined,
          objective: undefined,
          pillarIds: [],
          segmentIds: [],
        }),
      );
      const fields = store.errors().map((e) => e.field);
      expect(fields).toEqual(['keyMessage', 'owner', 'ctaType']);
      expect(store.canApprove()).toBe(false);
    });

    it('warnings include "Key message near max length" once the message length crosses the threshold', () => {
      // KEY_MESSAGE_MAX_CHARS is 140; threshold fires at >= 120 chars.
      const { store } = setup(makeItem({ keyMessage: 'x'.repeat(125) }));
      const warningLabels = store.warnings().map((w) => w.label);
      expect(warningLabels.some((l) => l.includes('near the max length'))).toBe(true);
    });

    it('warnings include "Pillar limit reached" when the cap is hit', () => {
      const { store } = setup(makeItem({ pillarIds: ['p1', 'p2', 'p3'] }));
      const warningLabels = store.warnings().map((w) => w.label);
      expect(warningLabels.some((l) => l.includes('Pillar limit reached'))).toBe(true);
    });

    it('togglePillar early-returns when the cap is reached and the pillar is new', () => {
      const { store } = setup(makeItem({ pillarIds: ['p1', 'p2', 'p3'] }));
      store.togglePillar('p4');
      expect(store.item()?.pillarIds).toEqual(['p1', 'p2', 'p3']);
      // Removing one is still allowed
      store.togglePillar('p1');
      expect(store.item()?.pillarIds).toEqual(['p2', 'p3']);
    });

    it('reads existing production.brief sub-fields without overwriting them on the first patch', () => {
      const seeded = makeItem({
        production: {
          brief: {
            referenceLinks: ['https://seed.com'],
            dueDate: '2026-12-01',
            campaignName: 'Seed_campaign',
            publishingMode: 'PAID_BOOSTED',
            primaryCta: 'sign-up',
            approvalNote: 'seed note',
          },
        },
      });
      const { store } = setup(seeded);
      // Computeds reflect the seed
      expect(store.referenceLinks()).toEqual(['https://seed.com']);
      expect(store.dueDate()).toBe('2026-12-01');
      expect(store.campaignName()).toBe('Seed_campaign');
      expect(store.publishingMode()).toBe('PAID_BOOSTED');
      expect(store.primaryCta()).toBe('sign-up');
      expect(store.approvalNote()).toBe('seed note');
      expect(store.paidBoosted()).toBe(true);

      // Patching a single field preserves the rest
      store.addReferenceLink('https://added.com');
      expect(store.referenceLinks()).toEqual([
        'https://seed.com',
        'https://added.com',
      ]);
      expect(store.dueDate()).toBe('2026-12-01');
      expect(store.campaignName()).toBe('Seed_campaign');
    });
  });
});

describe('PostDetailStore — landing step (derived from item state)', () => {
  function makeApprovedItem(partial: Partial<ContentItem> = {}): ContentItem {
    return makeItem({ briefApproved: true, ...partial });
  }

  it('briefApproved=false lands on Brief regardless of any persisted step', () => {
    const item = makeItem({
      briefApproved: false,
      production: { productionStep: 'packaging' },
    });
    const { store } = setup(item);
    expect(store.activeStep()).toBe('brief');
  });

  it('briefApproved=true with no persisted step lands on Draft', () => {
    const { store } = setup(makeApprovedItem());
    expect(store.activeStep()).toBe('draft');
  });

  it('briefApproved=true with persisted productionStep="packaging" lands on Packaging', () => {
    const item = makeApprovedItem({
      production: { productionStep: 'packaging' },
    });
    const { store } = setup(item);
    expect(store.activeStep()).toBe('packaging');
  });

  it('briefApproved=true with persisted productionStep="qa" lands on QA', () => {
    const item = makeApprovedItem({
      production: { productionStep: 'qa' },
    });
    const { store } = setup(item);
    expect(store.activeStep()).toBe('qa');
  });

  it('ignores legacy productionStep values not in the UI set and falls back to draft', () => {
    const item = makeApprovedItem({
      production: { productionStep: 'select' as never },
    });
    const { store } = setup(item);
    expect(store.activeStep()).toBe('draft');
  });

  it('user-driven setActiveStep is preserved after the initial landing resolves', () => {
    const { store } = setup(makeApprovedItem());
    expect(store.activeStep()).toBe('draft');
    store.setActiveStep('brief');
    expect(store.activeStep()).toBe('brief');
    // No re-trigger of the landing effect because the item-id hasn't changed.
  });

  it('switching to a different itemId re-resolves the landing step', () => {
    const a = makeApprovedItem({ id: 'a' });
    const b = makeItem({ id: 'b', briefApproved: false });
    const { store, state } = setup(a);
    state.setItems([a, b]);
    expect(store.activeStep()).toBe('draft');
    store.setItemId('b');
    expect(store.activeStep()).toBe('brief');
  });
});

describe('PostDetailStore — advanceProductionStep + approveBrief persistence', () => {
  function makeApprovedItem(partial: Partial<ContentItem> = {}): ContentItem {
    return makeItem({ briefApproved: true, ...partial });
  }

  it('advanceProductionStep sets activeStep AND persists production.productionStep', () => {
    const { store } = setup(makeApprovedItem());
    store.advanceProductionStep('packaging');
    expect(store.activeStep()).toBe('packaging');
    expect(store.item()?.production?.productionStep).toBe('packaging');
  });

  it('advanceProductionStep is a no-op when there is no item', () => {
    const { store } = setup();
    store.setItemId('missing');
    store.advanceProductionStep('draft');
    expect(store.activeStep()).toBe('draft'); // signal still updates
    expect(store.item()).toBeNull();
  });

  it('approveBrief persists productionStep="draft" alongside the approval flags', () => {
    const item = makeItem({ briefApproved: false });
    const { store } = setup(item);
    store.approveBrief('user-sarah');
    const after = store.item();
    expect(after?.briefApproved).toBe(true);
    expect(after?.briefApprovedBy).toBe('user-sarah');
    expect(after?.production?.productionStep).toBe('draft');
  });

  it('approveBrief preserves other production fields (brief, draft)', () => {
    const item = makeItem({
      briefApproved: false,
      production: {
        brief: { canonicalType: 'VIDEO_SHORT_VERTICAL' },
        draft: { mode: 'VIDEO', video: { hook: 'kept' } },
      },
    });
    const { store } = setup(item);
    store.approveBrief();
    const after = store.item();
    expect(after?.production?.brief?.canonicalType).toBe('VIDEO_SHORT_VERTICAL');
    expect(after?.production?.draft?.video?.hook).toBe('kept');
    expect(after?.production?.productionStep).toBe('draft');
  });
});

describe('PostDetailStore — production.draft (#114)', () => {
  function makeApprovedItem(partial: Partial<ContentItem> = {}): ContentItem {
    return makeItem({ briefApproved: true, ...partial });
  }

  it('all draft slots default to empty objects', () => {
    const { store } = setup(makeApprovedItem());
    expect(store.draft()).toBeUndefined();
    expect(store.videoDraft()).toEqual({});
    expect(store.videoLongDraft()).toEqual({});
    expect(store.imageSingleDraft()).toEqual({});
    expect(store.carouselDraft()).toEqual({});
    expect(store.textDraft()).toEqual({});
  });

  describe('write-lock — drafting requires briefApproved=true', () => {
    it('persistVideoDraft is a no-op when briefApproved=false', () => {
      const { store } = setup(makeItem({ briefApproved: false }));
      store.setVideoHook('Locked out');
      expect(store.videoDraft().hook).toBeUndefined();
    });

    it('persistVideoDraft persists when briefApproved=true', () => {
      const { store } = setup(makeApprovedItem());
      store.setVideoHook('Open me');
      expect(store.videoDraft().hook).toBe('Open me');
    });
  });

  describe('VIDEO setters', () => {
    it('all video setters route to videoDraft', () => {
      const { store } = setup(makeApprovedItem());
      store.setVideoHook('hook');
      store.setVideoBody('body');
      store.setVideoCta('cta');
      store.setVideoHookBank(['a', 'b']);
      store.setVideoTargetDuration('60s');
      store.setVideoBRollNotes('b-roll');
      store.setVideoVoiceoverNotes('vo');
      store.setVideoShotList([
        { id: 's1', type: 'Shot', description: 'd', duration: '5s' },
      ]);
      const v = store.videoDraft();
      expect(v).toEqual({
        hook: 'hook',
        body: 'body',
        cta: 'cta',
        hookBank: ['a', 'b'],
        targetDuration: '60s',
        bRollNotes: 'b-roll',
        voiceoverNotes: 'vo',
        shotList: [{ id: 's1', type: 'Shot', description: 'd', duration: '5s' }],
      });
    });
  });

  describe('VIDEO_LONG setters', () => {
    it('all videoLong setters route to videoLongDraft', () => {
      const { store } = setup(makeApprovedItem());
      store.setVideoLongHook('hook');
      store.setVideoLongSequenceBlocks([
        { id: 'b1', type: 'Hook', description: 'open', duration: '10s' },
      ]);
      store.setVideoLongTargetDuration('10m');
      store.setVideoLongVoiceoverNotes('vo');
      const v = store.videoLongDraft();
      expect(v.hook).toBe('hook');
      expect(v.sequenceBlocks).toHaveLength(1);
      expect(v.targetDuration).toBe('10m');
      expect(v.voiceoverNotes).toBe('vo');
    });
  });

  describe('IMAGE_SINGLE setters', () => {
    it('all imageSingle setters route to imageSingleDraft', () => {
      const { store } = setup(makeApprovedItem());
      store.setImageSingleHook('hook');
      store.setImageSingleCreativeDirectionNotes('notes');
      store.setImageSingleImageRef('img.png');
      store.setImageSingleAltText('alt');
      store.setImageSingleHashtags(['#a', '#b']);
      const v = store.imageSingleDraft();
      expect(v).toEqual({
        hook: 'hook',
        creativeDirectionNotes: 'notes',
        imageRef: 'img.png',
        altText: 'alt',
        hashtags: ['#a', '#b'],
      });
    });
  });

  describe('CAROUSEL setters', () => {
    it('all carousel setters route to carouselDraft', () => {
      const { store } = setup(makeApprovedItem());
      store.setCarouselHook('hook');
      store.setCarouselSlides([
        { id: 's1', headline: 'h', body: 'b' },
        { id: 's2', headline: 'h2', body: 'b2' },
      ]);
      store.setCarouselHashtags(['#x']);
      const v = store.carouselDraft();
      expect(v.hook).toBe('hook');
      expect(v.slides).toHaveLength(2);
      expect(v.hashtags).toEqual(['#x']);
    });
  });

  describe('TEXT setters', () => {
    it('all text setters route to textDraft', () => {
      const { store } = setup(makeApprovedItem());
      store.setTextCaption('caption');
      store.setTextImageRef('img.png');
      store.setTextAltText('alt');
      store.setTextHashtags(['#z']);
      const v = store.textDraft();
      expect(v).toEqual({
        caption: 'caption',
        imageRef: 'img.png',
        altText: 'alt',
        hashtags: ['#z'],
      });
    });
  });

  describe('setDraftMode', () => {
    it('persists the canonical mode', () => {
      const { store } = setup(makeApprovedItem());
      store.setDraftMode('VIDEO');
      expect(store.draft()?.mode).toBe('VIDEO');
    });

    it('is a no-op when briefApproved=false', () => {
      const { store } = setup(makeItem({ briefApproved: false }));
      store.setDraftMode('VIDEO');
      expect(store.draft()).toBeUndefined();
    });

    it('is a no-op when mode is unchanged', () => {
      const seeded = makeApprovedItem({
        production: {
          draft: { mode: 'VIDEO', video: { hook: 'kept' } },
        },
      });
      const { store } = setup(seeded);
      const before = store.item()?.updatedAt;
      store.setDraftMode('VIDEO');
      // hook is preserved (no rewrite)
      expect(store.videoDraft().hook).toBe('kept');
      expect(store.item()?.updatedAt).toBe(before);
    });
  });

  describe('per-mode validation (draftErrors)', () => {
    it('VIDEO: requires hook + ≥ 1 shot', () => {
      const { store } = setup(makeApprovedItem());
      store.setDraftMode('VIDEO');
      expect(store.draftErrors().map((e) => e.field)).toEqual([
        'hook',
        'shotList',
      ]);
      store.setVideoHook('h');
      expect(store.draftErrors().map((e) => e.field)).toEqual(['shotList']);
      store.setVideoShotList([
        { id: 's1', type: 'Shot', description: 'd', duration: '5s' },
      ]);
      expect(store.draftErrors()).toEqual([]);
      expect(store.canContinueFromDraft()).toBe(true);
    });

    it('VIDEO_LONG: requires ≥ 1 sequence block with non-empty description', () => {
      const { store } = setup(makeApprovedItem());
      store.setDraftMode('VIDEO_LONG');
      expect(store.draftErrors().map((e) => e.field)).toEqual([
        'sequenceBlocks',
      ]);
      store.setVideoLongSequenceBlocks([
        { id: 'b1', type: 'Hook', description: '', duration: '' },
      ]);
      expect(store.draftErrors().map((e) => e.field)).toEqual([
        'sequenceBlocks',
      ]);
      store.setVideoLongSequenceBlocks([
        { id: 'b1', type: 'Hook', description: 'open', duration: '' },
      ]);
      expect(store.draftErrors()).toEqual([]);
    });

    it('IMAGE_SINGLE: requires hook + image ref', () => {
      const { store } = setup(makeApprovedItem());
      store.setDraftMode('IMAGE_SINGLE');
      expect(store.draftErrors().map((e) => e.field)).toEqual([
        'hook',
        'imageRef',
      ]);
      store.setImageSingleHook('h');
      store.setImageSingleImageRef('img.png');
      expect(store.draftErrors()).toEqual([]);
    });

    it('CAROUSEL: requires hook + ≥ 2 slides with headlines', () => {
      const { store } = setup(makeApprovedItem());
      store.setDraftMode('CAROUSEL');
      expect(store.draftErrors().map((e) => e.field)).toEqual([
        'hook',
        'slides',
      ]);
      store.setCarouselHook('h');
      store.setCarouselSlides([
        { id: 's1', headline: 'a', body: '' },
      ]);
      expect(store.draftErrors().map((e) => e.field)).toEqual(['slides']);
      store.setCarouselSlides([
        { id: 's1', headline: 'a', body: '' },
        { id: 's2', headline: 'b', body: '' },
      ]);
      expect(store.draftErrors()).toEqual([]);
    });

    it('TEXT: requires caption', () => {
      const { store } = setup(makeApprovedItem());
      store.setDraftMode('TEXT');
      expect(store.draftErrors().map((e) => e.field)).toEqual(['caption']);
      store.setTextCaption('a caption');
      expect(store.draftErrors()).toEqual([]);
    });

    it('unsupported mode (DOCUMENT) returns "not supported" error', () => {
      const { store } = setup(makeApprovedItem());
      store.setDraftMode('DOCUMENT');
      expect(store.draftErrors().map((e) => e.field)).toEqual(['mode']);
    });
  });

  describe('errors() — step-aware routing', () => {
    it('returns brief errors when activeStep=brief', () => {
      const item = makeItem({
        keyMessage: '',
        owner: null,
        cta: undefined,
      });
      const { store } = setup(item);
      store.setActiveStep('brief');
      expect(store.errors().map((e) => e.field)).toEqual([
        'keyMessage',
        'owner',
        'ctaType',
      ]);
    });

    it('returns draft errors when activeStep=draft', () => {
      const item = makeApprovedItem({
        keyMessage: 'set',
        owner: 'user-sarah',
        cta: { type: 'learn-more', text: 'go' },
      });
      const { store } = setup(item);
      store.setDraftMode('VIDEO');
      store.setActiveStep('draft');
      expect(store.errors().map((e) => e.field)).toEqual([
        'hook',
        'shotList',
      ]);
    });

    it('canApprove gates only on briefErrors — drafting cannot re-disable approval', () => {
      const { store } = setup(makeApprovedItem());
      store.setDraftMode('VIDEO');
      // Draft is incomplete, but canApprove (a brief-side concept) should not
      // be blocked by it.
      expect(store.draftErrors().length).toBeGreaterThan(0);
      expect(store.canApprove()).toBe(true);
    });
  });

  describe('unlockedThroughIndex — Model A gating chain', () => {
    it('returns 0 when the brief is not approved (only Brief reachable)', () => {
      const { store } = setup(makeItem({ briefApproved: false }));
      expect(store.unlockedThroughIndex()).toBe(0);
    });

    it('returns 1 when briefApproved but draft is not yet valid (Brief + Draft reachable)', () => {
      const { store } = setup(makeApprovedItem());
      store.setDraftMode('VIDEO');
      // No hook, no shots — draft is invalid.
      expect(store.canContinueFromDraft()).toBe(false);
      expect(store.unlockedThroughIndex()).toBe(1);
    });

    it('returns 2 when draft is valid (Packaging reachable; Approve & Schedule stays locked until packaging is built)', () => {
      const { store } = setup(makeApprovedItem());
      store.setDraftMode('VIDEO');
      store.setVideoHook('Hook copy');
      store.setVideoShotList([
        { id: 's1', type: 'Shot', description: 'desc', duration: '5s' },
      ]);
      expect(store.canContinueFromDraft()).toBe(true);
      expect(store.canContinueFromPackaging()).toBe(false);
      expect(store.unlockedThroughIndex()).toBe(2);
    });

    it('packagingErrors flags the not-yet-implemented placeholder', () => {
      const { store } = setup(makeApprovedItem());
      expect(store.packagingErrors().map((e) => e.field)).toEqual(['packaging']);
      expect(store.canContinueFromPackaging()).toBe(false);
    });
  });
});
