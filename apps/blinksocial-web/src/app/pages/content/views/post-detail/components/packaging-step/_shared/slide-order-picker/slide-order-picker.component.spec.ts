import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  SlideOrderPickerComponent,
  type SlideOrderItem,
} from './slide-order-picker.component';

const SLIDES: SlideOrderItem[] = [
  { id: 's1', headline: 'Alpha' },
  { id: 's2', headline: 'Bravo' },
  { id: 's3', headline: 'Charlie' },
];

interface SetupOptions {
  slides?: ReadonlyArray<SlideOrderItem>;
  order?: number[];
  disabled?: boolean;
}

function setup(opts: SetupOptions = {}): ComponentFixture<SlideOrderPickerComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [SlideOrderPickerComponent] });
  const fixture = TestBed.createComponent(SlideOrderPickerComponent);
  fixture.componentRef.setInput('slides', opts.slides ?? SLIDES);
  fixture.componentRef.setInput('order', opts.order ?? []);
  fixture.componentRef.setInput('disabled', opts.disabled ?? false);
  fixture.detectChanges();
  return fixture;
}

describe('SlideOrderPickerComponent', () => {
  it('renders one <li> per slide in identity order when no order is supplied', () => {
    const fixture = setup();
    const rows = fixture.nativeElement.querySelectorAll('.slide-row');
    expect(rows.length).toBe(3);
    expect(rows[0].querySelector('.slide-headline')?.textContent).toContain('Alpha');
    expect(rows[2].querySelector('.slide-headline')?.textContent).toContain('Charlie');
  });

  it('honors a passed-in order array', () => {
    const fixture = setup({ order: [2, 0, 1] });
    const rows = fixture.nativeElement.querySelectorAll('.slide-row');
    expect(rows[0].querySelector('.slide-headline')?.textContent).toContain('Charlie');
    expect(rows[1].querySelector('.slide-headline')?.textContent).toContain('Alpha');
  });

  it('Move Up swaps with previous and emits new order', () => {
    const fixture = setup();
    const emitted: number[][] = [];
    fixture.componentInstance.orderChange.subscribe((v) => emitted.push(v));
    const upButtons = fixture.nativeElement.querySelectorAll('[aria-label^="Move slide"][aria-label$=" up"]');
    (upButtons[1] as HTMLButtonElement).click();
    expect(emitted).toEqual([[1, 0, 2]]);
  });

  it('Move Down swaps with next and emits new order', () => {
    const fixture = setup();
    const emitted: number[][] = [];
    fixture.componentInstance.orderChange.subscribe((v) => emitted.push(v));
    const downButtons = fixture.nativeElement.querySelectorAll('[aria-label^="Move slide"][aria-label$=" down"]');
    (downButtons[0] as HTMLButtonElement).click();
    expect(emitted).toEqual([[1, 0, 2]]);
  });

  it('Move Up at position 0 is a no-op (button is disabled)', () => {
    const fixture = setup();
    const emitted: number[][] = [];
    fixture.componentInstance.orderChange.subscribe((v) => emitted.push(v));
    const upButtons = fixture.nativeElement.querySelectorAll('[aria-label^="Move slide"][aria-label$=" up"]');
    expect((upButtons[0] as HTMLButtonElement).disabled).toBe(true);
    fixture.componentInstance['onMoveUp'](0);
    expect(emitted).toEqual([]);
  });

  it('Move Down at last position is a no-op (button is disabled)', () => {
    const fixture = setup();
    const downButtons = fixture.nativeElement.querySelectorAll('[aria-label^="Move slide"][aria-label$=" down"]');
    expect((downButtons[2] as HTMLButtonElement).disabled).toBe(true);
    const emitted: number[][] = [];
    fixture.componentInstance.orderChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onMoveDown'](2);
    expect(emitted).toEqual([]);
  });

  it('each <li> carries an aria-label of "Slide N of M"', () => {
    const fixture = setup();
    const rows = fixture.nativeElement.querySelectorAll('.slide-row');
    expect(rows[0].getAttribute('aria-label')).toBe('Slide 1 of 3');
    expect(rows[2].getAttribute('aria-label')).toBe('Slide 3 of 3');
  });

  it('uses <ol role="list">', () => {
    const fixture = setup();
    const list = fixture.nativeElement.querySelector('ol');
    expect(list.getAttribute('role')).toBe('list');
  });

  it('disabled disables every move button', () => {
    const fixture = setup({ disabled: true });
    const buttons = fixture.nativeElement.querySelectorAll('.move-btn');
    for (const b of buttons) {
      expect((b as HTMLButtonElement).disabled).toBe(true);
    }
  });

  it('disabled blocks emission from move handlers', () => {
    const fixture = setup({ disabled: true });
    const emitted: number[][] = [];
    fixture.componentInstance.orderChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onMoveUp'](1);
    fixture.componentInstance['onMoveDown'](0);
    expect(emitted).toEqual([]);
  });

  it('renders the first character of the headline as the thumbnail', () => {
    const fixture = setup({ slides: [{ id: 'x', headline: 'eclipse' }] });
    const initial = fixture.nativeElement.querySelector('.thumb-initial');
    expect(initial.textContent).toContain('E');
  });

  it('handles an empty-headline slide gracefully', () => {
    const fixture = setup({ slides: [{ id: 'x', headline: '   ' }] });
    const initial = fixture.nativeElement.querySelector('.thumb-initial');
    expect(initial.textContent).toContain('?');
  });

  it('renders nothing when slides is empty (covers empty-resolvedOrder branch)', () => {
    const fixture = setup({ slides: [], order: [] });
    expect(fixture.nativeElement.querySelectorAll('.slide-row').length).toBe(0);
  });

  it('resolvedOrder falls back to identity when order is empty', () => {
    const fixture = setup({ order: [] });
    expect(fixture.componentInstance['resolvedOrder']()).toEqual([0, 1, 2]);
  });
});
