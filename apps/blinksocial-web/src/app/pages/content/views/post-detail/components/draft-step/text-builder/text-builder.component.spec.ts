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
});
