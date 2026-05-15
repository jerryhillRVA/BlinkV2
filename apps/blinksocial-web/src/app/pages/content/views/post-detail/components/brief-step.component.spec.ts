import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { BriefStepComponent } from './brief-step.component';
import { PostDetailStore } from '../post-detail.store';
import { ContentStateService } from '../../../content-state.service';
import { provideContentItemsApiStubs } from '../../../content-items-api.test-util';
import { AiAssistApiService } from '../../../../../core/ai-assist/ai-assist.service';
import { ToastService } from '../../../../../core/toast/toast.service';
import type {
  AudienceSegment,
  ContentItem,
  ContentPillar,
} from '../../../content.types';
import type { AiAssistRequestContract } from '@blinksocial/contracts';

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

function setup(
  item: ContentItem = makeItem(),
  options: { aiResponse?: { values: string[] }; aiError?: boolean } = {},
): {
  fixture: ComponentFixture<BriefStepComponent>;
  state: ContentStateService;
  store: PostDetailStore;
  aiCalls: AiAssistRequestContract[];
  toastErrors: string[];
} {
  const aiCalls: AiAssistRequestContract[] = [];
  const toastErrors: string[] = [];
  const aiStub = {
    assist: vi.fn((req: AiAssistRequestContract) => {
      aiCalls.push(req);
      if (options.aiError) return throwError(() => new Error('boom'));
      return of(options.aiResponse ?? { values: ['Generated key message.'] });
    }),
  };
  const toastStub = {
    showError: (m: string) => toastErrors.push(m),
    showSuccess: () => undefined,
  };
  TestBed.configureTestingModule({
    imports: [BriefStepComponent],
    providers: [
      ...provideContentItemsApiStubs(),
      ContentStateService,
      PostDetailStore,
      { provide: AiAssistApiService, useValue: aiStub },
      { provide: ToastService, useValue: toastStub },
    ],
  });
  const state = TestBed.inject(ContentStateService);
  state.workspaceId.set('test-ws');
  state.setItems([item]);
  state.pillars.set(PILLARS);
  state.segments.set(SEGMENTS);
  const store = TestBed.inject(PostDetailStore);
  store.setItemId(item.id);
  const fixture = TestBed.createComponent(BriefStepComponent);
  fixture.detectChanges();
  return { fixture, state, store, aiCalls, toastErrors };
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

// The Brief → Draft Continue button moved to the shared
// <app-step-action-bar> at the bottom of the production detail page —
// see step-action-bar.component.spec.ts for the equivalent assertions.

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

describe('BriefStepComponent — Key Message handlers', () => {
  it('typing in the textarea persists the value via the store', () => {
    const { fixture, store } = setup(makeItem({ keyMessage: '' }));
    const textarea = fixture.nativeElement.querySelector('.brief-textarea') as HTMLTextAreaElement;
    textarea.value = 'Updated message text';
    textarea.dispatchEvent(new Event('input'));
    expect(store.item()?.keyMessage).toBe('Updated message text');
  });

  it('AI Assist click calls the API and writes values[0] to keyMessage', () => {
    const { fixture, store, aiCalls } = setup(makeItem({ keyMessage: '' }), {
      aiResponse: { values: ['Stay focused on momentum.'] },
    });
    const assist = fixture.nativeElement.querySelector('.assist-btn') as HTMLButtonElement;
    assist.click();
    expect(aiCalls[0]).toMatchObject({
      scope: 'content-item',
      workspaceId: 'test-ws',
      refId: 'post-1',
      field: 'post-key-message',
    });
    expect(store.item()?.keyMessage).toBe('Stay focused on momentum.');
  });

  it('AI Assist toast on error, keyMessage unchanged', () => {
    const original = 'untouched';
    const { fixture, store, toastErrors } = setup(makeItem({ keyMessage: original }), {
      aiError: true,
    });
    const assist = fixture.nativeElement.querySelector('.assist-btn') as HTMLButtonElement;
    assist.click();
    expect(toastErrors).toHaveLength(1);
    expect(store.item()?.keyMessage).toBe(original);
  });

  it('textarea has id="post-key-message" for E2E selector parity', () => {
    const { fixture } = setup();
    const ta = fixture.nativeElement.querySelector('textarea#post-key-message');
    expect(ta).not.toBeNull();
  });

  it('AI Assist click is a no-op once the brief is approved (locked branch)', () => {
    const { fixture, store } = setup(
      makeItem({ owner: 'user-sarah', cta: { type: 'learn-more', text: 'Read more' } }),
    );
    store.approveBrief();
    fixture.detectChanges();
    // After approval the AI Assist button is rendered with [disabled]; calling
    // its handler programmatically (or via a synthetic click on a disabled
    // button) should be a no-op due to the locked() guard. We invoke the
    // method directly through the rendered DOM to exercise the guard branch.
    const before = store.item()?.keyMessage;
    const assistFromDom = fixture.nativeElement.querySelector('.assist-btn') as HTMLButtonElement | null;
    // The AI Assist button is inside the goal/message card which only renders
    // when not approved — depending on the template that path may not render
    // a button. Either way the guard branch is what we want to cover, so we
    // call through the component instance.
    const cmp = fixture.componentInstance as unknown as {
      onKeyMessageAssist: () => void;
    };
    cmp.onKeyMessageAssist();
    expect(store.item()?.keyMessage).toBe(before);
    // Sanity: when locked, the goal-message card is still rendered, but the
    // button (if present) is disabled.
    if (assistFromDom) expect(assistFromDom.disabled).toBe(true);
  });
});

describe('BriefStepComponent — Reference Link handlers', () => {
  it('typing in the add input updates newRefLink (covers onRefLinkInput)', () => {
    const { fixture, store } = setup();
    const inputs = fixture.nativeElement.querySelectorAll('.reference-link-row input') as NodeListOf<HTMLInputElement>;
    const addInput = inputs[inputs.length - 1] as HTMLInputElement;
    addInput.value = 'https://typed.example';
    addInput.dispatchEvent(new Event('input'));
    // Pressing Enter consumes newRefLink and pushes it through — proves the
    // input handler stored the value first.
    addInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(store.referenceLinks()).toEqual(['https://typed.example']);
  });

  it('non-Enter keys on the add input do not push a link (covers Enter guard)', () => {
    const { fixture, store } = setup();
    const inputs = fixture.nativeElement.querySelectorAll('.reference-link-row input') as NodeListOf<HTMLInputElement>;
    const addInput = inputs[inputs.length - 1] as HTMLInputElement;
    addInput.value = 'https://typed.example';
    addInput.dispatchEvent(new Event('input'));
    addInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(store.referenceLinks()).toEqual([]);
  });

  it('Enter with an empty (whitespace) value is a no-op (covers !v guard)', () => {
    const { fixture, store } = setup();
    const inputs = fixture.nativeElement.querySelectorAll('.reference-link-row input') as NodeListOf<HTMLInputElement>;
    const addInput = inputs[inputs.length - 1] as HTMLInputElement;
    addInput.value = '   ';
    addInput.dispatchEvent(new Event('input'));
    addInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(store.referenceLinks()).toEqual([]);
  });

  it('clicking the + button pushes the typed link (covers onAddRefLink truthy branch)', () => {
    const { fixture, store } = setup();
    const inputs = fixture.nativeElement.querySelectorAll('.reference-link-row input') as NodeListOf<HTMLInputElement>;
    const addInput = inputs[inputs.length - 1] as HTMLInputElement;
    addInput.value = 'https://added-via-button.example';
    addInput.dispatchEvent(new Event('input'));
    const addBtn = fixture.nativeElement.querySelector('.link-row-add') as HTMLButtonElement;
    addBtn.click();
    expect(store.referenceLinks()).toEqual(['https://added-via-button.example']);
  });

  it('clicking the + button with an empty input is a no-op (covers !v guard)', () => {
    const { fixture, store } = setup();
    const addBtn = fixture.nativeElement.querySelector('.link-row-add') as HTMLButtonElement;
    addBtn.click();
    expect(store.referenceLinks()).toEqual([]);
  });

  it('editing an existing link via change updates the array in place', () => {
    const seeded = makeItem({
      production: { brief: { referenceLinks: ['https://a.com', 'https://b.com'] } },
    });
    const { fixture, store } = setup(seeded);
    const editable = fixture.nativeElement.querySelectorAll(
      '.reference-link-row input',
    ) as NodeListOf<HTMLInputElement>;
    // The first two inputs are the saved-link rows; the last one is the add row.
    editable[0].value = 'https://edited.example';
    editable[0].dispatchEvent(new Event('change'));
    expect(store.referenceLinks()).toEqual(['https://edited.example', 'https://b.com']);
  });
});

describe('BriefStepComponent — Due Date + CTA locked guards', () => {
  it('changing Due Date persists it via the store', () => {
    const { fixture, store } = setup();
    const dateInput = fixture.nativeElement.querySelector('.brief-date-input') as HTMLInputElement;
    dateInput.value = '2099-12-31';
    dateInput.dispatchEvent(new Event('change'));
    expect(store.dueDate()).toBe('2099-12-31');
  });

  it('Primary CTA pill click is a no-op when locked', () => {
    const { fixture, store } = setup(
      makeItem({
        owner: 'user-sarah',
        cta: { type: 'learn-more', text: 'Read more' },
        objective: 'traffic',
      }),
    );
    store.approveBrief();
    fixture.detectChanges();
    const before = store.primaryCta();
    const cmp = fixture.componentInstance as unknown as {
      onPrimaryCta: (v: 'shop-now') => void;
    };
    cmp.onPrimaryCta('shop-now');
    expect(store.primaryCta()).toBe(before);
  });

  it('CTA Type click is a no-op when locked', () => {
    const { fixture, store } = setup(
      makeItem({ owner: 'user-sarah', cta: { type: 'learn-more', text: 'Read more' } }),
    );
    store.approveBrief();
    fixture.detectChanges();
    const before = store.item()?.cta?.type;
    const cmp = fixture.componentInstance as unknown as {
      onCtaType: (v: 'shop-now') => void;
    };
    cmp.onCtaType('shop-now');
    expect(store.item()?.cta?.type).toBe(before);
  });
});

describe('BriefStepComponent — Approve toggle branches + approval note', () => {
  it('canApprove=false + checked=true exits early (no approveBrief / no unlockBrief)', () => {
    // Force canApprove false by omitting owner; keyMessage valid via default.
    const { fixture, store } = setup(makeItem({ owner: null as never }));
    const cmp = fixture.componentInstance as unknown as {
      onApproveToggle: (e: Event) => void;
    };
    const target = document.createElement('input');
    target.type = 'checkbox';
    target.checked = true;
    const evt = new Event('change');
    Object.defineProperty(evt, 'target', { value: target });
    cmp.onApproveToggle(evt);
    expect(store.item()?.briefApproved).not.toBe(true);
  });

  it('unchecking the toggle calls unlockBrief (covers else branch)', () => {
    const { fixture, store } = setup(
      makeItem({ owner: 'user-sarah', cta: { type: 'learn-more', text: 'Read more' } }),
    );
    store.approveBrief();
    fixture.detectChanges();
    expect(store.item()?.briefApproved).toBe(true);
    // approve-toggle is not in the DOM once approved — but we can exercise
    // the un-approve branch directly through the handler.
    const cmp = fixture.componentInstance as unknown as {
      onApproveToggle: (e: Event) => void;
    };
    const target = document.createElement('input');
    target.type = 'checkbox';
    target.checked = false;
    const evt = new Event('change');
    Object.defineProperty(evt, 'target', { value: target });
    cmp.onApproveToggle(evt);
    expect(store.item()?.briefApproved).toBe(false);
  });

  it('approval note textarea writes through to the store', () => {
    const { fixture, store } = setup();
    const note = fixture.nativeElement.querySelector('.approval-note') as HTMLTextAreaElement;
    note.value = 'Looks good to me';
    note.dispatchEvent(new Event('input'));
    expect(store.approvalNote()).toBe('Looks good to me');
  });

  // ── Branch coverage: `(e.target as ...)?.value ?? ''` fallbacks ──
  it('onKeyMessageInput handles null event.target via ?? "" fallback', () => {
    const { fixture, store } = setup();
    const cmp = fixture.componentInstance as unknown as {
      onKeyMessageInput: (e: Event) => void;
    };
    cmp.onKeyMessageInput({ target: null } as unknown as Event);
    expect(store.item()?.keyMessage).toBe('');
  });

  it('onRefLinkInput handles null event.target via ?? "" fallback', () => {
    const { fixture } = setup();
    const cmp = fixture.componentInstance as unknown as {
      onRefLinkInput: (e: Event) => void;
      newRefLink: () => string;
    };
    cmp.onRefLinkInput({ target: null } as unknown as Event);
    expect(cmp.newRefLink()).toBe('');
  });

  it('onEditRefLink handles null event.target via ?? "" fallback', () => {
    const { fixture, store } = setup();
    store.setReferenceLinks(['https://existing.com']);
    const cmp = fixture.componentInstance as unknown as {
      onEditRefLink: (i: number, e: Event) => void;
    };
    cmp.onEditRefLink(0, { target: null } as unknown as Event);
    expect(store.referenceLinks()[0]).toBe('');
  });

  it('onOwnerChange handles null event.target via ?? "" fallback', () => {
    const { fixture, store } = setup();
    const cmp = fixture.componentInstance as unknown as {
      onOwnerChange: (e: Event) => void;
    };
    cmp.onOwnerChange({ target: null } as unknown as Event);
    expect(store.item()?.owner).toBeNull();
  });

  it('onApproveToggle handles null event.target via ?? false fallback', () => {
    const { fixture } = setup();
    const cmp = fixture.componentInstance as unknown as {
      onApproveToggle: (e: Event) => void;
    };
    expect(() => cmp.onApproveToggle({ target: null } as unknown as Event)).not.toThrow();
  });

  it('onApprovalNoteInput handles null event.target via ?? "" fallback', () => {
    const { fixture, store } = setup();
    const cmp = fixture.componentInstance as unknown as {
      onApprovalNoteInput: (e: Event) => void;
    };
    cmp.onApprovalNoteInput({ target: null } as unknown as Event);
    expect(store.approvalNote()).toBe('');
  });
});
