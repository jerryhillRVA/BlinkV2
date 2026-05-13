import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { PlatformContract } from '@blinksocial/contracts';
import { PackagingBuilderPlaceholderComponent } from './builder-placeholder.component';

function setup(
  platform: PlatformContract | null | undefined,
): ComponentFixture<PackagingBuilderPlaceholderComponent> {
  TestBed.configureTestingModule({
    imports: [PackagingBuilderPlaceholderComponent],
  });
  const fixture = TestBed.createComponent(PackagingBuilderPlaceholderComponent);
  fixture.componentRef.setInput('platform', platform);
  fixture.detectChanges();
  return fixture;
}

describe('PackagingBuilderPlaceholderComponent', () => {
  it('renders "Set a platform first" copy when platform is null', () => {
    const fixture = setup(null);
    expect(fixture.nativeElement.querySelector('.placeholder-title')?.textContent).toContain(
      'Set a platform first',
    );
  });

  it('renders "Set a platform first" copy when platform is "tbd"', () => {
    const fixture = setup('tbd');
    expect(fixture.nativeElement.querySelector('.placeholder-title')?.textContent).toContain(
      'Set a platform first',
    );
  });

  it('renders "coming soon" copy with platform label for known platforms', () => {
    const fixture = setup('instagram');
    expect(fixture.nativeElement.querySelector('.placeholder-title')?.textContent).toContain(
      'Packaging for Instagram coming soon',
    );
  });

  it('falls back to raw platform key when no label matches', () => {
    const fixture = setup('unknown-platform' as unknown as PlatformContract);
    expect(fixture.nativeElement.querySelector('.placeholder-title')?.textContent).toContain(
      'unknown-platform',
    );
  });

  it('uses role=status + aria-live=polite for screen-reader announcement', () => {
    const fixture = setup(null);
    const root = fixture.nativeElement.querySelector('.builder-placeholder');
    expect(root.getAttribute('role')).toBe('status');
    expect(root.getAttribute('aria-live')).toBe('polite');
  });
});
