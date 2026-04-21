import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InlineEditComponent } from './inline-edit.component';

function setup(
  inputs: Partial<{
    value: string;
    multiline: boolean;
    placeholder: string;
    readOnly: boolean;
  }> = {},
): ComponentFixture<InlineEditComponent> {
  TestBed.configureTestingModule({ imports: [InlineEditComponent] });
  const fixture = TestBed.createComponent(InlineEditComponent);
  fixture.componentRef.setInput('value', inputs.value ?? '');
  fixture.componentRef.setInput('multiline', inputs.multiline ?? false);
  fixture.componentRef.setInput('placeholder', inputs.placeholder ?? '');
  fixture.componentRef.setInput('readOnly', inputs.readOnly ?? false);
  fixture.detectChanges();
  return fixture;
}

describe('InlineEditComponent — display mode', () => {
  it('renders the value as a display button when not editing', () => {
    const fixture = setup({ value: 'Hello' });
    const display: HTMLButtonElement = fixture.nativeElement.querySelector('.inline-edit-display');
    expect(display).not.toBeNull();
    expect(display.textContent).toContain('Hello');
    expect(fixture.nativeElement.querySelector('.inline-edit-input')).toBeNull();
  });

  it('renders placeholder with is-placeholder class when value is empty', () => {
    const fixture = setup({ value: '', placeholder: 'Add a title' });
    const display: HTMLButtonElement = fixture.nativeElement.querySelector('.inline-edit-display');
    expect(display.classList.contains('is-placeholder')).toBe(true);
    expect(display.textContent).toContain('Add a title');
  });

  it('clicking the display enters edit mode and renders an input', async () => {
    const fixture = setup({ value: 'Hello' });
    const display: HTMLButtonElement = fixture.nativeElement.querySelector('.inline-edit-display');
    display.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input.inline-edit-input');
    expect(input).not.toBeNull();
    expect(input.value).toBe('Hello');
  });

  it('does not enter edit mode when readOnly is set', () => {
    const fixture = setup({ value: 'Hello', readOnly: true });
    const display: HTMLButtonElement = fixture.nativeElement.querySelector('.inline-edit-display');
    display.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input.inline-edit-input')).toBeNull();
    expect(display.classList.contains('is-readonly')).toBe(true);
  });

  it('multiline mode renders a textarea when editing', () => {
    const fixture = setup({ value: 'line1\nline2', multiline: true });
    (fixture.nativeElement.querySelector('.inline-edit-display') as HTMLButtonElement).click();
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector('textarea.inline-edit-input');
    expect(textarea).not.toBeNull();
  });
});

describe('InlineEditComponent — editing behaviour', () => {
  it('commits on blur and emits trimmed value when changed', () => {
    const fixture = setup({ value: 'Old' });
    const emitted: string[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    (fixture.nativeElement.querySelector('.inline-edit-display') as HTMLButtonElement).click();
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input.inline-edit-input');
    input.value = '  New title  ';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(emitted).toEqual(['New title']);
    // Returns to display mode
    expect(fixture.nativeElement.querySelector('input.inline-edit-input')).toBeNull();
  });

  it('does not emit when value is unchanged', () => {
    const fixture = setup({ value: 'Same' });
    const emitted: string[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    (fixture.nativeElement.querySelector('.inline-edit-display') as HTMLButtonElement).click();
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input.inline-edit-input');
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(emitted).toEqual([]);
  });

  it('Escape reverts the draft and exits edit mode without emitting', () => {
    const fixture = setup({ value: 'Original' });
    const emitted: string[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    (fixture.nativeElement.querySelector('.inline-edit-display') as HTMLButtonElement).click();
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input.inline-edit-input');
    input.value = 'Typed but cancelled';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(emitted).toEqual([]);
    expect(fixture.nativeElement.querySelector('input.inline-edit-input')).toBeNull();
  });

  it('Enter commits in single-line mode', () => {
    const fixture = setup({ value: 'Old' });
    const emitted: string[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    (fixture.nativeElement.querySelector('.inline-edit-display') as HTMLButtonElement).click();
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input.inline-edit-input');
    input.value = 'Enter-committed';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(emitted).toEqual(['Enter-committed']);
  });

  it('Enter does not commit in multiline mode (allows newlines)', () => {
    const fixture = setup({ value: 'Old', multiline: true });
    const emitted: string[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    (fixture.nativeElement.querySelector('.inline-edit-display') as HTMLButtonElement).click();
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector('textarea.inline-edit-input') as HTMLTextAreaElement;
    textarea.value = 'line1\nline2';
    textarea.dispatchEvent(new Event('input'));
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(emitted).toEqual([]);
    // Still in edit mode
    expect(fixture.nativeElement.querySelector('textarea.inline-edit-input')).not.toBeNull();
  });

  it('multiline mode preserves leading/trailing whitespace on commit', () => {
    const fixture = setup({ value: '', multiline: true });
    const emitted: string[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    (fixture.nativeElement.querySelector('.inline-edit-display') as HTMLButtonElement).click();
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector('textarea.inline-edit-input') as HTMLTextAreaElement;
    textarea.value = '  line1\nline2  ';
    textarea.dispatchEvent(new Event('input'));
    textarea.dispatchEvent(new Event('blur'));
    expect(emitted).toEqual(['  line1\nline2  ']);
  });
});
