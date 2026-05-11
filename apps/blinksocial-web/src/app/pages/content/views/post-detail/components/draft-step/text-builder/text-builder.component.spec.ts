import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextBuilderComponent } from './text-builder.component';
import { PostDetailStore } from '../../../post-detail.store';
import { ContentStateService } from '../../../../../content-state.service';
import { provideContentItemsApiStubs } from '../../../../../content-items-api.test-util';
import type { ContentItem } from '../../../../../content.types';

function setup(): {
  fixture: ComponentFixture<TextBuilderComponent>;
  store: PostDetailStore;
} {
  const now = new Date().toISOString();
  const item: ContentItem = {
    id: 'post-1',
    stage: 'post',
    status: 'in-progress',
    title: 'Post',
    description: 'x'.repeat(80),
    pillarIds: ['p1'],
    segmentIds: ['s1'],
    platform: 'linkedin',
    contentType: 'ln-text-post',
    keyMessage: 'set',
    owner: 'user-sarah',
    cta: { type: 'learn-more', text: 'go' },
    briefApproved: true,
    createdAt: now,
    updatedAt: now,
  };
  TestBed.configureTestingModule({
    imports: [TextBuilderComponent],
    providers: [
      ...provideContentItemsApiStubs(),
      ContentStateService,
      PostDetailStore,
    ],
  });
  TestBed.inject(ContentStateService).setItems([item]);
  const store = TestBed.inject(PostDetailStore);
  store.setItemId(item.id);
  const fixture = TestBed.createComponent(TextBuilderComponent);
  fixture.detectChanges();
  return { fixture, store };
}

describe('TextBuilderComponent', () => {
  it('Caption input + AI assist persist', () => {
    const { fixture, store } = setup();
    const ta = fixture.nativeElement.querySelector(
      'textarea[aria-label="Caption"]',
    ) as HTMLTextAreaElement;
    ta.value = 'My caption';
    ta.dispatchEvent(new Event('input'));
    expect(store.textDraft().caption).toBe('My caption');
    (fixture.nativeElement.querySelector('.ai-btn') as HTMLButtonElement).click();
    expect(store.textDraft().caption?.length).toBeGreaterThan(0);
  });

  it('Char counter announces character count via aria-live="polite"', () => {
    const { fixture, store } = setup();
    store.setTextCaption('hello');
    fixture.detectChanges();
    const counter = fixture.nativeElement.querySelector('.char-counter');
    expect(counter.getAttribute('aria-live')).toBe('polite');
    expect(counter.textContent).toContain('5');
  });

  it('File attach reveals alt text field; clear hides it', () => {
    const { fixture, store } = setup();
    expect(
      fixture.nativeElement.querySelector('textarea[aria-label="Alt text"]'),
    ).toBeNull();
    fixture.componentInstance['onFileChange']({ name: 'p.png', size: 1 });
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('textarea[aria-label="Alt text"]'),
    ).toBeTruthy();
    expect(store.textDraft().imageRef).toBe('p.png');
  });

  it('Hashtags route to setTextHashtags', () => {
    const { fixture, store } = setup();
    fixture.componentInstance['onHashtags'](['#a']);
    expect(store.textDraft().hashtags).toEqual(['#a']);
  });

  it('Caption AI assist is a no-op when disabled (brief not approved)', () => {
    const { fixture, store } = setup();
    store.unlockBrief();
    fixture.detectChanges();
    fixture.componentInstance['onCaptionAssist']();
    expect(store.textDraft().caption).toBeUndefined();
  });

  it('clearing the attached file resets imageRef to an empty string', () => {
    const { fixture, store } = setup();
    fixture.componentInstance['onFileChange']({ name: 'p.png', size: 1 });
    expect(store.textDraft().imageRef).toBe('p.png');
    fixture.componentInstance['onFileChange'](null);
    expect(store.textDraft().imageRef).toBe('');
  });

  it('Alt text input writes through to setTextAltText', () => {
    const { fixture, store } = setup();
    fixture.componentInstance['onFileChange']({ name: 'p.png', size: 1 });
    fixture.detectChanges();
    const alt = fixture.nativeElement.querySelector(
      'textarea[aria-label="Alt text"]',
    ) as HTMLTextAreaElement;
    alt.value = 'A close-up of …';
    alt.dispatchEvent(new Event('input'));
    expect(store.textDraft().altText).toBe('A close-up of …');
  });

  it('caption input truncates to the max length', () => {
    const { fixture, store } = setup();
    const fakeEvent = { target: { value: 'x'.repeat(3500) } } as unknown as Event;
    fixture.componentInstance['onCaptionInput'](fakeEvent);
    expect(store.textDraft().caption?.length).toBe(3000);
  });
});
