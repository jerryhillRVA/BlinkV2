import { TestBed } from '@angular/core/testing';
import type { DraftShotItemContract } from '@blinksocial/contracts';
import { ShotListComponent } from './shot-list.component';

function setup(initial: Partial<ShotListComponent> = {}) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [ShotListComponent] });
  const fixture = TestBed.createComponent(ShotListComponent);
  Object.assign(fixture.componentInstance, initial);
  fixture.detectChanges();
  return fixture;
}

const SHOTS: DraftShotItemContract[] = [
  { id: 's1', type: 'Shot', description: 'first', duration: '5s' },
  { id: 's2', type: 'CTA', description: 'second', duration: '10s' },
];

describe('ShotListComponent', () => {
  it('renders shots inside <ul role="list">', () => {
    const fixture = setup({ shots: SHOTS });
    const list = fixture.nativeElement.querySelector('ul.shot-rows');
    expect(list.getAttribute('role')).toBe('list');
    const rows = list.querySelectorAll('li.shot-row');
    expect(rows.length).toBe(2);
  });

  it('list has aria-label including count', () => {
    const fixture = setup({ shots: SHOTS });
    const list = fixture.nativeElement.querySelector('ul.shot-rows');
    expect(list.getAttribute('aria-label')).toBe('Shot list: 2 shots');
  });

  it('singular form when only 1 shot', () => {
    const fixture = setup({ shots: [SHOTS[0]] });
    const list = fixture.nativeElement.querySelector('ul.shot-rows');
    expect(list.getAttribute('aria-label')).toBe('Shot list: 1 shot');
  });

  it('Up / Down / Remove buttons each have descriptive aria-labels', () => {
    const fixture = setup({ shots: SHOTS });
    const btns = fixture.nativeElement.querySelectorAll('.action-btn');
    expect(btns[0].getAttribute('aria-label')).toBe('Move shot 1 up');
    expect(btns[1].getAttribute('aria-label')).toBe('Move shot 1 down');
    expect(btns[2].getAttribute('aria-label')).toBe('Remove shot 1');
  });

  it('Add shot button (between asset slot and shot list) appends a new empty row', () => {
    const fixture = setup({ shots: [] });
    const events: DraftShotItemContract[][] = [];
    fixture.componentInstance.shotsChange.subscribe((v) => events.push(v));
    // The Add shot button lives in .add-shot-row, between the asset
    // slot and the shot rows.
    const btn = fixture.nativeElement.querySelector(
      '.add-shot-row .ghost-btn',
    ) as HTMLButtonElement;
    btn.click();
    expect(events).toHaveLength(1);
    expect(events[0][0]).toMatchObject({
      type: 'Shot',
      description: '',
      duration: '',
    });
  });

  it('Empty state shows the "1 shot required" amber copy', () => {
    const fixture = setup({ shots: [] });
    const empty = fixture.nativeElement.querySelector('.empty-state');
    expect(empty).toBeTruthy();
    expect(empty.textContent).toContain('At least 1 shot is required');
  });

  it('Asset slot shows "No asset attached yet" only when coverAssetRef is empty', () => {
    const empty = setup({ shots: [], coverAssetRef: undefined });
    expect(
      empty.nativeElement.querySelector('.asset-empty'),
    ).toBeTruthy();
    expect(
      empty.nativeElement.querySelector('.asset-slot .asset-chip'),
    ).toBeNull();
    const attached = setup({ shots: [], coverAssetRef: 'cover.png' });
    expect(
      attached.nativeElement.querySelector('.asset-empty'),
    ).toBeNull();
    const chip = attached.nativeElement.querySelector('.asset-slot .asset-chip');
    expect(chip).toBeTruthy();
    expect(chip.textContent).toContain('cover.png');
  });

  it('Top-level Attach file input emits coverAssetRefChange with the filename', () => {
    const fixture = setup({ shots: [], coverAssetRef: undefined });
    const events: (string | undefined)[] = [];
    fixture.componentInstance.coverAssetRefChange.subscribe((v) => events.push(v));
    const file = new File(['x'], 'cover.png', { type: 'image/png' });
    const input = fixture.nativeElement.querySelector(
      '.asset-slot input[type="file"]',
    ) as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change'));
    expect(events).toEqual(['cover.png']);
  });

  it('Top-level chip Remove emits coverAssetRefChange(undefined)', () => {
    const fixture = setup({ shots: [], coverAssetRef: 'cover.png' });
    const events: (string | undefined)[] = [];
    fixture.componentInstance.coverAssetRefChange.subscribe((v) => events.push(v));
    const btn = fixture.nativeElement.querySelector(
      '.asset-slot .asset-chip-remove',
    ) as HTMLButtonElement;
    btn.click();
    expect(events).toEqual([undefined]);
  });

  it('Per-shot Attach file emits shotsChange with assetRef set', () => {
    const fixture = setup({ shots: SHOTS });
    const events: DraftShotItemContract[][] = [];
    fixture.componentInstance.shotsChange.subscribe((v) => events.push(v));
    const file = new File(['x'], 'first-shot.mp4', { type: 'video/mp4' });
    const input = fixture.nativeElement.querySelector(
      '.shot-row .shot-asset-zone input[type="file"]',
    ) as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change'));
    expect(events).toHaveLength(1);
    expect(events[0][0].assetRef).toBe('first-shot.mp4');
  });

  it('Remove emits the array minus that shot', () => {
    const fixture = setup({ shots: SHOTS });
    const events: DraftShotItemContract[][] = [];
    fixture.componentInstance.shotsChange.subscribe((v) => events.push(v));
    fixture.componentInstance['onRemove']('s1');
    expect(events[0]).toEqual([SHOTS[1]]);
  });

  it('Move up swaps the previous-sibling order', () => {
    const fixture = setup({ shots: SHOTS });
    const events: DraftShotItemContract[][] = [];
    fixture.componentInstance.shotsChange.subscribe((v) => events.push(v));
    fixture.componentInstance['onMoveUp'](1);
    expect(events[0].map((s) => s.id)).toEqual(['s2', 's1']);
  });

  it('Move up at index 0 is a no-op', () => {
    const fixture = setup({ shots: SHOTS });
    const events: DraftShotItemContract[][] = [];
    fixture.componentInstance.shotsChange.subscribe((v) => events.push(v));
    fixture.componentInstance['onMoveUp'](0);
    expect(events).toEqual([]);
  });

  it('Move down swaps the next-sibling order', () => {
    const fixture = setup({ shots: SHOTS });
    const events: DraftShotItemContract[][] = [];
    fixture.componentInstance.shotsChange.subscribe((v) => events.push(v));
    fixture.componentInstance['onMoveDown'](0);
    expect(events[0].map((s) => s.id)).toEqual(['s2', 's1']);
  });

  it('Move down at last index is a no-op', () => {
    const fixture = setup({ shots: SHOTS });
    const events: DraftShotItemContract[][] = [];
    fixture.componentInstance.shotsChange.subscribe((v) => events.push(v));
    fixture.componentInstance['onMoveDown'](1);
    expect(events).toEqual([]);
  });

  it('Editing description / duration / type emits updated array', () => {
    const fixture = setup({ shots: SHOTS });
    const events: DraftShotItemContract[][] = [];
    fixture.componentInstance.shotsChange.subscribe((v) => events.push(v));
    const fakeEvent = (value: string) =>
      ({ target: { value } } as unknown as Event);
    fixture.componentInstance['onDescriptionChange']('s1', fakeEvent('new desc'));
    fixture.componentInstance['onDurationChange']('s1', fakeEvent('20s'));
    fixture.componentInstance['onTypeChange']('s1', fakeEvent('B-Roll'));
    expect(events[0][0].description).toBe('new desc');
    expect(events[1][0].duration).toBe('20s');
    expect(events[2][0].type).toBe('B-Roll');
  });

  it('all writes are no-ops when disabled', () => {
    const fixture = setup({ shots: SHOTS, disabled: true });
    const events: DraftShotItemContract[][] = [];
    fixture.componentInstance.shotsChange.subscribe((v) => events.push(v));
    fixture.componentInstance['onAddShot']();
    fixture.componentInstance['onRemove']('s1');
    fixture.componentInstance['onMoveUp'](1);
    fixture.componentInstance['onMoveDown'](0);
    expect(events).toEqual([]);
  });

  it('per-row type / description / duration edits + per-shot file + clear are no-ops when disabled', () => {
    const fixture = setup({ shots: SHOTS, disabled: true });
    const events: DraftShotItemContract[][] = [];
    fixture.componentInstance.shotsChange.subscribe((v) => events.push(v));
    const fakeEvent = (value: string) => ({ target: { value } } as unknown as Event);
    fixture.componentInstance['onTypeChange']('s1', fakeEvent('B-Roll'));
    fixture.componentInstance['onDescriptionChange']('s1', fakeEvent('x'));
    fixture.componentInstance['onDurationChange']('s1', fakeEvent('1s'));
    const file = new File(['x'], 'p.png', { type: 'image/png' });
    const fileEvt = { target: { files: [file] } } as unknown as Event;
    fixture.componentInstance['onShotFile']('s1', fileEvt);
    fixture.componentInstance['onShotAssetClear']('s1');
    expect(events).toEqual([]);
  });

  it('cover file / cover clear are no-ops when disabled', () => {
    const fixture = setup({ shots: SHOTS, coverAssetRef: 'c.png', disabled: true });
    const events: (string | undefined)[] = [];
    fixture.componentInstance.coverAssetRefChange.subscribe((v) => events.push(v));
    const file = new File(['x'], 'c.png', { type: 'image/png' });
    const fileEvt = { target: { files: [file] } } as unknown as Event;
    fixture.componentInstance['onCoverFile'](fileEvt);
    fixture.componentInstance['onCoverClear']();
    expect(events).toEqual([]);
  });

  it('onTypeChange ignores empty values (no-op when select is reset)', () => {
    const fixture = setup({ shots: SHOTS });
    const events: DraftShotItemContract[][] = [];
    fixture.componentInstance.shotsChange.subscribe((v) => events.push(v));
    const fakeEvent = { target: { value: '' } } as unknown as Event;
    fixture.componentInstance['onTypeChange']('s1', fakeEvent);
    expect(events).toEqual([]);
  });

  it('cover file with no selected file is a no-op', () => {
    const fixture = setup({ shots: [], coverAssetRef: undefined });
    const events: (string | undefined)[] = [];
    fixture.componentInstance.coverAssetRefChange.subscribe((v) => events.push(v));
    const fileEvt = { target: { files: [] } } as unknown as Event;
    fixture.componentInstance['onCoverFile'](fileEvt);
    expect(events).toEqual([]);
  });

  it('per-shot file with no selected file is a no-op', () => {
    const fixture = setup({ shots: SHOTS });
    const events: DraftShotItemContract[][] = [];
    fixture.componentInstance.shotsChange.subscribe((v) => events.push(v));
    const fileEvt = { target: { files: [] } } as unknown as Event;
    fixture.componentInstance['onShotFile']('s1', fileEvt);
    expect(events).toEqual([]);
  });

  it('per-shot asset clear emits with assetRef:undefined', () => {
    const seeded: DraftShotItemContract[] = [
      { id: 's1', type: 'Shot', description: 'first', duration: '5s', assetRef: 'cur.mp4' },
    ];
    const fixture = setup({ shots: seeded });
    const events: DraftShotItemContract[][] = [];
    fixture.componentInstance.shotsChange.subscribe((v) => events.push(v));
    fixture.componentInstance['onShotAssetClear']('s1');
    expect(events).toHaveLength(1);
    expect(events[0][0].assetRef).toBeUndefined();
  });

  it('AI generate appends generated shots after the delay', () => {
    vi.useFakeTimers();
    const fixture = setup({ shots: [] });
    const events: DraftShotItemContract[][] = [];
    fixture.componentInstance.shotsChange.subscribe((v) => events.push(v));
    fixture.componentInstance['onAiGenerate']();
    vi.advanceTimersByTime(900);
    expect(events).toHaveLength(1);
    expect(events[0].length).toBeGreaterThan(0);
    vi.useRealTimers();
  });

  it('AI generate is a no-op when disabled', () => {
    vi.useFakeTimers();
    const fixture = setup({ shots: [], disabled: true });
    const events: DraftShotItemContract[][] = [];
    fixture.componentInstance.shotsChange.subscribe((v) => events.push(v));
    fixture.componentInstance['onAiGenerate']();
    vi.advanceTimersByTime(900);
    expect(events).toEqual([]);
    vi.useRealTimers();
  });

  it('countLabel pluralizes for 3 shots', () => {
    const three: DraftShotItemContract[] = [
      { id: 's1', type: 'Shot', description: 'a', duration: '1s' },
      { id: 's2', type: 'Shot', description: 'b', duration: '1s' },
      { id: 's3', type: 'Shot', description: 'c', duration: '1s' },
    ];
    const fixture = setup({ shots: three });
    const list = fixture.nativeElement.querySelector('ul.shot-rows');
    expect(list.getAttribute('aria-label')).toBe('Shot list: 3 shots');
  });
});
