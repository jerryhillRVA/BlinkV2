import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { PackagingUtmContract } from '@blinksocial/contracts';
import { UtmBuilderComponent } from './utm-builder.component';

function setup(
  utm: PackagingUtmContract | undefined = undefined,
  disabled = false,
): ComponentFixture<UtmBuilderComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [UtmBuilderComponent] });
  const fixture = TestBed.createComponent(UtmBuilderComponent);
  fixture.componentRef.setInput('utm', utm);
  fixture.componentRef.setInput('disabled', disabled);
  fixture.detectChanges();
  return fixture;
}

describe('UtmBuilderComponent', () => {
  it('renders the details element closed by default', () => {
    const fixture = setup();
    const details = fixture.nativeElement.querySelector('details');
    expect(details).toBeTruthy();
    expect(details.open).toBe(false);
  });

  it('renders five labeled inputs each programmatically linked to its label', () => {
    const fixture = setup();
    const details = fixture.nativeElement.querySelector('details') as HTMLDetailsElement;
    details.open = true;
    fixture.detectChanges();

    const inputs = fixture.nativeElement.querySelectorAll('.utm-input');
    expect(inputs.length).toBe(5);

    const labels = fixture.nativeElement.querySelectorAll('.utm-label');
    expect(labels.length).toBe(5);
    expect(labels[0].getAttribute('for')).toBe('utm-source');
    expect(inputs[0].id).toBe('utm-source');
  });

  it('typing in the Source field emits a merged-and-patched utm contract', () => {
    const fixture = setup({ medium: 'social' });
    const emitted: PackagingUtmContract[] = [];
    fixture.componentInstance.utmChange.subscribe((v) => emitted.push(v));
    const details = fixture.nativeElement.querySelector('details') as HTMLDetailsElement;
    details.open = true;
    fixture.detectChanges();
    const sourceInput = fixture.nativeElement.querySelector('#utm-source') as HTMLInputElement;
    sourceInput.value = 'linkedin';
    sourceInput.dispatchEvent(new Event('input'));
    expect(emitted).toEqual([{ medium: 'social', source: 'linkedin' }]);
  });

  it('typing in every field emits the right partial update for each key', () => {
    const fixture = setup();
    const emitted: PackagingUtmContract[] = [];
    fixture.componentInstance.utmChange.subscribe((v) => emitted.push(v));
    const details = fixture.nativeElement.querySelector('details') as HTMLDetailsElement;
    details.open = true;
    fixture.detectChanges();
    for (const k of ['source', 'medium', 'campaign', 'content', 'term'] as const) {
      const input = fixture.nativeElement.querySelector(`#utm-${k}`) as HTMLInputElement;
      input.value = `val-${k}`;
      input.dispatchEvent(new Event('input'));
    }
    expect(emitted.length).toBe(5);
    expect(emitted[0]).toEqual({ source: 'val-source' });
    expect(emitted[4]).toEqual({ term: 'val-term' });
  });

  it('preview line composes from non-empty fields only', () => {
    const fixture = setup({ source: 'li', medium: '', campaign: 'launch' });
    const details = fixture.nativeElement.querySelector('details') as HTMLDetailsElement;
    details.open = true;
    fixture.detectChanges();
    const preview = fixture.nativeElement.querySelector('.utm-preview');
    expect(preview.textContent).toContain('Appended: ?utm_source=li&utm_campaign=launch');
    expect(preview.textContent).not.toContain('utm_medium');
  });

  it('preview line is hidden when no fields are populated', () => {
    const fixture = setup({});
    const details = fixture.nativeElement.querySelector('details') as HTMLDetailsElement;
    details.open = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.utm-preview')).toBeNull();
  });

  it('disabled state marks every input read-only and applies pointer-events:none', () => {
    const fixture = setup({}, true);
    const details = fixture.nativeElement.querySelector('details') as HTMLDetailsElement;
    details.open = true;
    fixture.detectChanges();
    const inputs = fixture.nativeElement.querySelectorAll('.utm-input');
    for (const input of inputs) {
      expect((input as HTMLInputElement).readOnly).toBe(true);
    }
    expect((fixture.nativeElement.querySelector('.utm-builder') as HTMLElement).classList.contains('is-disabled')).toBe(true);
  });

  it('disabled blocks any utmChange emission from onFieldInput', () => {
    const fixture = setup({}, true);
    let count = 0;
    fixture.componentInstance.utmChange.subscribe(() => count++);
    fixture.componentInstance['onFieldInput']('source', 'attempted');
    expect(count).toBe(0);
  });

  it('encodes special characters in the preview', () => {
    const fixture = setup({ source: 'li ig' });
    const details = fixture.nativeElement.querySelector('details') as HTMLDetailsElement;
    details.open = true;
    fixture.detectChanges();
    const preview = fixture.nativeElement.querySelector('.utm-preview');
    expect(preview.textContent).toContain('utm_source=li%20ig');
  });
});
