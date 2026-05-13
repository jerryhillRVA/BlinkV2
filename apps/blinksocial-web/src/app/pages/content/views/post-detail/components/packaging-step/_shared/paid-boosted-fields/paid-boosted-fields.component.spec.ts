import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaidBoostedFieldsComponent } from './paid-boosted-fields.component';

interface SetupOptions {
  campaignName?: string;
  destinationUrl?: string;
  legalApprover?: string;
  disabled?: boolean;
}

function setup(opts: SetupOptions = {}): ComponentFixture<PaidBoostedFieldsComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [PaidBoostedFieldsComponent] });
  const fixture = TestBed.createComponent(PaidBoostedFieldsComponent);
  fixture.componentRef.setInput('campaignName', opts.campaignName);
  fixture.componentRef.setInput('destinationUrl', opts.destinationUrl);
  fixture.componentRef.setInput('legalApprover', opts.legalApprover);
  fixture.componentRef.setInput('disabled', opts.disabled ?? false);
  fixture.detectChanges();
  return fixture;
}

describe('PaidBoostedFieldsComponent', () => {
  it('renders the three required fields with paid-styled inputs', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('#paid-campaign')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#paid-url')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#paid-approver')).not.toBeNull();
  });

  it('renders the amber header label "Paid / Boosted — required fields"', () => {
    const fixture = setup();
    const label = fixture.nativeElement.querySelector('.paid-header-label') as HTMLElement;
    expect(label?.textContent).toContain('Paid / Boosted');
    expect(label?.textContent).toContain('required fields');
  });

  it('declares role=group with a descriptive aria-label', () => {
    const fixture = setup();
    const root = fixture.nativeElement.querySelector('.paid-card');
    expect(root.getAttribute('role')).toBe('group');
    expect(root.getAttribute('aria-label')).toBe('Paid / Boosted required fields');
  });

  it('each label is programmatically linked to its input via for=id', () => {
    const fixture = setup();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('label[for="paid-campaign"]')).not.toBeNull();
    expect(root.querySelector('label[for="paid-url"]')).not.toBeNull();
    expect(root.querySelector('label[for="paid-approver"]')).not.toBeNull();
  });

  it('each input is announced as aria-required', () => {
    const fixture = setup();
    const inputs = fixture.nativeElement.querySelectorAll('.paid-input');
    inputs.forEach((i: HTMLInputElement) => expect(i.getAttribute('aria-required')).toBe('true'));
  });

  it('typing into Campaign Name emits campaignNameChange', () => {
    const fixture = setup({ campaignName: 'old' });
    const emitted: string[] = [];
    fixture.componentInstance.campaignNameChange.subscribe((v) => emitted.push(v));
    const input = fixture.nativeElement.querySelector('#paid-campaign') as HTMLInputElement;
    input.value = 'Spring Launch';
    input.dispatchEvent(new Event('input'));
    expect(emitted).toEqual(['Spring Launch']);
  });

  it('typing into Destination URL emits destinationUrlChange', () => {
    const fixture = setup();
    const emitted: string[] = [];
    fixture.componentInstance.destinationUrlChange.subscribe((v) => emitted.push(v));
    const input = fixture.nativeElement.querySelector('#paid-url') as HTMLInputElement;
    input.value = 'https://example.com';
    input.dispatchEvent(new Event('input'));
    expect(emitted).toEqual(['https://example.com']);
  });

  it('typing into Legal Approver emits legalApproverChange', () => {
    const fixture = setup();
    const emitted: string[] = [];
    fixture.componentInstance.legalApproverChange.subscribe((v) => emitted.push(v));
    const input = fixture.nativeElement.querySelector('#paid-approver') as HTMLInputElement;
    input.value = 'legal@example.com';
    input.dispatchEvent(new Event('input'));
    expect(emitted).toEqual(['legal@example.com']);
  });

  it('renders the existing value via the input attribute', () => {
    const fixture = setup({
      campaignName: 'Existing campaign',
      destinationUrl: 'https://existing.com',
      legalApprover: 'jane@example.com',
    });
    expect(
      (fixture.nativeElement.querySelector('#paid-campaign') as HTMLInputElement).value,
    ).toBe('Existing campaign');
    expect(
      (fixture.nativeElement.querySelector('#paid-url') as HTMLInputElement).value,
    ).toBe('https://existing.com');
    expect(
      (fixture.nativeElement.querySelector('#paid-approver') as HTMLInputElement).value,
    ).toBe('jane@example.com');
  });

  it('disabled state makes inputs read-only', () => {
    const fixture = setup({ disabled: true });
    const inputs = fixture.nativeElement.querySelectorAll('.paid-input');
    inputs.forEach((i: HTMLInputElement) => expect(i.readOnly).toBe(true));
  });

  // Branch-coverage tests for the `(target as input).value ?? ''` fallbacks
  // in onCampaignInput / onUrlInput / onApproverInput. A real DOM input
  // event will always carry a string `.value`, but the nullish-coalesce
  // path needs explicit exercise.

  it('onCampaignInput coalesces null .value to empty string', () => {
    const fixture = setup();
    const emitted: string[] = [];
    fixture.componentInstance.campaignNameChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onCampaignInput']({ target: { value: null } } as unknown as Event);
    expect(emitted).toEqual(['']);
  });

  it('onUrlInput coalesces null .value to empty string', () => {
    const fixture = setup();
    const emitted: string[] = [];
    fixture.componentInstance.destinationUrlChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onUrlInput']({ target: { value: null } } as unknown as Event);
    expect(emitted).toEqual(['']);
  });

  it('onApproverInput coalesces null .value to empty string', () => {
    const fixture = setup();
    const emitted: string[] = [];
    fixture.componentInstance.legalApproverChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onApproverInput']({ target: { value: null } } as unknown as Event);
    expect(emitted).toEqual(['']);
  });

  it('all four inputs default to undefined when not explicitly set (exercises signal-input default branch)', () => {
    // Build the component WITHOUT calling setInput, so the signal-input
    // defaults are reached for branch coverage on the input() declarations.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [PaidBoostedFieldsComponent] });
    const fixture = TestBed.createComponent(PaidBoostedFieldsComponent);
    fixture.detectChanges();
    // The textareas/inputs render with empty values via the `?? ''` template fallback.
    expect(
      (fixture.nativeElement.querySelector('#paid-campaign') as HTMLInputElement).value,
    ).toBe('');
    expect(
      (fixture.nativeElement.querySelector('#paid-url') as HTMLInputElement).value,
    ).toBe('');
    expect(
      (fixture.nativeElement.querySelector('#paid-approver') as HTMLInputElement).value,
    ).toBe('');
    // disabled defaults to false → inputs are NOT readOnly.
    fixture.nativeElement.querySelectorAll('.paid-input').forEach((i: HTMLInputElement) => {
      expect(i.readOnly).toBe(false);
    });
  });
});
