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

  it('AI Assist + Add Slide are no-ops while disabled (brief not approved)', () => {
    const { fixture, store } = setup();
    // Unlock then mutate item to mark brief not approved — exercises the
    // disabled() guards on onHookAssist + onAddSlide.
    store.unlockBrief();
    fixture.detectChanges();
    const before = store.carouselDraft();
    fixture.componentInstance['onHookAssist']();
    fixture.componentInstance['onAddSlide']();
    expect(store.carouselDraft()).toEqual(before);
  });

  it('Remove / MoveUp / MoveDown are no-ops while disabled', () => {
    const { fixture, store } = setup();
    fixture.componentInstance['onAddSlide']();
    fixture.componentInstance['onAddSlide']();
    const before = store.carouselDraft().slides!.map((s) => s.id);
    store.unlockBrief();
    fixture.detectChanges();
    fixture.componentInstance['onRemoveSlide'](before[0]);
    fixture.componentInstance['onMoveUp'](1);
    fixture.componentInstance['onMoveDown'](0);
    expect(store.carouselDraft().slides!.map((s) => s.id)).toEqual(before);
  });

  it('onMoveUp at index 0 is a no-op (already at top)', () => {
    const { fixture, store } = setup();
    fixture.componentInstance['onAddSlide']();
    fixture.componentInstance['onAddSlide']();
    const before = store.carouselDraft().slides!.map((s) => s.id);
    fixture.componentInstance['onMoveUp'](0);
    expect(store.carouselDraft().slides!.map((s) => s.id)).toEqual(before);
  });

  it('onMoveDown at the last index is a no-op (already at bottom)', () => {
    const { fixture, store } = setup();
    fixture.componentInstance['onAddSlide']();
    fixture.componentInstance['onAddSlide']();
    const before = store.carouselDraft().slides!.map((s) => s.id);
    fixture.componentInstance['onMoveDown'](before.length - 1);
    expect(store.carouselDraft().slides!.map((s) => s.id)).toEqual(before);
  });

  it('per-slide field edits are no-ops while disabled', () => {
    const { fixture, store } = setup();
    fixture.componentInstance['onAddSlide']();
    const id = store.carouselDraft().slides![0].id;
    store.unlockBrief();
    fixture.detectChanges();
    const before = store.carouselDraft().slides![0];
    const fakeEvent = (value: string) =>
      ({ target: { value } } as unknown as Event);
    fixture.componentInstance['onSlideHeadline'](id, fakeEvent('changed'));
    fixture.componentInstance['onSlideBody'](id, fakeEvent('changed'));
    fixture.componentInstance['onSlideAlt'](id, fakeEvent('changed'));
    expect(store.carouselDraft().slides![0]).toEqual(before);
  });

  it('clearing a slide image (file=null) wipes imageRef', () => {
    const { fixture, store } = setup();
    fixture.componentInstance['onAddSlide']();
    const id = store.carouselDraft().slides![0].id;
    fixture.componentInstance['onSlideFile'](id, { name: 'p.png', size: 1 });
    expect(store.carouselDraft().slides![0].imageRef).toBe('p.png');
    fixture.componentInstance['onSlideFile'](id, null);
    expect(store.carouselDraft().slides![0].imageRef).toBeUndefined();
  });

  // ── Branch coverage: `.value ?? ''` fallbacks on event handlers ──
  it('onHookInput coalesces null .value to empty string', () => {
    const { fixture, store } = setup();
    const spy = vi.spyOn(store, 'setCarouselHook');
    fixture.componentInstance['onHookInput']({ target: { value: null } } as unknown as Event);
    expect(spy).toHaveBeenCalledWith('');
  });

  it('onSlideHeadline / onSlideBody / onSlideAlt coalesce null .value to empty string', () => {
    const { fixture, store } = setup();
    fixture.componentInstance['onAddSlide']();
    const id = store.carouselDraft().slides![0].id;
    fixture.componentInstance['onSlideHeadline'](id, { target: { value: null } } as unknown as Event);
    expect(store.carouselDraft().slides![0].headline).toBe('');
    fixture.componentInstance['onSlideBody'](id, { target: { value: null } } as unknown as Event);
    expect(store.carouselDraft().slides![0].body).toBe('');
    fixture.componentInstance['onSlideAlt'](id, { target: { value: null } } as unknown as Event);
    expect(store.carouselDraft().slides![0].altText).toBe('');
  });

  it('slide map preserves non-target slides while patching the target', () => {
    const { fixture, store } = setup();
    fixture.componentInstance['onAddSlide']();
    fixture.componentInstance['onAddSlide']();
    const id1 = store.carouselDraft().slides![0].id;
    const id2 = store.carouselDraft().slides![1].id;
    fixture.componentInstance['onSlideHeadline'](id2, {
      target: { value: 'updated' },
    } as unknown as Event);
    expect(store.carouselDraft().slides![0].id).toBe(id1);
    expect(store.carouselDraft().slides![1].headline).toBe('updated');
  });
});
