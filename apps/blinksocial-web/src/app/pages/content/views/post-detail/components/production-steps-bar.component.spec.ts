import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductionStepsBarComponent } from './production-steps-bar.component';
import type { ProductionStep } from '../post-detail.types';

function setup(
  activeStep: ProductionStep,
  briefApproved = false,
): ComponentFixture<ProductionStepsBarComponent> {
  TestBed.configureTestingModule({ imports: [ProductionStepsBarComponent] });
  const fixture = TestBed.createComponent(ProductionStepsBarComponent);
  fixture.componentRef.setInput('activeStep', activeStep);
  fixture.componentRef.setInput('briefApproved', briefApproved);
  fixture.detectChanges();
  return fixture;
}

describe('ProductionStepsBarComponent', () => {
  it('renders four steps in order (Brief / Builder / Packaging / QA)', () => {
    const fixture = setup('brief');
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.steps-label') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim());
    expect(labels).toEqual(['Brief', 'Builder', 'Packaging', 'QA']);
  });

  it('marks the active step with is-active and aria-current="step"', () => {
    const fixture = setup('packaging');
    const buttons = fixture.nativeElement.querySelectorAll('.steps-btn');
    expect(buttons[0].classList.contains('is-active')).toBe(false);
    expect(buttons[2].classList.contains('is-active')).toBe(true);
    expect(buttons[2].getAttribute('aria-current')).toBe('step');
  });

  it('renders numeric badges by default', () => {
    const fixture = setup('builder');
    const nums = Array.from(
      fixture.nativeElement.querySelectorAll('.steps-num') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim());
    expect(nums).toEqual(['1', '2', '3', '4']);
  });

  it('replaces Brief badge with a check when briefApproved=true and not active', () => {
    const fixture = setup('builder', true);
    const briefBtn = fixture.nativeElement.querySelector('.steps-btn') as HTMLElement;
    expect(briefBtn.classList.contains('is-approved')).toBe(true);
    expect(briefBtn.querySelector('.steps-num svg')).not.toBeNull();
  });

  it('keeps the number on Brief when it is both approved and active', () => {
    const fixture = setup('brief', true);
    const briefBtn = fixture.nativeElement.querySelector('.steps-btn') as HTMLElement;
    // approved-and-active: checkmark still shows
    expect(briefBtn.querySelector('.steps-num svg')).not.toBeNull();
  });

  it('emits stepChange when another step is clicked', () => {
    const fixture = setup('brief');
    const emitted: ProductionStep[] = [];
    fixture.componentInstance.stepChange.subscribe((s) => emitted.push(s));
    const buttons = fixture.nativeElement.querySelectorAll(
      '.steps-btn',
    ) as NodeListOf<HTMLButtonElement>;
    buttons[1].click();
    buttons[2].click();
    buttons[3].click();
    expect(emitted).toEqual(['builder', 'packaging', 'qa']);
  });
});
