import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduledDateCardComponent } from './scheduled-date-card.component';

function setup(
  opts: { scheduledAt?: string | null; disabled?: boolean } = {},
): ComponentFixture<ScheduledDateCardComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [ScheduledDateCardComponent] });
  const fixture = TestBed.createComponent(ScheduledDateCardComponent);
  if (opts.scheduledAt !== undefined) {
    fixture.componentRef.setInput('scheduledAt', opts.scheduledAt);
  }
  if (opts.disabled !== undefined) {
    fixture.componentRef.setInput('disabled', opts.disabled);
  }
  fixture.detectChanges();
  return fixture;
}

describe('ScheduledDateCardComponent', () => {
  it('renders the formatted scheduledAt + Pencil affordance', () => {
    const fixture = setup({ scheduledAt: '2099-01-15T15:30:00.000Z' });
    expect(fixture.nativeElement.querySelector('.sd-date-text')?.textContent).toMatch(
      /2099|Jan|15/,
    );
    expect(fixture.nativeElement.querySelector('.sd-edit-btn')).not.toBeNull();
  });

  it('renders "No date set" when scheduledAt is missing or invalid', () => {
    const fixtureA = setup({ scheduledAt: null });
    expect(fixtureA.nativeElement.querySelector('.sd-date-text')?.textContent?.trim()).toBe(
      'No date set',
    );
    const fixtureB = setup({ scheduledAt: 'not-a-date' });
    expect(fixtureB.nativeElement.querySelector('.sd-date-text')?.textContent?.trim()).toBe(
      'No date set',
    );
  });

  it('opens the popover when the Pencil button is clicked', () => {
    const fixture = setup({ scheduledAt: '2099-01-15T15:30:00.000Z' });
    expect(fixture.nativeElement.querySelector('.sd-popover')).toBeNull();
    (fixture.nativeElement.querySelector('.sd-edit-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    const popover = fixture.nativeElement.querySelector('.sd-popover') as HTMLElement;
    expect(popover).not.toBeNull();
    expect(popover.getAttribute('role')).toBe('dialog');
    expect(popover.getAttribute('aria-modal')).toBe('true');
  });

  it('pre-fills the input with the current scheduledAt sliced to YYYY-MM-DDTHH:mm', () => {
    const fixture = setup({ scheduledAt: '2099-01-15T15:30:00.000Z' });
    (fixture.nativeElement.querySelector('.sd-edit-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('.sd-popover-input') as HTMLInputElement;
    expect(input.value).toBe('2099-01-15T15:30');
  });

  it('Save emits scheduledAtChange with the edited value', () => {
    const fixture = setup({ scheduledAt: '2099-01-15T15:30:00.000Z' });
    let emitted: string | undefined;
    fixture.componentInstance.scheduledAtChange.subscribe((v) => (emitted = v));
    (fixture.nativeElement.querySelector('.sd-edit-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('.sd-popover-input') as HTMLInputElement;
    input.value = '2099-02-01T10:00';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const saveBtn = fixture.nativeElement.querySelector('.sd-btn--primary') as HTMLButtonElement;
    saveBtn.click();
    expect(emitted).toBe('2099-02-01T10:00');
  });

  it('Cancel closes the popover without emitting', () => {
    const fixture = setup({ scheduledAt: '2099-01-15T15:30:00.000Z' });
    let emitted = false;
    fixture.componentInstance.scheduledAtChange.subscribe(() => (emitted = true));
    (fixture.nativeElement.querySelector('.sd-edit-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.sd-btn--secondary') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sd-popover')).toBeNull();
    expect(emitted).toBe(false);
  });

  it('ESC closes the popover without emitting', () => {
    const fixture = setup({ scheduledAt: '2099-01-15T15:30:00.000Z' });
    let emitted = false;
    fixture.componentInstance.scheduledAtChange.subscribe(() => (emitted = true));
    (fixture.nativeElement.querySelector('.sd-edit-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    fixture.componentInstance['onEscape']();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sd-popover')).toBeNull();
    expect(emitted).toBe(false);
  });

  it('disabled state hides the affordance behavior', () => {
    const fixture = setup({ scheduledAt: '2099-01-15T15:30:00.000Z', disabled: true });
    const btn = fixture.nativeElement.querySelector('.sd-edit-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    btn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sd-popover')).toBeNull();
  });
});
