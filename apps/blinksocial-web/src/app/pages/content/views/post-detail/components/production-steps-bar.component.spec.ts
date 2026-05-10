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
  it('renders four steps in order (Brief / Draft / Packaging / Approve & Schedule)', () => {
    const fixture = setup('brief');
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.steps-label') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim());
    expect(labels).toEqual(['Brief', 'Draft', 'Packaging', 'Approve & Schedule']);
    expect(fixture.nativeElement.querySelectorAll('.steps-btn').length).toBe(4);
  });

  it('does not render per-step Lucide icons next to the labels (prototype parity — number circle + label only)', () => {
    const fixture = setup('brief');
    expect(fixture.nativeElement.querySelectorAll('.steps-btn .steps-icon').length).toBe(0);
  });

  it('marks the active step with is-active and aria-current="step"', () => {
    const fixture = setup('packaging');
    const buttons = fixture.nativeElement.querySelectorAll('.steps-btn');
    expect(buttons[0].classList.contains('is-active')).toBe(false);
    expect(buttons[2].classList.contains('is-active')).toBe(true);
    expect(buttons[2].getAttribute('aria-current')).toBe('step');
  });

  it('renders numeric badges by default (1..4)', () => {
    const fixture = setup('draft');
    const nums = Array.from(
      fixture.nativeElement.querySelectorAll('.steps-num') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim());
    expect(nums).toEqual(['1', '2', '3', '4']);
  });

  it('Brief shows a check (is-past) once briefApproved=true and the active step has moved past it', () => {
    const fixture = setup('draft', true);
    const briefBtn = fixture.nativeElement.querySelector('.steps-btn') as HTMLElement;
    expect(briefBtn.classList.contains('is-past')).toBe(true);
    expect(briefBtn.querySelector('.steps-num svg')).not.toBeNull();
  });

  it('past steps before activeIndex render in is-past green when briefApproved', () => {
    const fixture = setup('qa', true);
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.steps-btn') as NodeListOf<HTMLButtonElement>,
    );
    expect(buttons[0].classList.contains('is-past')).toBe(true);
    expect(buttons[1].classList.contains('is-past')).toBe(true);
    expect(buttons[2].classList.contains('is-past')).toBe(true);
    expect(buttons[3].classList.contains('is-active')).toBe(true);
  });

  it('disables future steps beyond active+1 when brief is not approved', () => {
    const fixture = setup('brief', false);
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.steps-btn') as NodeListOf<HTMLButtonElement>,
    );
    expect(buttons[0].disabled).toBe(false);
    expect(buttons[1].disabled).toBe(false);
    expect(buttons[2].disabled).toBe(true);
    expect(buttons[3].disabled).toBe(true);
  });

  it('mobile-only "Step N of 4" hint shows the active label', () => {
    const fixture = setup('packaging');
    const hint = fixture.nativeElement.querySelector('.steps-mobile-label') as HTMLElement;
    expect(hint).not.toBeNull();
    expect(hint.textContent).toContain('3 of 4');
    expect(hint.textContent).toContain('Packaging');
  });

  it('Brief stays not-past when briefApproved is false even if active is later (defensive)', () => {
    const fixture = setup('packaging', false);
    const briefBtn = fixture.nativeElement.querySelector('.steps-btn') as HTMLElement;
    expect(briefBtn.classList.contains('is-past')).toBe(false);
  });

  it('falls back to index 0 when activeStep is unknown (defensive activeIndex / activeStepDef)', () => {
    const fixture = setup('brief');
    fixture.componentRef.setInput('activeStep', 'unknown' as never);
    fixture.detectChanges();
    const hint = fixture.nativeElement.querySelector('.steps-mobile-label') as HTMLElement;
    expect(hint.textContent).toContain('1 of 4');
    expect(hint.textContent).toContain('Brief');
  });

  it('emits stepChange when another step is clicked', () => {
    const fixture = setup('brief', true);
    const emitted: ProductionStep[] = [];
    fixture.componentInstance.stepChange.subscribe((s) => emitted.push(s));
    const buttons = fixture.nativeElement.querySelectorAll(
      '.steps-btn',
    ) as NodeListOf<HTMLButtonElement>;
    buttons[1].click();
    buttons[2].click();
    buttons[3].click();
    expect(emitted).toEqual(['draft', 'packaging', 'qa']);
  });
});
