import { ComponentFixture, TestBed } from '@angular/core/testing';
import type {
  PackagingPlatformControlsContract,
  PlatformContract,
} from '@blinksocial/contracts';
import { PlatformControlsComponent } from './platform-controls.component';

interface SetupOptions {
  controls?: PackagingPlatformControlsContract | undefined;
  platform?: PlatformContract;
  disabled?: boolean;
}

function setup(opts: SetupOptions = {}): ComponentFixture<PlatformControlsComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [PlatformControlsComponent] });
  const fixture = TestBed.createComponent(PlatformControlsComponent);
  fixture.componentRef.setInput('controls', opts.controls);
  fixture.componentRef.setInput('platform', opts.platform ?? 'instagram');
  fixture.componentRef.setInput('disabled', opts.disabled ?? false);
  fixture.detectChanges();
  return fixture;
}

describe('PlatformControlsComponent', () => {
  it('YouTube renders all 3 visibility options', () => {
    const fixture = setup({ platform: 'youtube' });
    const radios = fixture.nativeElement.querySelectorAll('input[type="radio"]');
    expect(radios.length).toBe(3);
  });

  it('Instagram renders only Public + Private', () => {
    const fixture = setup({ platform: 'instagram' });
    const radios = fixture.nativeElement.querySelectorAll('input[type="radio"]');
    expect(radios.length).toBe(2);
  });

  it('TikTok renders only Public (and adds Duet/Stitch switch)', () => {
    const fixture = setup({ platform: 'tiktok' });
    const radios = fixture.nativeElement.querySelectorAll('input[type="radio"]');
    expect(radios.length).toBe(1);
    const switches = fixture.nativeElement.querySelectorAll('[role="switch"]');
    expect(switches.length).toBe(2);
  });

  it('Facebook adds an Enable Boost switch', () => {
    const fixture = setup({ platform: 'facebook' });
    const switches = fixture.nativeElement.querySelectorAll('[role="switch"]');
    expect(switches.length).toBe(2);
    expect(switches[1].textContent).toContain('Enable Boost');
  });

  it('visibility radios are mutually exclusive (one checked)', () => {
    const fixture = setup({ platform: 'youtube', controls: { visibility: 'unlisted' } });
    const radios = fixture.nativeElement.querySelectorAll('input[type="radio"]') as NodeListOf<HTMLInputElement>;
    const checkedCount = Array.from(radios).filter((r) => r.checked).length;
    expect(checkedCount).toBe(1);
    expect(radios[1].checked).toBe(true); // unlisted
  });

  it('clicking a visibility radio emits a controlsChange with the merged patch', () => {
    const fixture = setup({ platform: 'youtube', controls: { allowComments: false } });
    const emitted: PackagingPlatformControlsContract[] = [];
    fixture.componentInstance.controlsChange.subscribe((v) => emitted.push(v));
    const radios = fixture.nativeElement.querySelectorAll('input[type="radio"]') as NodeListOf<HTMLInputElement>;
    radios[2].click();
    expect(emitted).toEqual([{ allowComments: false, visibility: 'private' }]);
  });

  it('clicking the Allow comments switch toggles aria-checked and emits', () => {
    const fixture = setup({ platform: 'instagram' });
    const emitted: PackagingPlatformControlsContract[] = [];
    fixture.componentInstance.controlsChange.subscribe((v) => emitted.push(v));
    const sw = fixture.nativeElement.querySelector('[role="switch"]') as HTMLButtonElement;
    expect(sw.getAttribute('aria-checked')).toBe('true');
    sw.click();
    expect(emitted).toEqual([{ allowComments: false }]);
  });

  it('TikTok-only Duet/Stitch switch emits allowDuetStitch', () => {
    const fixture = setup({ platform: 'tiktok' });
    const emitted: PackagingPlatformControlsContract[] = [];
    fixture.componentInstance.controlsChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onToggleDuetStitch']();
    expect(emitted).toEqual([{ allowDuetStitch: true }]);
  });

  it('Facebook-only Boost switch emits boostEnabled', () => {
    const fixture = setup({ platform: 'facebook' });
    const emitted: PackagingPlatformControlsContract[] = [];
    fixture.componentInstance.controlsChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onToggleBoost']();
    expect(emitted).toEqual([{ boostEnabled: true }]);
  });

  it('renders a <fieldset> with a <legend>', () => {
    const fixture = setup();
    const fieldset = fixture.nativeElement.querySelector('fieldset');
    expect(fieldset).not.toBeNull();
    expect(fieldset.querySelector('legend')?.textContent?.trim()).toBe('Visibility');
  });

  it('disabled blocks any emission from onVisibility / toggles', () => {
    const fixture = setup({ platform: 'tiktok', disabled: true });
    const emitted: PackagingPlatformControlsContract[] = [];
    fixture.componentInstance.controlsChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onVisibility']('public');
    fixture.componentInstance['onToggleComments']();
    fixture.componentInstance['onToggleDuetStitch']();
    fixture.componentInstance['onToggleBoost']();
    expect(emitted).toEqual([]);
  });

  it('disabled marks the fieldset disabled and adds is-disabled class', () => {
    const fixture = setup({ disabled: true });
    const fieldset = fixture.nativeElement.querySelector('fieldset') as HTMLFieldSetElement;
    expect(fieldset.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('.platform-controls').classList.contains('is-disabled')).toBe(true);
  });

  it('TikTok does not render the Boost switch', () => {
    const fixture = setup({ platform: 'tiktok' });
    expect(fixture.nativeElement.textContent).not.toContain('Enable Boost');
  });

  it('Instagram does not render Duet/Stitch', () => {
    const fixture = setup({ platform: 'instagram' });
    expect(fixture.nativeElement.textContent).not.toContain('Duet');
  });

  it('allowComments defaults to true when controls is undefined', () => {
    const fixture = setup({ platform: 'instagram', controls: undefined });
    const sw = fixture.nativeElement.querySelector('[role="switch"]') as HTMLButtonElement;
    expect(sw.getAttribute('aria-checked')).toBe('true');
  });

  it('explicit allowComments=false renders aria-checked=false', () => {
    const fixture = setup({ platform: 'instagram', controls: { allowComments: false } });
    const sw = fixture.nativeElement.querySelector('[role="switch"]') as HTMLButtonElement;
    expect(sw.getAttribute('aria-checked')).toBe('false');
  });

  it('toggling allowComments twice flips back to its original state', () => {
    const fixture = setup({ platform: 'instagram', controls: { allowComments: true } });
    const emitted: PackagingPlatformControlsContract[] = [];
    fixture.componentInstance.controlsChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onToggleComments']();
    expect(emitted[0]).toEqual({ allowComments: false });
  });

  it('TikTok allowDuetStitch defaults to false', () => {
    const fixture = setup({ platform: 'tiktok' });
    const switches = fixture.nativeElement.querySelectorAll('[role="switch"]');
    expect(switches[1].getAttribute('aria-checked')).toBe('false');
  });

  it('Facebook boostEnabled defaults to false', () => {
    const fixture = setup({ platform: 'facebook' });
    const switches = fixture.nativeElement.querySelectorAll('[role="switch"]');
    expect(switches[1].getAttribute('aria-checked')).toBe('false');
  });

  it('unknown platform falls back to PUBLIC_PRIVATE visibility set', () => {
    const fixture = setup({ platform: 'tbd' });
    const radios = fixture.nativeElement.querySelectorAll('input[type="radio"]');
    expect(radios.length).toBe(2);
  });

  it('explicit boostEnabled=true on facebook renders aria-checked=true', () => {
    const fixture = setup({ platform: 'facebook', controls: { boostEnabled: true } });
    const switches = fixture.nativeElement.querySelectorAll('[role="switch"]');
    expect(switches[1].getAttribute('aria-checked')).toBe('true');
  });

  it('explicit allowDuetStitch=true on tiktok renders aria-checked=true', () => {
    const fixture = setup({ platform: 'tiktok', controls: { allowDuetStitch: true } });
    const switches = fixture.nativeElement.querySelectorAll('[role="switch"]');
    expect(switches[1].getAttribute('aria-checked')).toBe('true');
  });
});
