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

    it('most brief sub-field setters respect the briefApproved write-lock (paid-mode fields are exempt)', () => {
      const { store } = setup(makeItem({ briefApproved: true }));
      store.setReferenceLinks(['https://x.com']);
      store.setDueDate('2030-01-01');
      store.togglePrimaryCta('sign-up');
      store.setApprovalNote('blocked');
      expect(store.referenceLinks()).toEqual([]);
      expect(store.dueDate()).toBeUndefined();
      expect(store.primaryCta()).toBeUndefined();
      expect(store.approvalNote()).toBe('');
    });

    it('paid-mode brief fields (publishingMode, campaignName, destinationUrl, legalApprover) bypass the write-lock (#116)', () => {
      // The Publishing Mode toggle + Paid/Boosted required-fields panel
      // both live on the Packaging step in the prototype. Locking these
      // brief fields after approval would break that flow.
      const { store } = setup(makeItem({ briefApproved: true }));
      store.setPublishingMode('PAID_BOOSTED');
      store.setCampaignName('Spring Launch 2026');
      store.setDestinationUrl('https://example.com');
      store.setLegalApprover('legal@example.com');
      expect(store.publishingMode()).toBe('PAID_BOOSTED');
      expect(store.campaignName()).toBe('Spring Launch 2026');
      expect(store.destinationUrl()).toBe('https://example.com');
      expect(store.legalApprover()).toBe('legal@example.com');
      // Clearing destinationUrl / legalApprover (empty string) writes undefined.
      store.setDestinationUrl('');
      store.setLegalApprover('');
      expect(store.destinationUrl()).toBeUndefined();
      expect(store.legalApprover()).toBeUndefined();
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

  // ── #129: pipeline-lane sync — qa advance flips in-progress→review ──
  it('U-1: advanceProductionStep("qa") on in-progress post flips status to review + persists step + bumps updatedAt', () => {
    const before = '2026-01-01T00:00:00.000Z';
    const seeded = makeApprovedItem({
      status: 'in-progress',
      updatedAt: before,
      production: { productionStep: 'packaging' },
    });
    const { store } = setup(seeded);
    store.advanceProductionStep('qa');
    const after = store.item();
    expect(after?.status).toBe('review');
    expect(after?.production?.productionStep).toBe('qa');
    expect(after?.updatedAt).not.toBe(before);
  });

  it('U-2: advanceProductionStep("qa") on a "review" post leaves status="review" (no churn), still persists step', () => {
    const seeded = makeApprovedItem({
      status: 'review',
      production: { productionStep: 'packaging' },
    });
    const { store } = setup(seeded);
    store.advanceProductionStep('qa');
    const after = store.item();
    expect(after?.status).toBe('review');
    expect(after?.production?.productionStep).toBe('qa');
  });

  it('U-3a: advanceProductionStep("qa") does NOT downgrade status="scheduled"', () => {
    const seeded = makeApprovedItem({
      status: 'scheduled',
      production: { productionStep: 'packaging' },
    });
    const { store } = setup(seeded);
    store.advanceProductionStep('qa');
    expect(store.item()?.status).toBe('scheduled');
    expect(store.item()?.production?.productionStep).toBe('qa');
  });

  it('U-3b: advanceProductionStep("qa") does NOT downgrade status="published"', () => {
    const seeded = makeApprovedItem({
      status: 'published',
      production: { productionStep: 'packaging' },
    });
    const { store } = setup(seeded);
    store.advanceProductionStep('qa');
    expect(store.item()?.status).toBe('published');
    expect(store.item()?.production?.productionStep).toBe('qa');
  });

  it('U-4a: advanceProductionStep("draft") on in-progress post never touches status', () => {
    const seeded = makeApprovedItem({ status: 'in-progress' });
    const { store } = setup(seeded);
    store.advanceProductionStep('draft');
    expect(store.item()?.status).toBe('in-progress');
    expect(store.item()?.production?.productionStep).toBe('draft');
  });

  it('U-4b: advanceProductionStep("packaging") on in-progress post never touches status', () => {
    const seeded = makeApprovedItem({ status: 'in-progress' });
    const { store } = setup(seeded);
    store.advanceProductionStep('packaging');
    expect(store.item()?.status).toBe('in-progress');
    expect(store.item()?.production?.productionStep).toBe('packaging');
  });

  it('U-5: setActiveStep("qa") does NOT call saveItem and does NOT mutate status', () => {
    const seeded = makeApprovedItem({
      status: 'in-progress',
      production: { productionStep: 'packaging' },
    });
    const { store, state } = setup(seeded);
    const saveSpy = vi.spyOn(state, 'saveItem');
    const updatedAtBefore = store.item()?.updatedAt;
    store.setActiveStep('qa');
    expect(store.activeStep()).toBe('qa');
    expect(saveSpy).not.toHaveBeenCalled();
    expect(store.item()?.status).toBe('in-progress');
    expect(store.item()?.production?.productionStep).toBe('packaging');
    expect(store.item()?.updatedAt).toBe(updatedAtBefore);
    saveSpy.mockRestore();
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

    // #139: shared asset pool replaces the prior coverAssetRef slot.
    it('#139: setVideoUploadedAssets persists when brief is approved', () => {
      const { store } = setup(makeApprovedItem());
      store.setVideoUploadedAssets([
        { id: 'a1', filename: 'clip.mp4', mimeType: 'video/mp4', size: 1024 },
      ]);
      expect(store.videoDraft().uploadedAssets).toEqual([
        { id: 'a1', filename: 'clip.mp4', mimeType: 'video/mp4', size: 1024 },
      ]);
    });

    it('#139: setVideoUploadedAssets is a no-op when briefApproved=false', () => {
      const { store } = setup(makeItem({ briefApproved: false }));
      store.setVideoUploadedAssets([{ id: 'a1', filename: 'clip.mp4' }]);
      expect(store.videoDraft().uploadedAssets).toBeUndefined();
    });

    it('#139: setVideoUploadedAssetsAndShotList persists both in one operation', () => {
      const { store } = setup(makeApprovedItem());
      store.setVideoUploadedAssetsAndShotList(
        [{ id: 'a1', filename: 'clip.mp4' }],
        [{ id: 's1', type: 'Shot', description: 'd', duration: '5s', assetRef: 'a1' }],
      );
      const v = store.videoDraft();
      expect(v.uploadedAssets).toEqual([{ id: 'a1', filename: 'clip.mp4' }]);
      expect(v.shotList).toEqual([
        { id: 's1', type: 'Shot', description: 'd', duration: '5s', assetRef: 'a1' },
      ]);
    });

    it('#139: setVideoUploadedAssetsAndShotList is a no-op when briefApproved=false', () => {
      const { store } = setup(makeItem({ briefApproved: false }));
      store.setVideoUploadedAssetsAndShotList(
        [{ id: 'a1', filename: 'clip.mp4' }],
        [{ id: 's1', type: 'Shot', description: '', duration: '5s' }],
      );
      expect(store.videoDraft().uploadedAssets).toBeUndefined();
      expect(store.videoDraft().shotList).toBeUndefined();
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

    it('packagingErrors gates on per-platform caption presence (#116)', () => {
      // Brief-approved Instagram post with no caption: packaging is invalid.
      const { store } = setup(makeApprovedItem({ platform: 'instagram' }));
      expect(store.packagingErrors().map((e) => e.field)).toEqual(['caption']);
      expect(store.canContinueFromPackaging()).toBe(false);
      // Setting a caption clears the error.
      store.setInstagramPackaging({ caption: 'Hello world' });
      expect(store.packagingErrors()).toEqual([]);
      expect(store.canContinueFromPackaging()).toBe(true);
    });

    it('packagingErrors gates TikTok on caption presence (#116)', () => {
      const { store } = setup(makeApprovedItem({ platform: 'tiktok' }));
      expect(store.packagingErrors().map((e) => e.field)).toEqual(['caption']);
      store.setTikTokPackaging({ caption: 'tiktok caption' });
      expect(store.packagingErrors()).toEqual([]);
    });

    it('packagingErrors gates LinkedIn on caption presence (#116)', () => {
      const { store } = setup(makeApprovedItem({ platform: 'linkedin' }));
      expect(store.packagingErrors().map((e) => e.field)).toEqual(['caption']);
      store.setLinkedInPackaging({ caption: 'li' });
      expect(store.packagingErrors()).toEqual([]);
    });

    it('packagingErrors gates Facebook on caption presence (#116)', () => {
      const { store } = setup(makeApprovedItem({ platform: 'facebook' }));
      expect(store.packagingErrors().map((e) => e.field)).toEqual(['caption']);
      store.setFacebookPackaging({ caption: 'fb' });
      expect(store.packagingErrors()).toEqual([]);
    });

    it('packagingErrors for X enforces both presence + 280-char hard cap (#116)', () => {
      const { store } = setup(makeApprovedItem({ platform: 'x' }));
      // Empty caption → required error
      expect(store.packagingErrors().map((e) => e.field)).toEqual(['caption']);
      // 281 chars → length error
      store.setXPackaging({ caption: 'x'.repeat(281) });
      expect(store.packagingErrors()[0].label).toContain('280');
      // Exactly 280 → ok
      store.setXPackaging({ caption: 'x'.repeat(280) });
      expect(store.packagingErrors()).toEqual([]);
    });

    it('packagingErrors for YouTube requires both title and description (#116)', () => {
      const { store } = setup(makeApprovedItem({ platform: 'youtube' }));
      // Both missing → two errors
      expect(store.packagingErrors().map((e) => e.field)).toEqual(['title', 'description']);
      // Title only → description error remains
      store.setYouTubePackaging({ title: 'My video' });
      expect(store.packagingErrors().map((e) => e.field)).toEqual(['description']);
      // Both set → clear
      store.setYouTubePackaging({ title: 'My video', description: 'Big description' });
      expect(store.packagingErrors()).toEqual([]);
    });

    it('packagingErrors for tbd / unknown platform tells the user to set a platform (#116)', () => {
      const { store } = setup(makeApprovedItem({ platform: 'tbd' }));
      expect(store.packagingErrors()[0].field).toBe('platform');
      expect(store.canContinueFromPackaging()).toBe(false);
    });

    it('errors() routes to packagingErrors when activeStep=packaging (#116)', () => {
      const { store } = setup(makeApprovedItem({ platform: 'instagram' }));
      store.setActiveStep('packaging');
      expect(store.errors().map((e) => e.field)).toEqual(['caption']);
    });

    // ── Branch-coverage tests for setter / computed nullish paths ──
    // These exercise pre-approval setters (write-lock isn't engaged on
    // briefApproved=false items).
    it('setOwner converts whitespace-only value to null (|| null branch)', () => {
      const { store } = setup(makeItem({ owner: 'someone' }));
      store.setOwner('   ');
      expect(store.item()?.owner).toBeNull();
    });

    it('setObjective converts empty string to undefined (=== "" branch)', () => {
      const { store } = setup(makeItem({ objective: 'engagement' }));
      store.setObjective('');
      expect(store.item()?.objective).toBeUndefined();
    });

    it('setTonePreset converts empty string to undefined', () => {
      const { store } = setup(makeItem({ tonePreset: 'casual' }));
      store.setTonePreset('');
      expect(store.item()?.tonePreset).toBeUndefined();
    });

    it('setCtaType("") clears cta entirely; non-empty value seeds with existing text or empty', () => {
      const { store } = setup(makeItem({ cta: { type: 'follow', text: 'go' } }));
      store.setCtaType('');
      expect(store.item()?.cta).toBeUndefined();
      // Re-setting a type uses existing text (none after clear) → empty text
      store.setCtaType('learn-more');
      expect(store.item()?.cta).toEqual({ type: 'learn-more', text: '' });
    });

    it('setCtaText is a no-op when there is no existing cta', () => {
      const { store } = setup(makeItem({ cta: undefined }));
      store.setCtaText('hello');
      expect(store.item()?.cta).toBeUndefined();
    });

    it('togglePillar is a no-op when item is null', () => {
      const { store } = setup();
      store.setItemId('missing');
      // Pre-call assert: item is null
      expect(store.item()).toBeNull();
      // No throw, no state change
      expect(() => store.togglePillar('p1')).not.toThrow();
    });

    it('togglePillar respects MAX_PILLARS limit (does not add a 4th)', () => {
      const { store } = setup(
        makeApprovedItem({ pillarIds: ['p1', 'p2', 'p3'] }),
      );
      store.togglePillar('p4');
      expect(store.item()?.pillarIds).toEqual(['p1', 'p2', 'p3']);
    });

    it('toggleSegment is a no-op when item is null', () => {
      const { store } = setup();
      store.setItemId('missing');
      expect(() => store.toggleSegment('s1')).not.toThrow();
    });

    it('hasClaims/hasTalent/hasMusic flags are all false when brief is missing', () => {
      const { store } = setup();
      store.setItemId('missing');
      expect(store.hasClaims()).toBe(false);
      expect(store.hasTalent()).toBe(false);
      expect(store.hasMusic()).toBe(false);
      // needsAccessibility defaults to TRUE per its omitted-≠-not-needed rule
      expect(store.needsAccessibility()).toBe(true);
      expect(store.activeFlagCount()).toBe(1);
    });

    it('needsAccessibility returns false only when explicitly set to false', () => {
      const { store } = setup(
        makeApprovedItem({
          production: {
            brief: { needsAccessibility: false },
          },
        }),
      );
      expect(store.needsAccessibility()).toBe(false);
    });

    it('activeFlagCount counts all four flags when all true', () => {
      const { store } = setup(
        makeApprovedItem({
          production: {
            brief: {
              hasTalent: true,
              hasMusic: true,
              compliance: { containsClaims: true },
              needsAccessibility: true,
            },
          },
        }),
      );
      expect(store.activeFlagCount()).toBe(4);
    });

    it('pastDueDate returns false for invalid date strings', () => {
      const { store } = setup(
        makeApprovedItem({
          production: { brief: { dueDate: 'not-a-date' } },
        }),
      );
      expect(store.pastDueDate()).toBe(false);
    });

    it('pastDueDate returns false when no dueDate is set', () => {
      const { store } = setup();
      expect(store.pastDueDate()).toBe(false);
    });

    it('pastDueDate returns true for a date in the past', () => {
      const { store } = setup(
        makeApprovedItem({
          production: { brief: { dueDate: '2020-01-01' } },
        }),
      );
      expect(store.pastDueDate()).toBe(true);
    });

    it('approvalNote defaults to empty string when missing', () => {
      const { store } = setup();
      expect(store.approvalNote()).toBe('');
    });

    it('referenceLinks defaults to empty array when missing', () => {
      const { store } = setup();
      expect(store.referenceLinks()).toEqual([]);
    });

    it('draft slots (videoDraft, imageSingleDraft, etc.) all return empty objects when draft is missing', () => {
      const { store } = setup();
      expect(store.draft()).toBeUndefined();
      expect(store.videoDraft()).toEqual({});
      expect(store.videoLongDraft()).toEqual({});
      expect(store.imageSingleDraft()).toEqual({});
      expect(store.carouselDraft()).toEqual({});
      expect(store.textDraft()).toEqual({});
    });

    it('per-platform packaging computeds return undefined when packaging slot is missing', () => {
      const { store } = setup();
      expect(store.packaging()).toBeUndefined();
      expect(store.instagramPackaging()).toBeUndefined();
      expect(store.tiktokPackaging()).toBeUndefined();
      expect(store.youtubePackaging()).toBeUndefined();
      expect(store.linkedinPackaging()).toBeUndefined();
      expect(store.facebookPackaging()).toBeUndefined();
      expect(store.xPackaging()).toBeUndefined();
    });

    it('per-platform packaging computeds resolve to the right slot when set', () => {
      const { store } = setup(makeApprovedItem({ platform: 'tiktok' }));
      store.setTikTokPackaging({ caption: 'tt' });
      expect(store.tiktokPackaging()?.caption).toBe('tt');
      expect(store.instagramPackaging()).toBeUndefined();
    });

    it('persistPackagingSlot is a no-op when briefApproved=false (write-lock)', () => {
      const { store } = setup(makeItem({ platform: 'instagram' }));
      // briefApproved defaults to false on makeItem → packaging write is blocked.
      store.setInstagramPackaging({ caption: 'blocked' });
      expect(store.instagramPackaging()).toBeUndefined();
    });

    it('persistPackagingSlot is a no-op when item is null', () => {
      const { store } = setup();
      store.setItemId('missing');
      expect(() => store.setInstagramPackaging({ caption: 'x' })).not.toThrow();
      expect(store.instagramPackaging()).toBeUndefined();
    });
  });

  describe('liveSiblingPostCount (ticket #118)', () => {
    function seedWith(siblings: ContentItem[]): {
      store: PostDetailStore;
      state: ContentStateService;
    } {
      const current = makeItem({ id: 'post-1', conceptId: 'concept-1' });
      const { store, state } = setup(current);
      state.setItems([current, ...siblings]);
      return { store, state };
    }

    it('returns 0 when the current item has no conceptId', () => {
      const { store } = setup(makeItem({ conceptId: undefined }));
      expect(store.liveSiblingPostCount()).toBe(0);
    });

    it('counts the current post itself when it is the only live child', () => {
      const { store } = seedWith([]);
      expect(store.liveSiblingPostCount()).toBe(1);
    });

    it('counts live sibling posts under the same concept', () => {
      const { store } = seedWith([
        makeItem({ id: 'post-2', conceptId: 'concept-1', title: 'Sib1' }),
        makeItem({ id: 'post-3', conceptId: 'concept-1', title: 'Sib2' }),
      ]);
      expect(store.liveSiblingPostCount()).toBe(3);
    });

    it('excludes archived siblings', () => {
      const { store } = seedWith([
        makeItem({ id: 'post-2', conceptId: 'concept-1', title: 'Live' }),
        makeItem({
          id: 'post-3',
          conceptId: 'concept-1',
          title: 'Archived',
          archived: true,
        }),
      ]);
      expect(store.liveSiblingPostCount()).toBe(2);
    });

    it('excludes non-post stages even if they share the concept id', () => {
      const { store } = seedWith([
        makeItem({ id: 'other-concept', conceptId: 'concept-1', stage: 'concept', title: 'Concept dup' }),
      ]);
      expect(store.liveSiblingPostCount()).toBe(1);
    });

    it('excludes posts under a different concept', () => {
      const { store } = seedWith([
        makeItem({ id: 'post-other', conceptId: 'concept-2', title: 'Other parent' }),
      ]);
      expect(store.liveSiblingPostCount()).toBe(1);
    });
  });

  // ── Function-call throw paths ──────────────────────────────────────
  // V8's coverage instrumentation marks every function call expression
  // as having two paths: "returned normally" and "threw an exception".
  // For pure framework calls like computed(()=>...) and signal(...)
  // the throw path is normally unreachable. This block intentionally
  // forces the underlying callback to throw to exercise that path.
  describe('Function-call throw paths (V8 coverage exhaustion)', () => {
    it('item() computed re-throws when state.items().find() throws', () => {
      const { store, state } = setup();
      // Poison the state.items() signal with an iterable whose .find()
      // throws. The item() computed wraps a .find() call; when the
      // callback throws, computed() re-throws on read.
      const poisoned = {
        find: () => {
          throw new Error('boom');
        },
      } as unknown as ReturnType<typeof state.items>;
      const itemsSpy = vi.spyOn(state, 'items').mockReturnValue(poisoned);
      expect(() => store.item()).toThrow('boom');
      itemsSpy.mockRestore();
    });

    it('brief() computed propagates exceptions from item()', () => {
      const { store, state } = setup();
      const itemsSpy = vi.spyOn(state, 'items').mockImplementation(() => {
        throw new Error('items-boom');
      });
      expect(() => store.brief()).toThrow('items-boom');
      itemsSpy.mockRestore();
    });

    it('packaging() computed propagates exceptions from item()', () => {
      const { store, state } = setup();
      const itemsSpy = vi.spyOn(state, 'items').mockImplementation(() => {
        throw new Error('items-boom');
      });
      expect(() => store.packaging()).toThrow('items-boom');
      itemsSpy.mockRestore();
    });
  });
});

// ── Approve & Schedule (#124) ────────────────────────────────────────
describe('PostDetailStore — Approve & Schedule slot', () => {
  function approvedItem(partial: Partial<ContentItem> = {}): ContentItem {
    return makeItem({
      briefApproved: true,
      briefApprovedAt: new Date().toISOString(),
      briefApprovedBy: 'You',
      ...partial,
    });
  }

  describe('default workflow + computeds', () => {
    it('returns the default single-Brand-Reviewer workflow when no approvals persisted', () => {
      const { store } = setup(approvedItem());
      const approvals = store.approvals();
      expect(approvals).toHaveLength(1);
      expect(approvals[0]).toMatchObject({
        role: 'brand-reviewer',
        label: 'Brand Reviewer',
        required: true,
        status: 'pending',
      });
    });

    it('returns persisted approvals when present, not the default', () => {
      const { store } = setup(
        approvedItem({
          production: {
            qa: {
              approvals: [
                {
                  role: 'legal',
                  label: 'Legal',
                  required: false,
                  status: 'approved',
                },
              ],
            },
          },
        }),
      );
      const approvals = store.approvals();
      expect(approvals).toHaveLength(1);
      expect(approvals[0].role).toBe('legal');
      expect(approvals[0].status).toBe('approved');
    });

    it('treats an empty persisted approvals array as "no approvals yet" and returns the default', () => {
      const { store } = setup(
        approvedItem({ production: { qa: { approvals: [] } } }),
      );
      expect(store.approvals()).toHaveLength(1);
      expect(store.approvals()[0].role).toBe('brand-reviewer');
    });

    it('publishConfig defaults to Save Draft + Auto when not persisted', () => {
      const { store } = setup(approvedItem());
      expect(store.publishConfig()).toEqual({
        publishAction: 'save-draft',
        deliveryMethod: 'auto',
      });
    });

    it('publishConfig returns persisted value when present', () => {
      const { store } = setup(
        approvedItem({
          production: {
            qa: {
              publishConfig: {
                publishAction: 'schedule',
                scheduleAt: '2099-01-01T10:00',
                deliveryMethod: 'manual',
                notifyTeam: true,
              },
            },
          },
        }),
      );
      expect(store.publishConfig().publishAction).toBe('schedule');
      expect(store.publishConfig().notifyTeam).toBe(true);
    });

    it('qaApproved is true when qa.approved is true on the item', () => {
      const { store } = setup(
        approvedItem({ production: { qa: { approved: true } } }),
      );
      expect(store.qaApproved()).toBe(true);
    });

    it('qaApproved is false when the qa slot is missing', () => {
      const { store } = setup(approvedItem());
      expect(store.qaApproved()).toBe(false);
    });

    it('canApproveAndPublish reflects pendingRequired + hasChangesRequested', () => {
      const { store } = setup(approvedItem());
      // Default: 1 required pending → can't approve.
      expect(store.canApproveAndPublish()).toBe(false);
      expect(store.pendingRequired()).toHaveLength(1);
      expect(store.hasChangesRequested()).toBe(false);

      // Approve the row.
      store.setApprovalStatus('brand-reviewer', 'approved');
      expect(store.canApproveAndPublish()).toBe(true);
      expect(store.pendingRequired()).toHaveLength(0);

      // Flip to changes-requested.
      store.setApprovalStatus('brand-reviewer', 'changes-requested', 'note');
      expect(store.canApproveAndPublish()).toBe(false);
      expect(store.hasChangesRequested()).toBe(true);
    });
  });

  describe('setApprovalStatus', () => {
    it('updates the matching approver row, stamps a timestamp, and stores the note', () => {
      const { store } = setup(approvedItem());
      store.setApprovalStatus('brand-reviewer', 'changes-requested', '  Tighten hook  ');
      const updated = store.approvals()[0];
      expect(updated.status).toBe('changes-requested');
      expect(updated.note).toBe('Tighten hook'); // trimmed
      expect(updated.timestamp).toBeDefined();
    });

    it('clears the note when an empty/whitespace string is passed', () => {
      const { store } = setup(approvedItem());
      store.setApprovalStatus('brand-reviewer', 'changes-requested', 'note');
      expect(store.approvals()[0].note).toBe('note');
      store.setApprovalStatus('brand-reviewer', 'pending', '   ');
      expect(store.approvals()[0].note).toBeUndefined();
    });

    it('is a no-op when brief is not approved (write-lock honored)', () => {
      const { store } = setup(makeItem());
      store.setApprovalStatus('brand-reviewer', 'approved');
      expect(store.qa()).toBeUndefined();
    });

    it('does nothing when there is no item', () => {
      const { store } = setup(approvedItem());
      store.setItemId('missing');
      store.setApprovalStatus('brand-reviewer', 'approved');
      expect(store.qa()).toBeUndefined();
    });

    it('preserves untouched rows on multi-approver workflows', () => {
      const { store } = setup(
        approvedItem({
          production: {
            qa: {
              approvals: [
                { role: 'brand-reviewer', label: 'Brand Reviewer', required: true, status: 'pending' },
                { role: 'legal', label: 'Legal', required: false, status: 'pending' },
              ],
            },
          },
        }),
      );
      store.setApprovalStatus('legal', 'approved');
      expect(store.approvals()[0].status).toBe('pending');
      expect(store.approvals()[1].status).toBe('approved');
    });
  });

  describe('setPublishConfig', () => {
    it('merges patch with existing publish config', () => {
      const { store } = setup(approvedItem());
      store.setPublishConfig({ publishAction: 'schedule' });
      store.setPublishConfig({ notifyTeam: true });
      expect(store.publishConfig().publishAction).toBe('schedule');
      expect(store.publishConfig().notifyTeam).toBe(true);
      expect(store.publishConfig().deliveryMethod).toBe('auto'); // preserved default
    });

    it('is a no-op when brief is not approved', () => {
      const { store } = setup(makeItem());
      store.setPublishConfig({ publishAction: 'schedule' });
      expect(store.qa()).toBeUndefined();
    });
  });

  describe('markApproved', () => {
    it('sets approved/qaApprovedAt/qaApprovedBy on the qa slot', () => {
      const { store } = setup(approvedItem());
      store.markApproved('Brand Captain');
      expect(store.qaApproved()).toBe(true);
      expect(store.qa()?.qaApprovedAt).toBeDefined();
      expect(store.qa()?.qaApprovedBy).toBe('Brand Captain');
    });

    it('defaults qaApprovedBy to "You"', () => {
      const { store } = setup(approvedItem());
      store.markApproved();
      expect(store.qa()?.qaApprovedBy).toBe('You');
    });

    it('is a no-op when brief is not approved', () => {
      const { store } = setup(makeItem());
      store.markApproved();
      expect(store.qaApproved()).toBe(false);
    });
  });

  it('persistence round-trip: setApprovalStatus + setPublishConfig + markApproved survives reload', () => {
    const { store, state } = setup(approvedItem());
    store.setApprovalStatus('brand-reviewer', 'approved');
    store.setPublishConfig({ publishAction: 'schedule', scheduleAt: '2099-01-01T10:00' });
    store.markApproved();

    // Simulate reload: rebuild a new store against the same persisted state.
    const newStore = TestBed.inject(PostDetailStore);
    newStore.setItemId('post-1');
    // The state was mutated through state.saveItem; verify by re-reading items.
    const saved = state.items().find((i) => i.id === 'post-1');
    expect(saved?.production?.qa?.approvals?.[0].status).toBe('approved');
    expect(saved?.production?.qa?.publishConfig?.publishAction).toBe('schedule');
    expect(saved?.production?.qa?.publishConfig?.scheduleAt).toBe('2099-01-01T10:00');
    expect(saved?.production?.qa?.approved).toBe(true);
  });
});

// Ticket #135 — Approve & Schedule live-sync to top-level scheduledAt + status
describe('PostDetailStore — schedule live-sync (#135)', () => {
  function approvedItem(partial: Partial<ContentItem> = {}): ContentItem {
    return makeItem({
      status: 'review',
      briefApproved: true,
      briefApprovedAt: '2026-04-01T00:00:00.000Z',
      briefApprovedBy: 'You',
      ...partial,
    });
  }

  describe('schedule write path (review → scheduled)', () => {
    it('stamps top-level scheduledAt/scheduledDate/status when publishAction=schedule and scheduleAt is set', () => {
      const { store, state } = setup(approvedItem());
      store.setPublishConfig({
        publishAction: 'schedule',
        scheduleAt: '2026-06-01T15:00',
      });
      const saved = state.items().find((i) => i.id === 'post-1');
      expect(saved?.status).toBe('scheduled');
      expect(saved?.scheduledAt).toBe('2026-06-01T15:00:00.000Z');
      expect(saved?.scheduledDate).toBe('2026-06-01');
      expect(saved?.production?.qa?.publishConfig?.publishAction).toBe('schedule');
      expect(saved?.production?.qa?.publishConfig?.scheduleAt).toBe('2026-06-01T15:00');
    });

    it('does NOT promote status when current is in-progress', () => {
      const { store, state } = setup(
        approvedItem({ status: 'in-progress' }),
      );
      store.setPublishConfig({
        publishAction: 'schedule',
        scheduleAt: '2026-06-01T15:00',
      });
      const saved = state.items().find((i) => i.id === 'post-1');
      expect(saved?.status).toBe('in-progress');
      expect(saved?.scheduledAt).toBe('2026-06-01T15:00:00.000Z');
    });

    it('does NOT downgrade a published post but still updates scheduledAt', () => {
      const { store, state } = setup(approvedItem({ status: 'published' }));
      store.setPublishConfig({
        publishAction: 'schedule',
        scheduleAt: '2026-06-01T15:00',
      });
      const saved = state.items().find((i) => i.id === 'post-1');
      expect(saved?.status).toBe('published');
      expect(saved?.scheduledAt).toBe('2026-06-01T15:00:00.000Z');
    });

    it('does NOT promote a draft post (status not in the allowlist)', () => {
      const { store, state } = setup(approvedItem({ status: 'draft' }));
      store.setPublishConfig({
        publishAction: 'schedule',
        scheduleAt: '2026-06-01T15:00',
      });
      const saved = state.items().find((i) => i.id === 'post-1');
      expect(saved?.status).toBe('draft');
      expect(saved?.scheduledAt).toBe('2026-06-01T15:00:00.000Z');
    });

    it('does NOT write top-level fields when scheduleAt is empty', () => {
      const { store, state } = setup(approvedItem());
      store.setPublishConfig({ publishAction: 'schedule', scheduleAt: '' });
      const saved = state.items().find((i) => i.id === 'post-1');
      expect(saved?.scheduledAt).toBeNull();
      expect(saved?.scheduledDate).toBeNull();
      expect(saved?.status).toBe('review');
    });

    it('does NOT write top-level fields when scheduleAt is malformed', () => {
      const { store, state } = setup(approvedItem());
      store.setPublishConfig({
        publishAction: 'schedule',
        scheduleAt: 'not-a-date',
      });
      const saved = state.items().find((i) => i.id === 'post-1');
      expect(saved?.scheduledAt).toBeNull();
      expect(saved?.scheduledDate).toBeNull();
      expect(saved?.status).toBe('review');
    });

    it('does NOT promote status when publishAction is not "schedule"', () => {
      const { store, state } = setup(approvedItem());
      store.setPublishConfig({
        publishAction: 'publish-now',
        scheduleAt: '2026-06-01T15:00',
      });
      const saved = state.items().find((i) => i.id === 'post-1');
      expect(saved?.status).toBe('review');
      expect(saved?.scheduledAt).toBeNull();
    });
  });

  describe('unschedule write path (scheduled → review)', () => {
    function scheduledItem(): ContentItem {
      return approvedItem({
        status: 'scheduled',
        scheduledAt: '2026-06-01T15:00:00.000Z',
        scheduledDate: '2026-06-01',
        production: {
          qa: {
            publishConfig: {
              publishAction: 'schedule',
              scheduleAt: '2026-06-01T15:00',
            },
          },
        },
      });
    }

    it('clears top-level fields and reverts status to review when publishAction flips away from schedule', () => {
      const { store, state } = setup(scheduledItem());
      store.setPublishConfig({ publishAction: 'save-draft' });
      const saved = state.items().find((i) => i.id === 'post-1');
      expect(saved?.status).toBe('review');
      expect(saved?.scheduledAt).toBeNull();
      expect(saved?.scheduledDate).toBeNull();
      expect(saved?.production?.qa?.publishConfig?.publishAction).toBe('save-draft');
    });

    it('does NOT downgrade a published post on unschedule', () => {
      const { store, state } = setup(
        approvedItem({
          status: 'published',
          scheduledAt: '2026-06-01T15:00:00.000Z',
          scheduledDate: '2026-06-01',
        }),
      );
      store.setPublishConfig({ publishAction: 'save-draft' });
      const saved = state.items().find((i) => i.id === 'post-1');
      expect(saved?.status).toBe('published');
    });

    it('round-trip: schedule → save-draft → schedule with the same date matches a fresh schedule', () => {
      const { store, state } = setup(approvedItem());
      store.setPublishConfig({
        publishAction: 'schedule',
        scheduleAt: '2026-06-01T15:00',
      });
      store.setPublishConfig({ publishAction: 'save-draft' });
      store.setPublishConfig({
        publishAction: 'schedule',
        scheduleAt: '2026-06-01T15:00',
      });
      const saved = state.items().find((i) => i.id === 'post-1');
      expect(saved?.status).toBe('scheduled');
      expect(saved?.scheduledAt).toBe('2026-06-01T15:00:00.000Z');
      expect(saved?.scheduledDate).toBe('2026-06-01');
    });
  });

  describe('defensive hydration from top-level scheduledAt', () => {
    it('hydrates publishConfig.scheduleAt + publishAction from item.scheduledAt when persisted publishConfig is empty', () => {
      const { store } = setup(
        approvedItem({
          scheduledAt: '2026-06-01T15:00:00.000Z',
        }),
      );
      const cfg = store.publishConfig();
      expect(cfg.scheduleAt).toBe('2026-06-01T15:00');
      expect(cfg.publishAction).toBe('schedule');
    });

    it('does NOT override a persisted publishConfig.scheduleAt with the top-level value', () => {
      const { store } = setup(
        approvedItem({
          scheduledAt: '2026-06-01T15:00:00.000Z',
          production: {
            qa: {
              publishConfig: {
                publishAction: 'schedule',
                scheduleAt: '2026-07-15T10:00',
              },
            },
          },
        }),
      );
      const cfg = store.publishConfig();
      expect(cfg.scheduleAt).toBe('2026-07-15T10:00');
    });
  });

  describe('brief-approval guard', () => {
    it('setPublishConfig is a no-op when briefApproved is false (matches persistQA)', () => {
      const { store, state } = setup(makeItem({ status: 'review' }));
      store.setPublishConfig({
        publishAction: 'schedule',
        scheduleAt: '2026-06-01T15:00',
      });
      const saved = state.items().find((i) => i.id === 'post-1');
      expect(saved?.scheduledAt).toBeUndefined();
      expect(saved?.status).toBe('review');
      expect(saved?.production?.qa).toBeUndefined();
    });
  });
});
