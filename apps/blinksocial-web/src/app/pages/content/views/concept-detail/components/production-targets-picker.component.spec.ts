import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductionTargetsPickerComponent } from './production-targets-picker.component';
import type { TargetPlatform } from '../concept-detail.types';

function setup(
  selected: TargetPlatform[] = [],
  isInProduction: (t: TargetPlatform) => boolean = () => false,
): ComponentFixture<ProductionTargetsPickerComponent> {
  TestBed.configureTestingModule({ imports: [ProductionTargetsPickerComponent] });
  const fixture = TestBed.createComponent(ProductionTargetsPickerComponent);
  fixture.componentRef.setInput('selected', selected);
  fixture.componentRef.setInput('isInProduction', isInProduction);
  fixture.detectChanges();
  return fixture;
}

describe('ProductionTargetsPickerComponent', () => {
  it('renders one group per non-tbd platform', () => {
    const fixture = setup();
    const groups = fixture.nativeElement.querySelectorAll('.target-group');
    // Instagram, YouTube, TikTok, Facebook, LinkedIn, X
    expect(groups.length).toBe(6);
  });

  it('renders content-type options under each platform', () => {
    const fixture = setup();
    // Instagram has 6 formats (reel, carousel, feed-post, story, guide, live)
    const firstGroup = fixture.nativeElement.querySelector('.target-group');
    const options = firstGroup.querySelectorAll('.target-option');
    expect(options.length).toBe(6);
  });

  it('each option contains a .target-option-check (rounded-rect with checkbox inside, prototype parity)', () => {
    const fixture = setup([{ platform: 'instagram', contentType: 'reel', postId: null }]);
    const options = fixture.nativeElement.querySelectorAll('.target-option') as NodeListOf<HTMLButtonElement>;
    expect(options.length).toBeGreaterThan(0);
    for (const opt of Array.from(options)) {
      expect(opt.querySelector('.target-option-check')).not.toBeNull();
    }
    const reel = Array.from(options).find((b) => b.textContent?.trim().includes('Reel')) as HTMLButtonElement;
    expect(reel.querySelector('.target-option-check svg')).not.toBeNull();
  });

  it('.target-option vertically centers the checkbox + label with line-height matching the check square', () => {
    const fixture = setup();
    document.body.appendChild(fixture.nativeElement);
    try {
      const opt = fixture.nativeElement.querySelector('.target-option') as HTMLElement;
      expect(opt).not.toBeNull();
      expect(getComputedStyle(opt).alignItems).toBe('center');
      expect(getComputedStyle(opt).minHeight).toBe('32px');
      const label = opt.querySelector('.target-option-label') as HTMLElement;
      // Line-height pinned to the 14px check square so single-line labels'
      // line-box centre coincides with the checkbox centre — the glyphs sit
      // visually centred regardless of cap/descender asymmetry.
      expect(getComputedStyle(label).lineHeight).toBe('14px');
    } finally {
      document.body.removeChild(fixture.nativeElement);
    }
  });

  it('selected targets receive the is-selected class + aria-pressed=true', () => {
    const fixture = setup([{ platform: 'instagram', contentType: 'reel', postId: null }]);
    const selectedChip = Array.from(
      fixture.nativeElement.querySelectorAll('.target-option') as NodeListOf<HTMLButtonElement>,
    ).find((b) => b.textContent?.trim() === 'Reel') as HTMLButtonElement;
    expect(selectedChip.classList.contains('is-selected')).toBe(true);
    expect(selectedChip.getAttribute('aria-pressed')).toBe('true');
  });

  it('clicking a chip emits toggleTarget with the correct pair', () => {
    const fixture = setup();
    const emitted: TargetPlatform[] = [];
    fixture.componentInstance.toggleTarget.subscribe((t) => emitted.push(t));
    const chip = Array.from(
      fixture.nativeElement.querySelectorAll('.target-option') as NodeListOf<HTMLButtonElement>,
    ).find((b) => b.textContent?.trim() === 'Reel') as HTMLButtonElement;
    chip.click();
    expect(emitted).toEqual([{ platform: 'instagram', contentType: 'reel', postId: null }]);
  });

  it('chips marked in-production are disabled, carry the badge, do not emit on click', () => {
    const isInProduction = (t: TargetPlatform) =>
      t.platform === 'instagram' && t.contentType === 'reel';
    const fixture = setup([], isInProduction);
    const emitted: TargetPlatform[] = [];
    fixture.componentInstance.toggleTarget.subscribe((t) => emitted.push(t));
    const chip = Array.from(
      fixture.nativeElement.querySelectorAll('.target-option') as NodeListOf<HTMLButtonElement>,
    ).find((b) => b.textContent?.includes('Reel')) as HTMLButtonElement;
    expect(chip.classList.contains('is-in-production')).toBe(true);
    expect(chip.disabled).toBe(true);
    expect(chip.querySelector('.target-option-badge')).not.toBeNull();
    expect(chip.querySelector('.target-option-check')).not.toBeNull();
    chip.click();
    expect(emitted).toEqual([]);
  });

});
