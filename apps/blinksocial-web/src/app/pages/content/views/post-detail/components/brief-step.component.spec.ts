import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BriefStepComponent } from './brief-step.component';
import { PostDetailStore } from '../post-detail.store';
import { ContentStateService } from '../../../content-state.service';
import { provideContentItemsApiStubs } from '../../../content-items-api.test-util';
import type {
  AudienceSegment,
  ContentItem,
  ContentPillar,
} from '../../../content.types';

const PILLARS: ContentPillar[] = [
  { id: 'p1', name: 'Alpha', description: '', color: '#111' },
  { id: 'p2', name: 'Beta', description: '', color: '#222' },
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
    providers: [...provideContentItemsApiStubs(), ContentStateService, PostDetailStore],
  });
  const state = TestBed.inject(ContentStateService);
  state.setItems([item]);
  state.pillars.set(PILLARS);
  state.segments.set(SEGMENTS);
  const store = TestBed.inject(PostDetailStore);
  store.setItemId(item.id);
  const fixture = TestBed.createComponent(BriefStepComponent);
  fixture.detectChanges();
  return { fixture, state, store };
}

describe('BriefStepComponent — composition', () => {
  it('renders the 5-card layout: Goal & Message, Reference Links, Ownership & Timeline, Call to Action, Brief Status', () => {
    const { fixture } = setup();
    const titles = Array.from(
      fixture.nativeElement.querySelectorAll('.panel-section-title') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim() ?? '');
    expect(titles).toEqual([
      'Goal & Message',
      'Reference Links',
      'Ownership & Timeline',
      'Call to Action',
      'Brief Status',
    ]);
    expect(fixture.nativeElement.querySelector('.goal-message-card')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.reference-links-card')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.ownership-timeline-card')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.cta-card')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.brief-status-card')).not.toBeNull();
  });

  it('removed sections are no longer rendered (Title, Description, Format, Pillars, Segments, Content Goal, Tone Preset)', () => {
    const { fixture } = setup();
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.panel-label') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent ?? '');
    for (const removed of ['Title', 'Format', 'Content Pillars', 'Audience Segments', 'Content Goal', 'Tone Preset']) {
      expect(labels.some((t) => t.trim().startsWith(removed))).toBe(false);
    }
    // The standalone "Description" panel-label is gone (concept owns description now).
    expect(fixture.nativeElement.querySelector('.brief-description')).toBeNull();
    expect(fixture.nativeElement.querySelector('.panel-format')).toBeNull();
    expect(fixture.nativeElement.querySelector('.pillar-chip')).toBeNull();
    expect(fixture.nativeElement.querySelector('.objective-btn')).toBeNull();
  });

  it('Goal & Message has Key Message label, AI Assist sibling, and a textarea', () => {
    const { fixture } = setup();
    const card = fixture.nativeElement.querySelector('.goal-message-card') as HTMLElement;
    expect(card.querySelector('h3.panel-label')?.textContent?.trim()).toContain('Key Message');
    expect(card.querySelector('.assist-btn')).not.toBeNull();
    expect(card.querySelector('.brief-textarea')).not.toBeNull();
  });
});

describe('BriefStepComponent — Primary CTA conditional', () => {
  it('hides Primary CTA pills when objective is awareness/non-traffic', () => {
    const { fixture } = setup(makeItem({ objective: 'awareness' }));
    expect(fixture.nativeElement.querySelector('.primary-cta-pills')).toBeNull();
  });

  it('shows Primary CTA pills when objective is traffic/leads/sales', () => {
    const { fixture } = setup(makeItem({ objective: 'traffic' }));
    expect(fixture.nativeElement.querySelector('.primary-cta-pills')).not.toBeNull();
    const pills = fixture.nativeElement.querySelectorAll(
      '.primary-cta-pills .pill-cta',
    ) as NodeListOf<HTMLButtonElement>;
    expect(pills.length).toBe(5);
  });

  it('clicking a Primary CTA pill toggles via store', () => {
    const { fixture, store } = setup(makeItem({ objective: 'leads' }));
    const pills = Array.from(
      fixture.nativeElement.querySelectorAll('.primary-cta-pills .pill-cta') as NodeListOf<HTMLButtonElement>,
    );
    pills.find((b) => b.textContent?.includes('Shop Now'))!.click();
    expect(store.primaryCta()).toBe('shop-now');
    pills.find((b) => b.textContent?.includes('Shop Now'))!.click();
    expect(store.primaryCta()).toBeUndefined();
  });
});

describe('BriefStepComponent — Reference Links', () => {
  it('renders one row per saved link plus the bottom add row', () => {
    const seeded = makeItem({
      production: { brief: { referenceLinks: ['https://a.com', 'https://b.com'] } },
    });
    const { fixture } = setup(seeded);
    const rows = fixture.nativeElement.querySelectorAll('.reference-link-row');
    expect(rows.length).toBe(3); // 2 saved + 1 add row
  });

  it('Enter on the add input pushes a new link via the store', () => {
    const { fixture, store } = setup();
    const addInput = fixture.nativeElement.querySelectorAll('.reference-link-row input')[0] as HTMLInputElement;
    addInput.value = 'https://example.com/a';
    addInput.dispatchEvent(new Event('input'));
    addInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(store.referenceLinks()).toEqual(['https://example.com/a']);
  });

  it('clicking the × removes the link at that index', () => {
    const seeded = makeItem({
      production: { brief: { referenceLinks: ['https://a.com', 'https://b.com'] } },
    });
    const { fixture, store } = setup(seeded);
    const removes = fixture.nativeElement.querySelectorAll(
      '.link-row-remove',
    ) as NodeListOf<HTMLButtonElement>;
    removes[0].click();
    expect(store.referenceLinks()).toEqual(['https://b.com']);
  });
});

describe('BriefStepComponent — Ownership & Timeline', () => {
  it('Owner select binds to ContentItem.owner', () => {
    const { fixture, store } = setup();
    const select = fixture.nativeElement.querySelector('.brief-select') as HTMLSelectElement;
    select.value = 'user-sarah';
    select.dispatchEvent(new Event('change'));
    expect(store.item()?.owner).toBe('user-sarah');
  });

  it('Owner select renders the matching option as selected on first load (regression: [value] on <select> raced @for-rendered options)', () => {
    const { fixture } = setup(makeItem({ owner: 'user-brett' }));
    const select = fixture.nativeElement.querySelector('.brief-select') as HTMLSelectElement;
    expect(select.value).toBe('user-brett');
    const sel = Array.from(
      fixture.nativeElement.querySelectorAll('.brief-select option') as NodeListOf<HTMLOptionElement>,
    ).find((o) => o.selected);
    expect(sel?.value).toBe('user-brett');
  });

  it('Owner select falls back to "Select owner…" when owner is null', () => {
    const { fixture } = setup(makeItem({ owner: null }));
    const select = fixture.nativeElement.querySelector('.brief-select') as HTMLSelectElement;
    expect(select.value).toBe('');
  });

  it('past Due Date triggers the warning copy', () => {
    const seeded = makeItem({
      production: { brief: { dueDate: '2020-01-01' } },
    });
    const { fixture } = setup(seeded);
    expect(fixture.nativeElement.querySelector('.due-date-warning')).not.toBeNull();
  });

  it('Paid & Boosted toggle and Campaign Name field are removed (no longer in the prototype)', () => {
    const { fixture } = setup();
    expect(fixture.nativeElement.textContent).not.toContain('Paid & Boosted');
    expect(fixture.nativeElement.textContent).not.toContain('Campaign Name');
    expect(fixture.nativeElement.querySelector('.publishing-toggle')).toBeNull();
  });

  it('Required-to-approve list under the toggle (no title header) includes Owner / CTA type / Key message when missing', () => {
    const { fixture } = setup(
      makeItem({ owner: null as never, keyMessage: undefined }),
    );
    const required = fixture.nativeElement.querySelector('.approve-required') as HTMLElement;
    expect(required).not.toBeNull();
    // Prototype parity — no "Required to approve:" header above the list.
    expect(fixture.nativeElement.textContent).not.toContain('Required to approve');
    const items = Array.from(
      required.querySelectorAll('li') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim() ?? '');
    expect(items.some((t) => t.includes('Owner is required'))).toBe(true);
    expect(items.some((t) => t.includes('CTA type is required'))).toBe(true);
    expect(items.some((t) => t.includes('Key message is required'))).toBe(true);
  });

  it('does not render inline .field-error messages — the summary list is the single source of truth', () => {
    const { fixture } = setup(makeItem({ owner: null as never }));
    expect(fixture.nativeElement.querySelector('.field-error')).toBeNull();
  });
});

describe('BriefStepComponent — CTA Type', () => {
  it('clicking a CTA pill sets the type; clicking the same one again clears it', () => {
    const { fixture, store } = setup();
    const pills = Array.from(
      fixture.nativeElement.querySelectorAll('.cta-grid .pill-cta') as NodeListOf<HTMLButtonElement>,
    );
    pills[0].click();
    expect(store.item()?.cta?.type).toBeDefined();
    pills[0].click();
    expect(store.item()?.cta).toBeUndefined();
  });
});

describe('BriefStepComponent — Brief Status', () => {
  it('toggling Approve writes briefApproved, briefApprovedAt, briefApprovedBy when canApprove is true', () => {
    const { fixture, store } = setup(
      makeItem({ owner: 'user-sarah', cta: { type: 'learn-more', text: 'Read more' } }),
    );
    fixture.detectChanges();
    const toggle = fixture.nativeElement.querySelector(
      '.approve-toggle',
    ) as HTMLInputElement;
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));
    expect(store.item()?.briefApproved).toBe(true);
    expect(store.item()?.briefApprovedAt).toBeDefined();
    expect(store.item()?.briefApprovedBy).toBe('You');
  });

  it('Unlock Brief clears approval and writes unlockedAt', () => {
    const { fixture, store } = setup();
    store.approveBrief();
    fixture.detectChanges();
    const unlock = fixture.nativeElement.querySelector('.unlock-btn') as HTMLButtonElement;
    expect(unlock).not.toBeNull();
    unlock.click();
    expect(store.item()?.briefApproved).toBe(false);
    expect(store.brief()?.unlockedAt).toBeDefined();
  });

  it('approve-toggle is disabled when canApprove is false', () => {
    const { fixture } = setup(
      makeItem({ title: '', description: '' }), // forces validators to fail
    );
    const toggle = fixture.nativeElement.querySelector('.approve-toggle') as HTMLInputElement;
    expect(toggle.disabled).toBe(true);
  });
});

describe('BriefStepComponent — Continue to Draft', () => {
  it('button is disabled when brief is not approved', () => {
    const { fixture } = setup();
    const btn = fixture.nativeElement.querySelector(
      '.btn-continue-draft',
    ) as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.disabled).toBe(true);
  });

  it('button is enabled and advances activeStep to draft once briefApproved is true', () => {
    const { fixture, store } = setup();
    store.approveBrief();
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector(
      '.btn-continue-draft',
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    btn.click();
    expect(store.activeStep()).toBe('draft');
  });

  it('clicking the button is a no-op when brief is not approved (defensive)', () => {
    const { fixture, store } = setup();
    expect(store.activeStep()).toBe('brief');
    const comp = fixture.componentInstance as unknown as {
      onContinueToDraft: () => void;
    };
    comp.onContinueToDraft();
    expect(store.activeStep()).toBe('brief');
  });
});

describe('BriefStepComponent — empty item', () => {
  it('renders nothing when the store has no item', () => {
    TestBed.configureTestingModule({
      imports: [BriefStepComponent],
      providers: [...provideContentItemsApiStubs(), ContentStateService, PostDetailStore],
    });
    const fixture = TestBed.createComponent(BriefStepComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.brief-step')).toBeNull();
  });
});
