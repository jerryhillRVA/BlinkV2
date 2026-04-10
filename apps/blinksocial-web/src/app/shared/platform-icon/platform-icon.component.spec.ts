import { TestBed } from '@angular/core/testing';
import { PlatformIconComponent, PlatformName } from './platform-icon.component';

describe('PlatformIconComponent', () => {
  const platforms: PlatformName[] = [
    'instagram', 'tiktok', 'youtube', 'facebook', 'linkedin',
    'twitter', 'slack', 'discord', 'tbd',
    'pinterest', 'x', 'threads',
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PlatformIconComponent] });
  });

  for (const p of platforms) {
    it(`renders an svg for ${p}`, () => {
      const fixture = TestBed.createComponent(PlatformIconComponent);
      fixture.componentRef.setInput('platform', p);
      fixture.detectChanges();
      const svg = (fixture.nativeElement as HTMLElement).querySelector('svg.platform-icon');
      expect(svg).toBeTruthy();
    });
  }

  it('respects the size input', () => {
    const fixture = TestBed.createComponent(PlatformIconComponent);
    fixture.componentRef.setInput('platform', 'instagram');
    fixture.componentRef.setInput('size', 20);
    fixture.detectChanges();
    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('20');
    expect(svg?.getAttribute('height')).toBe('20');
  });
});
