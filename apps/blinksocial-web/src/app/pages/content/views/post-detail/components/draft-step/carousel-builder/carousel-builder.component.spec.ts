import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CarouselBuilderComponent } from './carousel-builder.component';
import { PostDetailStore } from '../../../post-detail.store';
import { ContentStateService } from '../../../../../content-state.service';
import { provideContentItemsApiStubs } from '../../../../../content-items-api.test-util';
import type { ContentItem } from '../../../../../content.types';

function setup(): {
  fixture: ComponentFixture<CarouselBuilderComponent>;
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
    contentType: 'carousel',
    keyMessage: 'set',
    owner: 'user-sarah',
    cta: { type: 'learn-more', text: 'go' },
    briefApproved: true,
    createdAt: now,
    updatedAt: now,
  };
  TestBed.configureTestingModule({
    imports: [CarouselBuilderComponent],
    providers: [
      ...provideContentItemsApiStubs(),
      ContentStateService,
      PostDetailStore,
    ],
  });
  TestBed.inject(ContentStateService).setItems([item]);
  const store = TestBed.inject(PostDetailStore);
  store.setItemId(item.id);
  const fixture = TestBed.createComponent(CarouselBuilderComponent);
  fixture.detectChanges();
  return { fixture, store };
}

describe('CarouselBuilderComponent', () => {
  it('Hook input + AI assist persist', () => {
    const { fixture, store } = setup();
    const ta = fixture.nativeElement.querySelector(
      'textarea[aria-label="Hook"]',
    ) as HTMLTextAreaElement;
    ta.value = 'h';
    ta.dispatchEvent(new Event('input'));
    expect(store.carouselDraft().hook).toBe('h');
    (fixture.nativeElement.querySelector('.ai-btn') as HTMLButtonElement).click();
    expect(store.carouselDraft().hook?.length).toBeGreaterThan(0);
  });

  it('Add slide adds a new entry', () => {
    const { fixture, store } = setup();
    fixture.componentInstance['onAddSlide']();
    expect(store.carouselDraft().slides).toHaveLength(1);
  });

  it('Slides list uses <ol role="list"> with per-slide aria-label', () => {
    const { fixture } = setup();
    fixture.componentInstance['onAddSlide']();
    fixture.componentInstance['onAddSlide']();
    fixture.detectChanges();
    const list = fixture.nativeElement.querySelector('ol.slide-list');
    expect(list.getAttribute('role')).toBe('list');
    const slides = list.querySelectorAll('.slide');
    expect(slides[0].getAttribute('aria-label')).toBe('Slide 1 of 2');
    expect(slides[1].getAttribute('aria-label')).toBe('Slide 2 of 2');
  });

  it('Slide reorder + remove route to store', () => {
    const { fixture, store } = setup();
    fixture.componentInstance['onAddSlide']();
    fixture.componentInstance['onAddSlide']();
    const ids = store.carouselDraft().slides!.map((s) => s.id);
    fixture.componentInstance['onMoveDown'](0);
    expect(store.carouselDraft().slides!.map((s) => s.id)).toEqual([ids[1], ids[0]]);
    fixture.componentInstance['onRemoveSlide'](ids[1]);
    expect(store.carouselDraft().slides!.map((s) => s.id)).toEqual([ids[0]]);
  });

  it('Slide field edits + image attach persist', () => {
    const { fixture, store } = setup();
    fixture.componentInstance['onAddSlide']();
    const id = store.carouselDraft().slides![0].id;
    const fakeEvent = (value: string) =>
      ({ target: { value } } as unknown as Event);
    fixture.componentInstance['onSlideHeadline'](id, fakeEvent('H'));
    fixture.componentInstance['onSlideBody'](id, fakeEvent('B'));
    fixture.componentInstance['onSlideAlt'](id, fakeEvent('A'));
    fixture.componentInstance['onSlideFile'](id, { name: 'p.png', size: 1 });
    const slide = store.carouselDraft().slides![0];
    expect(slide).toMatchObject({
      headline: 'H',
      body: 'B',
      altText: 'A',
      imageRef: 'p.png',
    });
  });

  it('Hashtags route to store.setCarouselHashtags', () => {
    const { fixture, store } = setup();
    fixture.componentInstance['onHashtags'](['#a']);
    expect(store.carouselDraft().hashtags).toEqual(['#a']);
  });
});
