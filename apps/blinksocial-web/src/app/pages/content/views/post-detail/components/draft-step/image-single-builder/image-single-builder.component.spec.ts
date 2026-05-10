import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageSingleBuilderComponent } from './image-single-builder.component';
import { PostDetailStore } from '../../../post-detail.store';
import { ContentStateService } from '../../../../../content-state.service';
import { provideContentItemsApiStubs } from '../../../../../content-items-api.test-util';
import type { ContentItem } from '../../../../../content.types';

function setup(): {
  fixture: ComponentFixture<ImageSingleBuilderComponent>;
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
    platform: 'instagram',
    contentType: 'feed-post',
    keyMessage: 'set',
    owner: 'user-sarah',
    cta: { type: 'learn-more', text: 'go' },
    briefApproved: true,
    createdAt: now,
    updatedAt: now,
  };
  TestBed.configureTestingModule({
    imports: [ImageSingleBuilderComponent],
    providers: [
      ...provideContentItemsApiStubs(),
      ContentStateService,
      PostDetailStore,
    ],
  });
  TestBed.inject(ContentStateService).setItems([item]);
  const store = TestBed.inject(PostDetailStore);
  store.setItemId(item.id);
  const fixture = TestBed.createComponent(ImageSingleBuilderComponent);
  fixture.detectChanges();
  return { fixture, store };
}

describe('ImageSingleBuilderComponent', () => {
  it('Hook input + AI assist route to setImageSingleHook', () => {
    const { fixture, store } = setup();
    const ta = fixture.nativeElement.querySelector(
      'textarea[aria-label="Hook"]',
    ) as HTMLTextAreaElement;
    ta.value = 'h';
    ta.dispatchEvent(new Event('input'));
    expect(store.imageSingleDraft().hook).toBe('h');
    (fixture.nativeElement.querySelector('.ai-btn') as HTMLButtonElement).click();
    expect(store.imageSingleDraft().hook?.length).toBeGreaterThan(0);
  });

  it('Creative direction toggle expands the panel', () => {
    const { fixture } = setup();
    const toggle = fixture.nativeElement.querySelector(
      '.collapse-toggle',
    ) as HTMLButtonElement;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('#img-creative-panel')).toBeTruthy();
  });

  it('File change persists imageRef', () => {
    const { fixture, store } = setup();
    fixture.componentInstance['onFileChange']({ name: 'photo.png', size: 100 });
    expect(store.imageSingleDraft().imageRef).toBe('photo.png');
    fixture.componentInstance['onFileChange'](null);
    expect(store.imageSingleDraft().imageRef).toBe('');
  });

  it('AI generate sets imageRef to a stub filename', () => {
    const { fixture, store } = setup();
    fixture.componentInstance['onAiGenerate']();
    expect(store.imageSingleDraft().imageRef?.length).toBeGreaterThan(0);
  });

  it('Alt assist + alt input route to setImageSingleAltText', () => {
    const { fixture, store } = setup();
    const altBtn = fixture.nativeElement.querySelectorAll('.ai-btn')[1] as HTMLButtonElement;
    altBtn.click();
    expect(store.imageSingleDraft().altText?.length).toBeGreaterThan(0);
    const ta = fixture.nativeElement.querySelector(
      'textarea[aria-label="Alt text"]',
    ) as HTMLTextAreaElement;
    ta.value = 'overridden';
    ta.dispatchEvent(new Event('input'));
    expect(store.imageSingleDraft().altText).toBe('overridden');
  });

  it('Hashtags route to setImageSingleHashtags', () => {
    const { fixture, store } = setup();
    fixture.componentInstance['onHashtags'](['#a', '#b']);
    expect(store.imageSingleDraft().hashtags).toEqual(['#a', '#b']);
  });
});
