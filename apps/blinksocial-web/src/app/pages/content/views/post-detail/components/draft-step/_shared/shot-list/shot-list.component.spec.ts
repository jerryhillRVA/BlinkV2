import { TestBed } from '@angular/core/testing';
import type {
  DraftShotItemContract,
  DraftUploadedAssetContract,
} from '@blinksocial/contracts';
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

const POOL: DraftUploadedAssetContract[] = [
  { id: 'a1', filename: 'DolphinsVertical.mov', mimeType: 'video/quicktime' },
  { id: 'a2', filename: 'GusVertical.mov', mimeType: 'video/quicktime' },
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

  it('Add shot button appends a new empty row', () => {
    const fixture = setup({ shots: [] });
    const events: DraftShotItemContract[][] = [];
    fixture.componentInstance.shotsChange.subscribe((v) => events.push(v));
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

  // #139: cover-asset slot is gone. The shot-list no longer renders any
  // .asset-slot wrapper; uploads happen in the sibling <app-upload-assets>.
  it('#139: top-level cover-asset slot is removed in all input combinations', () => {
    const empty = setup({ shots: [], availableAssets: [] });
    expect(empty.nativeElement.querySelector('.asset-slot')).toBeNull();
    expect(empty.nativeElement.querySelector('.asset-empty')).toBeNull();

    const withShots = setup({ shots: SHOTS, availableAssets: POOL });
    expect(withShots.nativeElement.querySelector('.asset-slot')).toBeNull();
    expect(withShots.nativeElement.querySelector('.asset-empty')).toBeNull();
  });

  // #139: pool-from-shot picker (now built on <app-dropdown>).
  it('#139: row with no assetRef renders the picker with placeholder + one option per pool asset', () => {
    const fixture = setup({ shots: SHOTS, availableAssets: POOL });
    const pickers = fixture.nativeElement.querySelectorAll('.shot-asset-picker');
    expect(pickers.length).toBe(2);
    // Click to open the first picker, then count rendered options.
    const trigger = pickers[0].querySelector('.dropdown-trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    const options = pickers[0].querySelectorAll('.dropdown-option');
    expect(options.length).toBe(2);
    expect(options[0].textContent?.trim()).toContain('DolphinsVertical.mov');
    // Closed-state placeholder is the trigger's value text.
    expect(pickers[0].querySelector('.dropdown-value')?.textContent?.trim()).toBe(
      'Assign an asset…',
    );
  });

  it('#139: picker selection emits shotsChange with the selected asset id as assetRef', () => {
    const fixture = setup({ shots: SHOTS, availableAssets: POOL });
    const events: DraftShotItemContract[][] = [];
    fixture.componentInstance.shotsChange.subscribe((v) => events.push(v));
    fixture.componentInstance['onShotAssetPick']('s1', 'a1');
    expect(events).toHaveLength(1);
    expect(events[0][0].assetRef).toBe('a1');
  });

  it('#139: row with assetRef renders the chip (thumbnail + filename + clear), resolving via pool', () => {
    const seeded: DraftShotItemContract[] = [
      { id: 's1', type: 'Shot', description: 'first', duration: '5s', assetRef: 'a1' },
    ];
    const fixture = setup({ shots: seeded, availableAssets: POOL });
    // The picker on the assigned row is replaced by the chip.
    expect(fixture.nativeElement.querySelector('.shot-row .shot-asset-picker')).toBeNull();
    const chip = fixture.nativeElement.querySelector('.shot-row .asset-chip--sm');
    expect(chip).not.toBeNull();
    expect(chip.textContent).toContain('DolphinsVertical.mov');
    expect(chip.querySelector('.asset-chip-thumb')).not.toBeNull();
  });

  it('#139: chip × emits shotsChange with assetRef cleared', () => {
    const seeded: DraftShotItemContract[] = [
      { id: 's1', type: 'Shot', description: 'first', duration: '5s', assetRef: 'a1' },
    ];
    const fixture = setup({ shots: seeded, availableAssets: POOL });
    const events: DraftShotItemContract[][] = [];
    fixture.componentInstance.shotsChange.subscribe((v) => events.push(v));
    const btn = fixture.nativeElement.querySelector(
      '.shot-row .asset-chip-remove',
    ) as HTMLButtonElement;
    btn.click();
    expect(events).toHaveLength(1);
    expect(events[0][0].assetRef).toBeUndefined();
  });

  it('#139: pool-empty picker shows the disabled overlay + helper placeholder', () => {
    const fixture = setup({ shots: SHOTS, availableAssets: [] });
    const picker = fixture.nativeElement.querySelector(
      '.shot-row .shot-asset-picker',
    ) as HTMLElement;
    expect(picker.classList.contains('shot-asset-picker--disabled')).toBe(true);
    // Trigger renders the placeholder string.
    expect(picker.querySelector('.dropdown-value')?.textContent?.trim()).toBe(
      'Upload an asset first…',
    );
  });

  it('#139: same pool asset can be assigned to multiple shots (no filter)', () => {
    const seeded: DraftShotItemContract[] = [
      { id: 's1', type: 'Shot', description: 'first', duration: '5s', assetRef: 'a1' },
    ];
    const fixture = setup({ shots: [seeded[0], SHOTS[1]], availableAssets: POOL });
    // Shot 2 (no assetRef) renders a picker whose options include the asset
    // already assigned to shot 1.
    const picker = fixture.nativeElement.querySelectorAll('.shot-asset-picker')[0];
    const trigger = picker.querySelector('.dropdown-trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    const options = Array.from(picker.querySelectorAll('.dropdown-option'));
    expect(options.map((o) => (o as HTMLElement).textContent?.trim())).toEqual([
      'DolphinsVertical.mov',
      'GusVertical.mov',
    ]);
  });

  it('#139: chip falls back to the raw assetRef when the pool entry is missing', () => {
    const seeded: DraftShotItemContract[] = [
      { id: 's1', type: 'Shot', description: 'first', duration: '5s', assetRef: 'missing-id' },
    ];
    const fixture = setup({ shots: seeded, availableAssets: POOL });
    const chip = fixture.nativeElement.querySelector('.shot-row .asset-chip--sm');
    expect(chip.textContent).toContain('missing-id');
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

  it('per-row type / description / duration edits + picker + clear are no-ops when disabled', () => {
    const fixture = setup({ shots: SHOTS, availableAssets: POOL, disabled: true });
    const events: DraftShotItemContract[][] = [];
    fixture.componentInstance.shotsChange.subscribe((v) => events.push(v));
    const fakeEvent = (value: string) => ({ target: { value } } as unknown as Event);
    fixture.componentInstance['onTypeChange']('s1', fakeEvent('B-Roll'));
    fixture.componentInstance['onDescriptionChange']('s1', fakeEvent('x'));
    fixture.componentInstance['onDurationChange']('s1', fakeEvent('1s'));
    fixture.componentInstance['onShotAssetPick']('s1', 'a1');
    fixture.componentInstance['onShotAssetClear']('s1');
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

  it('per-shot picker called with empty value emits assetRef:undefined', () => {
    const fixture = setup({ shots: SHOTS, availableAssets: POOL });
    const events: DraftShotItemContract[][] = [];
    fixture.componentInstance.shotsChange.subscribe((v) => events.push(v));
    fixture.componentInstance['onShotAssetPick']('s1', '');
    expect(events).toHaveLength(1);
    expect(events[0][0].assetRef).toBeUndefined();
  });

  it('per-shot asset clear emits with assetRef:undefined', () => {
    const seeded: DraftShotItemContract[] = [
      { id: 's1', type: 'Shot', description: 'first', duration: '5s', assetRef: 'a1' },
    ];
    const fixture = setup({ shots: seeded, availableAssets: POOL });
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
