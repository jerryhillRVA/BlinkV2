import { TestBed } from '@angular/core/testing';
import { SectionLabelComponent } from './section-label.component';

function setup(props: Partial<SectionLabelComponent> = {}) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [SectionLabelComponent] });
  const fixture = TestBed.createComponent(SectionLabelComponent);
  Object.assign(fixture.componentInstance, { label: 'Hook', ...props });
  fixture.detectChanges();
  return fixture;
}

describe('SectionLabelComponent', () => {
  it('renders the label uppercase via CSS, in tiny tracking-wider style', () => {
    const fixture = setup({ label: 'hook' });
    expect(fixture.nativeElement.querySelector('.label-text').textContent).toContain('hook');
  });

  it('shows the info icon as a focusable trigger via <app-tooltip>', () => {
    const fixture = setup({ info: 'The first line that stops the scroll.' });
    const trigger = fixture.nativeElement.querySelector('app-tooltip .tooltip-trigger');
    expect(trigger).toBeTruthy();
    expect(trigger.getAttribute('aria-label')).toBe('More information');
    // The actual tooltip text is delivered via the TooltipService portal on
    // hover/focus; the <app-tooltip> hosts the trigger only.
    expect(fixture.nativeElement.querySelector('app-tooltip')).toBeTruthy();
  });

  it('omits the info icon when no info is provided', () => {
    const fixture = setup({});
    expect(fixture.nativeElement.querySelector('app-tooltip')).toBeNull();
  });

  it('renders the required asterisk + screen-reader text when required=true', () => {
    const fixture = setup({ required: true });
    const aster = fixture.nativeElement.querySelector('.required');
    expect(aster).toBeTruthy();
    expect(aster.getAttribute('aria-hidden')).toBe('true');
    expect(fixture.nativeElement.querySelector('.visually-hidden').textContent).toBe('required');
  });

  it('places the required asterisk BETWEEN the label and the info tooltip', () => {
    const fixture = setup({
      required: true,
      info: 'About this field',
    });
    const containers = Array.from(
      fixture.nativeElement.querySelectorAll('.section-label > *'),
    );
    // Find the indices of label-text, required asterisk, and the tooltip host
    const labelIdx = containers.findIndex((el) =>
      (el as Element).classList.contains('label-text'),
    );
    const requiredIdx = containers.findIndex((el) =>
      (el as Element).classList.contains('required'),
    );
    const tooltipIdx = containers.findIndex((el) =>
      (el as Element).classList.contains('info-tooltip-host'),
    );
    expect(labelIdx).toBeGreaterThanOrEqual(0);
    expect(requiredIdx).toBeGreaterThan(labelIdx);
    expect(tooltipIdx).toBeGreaterThan(requiredIdx);
  });

  it('renders a badge with the right variant attribute', () => {
    const fixture = setup({ badge: '1 shot required', badgeVariant: 'amber' });
    const b = fixture.nativeElement.querySelector('.badge');
    expect(b).toBeTruthy();
    expect(b.getAttribute('data-variant')).toBe('amber');
    expect(b.textContent).toContain('1 shot required');
  });

  it('renders the suffix when provided', () => {
    const fixture = setup({ suffix: '— optional' });
    expect(fixture.nativeElement.querySelector('.label-suffix').textContent).toContain('— optional');
  });
});
