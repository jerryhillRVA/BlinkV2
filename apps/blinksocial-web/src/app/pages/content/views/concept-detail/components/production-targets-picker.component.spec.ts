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
    // Instagram, YouTube, TikTok, Facebook, LinkedIn
    expect(groups.length).toBe(5);
  });

  it('renders content-type chips under each platform', () => {
    const fixture = setup();
    // Instagram has 6 formats (reel, carousel, feed-post, story, guide, live)
    const firstGroup = fixture.nativeElement.querySelector('.target-group');
    const chips = firstGroup.querySelectorAll('.target-chip');
    expect(chips.length).toBe(6);
  });

  it('selected targets receive the is-selected class + aria-pressed=true', () => {
    const fixture = setup([{ platform: 'instagram', contentType: 'reel', postId: null }]);
    const selectedChip = Array.from(
      fixture.nativeElement.querySelectorAll('.target-chip') as NodeListOf<HTMLButtonElement>,
    ).find((b) => b.textContent?.trim() === 'Reel') as HTMLButtonElement;
    expect(selectedChip.classList.contains('is-selected')).toBe(true);
    expect(selectedChip.getAttribute('aria-pressed')).toBe('true');
  });

  it('clicking a chip emits toggleTarget with the correct pair', () => {
    const fixture = setup();
    const emitted: TargetPlatform[] = [];
    fixture.componentInstance.toggleTarget.subscribe((t) => emitted.push(t));
    const chip = Array.from(
      fixture.nativeElement.querySelectorAll('.target-chip') as NodeListOf<HTMLButtonElement>,
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
      fixture.nativeElement.querySelectorAll('.target-chip') as NodeListOf<HTMLButtonElement>,
    ).find((b) => b.textContent?.includes('Reel')) as HTMLButtonElement;
    expect(chip.classList.contains('is-in-production')).toBe(true);
    expect(chip.disabled).toBe(true);
    expect(chip.querySelector('.target-chip-badge')).not.toBeNull();
    chip.click();
    expect(emitted).toEqual([]);
  });

});
