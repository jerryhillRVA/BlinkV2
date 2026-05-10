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

  it('AI assist fills Hook / Body / CTA with stub copy', () => {
    const { fixture, store } = setup();
    fixture.componentInstance['onHookAssist']();
    fixture.componentInstance['onBodyAssist']();
    fixture.componentInstance['onCtaAssist']();
    expect(store.videoDraft().hook?.length).toBeGreaterThan(0);
    expect(store.videoDraft().body?.length).toBeGreaterThan(0);
    expect(store.videoDraft().cta?.length).toBeGreaterThan(0);
  });

  it('Generate alternates fills the hookBank and opens the panel', () => {
    const { fixture, store } = setup();
    const ai = fixture.nativeElement.querySelector(
      '.ai-btn--secondary',
    ) as HTMLButtonElement;
    ai.click();
    fixture.detectChanges();
    expect(store.videoDraft().hookBank?.length).toBeGreaterThan(0);
    expect(fixture.nativeElement.querySelector('#hook-bank-panel')).toBeTruthy();
  });

  it('Apply hook from bank routes to setVideoHook', () => {
    const { fixture, store } = setup();
    (fixture.nativeElement.querySelector('.ai-btn--secondary') as HTMLButtonElement).click();
    fixture.detectChanges();
    const pick = fixture.nativeElement.querySelector(
      '.bank-pick',
    ) as HTMLButtonElement;
    const text = pick.textContent?.trim() ?? '';
    pick.click();
    expect(store.videoDraft().hook).toBe(text);
  });

  it('Target duration select uses per-option [selected]', () => {
    const { fixture } = setup();
    const select = fixture.nativeElement.querySelector(
      'select[aria-label="Target duration"]',
    ) as HTMLSelectElement;
    expect(select.value).toBe('60s');
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
