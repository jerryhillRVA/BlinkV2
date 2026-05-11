import { TestBed } from '@angular/core/testing';
import type { DraftModeContract } from '@blinksocial/contracts';
import { BuilderPlaceholderComponent } from './builder-placeholder.component';

describe('BuilderPlaceholderComponent', () => {
  function setup(mode: DraftModeContract = 'STORY') {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [BuilderPlaceholderComponent] });
    const fixture = TestBed.createComponent(BuilderPlaceholderComponent);
    fixture.componentRef.setInput('mode', mode);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the mode-specific label and copy', () => {
    const fixture = setup('STORY');
    const title = fixture.nativeElement.querySelector('.placeholder-title');
    expect(title.textContent).toContain('Story coming soon');
    const copy = fixture.nativeElement.querySelector('.placeholder-copy');
    expect(copy.textContent).toContain('story builder');
  });

  it('renders different labels for different modes', () => {
    expect(
      setup('LINK').nativeElement.querySelector('.placeholder-title').textContent,
    ).toContain('Link post');
    expect(
      setup('LIVE').nativeElement.querySelector('.placeholder-title').textContent,
    ).toContain('Live broadcast');
    expect(
      setup('DOCUMENT').nativeElement.querySelector('.placeholder-title')
        .textContent,
    ).toContain('Document carousel');
  });

  it('exposes a region with aria-label', () => {
    const fixture = setup('STORY');
    const region = fixture.nativeElement.querySelector('[role="region"]');
    expect(region).toBeTruthy();
    expect(region.getAttribute('aria-label')).toBe('Builder placeholder');
  });
});
