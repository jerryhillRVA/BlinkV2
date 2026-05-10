import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoLongBuilderComponent } from './video-long-builder.component';
import { PostDetailStore } from '../../../post-detail.store';
import { ContentStateService } from '../../../../../content-state.service';
import { provideContentItemsApiStubs } from '../../../../../content-items-api.test-util';
import type { ContentItem } from '../../../../../content.types';

function makeApprovedItem(): ContentItem {
  const now = new Date().toISOString();
  return {
    id: 'post-1',
    stage: 'post',
    status: 'in-progress',
    title: 'Post',
    description: 'x'.repeat(80),
    pillarIds: ['p1'],
    segmentIds: ['s1'],
    platform: 'youtube',
    contentType: 'long-form',
    keyMessage: 'set',
    owner: 'user-sarah',
    cta: { type: 'learn-more', text: 'go' },
    briefApproved: true,
    createdAt: now,
    updatedAt: now,
  };
}

function setup(): {
  fixture: ComponentFixture<VideoLongBuilderComponent>;
  store: PostDetailStore;
} {
  TestBed.configureTestingModule({
    imports: [VideoLongBuilderComponent],
    providers: [
      ...provideContentItemsApiStubs(),
      ContentStateService,
      PostDetailStore,
    ],
  });
  const state = TestBed.inject(ContentStateService);
  state.setItems([makeApprovedItem()]);
  const store = TestBed.inject(PostDetailStore);
  store.setItemId('post-1');
  const fixture = TestBed.createComponent(VideoLongBuilderComponent);
  fixture.detectChanges();
  return { fixture, store };
}

describe('VideoLongBuilderComponent', () => {
  it('Hook input + AI assist route to setVideoLongHook', () => {
    const { fixture, store } = setup();
    const hookField = fixture.nativeElement.querySelector(
      'textarea[aria-label="Hook"]',
    ) as HTMLTextAreaElement;
    hookField.value = 'Pulled in';
    hookField.dispatchEvent(new Event('input'));
    expect(store.videoLongDraft().hook).toBe('Pulled in');
    (fixture.nativeElement.querySelector('.ai-btn') as HTMLButtonElement).click();
    expect(store.videoLongDraft().hook?.length).toBeGreaterThan(0);
  });

  it('Add block creates a new sequence block', () => {
    const { fixture, store } = setup();
    (fixture.nativeElement.querySelector('.add-btn') as HTMLButtonElement).click();
    expect(store.videoLongDraft().sequenceBlocks).toHaveLength(1);
  });

  it('Block reorder via Up/Down works', () => {
    const { fixture, store } = setup();
    fixture.componentInstance['onAddBlock']();
    fixture.componentInstance['onAddBlock']();
    fixture.detectChanges();
    const ids = store.videoLongDraft().sequenceBlocks?.map((b) => b.id) ?? [];
    fixture.componentInstance['onMoveDown'](0);
    expect(store.videoLongDraft().sequenceBlocks?.map((b) => b.id)).toEqual([
      ids[1],
      ids[0],
    ]);
    fixture.componentInstance['onMoveUp'](1);
    expect(store.videoLongDraft().sequenceBlocks?.map((b) => b.id)).toEqual([
      ids[0],
      ids[1],
    ]);
  });

  it('Block remove works', () => {
    const { fixture, store } = setup();
    fixture.componentInstance['onAddBlock']();
    const id = store.videoLongDraft().sequenceBlocks![0].id;
    fixture.componentInstance['onRemoveBlock'](id);
    expect(store.videoLongDraft().sequenceBlocks).toEqual([]);
  });

  it('Block edits route to store', () => {
    const { fixture, store } = setup();
    fixture.componentInstance['onAddBlock']();
    const id = store.videoLongDraft().sequenceBlocks![0].id;
    const fakeEvent = (value: string) =>
      ({ target: { value } } as unknown as Event);
    fixture.componentInstance['onBlockType'](id, fakeEvent('Hook'));
    fixture.componentInstance['onBlockDescription'](id, fakeEvent('Open'));
    fixture.componentInstance['onBlockDuration'](id, fakeEvent('15s'));
    const updated = store.videoLongDraft().sequenceBlocks![0];
    expect(updated).toMatchObject({ type: 'Hook', description: 'Open', duration: '15s' });
  });

  it('Voiceover toggle flips aria-expanded', () => {
    const { fixture } = setup();
    const toggle = fixture.nativeElement.querySelector(
      '.collapse-toggle',
    ) as HTMLButtonElement;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });
});
