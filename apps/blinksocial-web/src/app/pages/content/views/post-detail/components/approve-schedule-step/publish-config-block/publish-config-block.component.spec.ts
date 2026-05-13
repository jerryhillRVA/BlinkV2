import { ComponentFixture, TestBed } from '@angular/core/testing';
import type {
  ContentTypeContract,
  PublishActionContract,
  PublishConfigContract,
} from '@blinksocial/contracts';
import {
  ConnectedAccountOption,
  PublishConfigBlockComponent,
} from './publish-config-block.component';

interface SetupInputs {
  publishConfig?: PublishConfigContract;
  contentType?: ContentTypeContract | null;
  isVideoLong?: boolean;
  connectedAccounts?: ReadonlyArray<ConnectedAccountOption>;
}

function setup(
  inputs: SetupInputs = {},
): ComponentFixture<PublishConfigBlockComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [PublishConfigBlockComponent],
  });
  const fixture = TestBed.createComponent(PublishConfigBlockComponent);
  fixture.componentRef.setInput(
    'publishConfig',
    inputs.publishConfig ?? ({ publishAction: 'save-draft', deliveryMethod: 'auto' } as PublishConfigContract),
  );
  if (inputs.contentType !== undefined) {
    fixture.componentRef.setInput('contentType', inputs.contentType);
  }
  if (inputs.isVideoLong !== undefined) {
    fixture.componentRef.setInput('isVideoLong', inputs.isVideoLong);
  }
  if (inputs.connectedAccounts !== undefined) {
    fixture.componentRef.setInput('connectedAccounts', inputs.connectedAccounts);
  }
  fixture.detectChanges();
  return fixture;
}

describe('PublishConfigBlockComponent', () => {
  it('renders the four publish-action pills with Save Draft selected by default', () => {
    const fixture = setup();
    const pills = fixture.nativeElement.querySelectorAll('.pill-row [role="radio"]');
    expect(pills.length).toBeGreaterThanOrEqual(4);
    const selected = fixture.nativeElement.querySelector('.pill.pill--selected');
    expect(selected?.textContent?.trim()).toContain('Save Draft');
  });

  it('emits publishAction patch when a pill is clicked', () => {
    const fixture = setup();
    const emitted: Array<Partial<PublishConfigContract>> = [];
    fixture.componentInstance.configChange.subscribe((p) => emitted.push(p));
    const pills = Array.from(
      fixture.nativeElement.querySelectorAll('.pill-row [role="radio"]'),
    ) as HTMLButtonElement[];
    const schedulePill = pills.find((p) => p.textContent?.includes('Schedule'));
    expect(schedulePill).toBeTruthy();
    schedulePill?.click();
    expect(emitted).toEqual([{ publishAction: 'schedule' }]);
  });

  it('shows the datetime input only when publishAction === schedule', () => {
    const drafted = setup({ publishConfig: { publishAction: 'save-draft' as PublishActionContract } });
    expect(drafted.nativeElement.querySelector('#schedule-at-input')).toBeNull();

    const scheduled = setup({ publishConfig: { publishAction: 'schedule' as PublishActionContract } });
    expect(scheduled.nativeElement.querySelector('#schedule-at-input')).not.toBeNull();
  });

  it('renders the "Must be a future date/time" error when scheduleAt is in the past', () => {
    const past = new Date(Date.now() - 86400000).toISOString().slice(0, 16);
    const fixture = setup({
      publishConfig: { publishAction: 'schedule', scheduleAt: past },
    });
    const err = fixture.nativeElement.querySelector('.field-error');
    expect(err?.textContent).toContain('Must be a future date/time');
  });

  it('does NOT render the past-date error when scheduleAt is in the future', () => {
    const future = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
    const fixture = setup({
      publishConfig: { publishAction: 'schedule', scheduleAt: future },
    });
    expect(fixture.nativeElement.querySelector('.field-error')).toBeNull();
  });

  it('emits scheduleAt patch on datetime input', () => {
    const fixture = setup({
      publishConfig: { publishAction: 'schedule' },
    });
    const emitted: Array<Partial<PublishConfigContract>> = [];
    fixture.componentInstance.configChange.subscribe((p) => emitted.push(p));
    const input = fixture.nativeElement.querySelector(
      '#schedule-at-input',
    ) as HTMLInputElement;
    input.value = '2099-01-01T10:00';
    input.dispatchEvent(new Event('input'));
    expect(emitted).toEqual([{ scheduleAt: '2099-01-01T10:00' }]);
  });

  it('does NOT render visibility or Made for Kids when isVideoLong is false', () => {
    const fixture = setup({ isVideoLong: false });
    expect(fixture.nativeElement.querySelector('#visibility-select')).toBeNull();
    expect(fixture.nativeElement.querySelector('.switch-row')).toBeNull();
  });

  it('renders visibility selector and Made for Kids switch when isVideoLong is true', () => {
    const fixture = setup({ isVideoLong: true });
    expect(fixture.nativeElement.querySelector('#visibility-select')).not.toBeNull();
    const switchRows = fixture.nativeElement.querySelectorAll('.switch-row');
    expect(switchRows.length).toBeGreaterThanOrEqual(1);
  });

  it('emits visibility patch when select changes', () => {
    const fixture = setup({ isVideoLong: true });
    const emitted: Array<Partial<PublishConfigContract>> = [];
    fixture.componentInstance.configChange.subscribe((p) => emitted.push(p));
    const select = fixture.nativeElement.querySelector(
      '#visibility-select',
    ) as HTMLSelectElement;
    select.value = 'unlisted';
    select.dispatchEvent(new Event('change'));
    expect(emitted).toEqual([{ visibility: 'unlisted' }]);
  });

  it('emits madeForKids patch when toggle changes', () => {
    const fixture = setup({ isVideoLong: true });
    const emitted: Array<Partial<PublishConfigContract>> = [];
    fixture.componentInstance.configChange.subscribe((p) => emitted.push(p));
    const toggle = fixture.nativeElement.querySelector(
      '.switch input',
    ) as HTMLInputElement;
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));
    expect(emitted).toEqual([{ madeForKids: true }]);
  });

  it('renders the empty-state workspace-settings prompt when no accounts are connected', () => {
    const fixture = setup({ connectedAccounts: [] });
    expect(fixture.nativeElement.querySelector('.empty-state')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'No accounts connected for this platform.',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Connect one in Workspace Settings → Accounts.',
    );
    expect(fixture.nativeElement.querySelector('#account-select')).toBeNull();
  });

  it('renders a connected-account selector when accounts are provided', () => {
    const fixture = setup({
      connectedAccounts: [{ id: 'a1', handle: '@studio' }],
    });
    const select = fixture.nativeElement.querySelector(
      '#account-select',
    ) as HTMLSelectElement;
    expect(select).not.toBeNull();
    expect(select.textContent).toContain('@studio');
  });

  it('emits accountId patch when an account is selected', () => {
    const fixture = setup({
      connectedAccounts: [{ id: 'a1', handle: '@studio' }],
    });
    const emitted: Array<Partial<PublishConfigContract>> = [];
    fixture.componentInstance.configChange.subscribe((p) => emitted.push(p));
    const select = fixture.nativeElement.querySelector(
      '#account-select',
    ) as HTMLSelectElement;
    select.value = 'a1';
    select.dispatchEvent(new Event('change'));
    expect(emitted).toEqual([{ accountId: 'a1' }]);
  });

  it('emits deliveryMethod patch when a delivery pill is clicked', () => {
    const fixture = setup();
    const emitted: Array<Partial<PublishConfigContract>> = [];
    fixture.componentInstance.configChange.subscribe((p) => emitted.push(p));
    const pills = Array.from(
      fixture.nativeElement.querySelectorAll('.pill-row [role="radio"]'),
    ) as HTMLButtonElement[];
    const manual = pills.find((p) => p.textContent?.includes('Notify me'));
    manual?.click();
    expect(emitted).toEqual([{ deliveryMethod: 'manual' }]);
  });

  it('emits notifyTeam patch when the checkbox toggles', () => {
    const fixture = setup();
    const emitted: Array<Partial<PublishConfigContract>> = [];
    fixture.componentInstance.configChange.subscribe((p) => emitted.push(p));
    const cb = fixture.nativeElement.querySelector(
      '#notify-team-input',
    ) as HTMLInputElement;
    cb.checked = true;
    cb.dispatchEvent(new Event('change'));
    expect(emitted).toEqual([{ notifyTeam: true }]);
  });

  it('renders the live notify-followers switch only for live content types', () => {
    const reel = setup({ contentType: 'reel' });
    // Reel + no isVideoLong → no switch rows at all.
    expect(reel.nativeElement.querySelectorAll('.switch-row').length).toBe(0);

    const live = setup({ contentType: 'live' });
    expect(live.nativeElement.querySelectorAll('.switch-row').length).toBe(1);
    expect(live.nativeElement.textContent).toContain(
      'Notify followers when stream starts',
    );
  });

  it('emits notifyFollowers patch when the live switch toggles', () => {
    const fixture = setup({ contentType: 'live' });
    const emitted: Array<Partial<PublishConfigContract>> = [];
    fixture.componentInstance.configChange.subscribe((p) => emitted.push(p));
    const toggle = fixture.nativeElement.querySelector(
      '.switch input',
    ) as HTMLInputElement;
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));
    expect(emitted).toEqual([{ notifyFollowers: true }]);
  });
});
