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

  it('Duration change + Voiceover textarea route to setters', () => {
    const { fixture, store } = setup();
    fixture.componentInstance['toggleVoiceover']();
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector(
      'select[aria-label="Target duration"]',
    ) as HTMLSelectElement;
    select.value = '15m';
    select.dispatchEvent(new Event('change'));
    expect(store.videoLongDraft().targetDuration).toBe('15m');
    const vo = fixture.nativeElement.querySelector(
      'textarea[aria-label="Voiceover notes"]',
    ) as HTMLTextAreaElement;
    vo.value = 'Calm, deliberate cadence';
    vo.dispatchEvent(new Event('input'));
    expect(store.videoLongDraft().voiceoverNotes).toBe('Calm, deliberate cadence');
  });

  it('all add / remove / move / edit handlers are no-ops while disabled', () => {
    const { fixture, store } = setup();
    // Seed a couple of blocks while enabled, then unlock.
    fixture.componentInstance['onAddBlock']();
    fixture.componentInstance['onAddBlock']();
    const before = store.videoLongDraft().sequenceBlocks?.map((b) => ({ ...b })) ?? [];
    store.unlockBrief();
    fixture.detectChanges();
    const fakeEvent = (value: string) => ({ target: { value } } as unknown as Event);
    fixture.componentInstance['onHookAssist']();
    fixture.componentInstance['onAddBlock']();
    fixture.componentInstance['onRemoveBlock'](before[0].id);
    fixture.componentInstance['onMoveUp'](1);
    fixture.componentInstance['onMoveDown'](0);
    fixture.componentInstance['onBlockType'](before[0].id, fakeEvent('CTA'));
    fixture.componentInstance['onBlockDescription'](before[0].id, fakeEvent('changed'));
    fixture.componentInstance['onBlockDuration'](before[0].id, fakeEvent('99s'));
    expect(store.videoLongDraft().sequenceBlocks).toEqual(before);
  });

  it('onMoveUp at index 0 and onMoveDown at the last index are no-ops', () => {
    const { fixture, store } = setup();
    fixture.componentInstance['onAddBlock']();
    fixture.componentInstance['onAddBlock']();
    const before = store.videoLongDraft().sequenceBlocks?.map((b) => b.id) ?? [];
    fixture.componentInstance['onMoveUp'](0);
    fixture.componentInstance['onMoveDown'](before.length - 1);
    expect(store.videoLongDraft().sequenceBlocks?.map((b) => b.id)).toEqual(before);
  });

  it('duration getter falls back to "10m" when no targetDuration is set', () => {
    const { fixture } = setup();
    expect(fixture.componentInstance['duration']).toBe('10m');
  });

  // ── Branch coverage: `?? defaultValue` fallbacks on event handlers ──
  // Each handler reads (e.target as ...).value and coalesces null to a
  // default. Real DOM events always carry strings, but the fallback path
  // needs explicit exercise.

  it('onHookInput coalesces null .value to empty string', () => {
    const { fixture, store } = setup();
    const spy = vi.spyOn(store, 'setVideoLongHook');
    fixture.componentInstance['onHookInput']({ target: { value: null } } as unknown as Event);
    expect(spy).toHaveBeenCalledWith('');
  });

  it('onDurationChange coalesces null .value to "10m"', () => {
    const { fixture, store } = setup();
    const spy = vi.spyOn(store, 'setVideoLongTargetDuration');
    fixture.componentInstance['onDurationChange']({ target: { value: null } } as unknown as Event);
    expect(spy).toHaveBeenCalledWith('10m');
  });

  it('onVoiceoverInput coalesces null .value to empty string', () => {
    const { fixture, store } = setup();
    const spy = vi.spyOn(store, 'setVideoLongVoiceoverNotes');
    fixture.componentInstance['onVoiceoverInput']({ target: { value: null } } as unknown as Event);
    expect(spy).toHaveBeenCalledWith('');
  });

  it('onBlockDescription coalesces null .value to empty string', () => {
    const { fixture, store } = setup();
    store.setVideoLongSequenceBlocks([
      { id: 'b1', type: 'Hook', description: 'orig', duration: '5s' },
    ]);
    const setSpy = vi.spyOn(store, 'setVideoLongSequenceBlocks');
    fixture.componentInstance['onBlockDescription'](
      'b1',
      { target: { value: null } } as unknown as Event,
    );
    expect(setSpy).toHaveBeenCalled();
    const lastCall = setSpy.mock.calls[setSpy.mock.calls.length - 1][0];
    expect(lastCall[0].description).toBe('');
  });

  it('onBlockDuration coalesces null .value to empty string', () => {
    const { fixture, store } = setup();
    store.setVideoLongSequenceBlocks([
      { id: 'b1', type: 'Hook', description: 'orig', duration: '5s' },
    ]);
    const setSpy = vi.spyOn(store, 'setVideoLongSequenceBlocks');
    fixture.componentInstance['onBlockDuration'](
      'b1',
      { target: { value: null } } as unknown as Event,
    );
    expect(setSpy).toHaveBeenCalled();
    const lastCall = setSpy.mock.calls[setSpy.mock.calls.length - 1][0];
    expect(lastCall[0].duration).toBe('');
  });

  it('onRemoveBlock filters out the targeted block id (sequenceBlocks ?? [] branch)', () => {
    const { fixture, store } = setup();
    store.setVideoLongSequenceBlocks([
      { id: 'b1', type: 'Hook', description: 'a', duration: '5s' },
      { id: 'b2', type: 'Body', description: 'b', duration: '10s' },
    ]);
    fixture.componentInstance['onRemoveBlock']('b1');
    expect(store.videoLongDraft().sequenceBlocks?.map((b) => b.id)).toEqual(['b2']);
  });

  it('onAddBlock works when sequenceBlocks is undefined (?? [] fallback path)', () => {
    const { fixture, store } = setup();
    expect(store.videoLongDraft().sequenceBlocks).toBeUndefined();
    fixture.componentInstance['onAddBlock']();
    expect(store.videoLongDraft().sequenceBlocks?.length).toBe(1);
  });

  it('onBlockDescription preserves other blocks while patching the target one', () => {
    const { fixture, store } = setup();
    store.setVideoLongSequenceBlocks([
      { id: 'b1', type: 'Hook', description: 'orig1', duration: '5s' },
      { id: 'b2', type: 'Body', description: 'orig2', duration: '10s' },
    ]);
    fixture.componentInstance['onBlockDescription'](
      'b2',
      { target: { value: 'updated' } } as unknown as Event,
    );
    const blocks = store.videoLongDraft().sequenceBlocks ?? [];
    expect(blocks.find((b) => b.id === 'b1')?.description).toBe('orig1');
    expect(blocks.find((b) => b.id === 'b2')?.description).toBe('updated');
  });
});
