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

  it('shows the info icon as a focusable trigger with aria-label = info text', () => {
    const fixture = setup({ info: 'The first line that stops the scroll.' });
    const info = fixture.nativeElement.querySelector('.info');
    expect(info).toBeTruthy();
    expect(info.getAttribute('aria-label')).toBe('The first line that stops the scroll.');
    expect(info.getAttribute('tabindex')).toBe('0');
  });

  it('omits the info icon when no info is provided', () => {
    const fixture = setup({});
    expect(fixture.nativeElement.querySelector('.info')).toBeNull();
  });

  it('renders the required asterisk + screen-reader text when required=true', () => {
    const fixture = setup({ required: true });
    const aster = fixture.nativeElement.querySelector('.required');
    expect(aster).toBeTruthy();
    expect(aster.getAttribute('aria-hidden')).toBe('true');
    expect(fixture.nativeElement.querySelector('.visually-hidden').textContent).toBe('required');
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
