import { TestBed } from '@angular/core/testing';
import { IconComponent } from './icon.component';
import { ICONS, type IconName } from './icons';

function setup(props: Partial<IconComponent> = {}, name: IconName = 'sparkles') {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [IconComponent] });
  const fixture = TestBed.createComponent(IconComponent);
  fixture.componentRef.setInput('name', name);
  Object.assign(fixture.componentInstance, props);
  fixture.detectChanges();
  return fixture;
}

describe('IconComponent', () => {
  it('renders an SVG with currentColor stroke', () => {
    const fixture = setup();
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('stroke')).toBe('currentColor');
  });

  it('respects size input (number → px attribute)', () => {
    const fixture = setup({ size: 20 });
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('width')).toBe('20');
    expect(svg.getAttribute('height')).toBe('20');
  });

  it('size accepts strings for em/rem use', () => {
    const fixture = setup({ size: '1em' });
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('width')).toBe('1em');
  });

  it('defaults to aria-hidden=true (decorative)', () => {
    const fixture = setup();
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('aria-label')).toBeNull();
  });

  it('when ariaLabel is set, drops aria-hidden and adds role=img + aria-label', () => {
    const fixture = setup({ ariaLabel: 'Loading indicator' });
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('aria-hidden')).toBeNull();
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Loading indicator');
  });

  it('renders the registered path primitives', () => {
    const fixture = setup({}, 'sparkles');
    const paths = fixture.nativeElement.querySelectorAll('path');
    expect(paths.length).toBe(ICONS.sparkles.primitives.length);
    expect(paths[0].getAttribute('d')).toBe(
      (ICONS.sparkles.primitives[0] as { d: string }).d,
    );
  });

  it.each(['info', 'plus', 'trash-2', 'x', 'chevron-down', 'alert-triangle'] as const)(
    'renders %s without throwing',
    (name) => {
      const fixture = setup({}, name as IconName);
      expect(fixture.nativeElement.querySelector('svg')).toBeTruthy();
    },
  );

  it('renders circle / line / polyline primitives', () => {
    const fixture = setup({}, 'info'); // info has 1 circle + 2 lines
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg.querySelector('circle')).toBeTruthy();
    expect(svg.querySelectorAll('line').length).toBe(2);
    const fixture2 = setup({}, 'chevron-down');
    expect(fixture2.nativeElement.querySelector('polyline')).toBeTruthy();
  });
});
