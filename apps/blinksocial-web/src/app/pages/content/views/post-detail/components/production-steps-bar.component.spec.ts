import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductionStepsBarComponent } from './production-steps-bar.component';
import type { ProductionStep } from '../post-detail.types';

function setup(
  activeStep: ProductionStep,
  unlockedThroughIndex = 0,
): ComponentFixture<ProductionStepsBarComponent> {
  TestBed.configureTestingModule({ imports: [ProductionStepsBarComponent] });
  const fixture = TestBed.createComponent(ProductionStepsBarComponent);
  fixture.componentRef.setInput('activeStep', activeStep);
  fixture.componentRef.setInput('unlockedThroughIndex', unlockedThroughIndex);
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
    const fixture = setup('packaging', 3);
    const buttons = fixture.nativeElement.querySelectorAll('.steps-btn');
    expect(buttons[0].classList.contains('is-active')).toBe(false);
    expect(buttons[2].classList.contains('is-active')).toBe(true);
    expect(buttons[2].getAttribute('aria-current')).toBe('step');
  });

  it('renders numeric badges by default (1..4) when nothing is past yet', () => {
    // On Brief with no gate satisfied: no step is "past" (strictly behind
    // the active step), so all four show numbers rather than checks.
    const fixture = setup('brief');
    const nums = Array.from(
      fixture.nativeElement.querySelectorAll('.steps-num') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim());
    expect(nums).toEqual(['1', '2', '3', '4']);
  });

  it('Brief shows a check (is-past) once the user has moved past it (active = Draft or later)', () => {
    const fixture = setup('draft', 1);
    const briefBtn = fixture.nativeElement.querySelector('.steps-btn') as HTMLElement;
    expect(briefBtn.classList.contains('is-past')).toBe(true);
    expect(briefBtn.querySelector('.steps-num svg')).not.toBeNull();
  });

  it('the active step is NEVER also is-past, even when its gate is satisfied (active wins visually)', () => {
    // Critical regression: with unlockedThroughIndex=2 and active=Draft,
    // Draft's gate is satisfied but the user is still sitting on Draft.
    // The Draft tab must render as the active (orange) step, not the
    // green completed step.
    const fixture = setup('draft', 2);
    const draftBtn = fixture.nativeElement.querySelectorAll('.steps-btn')[1] as HTMLElement;
    expect(draftBtn.classList.contains('is-active')).toBe(true);
    expect(draftBtn.classList.contains('is-past')).toBe(false);
  });

  it('strictly past steps (i < activeIndex) render in is-past green', () => {
    const fixture = setup('qa', 3);
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.steps-btn') as NodeListOf<HTMLButtonElement>,
    );
    expect(buttons[0].classList.contains('is-past')).toBe(true);
    expect(buttons[1].classList.contains('is-past')).toBe(true);
    expect(buttons[2].classList.contains('is-past')).toBe(true);
    expect(buttons[3].classList.contains('is-active')).toBe(true);
    expect(buttons[3].classList.contains('is-past')).toBe(false);
  });

  it('only the Brief tab is clickable when unlockedThroughIndex=0 (brief not approved)', () => {
    const fixture = setup('brief', 0);
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.steps-btn') as NodeListOf<HTMLButtonElement>,
    );
    expect(buttons[0].disabled).toBe(false);
    expect(buttons[1].disabled).toBe(true);
    expect(buttons[2].disabled).toBe(true);
    expect(buttons[3].disabled).toBe(true);
  });

  it('Brief + Draft clickable when unlockedThroughIndex=1 (brief approved, draft not yet valid)', () => {
    const fixture = setup('draft', 1);
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.steps-btn') as NodeListOf<HTMLButtonElement>,
    );
    expect(buttons[0].disabled).toBe(false);
    expect(buttons[1].disabled).toBe(false);
    expect(buttons[2].disabled).toBe(true);
    expect(buttons[3].disabled).toBe(true);
  });

  it('Brief + Draft + Packaging clickable when unlockedThroughIndex=2 (draft valid, packaging not yet ready)', () => {
    const fixture = setup('draft', 2);
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.steps-btn') as NodeListOf<HTMLButtonElement>,
    );
    expect(buttons[0].disabled).toBe(false);
    expect(buttons[1].disabled).toBe(false);
    expect(buttons[2].disabled).toBe(false);
    expect(buttons[3].disabled).toBe(true);
  });

  it('all four steps clickable when sitting on the last step with full gates (past+current)', () => {
    const fixture = setup('qa', 3);
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.steps-btn') as NodeListOf<HTMLButtonElement>,
    );
    expect(buttons[0].disabled).toBe(false);
    expect(buttons[1].disabled).toBe(false);
    expect(buttons[2].disabled).toBe(false);
    expect(buttons[3].disabled).toBe(false);
  });

  it('does not allow skipping two steps ahead even with all gates satisfied', () => {
    // On Brief with every gate satisfied (unlockedThroughIndex=3), the user
    // can still only click forward to the immediate next step (Draft).
    // Packaging and Approve & Schedule require advancing through the
    // Continue button — the bar never lets a user leap two steps forward.
    const fixture = setup('brief', 3);
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.steps-btn') as NodeListOf<HTMLButtonElement>,
    );
    expect(buttons[0].disabled).toBe(false); // current
    expect(buttons[1].disabled).toBe(false); // next-up
    expect(buttons[2].disabled).toBe(true); // two-ahead
    expect(buttons[3].disabled).toBe(true); // three-ahead
  });

  it('active step stays clickable even if its gate regressed (defensive — user is sitting on it)', () => {
    // Simulate: user advanced to Packaging, then went back to Brief and
    // unlocked it. unlockedThroughIndex collapses to 0; activeStep is
    // still 'packaging' for one tick. The packaging tab must remain
    // clickable so the user can interact with it.
    const fixture = setup('packaging', 0);
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.steps-btn') as NodeListOf<HTMLButtonElement>,
    );
    expect(buttons[2].disabled).toBe(false);
  });

  it('mobile-only "Step N of 4" hint shows the active label', () => {
    const fixture = setup('packaging', 3);
    const hint = fixture.nativeElement.querySelector('.steps-mobile-label') as HTMLElement;
    expect(hint).not.toBeNull();
    expect(hint.textContent).toContain('3 of 4');
    expect(hint.textContent).toContain('Packaging');
  });

  it('Brief stays not-past when unlockedThroughIndex=0 (defensive — gate not satisfied)', () => {
    const fixture = setup('brief', 0);
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

  it('emits stepChange when a reachable step (past + current + next-up) is clicked', () => {
    // From Packaging with all gates satisfied, all four steps are
    // clickable (3 past/current + 1 next-up). Clicks on each emit its id.
    const fixture = setup('packaging', 3);
    const emitted: ProductionStep[] = [];
    fixture.componentInstance.stepChange.subscribe((s) => emitted.push(s));
    const buttons = fixture.nativeElement.querySelectorAll(
      '.steps-btn',
    ) as NodeListOf<HTMLButtonElement>;
    buttons[0].click();
    buttons[1].click();
    buttons[3].click();
    expect(emitted).toEqual(['brief', 'draft', 'qa']);
  });
});
