import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoBuilderComponent } from './video-builder.component';
import { PostDetailStore } from '../../../post-detail.store';
import { ContentStateService } from '../../../../../content-state.service';
import { provideContentItemsApiStubs } from '../../../../../content-items-api.test-util';
import type { ContentItem } from '../../../../../content.types';

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

function setup(item: ContentItem = makeApprovedItem()): {
  fixture: ComponentFixture<VideoBuilderComponent>;
  store: PostDetailStore;
} {
  TestBed.configureTestingModule({
    imports: [VideoBuilderComponent],
    providers: [
      ...provideContentItemsApiStubs(),
      ContentStateService,
      PostDetailStore,
    ],
  });
  const state = TestBed.inject(ContentStateService);
  state.setItems([item]);
  const store = TestBed.inject(PostDetailStore);
  store.setItemId(item.id);
  const fixture = TestBed.createComponent(VideoBuilderComponent);
  fixture.detectChanges();
  return { fixture, store };
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

  it('Body assist eventually fills the body', () => {
    vi.useFakeTimers();
    const { store, fixture } = setup();
    fixture.componentInstance['onBodyAssist']();
    vi.advanceTimersByTime(700);
    expect(store.videoDraft().body?.length ?? 0).toBeGreaterThan(0);
    vi.useRealTimers();
  });

  it('CTA assist eventually fills the cta', () => {
    vi.useFakeTimers();
    const { store, fixture } = setup();
    fixture.componentInstance['onCtaAssist']();
    vi.advanceTimersByTime(700);
    expect(store.videoDraft().cta?.length ?? 0).toBeGreaterThan(0);
    vi.useRealTimers();
  });

  it('Hook bank fills the hookBank and opens the panel', () => {
    vi.useFakeTimers();
    const { fixture, store } = setup();
    fixture.componentInstance['onHookBank']();
    vi.advanceTimersByTime(700);
    fixture.detectChanges();
    expect(store.videoDraft().hookBank?.length ?? 0).toBeGreaterThan(0);
    expect(fixture.nativeElement.querySelector('.hook-bank')).toBeTruthy();
    vi.useRealTimers();
  });

  it('Apply hook from bank routes to setVideoHook', () => {
    vi.useFakeTimers();
    const { fixture, store } = setup();
    fixture.componentInstance['onHookBank']();
    vi.advanceTimersByTime(700);
    fixture.detectChanges();
    const pick = fixture.nativeElement.querySelector(
      '.bank-pick',
    ) as HTMLButtonElement;
    const text = pick.textContent?.trim() ?? '';
    pick.click();
    expect(store.videoDraft().hook).toBe(text);
    vi.useRealTimers();
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
});
