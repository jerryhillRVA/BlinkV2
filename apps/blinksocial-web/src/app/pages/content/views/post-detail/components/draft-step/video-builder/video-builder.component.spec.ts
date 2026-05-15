import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { VideoBuilderComponent } from './video-builder.component';
import { PostDetailStore } from '../../../post-detail.store';
import { ContentStateService } from '../../../../../content-state.service';
import { provideContentItemsApiStubs } from '../../../../../content-items-api.test-util';
import { AiAssistApiService } from '../../../../../../../core/ai-assist/ai-assist.service';
import { ToastService } from '../../../../../../../core/toast/toast.service';
import type { ContentItem } from '../../../../../content.types';
import type { AiAssistRequestContract } from '@blinksocial/contracts';

function makeApprovedItem(partial: Partial<ContentItem> = {}): ContentItem {
  const now = new Date().toISOString();
  return {
    id: 'post-1',
    stage: 'post',
    status: 'in-progress',
    title: 'Post',
    description: 'x'.repeat(80),
    pillarIds: ['p1'],
    segmentIds: ['s1'],
    platform: 'instagram',
    contentType: 'reel',
    keyMessage: 'set',
    owner: 'user-sarah',
    cta: { type: 'learn-more', text: 'go' },
    briefApproved: true,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

interface AiResponses {
  'post-script-hook'?: string[];
  'post-script-body'?: string[];
  'post-script-cta'?: string[];
}

function setup(
  item: ContentItem = makeApprovedItem(),
  options: { responses?: AiResponses; error?: boolean } = {},
): {
  fixture: ComponentFixture<VideoBuilderComponent>;
  store: PostDetailStore;
  aiCalls: AiAssistRequestContract[];
  toastErrors: string[];
} {
  const aiCalls: AiAssistRequestContract[] = [];
  const toastErrors: string[] = [];
  const defaultResponses: Required<AiResponses> = {
    'post-script-hook': ['Hook A', 'Hook B', 'Hook C'],
    'post-script-body': ['Body draft.'],
    'post-script-cta': ['Call to action.'],
  };
  const aiStub = {
    assist: vi.fn((req: AiAssistRequestContract) => {
      aiCalls.push(req);
      if (options.error) return throwError(() => new Error('boom'));
      const values =
        options.responses?.[req.field as keyof AiResponses] ??
        defaultResponses[req.field as keyof AiResponses];
      return of({ values });
    }),
  };
  const toastStub = {
    showError: (m: string) => toastErrors.push(m),
    showSuccess: () => undefined,
  };
  TestBed.configureTestingModule({
    imports: [VideoBuilderComponent],
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
  const store = TestBed.inject(PostDetailStore);
  store.setItemId(item.id);
  const fixture = TestBed.createComponent(VideoBuilderComponent);
  fixture.detectChanges();
  return { fixture, store, aiCalls, toastErrors };
}

describe('VideoBuilderComponent', () => {
  it('Hook input routes to store.setVideoHook', () => {
    const { fixture, store } = setup();
    const ta = fixture.nativeElement.querySelector(
      'textarea[aria-label="Hook"]',
    ) as HTMLTextAreaElement;
    ta.value = 'A hook';
    ta.dispatchEvent(new Event('input'));
    expect(store.videoDraft().hook).toBe('A hook');
  });

  it('Body / CTA inputs route to their setters', () => {
    const { fixture, store } = setup();
    const body = fixture.nativeElement.querySelector(
      'textarea[aria-label="Body"]',
    ) as HTMLTextAreaElement;
    body.value = 'B';
    body.dispatchEvent(new Event('input'));
    const cta = fixture.nativeElement.querySelector(
      'textarea[aria-label="CTA"]',
    ) as HTMLTextAreaElement;
    cta.value = 'C';
    cta.dispatchEvent(new Event('input'));
    expect(store.videoDraft().body).toBe('B');
    expect(store.videoDraft().cta).toBe('C');
  });

  it('Body assist calls the API with post-script-body and fills the body', () => {
    const { store, fixture, aiCalls } = setup(makeApprovedItem(), {
      responses: { 'post-script-body': ['Body from API.'] },
    });
    fixture.componentInstance['onBodyAssist']();
    expect(aiCalls[0]).toMatchObject({ field: 'post-script-body' });
    expect(aiCalls[0].count).toBeUndefined();
    expect(store.videoDraft().body).toBe('Body from API.');
  });

  it('CTA assist calls the API with post-script-cta and fills the cta', () => {
    const { store, fixture, aiCalls } = setup(makeApprovedItem(), {
      responses: { 'post-script-cta': ['CTA from API.'] },
    });
    fixture.componentInstance['onCtaAssist']();
    expect(aiCalls[0]).toMatchObject({ field: 'post-script-cta' });
    expect(store.videoDraft().cta).toBe('CTA from API.');
  });

  it('Hook bank calls the API with count=3 and opens the picker', () => {
    const { fixture, store, aiCalls } = setup();
    fixture.componentInstance['onHookBank']();
    fixture.detectChanges();
    expect(aiCalls[0]).toMatchObject({ field: 'post-script-hook', count: 3 });
    expect(store.videoDraft().hookBank).toEqual(['Hook A', 'Hook B', 'Hook C']);
    expect(fixture.nativeElement.querySelector('.hook-bank')).toBeTruthy();
  });

  it('Apply hook from bank routes to setVideoHook', () => {
    const { fixture, store } = setup();
    fixture.componentInstance['onHookBank']();
    fixture.detectChanges();
    const pick = fixture.nativeElement.querySelector(
      '.bank-pick',
    ) as HTMLButtonElement;
    const text = pick.textContent?.trim() ?? '';
    pick.click();
    expect(store.videoDraft().hook).toBe(text);
  });

  it('AI Assist toast on error, fields unchanged', () => {
    const { fixture, store, toastErrors } = setup(makeApprovedItem(), { error: true });
    fixture.componentInstance['onBodyAssist']();
    expect(toastErrors).toHaveLength(1);
    expect(store.videoDraft().body).toBeUndefined();
  });

  it('script textareas carry the expected ids for E2E selectors', () => {
    const { fixture } = setup();
    expect(fixture.nativeElement.querySelector('textarea#post-script-hook')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('textarea#post-script-body')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('textarea#post-script-cta')).not.toBeNull();
  });

  it('Target duration renders as a radio-group of pills with the default 30s active', () => {
    const { fixture } = setup();
    const group = fixture.nativeElement.querySelector(
      '[role="radiogroup"][aria-label="Target duration"]',
    );
    expect(group).toBeTruthy();
    const active = group.querySelector('button[aria-checked="true"]');
    expect(active).toBeTruthy();
    expect(active.textContent?.trim()).toBe('30s');
  });

  it('clicking a pill routes to setVideoTargetDuration', () => {
    const { fixture, store } = setup();
    fixture.componentInstance['onDurationChange']('90s');
    expect(store.videoDraft().targetDuration).toBe('90s');
  });

  it('B-roll / Voiceover panels toggle aria-expanded', () => {
    const { fixture } = setup();
    const toggles = fixture.nativeElement.querySelectorAll('.collapse-toggle');
    expect(toggles[0].getAttribute('aria-expanded')).toBe('false');
    (toggles[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(toggles[0].getAttribute('aria-expanded')).toBe('true');
  });

  it('Shot-list change emits to store.setVideoShotList', () => {
    const { fixture, store } = setup();
    fixture.componentInstance['onShotsChange']([
      { id: 's1', type: 'Shot', description: 'd', duration: '5s' },
    ]);
    expect(store.videoDraft().shotList).toHaveLength(1);
  });

  it('all interactive elements are disabled when briefApproved=false', () => {
    const { fixture } = setup(makeApprovedItem({ briefApproved: false }));
    const ta = fixture.nativeElement.querySelector(
      'textarea[aria-label="Hook"]',
    ) as HTMLTextAreaElement;
    expect(ta.disabled).toBe(true);
    const aiBtn = fixture.nativeElement.querySelector(
      '.ai-btn',
    ) as HTMLButtonElement;
    expect(aiBtn.disabled).toBe(true);
  });

  it('onHookBank / onBodyAssist / onCtaAssist are no-ops while disabled', () => {
    const { fixture, store, aiCalls } = setup(makeApprovedItem({ briefApproved: false }));
    fixture.componentInstance['onHookBank']();
    fixture.componentInstance['onBodyAssist']();
    fixture.componentInstance['onCtaAssist']();
    expect(aiCalls).toHaveLength(0);
    expect(store.videoDraft().hookBank).toBeUndefined();
    expect(store.videoDraft().body).toBeUndefined();
    expect(store.videoDraft().cta).toBeUndefined();
  });

  it('B-roll + Voiceover textareas route to their setters', () => {
    const { fixture, store } = setup();
    // Open the collapsible panels so the textareas render.
    fixture.componentInstance['toggleBRoll']();
    fixture.componentInstance['toggleVoiceover']();
    fixture.detectChanges();
    const broll = fixture.nativeElement.querySelector(
      'textarea[aria-label="B-roll notes"]',
    ) as HTMLTextAreaElement;
    const vo = fixture.nativeElement.querySelector(
      'textarea[aria-label="Voiceover notes"]',
    ) as HTMLTextAreaElement;
    broll.value = 'Insert wide shot at 0:05';
    broll.dispatchEvent(new Event('input'));
    vo.value = 'Confident, conversational tone';
    vo.dispatchEvent(new Event('input'));
    expect(store.videoDraft().bRollNotes).toBe('Insert wide shot at 0:05');
    expect(store.videoDraft().voiceoverNotes).toBe('Confident, conversational tone');
  });

  it('hide-bank button closes the hook-bank panel', () => {
    const { fixture } = setup();
    fixture.componentInstance['onHookBank']();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.hook-bank')).toBeTruthy();
    fixture.componentInstance['onHideBank']();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.hook-bank')).toBeNull();
  });

  it('cover asset ref change routes to setVideoCoverAssetRef', () => {
    const { fixture, store } = setup();
    fixture.componentInstance['onCoverAssetRefChange']('cover.png');
    expect(store.videoDraft().coverAssetRef).toBe('cover.png');
    fixture.componentInstance['onCoverAssetRefChange'](undefined);
    expect(store.videoDraft().coverAssetRef).toBeUndefined();
  });

  it('ctaTypeLabel formats the brief CTA type to upper-kebab-removed form', () => {
    const { fixture } = setup();
    const label = fixture.componentInstance['ctaTypeLabel']();
    expect(label).toBe('LEARN MORE');
  });

  it('ctaTypeLabel is null when the brief has no CTA type', () => {
    const item = makeApprovedItem({ cta: undefined });
    const { fixture } = setup(item);
    expect(fixture.componentInstance['ctaTypeLabel']()).toBeNull();
  });

  // ── Handler branches: `(target as Input).value ?? ''` fallbacks ──

  it('onHookInput coalesces null .value to empty string', () => {
    const { fixture, store } = setup();
    const spy = vi.spyOn(store, 'setVideoHook');
    fixture.componentInstance['onHookInput']({ target: { value: null } } as unknown as Event);
    expect(spy).toHaveBeenCalledWith('');
  });

  it('onBodyInput / onCtaInput / onBRollInput / onVoiceoverInput coalesce null .value', () => {
    const { fixture, store } = setup();
    const spies = {
      body: vi.spyOn(store, 'setVideoBody'),
      cta: vi.spyOn(store, 'setVideoCta'),
      bRoll: vi.spyOn(store, 'setVideoBRollNotes'),
      voiceover: vi.spyOn(store, 'setVideoVoiceoverNotes'),
    };
    const nullEvent = { target: { value: null } } as unknown as Event;
    fixture.componentInstance['onBodyInput'](nullEvent);
    fixture.componentInstance['onCtaInput'](nullEvent);
    fixture.componentInstance['onBRollInput'](nullEvent);
    fixture.componentInstance['onVoiceoverInput'](nullEvent);
    expect(spies.body).toHaveBeenCalledWith('');
    expect(spies.cta).toHaveBeenCalledWith('');
    expect(spies.bRoll).toHaveBeenCalledWith('');
    expect(spies.voiceover).toHaveBeenCalledWith('');
  });

  it('duration defaults to "30s" when draft.targetDuration is undefined', () => {
    const { fixture } = setup();
    // No setVideoTargetDuration call → default branch reached.
    expect(fixture.componentInstance['duration']()).toBe('30s');
  });
});
