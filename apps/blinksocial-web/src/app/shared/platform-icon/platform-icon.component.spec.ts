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

  it('reflects the platform name onto the host as a data-platform attribute', () => {
    const fixture = TestBed.createComponent(PlatformIconComponent);
    fixture.componentRef.setInput('platform', 'youtube');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('data-platform')).toBe('youtube');
  });

  it('updates data-platform when the platform input changes', () => {
    const fixture = TestBed.createComponent(PlatformIconComponent);
    fixture.componentRef.setInput('platform', 'instagram');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).getAttribute('data-platform')).toBe('instagram');
    fixture.componentRef.setInput('platform', 'tiktok');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).getAttribute('data-platform')).toBe('tiktok');
  });
});
