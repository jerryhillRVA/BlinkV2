import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import type {
  AiAssistRequestContract,
  ContentItemContract,
  PackagingInstagramContract,
} from '@blinksocial/contracts';
import { InstagramPackagingComponent } from './instagram-packaging.component';
import { ContentStateService } from '../../../../../content-state.service';
import { PostDetailStore } from '../../../post-detail.store';
import { provideContentItemsApiStubs } from '../../../../../content-items-api.test-util';
import { AiAssistApiService } from '../../../../../../../core/ai-assist/ai-assist.service';
import { ToastService } from '../../../../../../../core/toast/toast.service';

interface SetupOptions {
  value?: PackagingInstagramContract | undefined;
  disabled?: boolean;
  isCarousel?: boolean;
  contentType?: string;
  publishingMode?: 'ORGANIC' | 'PAID_BOOSTED';
  aiCaption?: string[];
  aiHashtags?: string[];
  aiError?: boolean;
}

interface SetupResult {
  fixture: ComponentFixture<InstagramPackagingComponent>;
  aiCalls: AiAssistRequestContract[];
  toastErrors: string[];
}

function setup(opts: SetupOptions = {}): SetupResult {
  TestBed.resetTestingModule();
  const aiCalls: AiAssistRequestContract[] = [];
  const toastErrors: string[] = [];
  const aiStub = {
    assist: vi.fn((req: AiAssistRequestContract) => {
      aiCalls.push(req);
      if (opts.aiError) return throwError(() => new Error('boom'));
      if (req.field === 'post-caption') {
        return of({ values: opts.aiCaption ?? ['AI caption.'] });
      }
      if (req.field === 'post-hashtags') {
        return of({ values: opts.aiHashtags ?? ['#mobility', '#wellness'] });
      }
      return of({ values: [] });
    }),
  };
  const toastStub = {
    showError: (m: string) => toastErrors.push(m),
    showSuccess: () => undefined,
  };
  TestBed.configureTestingModule({
    imports: [InstagramPackagingComponent],
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
  state.setItems([
    {
      id: 'post-1',
      stage: 'post',
      status: 'in-progress',
      title: 'Post',
      description: '',
      pillarIds: [],
      segmentIds: [],
      createdAt: '2026-05-15T00:00:00.000Z',
      updatedAt: '2026-05-15T00:00:00.000Z',
    } as ContentItemContract,
  ]);
  const store = TestBed.inject(PostDetailStore);
  store.setItemId('post-1');
  const fixture = TestBed.createComponent(InstagramPackagingComponent);
  fixture.componentRef.setInput('value', opts.value);
  fixture.componentRef.setInput('disabled', opts.disabled ?? false);
  fixture.componentRef.setInput('isCarousel', opts.isCarousel ?? false);
  fixture.componentRef.setInput('contentType', opts.contentType ?? null);
  fixture.componentRef.setInput('publishingMode', opts.publishingMode);
  fixture.detectChanges();
  return { fixture, aiCalls, toastErrors };
}

describe('InstagramPackagingComponent', () => {
  it('renders the always-visible IG fields (caption, hashtags, audio, publish-settings)', () => {
    const { fixture } = setup();
    expect(fixture.nativeElement.querySelector('#post-caption')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-pkg-hashtag-bank')).not.toBeNull();
    // Audio Planning is rendered inline inside the Media Selections card
    // (Browse Trending Sounds / Use Original buttons + selected chip).
    expect(fixture.nativeElement.querySelector('app-media-selections-card')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-publish-settings-card')).not.toBeNull();
  });

  it('Link + UTM are hidden under ORGANIC publishing mode (prototype-aligned)', () => {
    const { fixture } = setup({ publishingMode: 'ORGANIC' });
    expect(fixture.nativeElement.querySelector('#ig-link')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-utm-builder')).toBeNull();
  });

  it('Link + UTM appear under PAID_BOOSTED publishing mode', () => {
    const { fixture } = setup({ publishingMode: 'PAID_BOOSTED' });
    expect(fixture.nativeElement.querySelector('#ig-link')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-utm-builder')).not.toBeNull();
  });

  it('does NOT render the slide-order picker unless isCarousel is true', () => {
    const { fixture } = setup({ isCarousel: false });
    expect(fixture.nativeElement.querySelector('app-slide-order-picker')).toBeNull();
  });

  it('renders the slide-order picker when isCarousel=true', () => {
    const { fixture } = setup({ isCarousel: true });
    expect(fixture.nativeElement.querySelector('app-slide-order-picker')).not.toBeNull();
  });

  it('typing a plain-text caption emits the caption + empty hashtag array (caption is source of truth)', () => {
    const { fixture } = setup({ value: { hashtags: ['#a'] } });
    const emitted: PackagingInstagramContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    const ta = fixture.nativeElement.querySelector('#post-caption') as HTMLTextAreaElement;
    ta.value = 'hello';
    ta.dispatchEvent(new Event('input'));
    // The pre-existing chip #a was a stale carryover that doesn't appear
    // in the new caption text — chips re-derive from caption, so they
    // empty out.
    expect(emitted[0]?.caption).toBe('hello');
    expect(emitted[0]?.hashtags).toEqual([]);
  });

  it('typing a #tag in the caption auto-adds it to the chip array', () => {
    const { fixture } = setup({ value: { caption: '' } });
    const emitted: PackagingInstagramContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    const ta = fixture.nativeElement.querySelector('#post-caption') as HTMLTextAreaElement;
    ta.value = 'Try this #wellness today';
    ta.dispatchEvent(new Event('input'));
    expect(emitted[0]?.hashtags).toEqual(['#wellness']);
  });

  it('deleting a #tag from the caption auto-removes the matching chip', () => {
    const { fixture } = setup({ value: { caption: 'Hello #wellness', hashtags: ['#wellness'] } });
    const emitted: PackagingInstagramContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    const ta = fixture.nativeElement.querySelector('#post-caption') as HTMLTextAreaElement;
    ta.value = 'Hello'; // user erased the #wellness suffix
    ta.dispatchEvent(new Event('input'));
    expect(emitted[0]?.hashtags).toEqual([]);
  });

  it('char counter switches to warn when caption length crosses 90% of cap', () => {
    const longCaption = 'x'.repeat(Math.ceil(2200 * 0.9) + 1);
    const { fixture } = setup({ value: { caption: longCaption } });
    const counter = fixture.nativeElement.querySelector('.char-counter') as HTMLElement;
    expect(counter.classList.contains('warn')).toBe(true);
  });

  it('disabled state propagates: caption textarea is readOnly', () => {
    const { fixture } = setup({ disabled: true });
    const ta = fixture.nativeElement.querySelector('#post-caption') as HTMLTextAreaElement;
    expect(ta.readOnly).toBe(true);
  });

  it('caption label is programmatically linked via for=id', () => {
    const { fixture } = setup();
    const label = fixture.nativeElement.querySelector('label[for="post-caption"]');
    expect(label).not.toBeNull();
  });

  it('hashtagsChange / linkInput / utm / order / audioPlanning / controls all emit patched value', () => {
    const { fixture } = setup({ value: { caption: 'pre' } });
    const emitted: PackagingInstagramContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onHashtagsChange'](['#a']);
    fixture.componentInstance['onLinkInput']({ target: { value: 'https://x' } } as unknown as Event);
    fixture.componentInstance['onUtmChange']({ source: 's' });
    fixture.componentInstance['onOrderChange']([1, 0]);
    fixture.componentInstance['onAudioPlanningChange']({
      audioStrategy: 'trending-platform',
      audioMood: 'energetic-pumped',
    });
    fixture.componentInstance['onControlsChange']({ visibility: 'private' });
    expect(emitted.length).toBe(6);
    // onHashtagsChange now syncs the caption: adding #a to caption 'pre'
    // appends it (no duplicate already-in-caption). Other handlers
    // preserve the caption verbatim.
    expect(emitted[0]).toEqual({ caption: 'pre #a', hashtags: ['#a'] });
    expect(emitted[1]).toEqual({ caption: 'pre', link: 'https://x' });
    expect(emitted[2]).toEqual({ caption: 'pre', utm: { source: 's' } });
    expect(emitted[3]).toEqual({ caption: 'pre', slideOrder: { order: [1, 0] } });
    expect(emitted[4]).toEqual({
      caption: 'pre',
      audioPlanning: {
        audioStrategy: 'trending-platform',
        audioMood: 'energetic-pumped',
      },
    });
    expect(emitted[5]).toEqual({ caption: 'pre', platformControls: { visibility: 'private' } });
  });

  it('adding a hashtag appends it to the caption with no duplicates', () => {
    const { fixture } = setup({ value: { caption: 'Already #wellness here', hashtags: [] } });
    const emitted: PackagingInstagramContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onHashtagsChange'](['#wellness', '#mobility']);
    // #wellness was already in caption — not re-appended; #mobility is new.
    expect(emitted[0]?.caption).toBe('Already #wellness here #mobility');
    expect(emitted[0]?.hashtags).toEqual(['#wellness', '#mobility']);
  });

  it('removing a hashtag strips it (with leading whitespace) from the caption', () => {
    const { fixture } = setup({
      value: { caption: 'Try this #wellness today', hashtags: ['#wellness'] },
    });
    const emitted: PackagingInstagramContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onHashtagsChange']([]);
    expect(emitted[0]?.caption).toBe('Try this today');
    expect(emitted[0]?.hashtags).toEqual([]);
  });

  it('onCoverAssetChange + onAudioPlanningChange + onOrderChange route through patch', () => {
    const { fixture } = setup({ value: { caption: 'pre' } });
    const emitted: PackagingInstagramContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onCoverAssetChange']('cover.png');
    fixture.componentInstance['onAudioPlanningChange']({ audioStrategy: 'named' });
    fixture.componentInstance['onOrderChange']([2, 1, 0]);
    expect(emitted[0]).toEqual({ caption: 'pre', coverAsset: 'cover.png' });
    expect(emitted[1]).toEqual({
      caption: 'pre',
      audioPlanning: { audioStrategy: 'named' },
    });
    expect(emitted[2]).toEqual({ caption: 'pre', slideOrder: { order: [2, 1, 0] } });
  });

  it('onIgMetadataChange + onIgControlsChange route through patch', () => {
    const { fixture } = setup({
      value: { caption: 'pre', platformControls: { allowComments: true } },
    });
    const emitted: PackagingInstagramContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onIgMetadataChange']({ peopleTags: ['@me'] });
    fixture.componentInstance['onIgControlsChange']({ commentsOff: true });
    expect(emitted[0]).toEqual({
      caption: 'pre',
      platformControls: { allowComments: true },
      peopleTags: ['@me'],
    });
    // onIgControlsChange merges into platformControls.ig (preserves existing top-level fields).
    expect(emitted[1]).toEqual({
      caption: 'pre',
      platformControls: { allowComments: true, ig: { commentsOff: true } },
    });
  });

  it('onSetPublishingMode is a no-op when disabled or when the mode is unchanged', () => {
    const { fixture } = setup({ disabled: true, publishingMode: 'ORGANIC' });
    const emitted: string[] = [];
    fixture.componentInstance.publishingModeChange.subscribe((m) => emitted.push(m));
    fixture.componentInstance['onSetPublishingMode']('PAID_BOOSTED');
    expect(emitted).toEqual([]); // disabled
    // Same mode is a no-op even when enabled.
    const { fixture: f2 } = setup({ publishingMode: 'ORGANIC' });
    const e2: string[] = [];
    f2.componentInstance.publishingModeChange.subscribe((m: string) => e2.push(m));
    f2.componentInstance['onSetPublishingMode']('ORGANIC');
    expect(e2).toEqual([]);
  });

  it('onCoverAssetUrlChange patches coverAssetUrl on the IG slot', () => {
    const { fixture } = setup({ value: { caption: 'pre', coverAsset: 'photo.png' } });
    const emitted: PackagingInstagramContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onCoverAssetUrlChange']('data:image/png;base64,iVBOR');
    expect(emitted[0]).toEqual({
      caption: 'pre',
      coverAsset: 'photo.png',
      coverAssetUrl: 'data:image/png;base64,iVBOR',
    });
  });

  it('caption marks fail class at or above the cap', () => {
    const { fixture } = setup({ value: { caption: 'x'.repeat(2200) } });
    const counter = fixture.nativeElement.querySelector('.char-counter') as HTMLElement;
    expect(counter.classList.contains('fail')).toBe(true);
  });

  it('all computed defaults resolve when value() is undefined or empty', () => {
    const { fixture } = setup({ value: {} });
    expect(fixture.componentInstance['caption']()).toBe('');
    expect(fixture.componentInstance['hashtags']()).toEqual([]);
    expect(fixture.componentInstance['link']()).toBe('');
    expect(fixture.componentInstance['utm']()).toBeUndefined();
    expect(fixture.componentInstance['slideOrder']()).toEqual([]);
    expect(fixture.componentInstance['audioPlanning']()).toBeUndefined();
    expect(fixture.componentInstance['controls']()).toBeUndefined();
    expect(fixture.componentInstance['captionState']()).toBe('ok');
  });

  it('no Revert-to-Draft or from-Draft affordance is rendered (removed for #116)', () => {
    const { fixture } = setup({ value: { caption: 'edited' } });
    expect(fixture.nativeElement.querySelector('.revert-btn')).toBeNull();
    expect(fixture.nativeElement.querySelector('.from-draft')).toBeNull();
  });

  it('AI Generate Caption calls the API with post-caption and emits values[0]', () => {
    const { fixture, aiCalls } = setup({
      aiCaption: ['New caption from API. #fresh'],
    });
    const emitted: PackagingInstagramContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onGenerateCaption']();
    expect(aiCalls[0]).toMatchObject({
      scope: 'content-item',
      workspaceId: 'test-ws',
      refId: 'post-1',
      field: 'post-caption',
    });
    expect(fixture.componentInstance['aiGeneratingCaption']()).toBe(false);
    expect(emitted.length).toBe(1);
    expect(emitted[0]?.caption).toBe('New caption from API. #fresh');
    // Inline hashtags in the caption are derived into the chip array.
    expect(emitted[0]?.hashtags).toEqual(['#fresh']);
  });

  it('AI Generate Caption: second click while loading is a no-op', () => {
    const { fixture } = setup();
    // Simulate an in-flight call: return an Observable that never emits.
    const aiStub = TestBed.inject(AiAssistApiService) as unknown as {
      assist: ReturnType<typeof vi.fn>;
    };
    let callCount = 0;
    aiStub.assist.mockImplementation(() => {
      callCount++;
      return new Observable<{ values: string[] }>(() => undefined);
    });
    fixture.componentInstance['onGenerateCaption']();
    expect(fixture.componentInstance['aiGeneratingCaption']()).toBe(true);
    fixture.componentInstance['onGenerateCaption']();
    expect(callCount).toBe(1);
  });

  it('AI Suggest Hashtags appends API values to chip array, deduped (case-insensitive)', () => {
    const { fixture, aiCalls } = setup({
      value: { caption: 'My caption #wellness', hashtags: ['#wellness'] },
      aiHashtags: ['#WELLNESS', '#mobility', '#dailyhabits'],
    });
    const emitted: PackagingInstagramContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onSuggestHashtags']();
    expect(aiCalls[0]).toMatchObject({ field: 'post-hashtags' });
    // #WELLNESS deduped against existing #wellness; rest appended.
    expect(emitted[0]?.hashtags).toEqual(['#wellness', '#mobility', '#dailyhabits']);
    expect(emitted[0]?.caption).toContain('#mobility');
    expect(emitted[0]?.caption).toContain('#dailyhabits');
  });

  it('AI Generate Caption toast on error, caption unchanged', () => {
    const { fixture, toastErrors } = setup({
      value: { caption: 'untouched' },
      aiError: true,
    });
    const emitted: PackagingInstagramContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onGenerateCaption']();
    expect(toastErrors).toHaveLength(1);
    expect(emitted).toEqual([]); // no patch emitted on error
    expect(fixture.componentInstance['aiGeneratingCaption']()).toBe(false);
  });

  it('AI buttons are no-ops while disabled', () => {
    const { fixture, aiCalls } = setup({ disabled: true });
    const emitted: PackagingInstagramContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onGenerateCaption']();
    fixture.componentInstance['onSuggestHashtags']();
    expect(aiCalls).toHaveLength(0);
    expect(emitted).toEqual([]);
    expect(fixture.componentInstance['aiGeneratingCaption']()).toBe(false);
    expect(fixture.componentInstance['aiSuggestingHashtags']()).toBe(false);
  });

  it('Publishing Mode pill reflects the active mode via aria-checked', () => {
    const { fixture: organic } = setup({ publishingMode: 'ORGANIC' });
    const organicPill = organic.nativeElement.querySelectorAll('.mode-pill')[0];
    expect(organicPill.getAttribute('aria-checked')).toBe('true');

    const { fixture: paid } = setup({ publishingMode: 'PAID_BOOSTED' });
    const paidPill = paid.nativeElement.querySelectorAll('.mode-pill')[1];
    expect(paidPill.getAttribute('aria-checked')).toBe('true');
  });

  it('toggleBank flips the bankOpen signal', () => {
    const { fixture } = setup();
    expect(fixture.componentInstance['bankOpen']()).toBe(false);
    fixture.componentInstance['toggleBank']();
    expect(fixture.componentInstance['bankOpen']()).toBe(true);
    fixture.componentInstance['toggleBank']();
    expect(fixture.componentInstance['bankOpen']()).toBe(false);
  });

  it('all computed accessors read explicit value-fields when provided', () => {
    const { fixture } = setup({
      value: {
        caption: 'c', hashtags: ['#h'], link: 'https://x',
        utm: { source: 's' },
        slideOrder: { order: [1, 0] },
        audioPlanning: {
          audioStrategy: 'trending-platform',
          audioMood: 'energetic-pumped',
        },
        platformControls: { allowComments: false },
      },
    });
    expect(fixture.componentInstance['caption']()).toBe('c');
    expect(fixture.componentInstance['hashtags']()).toEqual(['#h']);
    expect(fixture.componentInstance['link']()).toBe('https://x');
    expect(fixture.componentInstance['utm']()).toEqual({ source: 's' });
    expect(fixture.componentInstance['slideOrder']()).toEqual([1, 0]);
    expect(fixture.componentInstance['audioPlanning']()?.audioStrategy).toBe('trending-platform');
    expect(fixture.componentInstance['audioPlanning']()?.audioMood).toBe('energetic-pumped');
    expect(fixture.componentInstance['controls']()?.allowComments).toBe(false);
  });

  it('builds with all defaults (exercises signal-input default-value branches)', () => {
    // Build the component WITHOUT calling setInput on the optional inputs,
    // so the input() declaration defaults are reached. Lifts branch
    // coverage on the input() default-value branches.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [InstagramPackagingComponent],
      providers: [
        ...provideContentItemsApiStubs(),
        ContentStateService,
        PostDetailStore,
        {
          provide: AiAssistApiService,
          useValue: { assist: vi.fn(() => of({ values: [] })) },
        },
        { provide: ToastService, useValue: { showError: () => undefined, showSuccess: () => undefined } },
      ],
    });
    const fixture = TestBed.createComponent(InstagramPackagingComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance['caption']()).toBe('');
    expect(fixture.componentInstance['hashtags']()).toEqual([]);
    expect(fixture.componentInstance['link']()).toBe('');
    expect(fixture.componentInstance['utm']()).toBeUndefined();
    expect(fixture.componentInstance['slideOrder']()).toEqual([]);
    expect(fixture.componentInstance['paidBoosted']()).toBe(false);
    expect(fixture.nativeElement.querySelector('#post-caption')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-slide-order-picker')).toBeNull();
  });
});
