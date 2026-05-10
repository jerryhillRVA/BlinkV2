import { TestBed } from '@angular/core/testing';
import { PillGroupComponent, type PillOption } from './pill-group.component';

const OPTIONS: PillOption[] = [
  { value: '15s', label: '15s' },
  { value: '30s', label: '30s' },
  { value: '60s', label: '60s' },
];

function setup(props: Partial<PillGroupComponent> = {}) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [PillGroupComponent] });
  const fixture = TestBed.createComponent(PillGroupComponent);
  Object.assign(fixture.componentInstance, { options: OPTIONS, value: '60s', ...props });
  fixture.detectChanges();
  return fixture;
}

describe('PillGroupComponent', () => {
  it('renders one pill per option, with the active one marked aria-checked=true', () => {
    const fixture = setup();
    const pills = fixture.nativeElement.querySelectorAll('button.pill');
    expect(pills.length).toBe(3);
    expect(pills[2].getAttribute('aria-checked')).toBe('true');
    expect(pills[2].classList.contains('is-active')).toBe(true);
    expect(pills[0].getAttribute('aria-checked')).toBe('false');
  });

  it('uses radiogroup semantics with aria-label', () => {
    const fixture = setup({ ariaLabel: 'Target duration' });
    const group = fixture.nativeElement.querySelector('[role="radiogroup"]');
    expect(group.getAttribute('aria-label')).toBe('Target duration');
  });

  it('emits valueChange on click', () => {
    const fixture = setup();
    let emitted: string | null = null;
    fixture.componentInstance.valueChange.subscribe((v) => (emitted = v));
    const pills = fixture.nativeElement.querySelectorAll('button.pill');
    (pills[0] as HTMLButtonElement).click();
    expect(emitted).toBe('15s');
  });

  it('does not re-emit when clicking the active pill', () => {
    const fixture = setup();
    let count = 0;
    fixture.componentInstance.valueChange.subscribe(() => count++);
    const pills = fixture.nativeElement.querySelectorAll('button.pill');
    (pills[2] as HTMLButtonElement).click();
    expect(count).toBe(0);
  });

  it('Arrow Right on the focused radio moves selection to the next option', () => {
    const fixture = setup({ value: '30s' });
    let emitted: string | null = null;
    fixture.componentInstance.valueChange.subscribe((v) => (emitted = v));
    const active = fixture.nativeElement.querySelector(
      'button[aria-checked="true"]',
    ) as HTMLElement;
    active.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(emitted).toBe('60s');
  });

  it('Arrow Left wraps to last option from first', () => {
    const fixture = setup({ value: '15s' });
    let emitted: string | null = null;
    fixture.componentInstance.valueChange.subscribe((v) => (emitted = v));
    const active = fixture.nativeElement.querySelector(
      'button[aria-checked="true"]',
    ) as HTMLElement;
    active.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(emitted).toBe('60s');
  });

  it('disables all pills when disabled=true', () => {
    const fixture = setup({ disabled: true });
    const pills = fixture.nativeElement.querySelectorAll('button.pill');
    pills.forEach((p: HTMLButtonElement) => expect(p.disabled).toBe(true));
  });
});
