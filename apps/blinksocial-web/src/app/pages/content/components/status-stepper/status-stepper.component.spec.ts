import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusStepperComponent } from './status-stepper.component';
import type { ContentStage, ContentStatus } from '../../content.types';

function setup(
  value: ContentStatus,
  stage: ContentStage = 'post',
): ComponentFixture<StatusStepperComponent> {
  TestBed.configureTestingModule({ imports: [StatusStepperComponent] });
  const fixture = TestBed.createComponent(StatusStepperComponent);
  fixture.componentRef.setInput('value', value);
  fixture.componentRef.setInput('stage', stage);
  fixture.detectChanges();
  return fixture;
}

describe('StatusStepperComponent', () => {
  it('renders the 5 post steps in order when stage is post', () => {
    const fixture = setup('draft', 'post');
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.status-step-label') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim());
    expect(labels).toEqual(['Draft', 'In Progress', 'In Review', 'Scheduled', 'Published']);
  });

  it('renders the 3 idea/concept steps in order when stage is idea', () => {
    const fixture = setup('draft', 'idea');
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.status-step-label') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim());
    expect(labels).toEqual(['Draft', 'Concepting', 'Posting']);
  });

  it('renders the same 3 steps for concept stage', () => {
    const fixture = setup('concepting', 'concept');
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.status-step-label') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim());
    expect(labels).toEqual(['Draft', 'Concepting', 'Posting']);
  });

  it('assigns is-current to the matching step', () => {
    const fixture = setup('review', 'post');
    const steps = fixture.nativeElement.querySelectorAll('.status-step');
    expect(steps[0].classList.contains('is-done')).toBe(true);
    expect(steps[1].classList.contains('is-done')).toBe(true);
    expect(steps[2].classList.contains('is-current')).toBe(true);
    expect(steps[3].classList.contains('is-upcoming')).toBe(true);
    expect(steps[4].classList.contains('is-upcoming')).toBe(true);
  });

  it('marks concept stepper current step when status is concepting', () => {
    const fixture = setup('concepting', 'concept');
    const steps = fixture.nativeElement.querySelectorAll('.status-step');
    expect(steps[0].classList.contains('is-done')).toBe(true);
    expect(steps[1].classList.contains('is-current')).toBe(true);
    expect(steps[2].classList.contains('is-upcoming')).toBe(true);
  });

  it('emits statusChange when a non-current step is clicked', () => {
    const fixture = setup('draft', 'post');
    const emitted: ContentStatus[] = [];
    fixture.componentInstance.statusChange.subscribe((s) => emitted.push(s));
    const btns = fixture.nativeElement.querySelectorAll('.status-step-btn') as NodeListOf<HTMLButtonElement>;
    btns[2].click(); // "In Review"
    expect(emitted).toEqual(['review']);
  });

  it('does not emit when the current step is clicked again', () => {
    const fixture = setup('in-progress', 'post');
    const emitted: ContentStatus[] = [];
    fixture.componentInstance.statusChange.subscribe((s) => emitted.push(s));
    const btns = fixture.nativeElement.querySelectorAll('.status-step-btn') as NodeListOf<HTMLButtonElement>;
    btns[1].click(); // already current
    expect(emitted).toEqual([]);
  });

  it('unknown status shows all steps as upcoming', () => {
    const fixture = setup('draft', 'post');
    fixture.componentRef.setInput('value', 'unknown' as unknown as ContentStatus);
    fixture.detectChanges();
    const steps = fixture.nativeElement.querySelectorAll('.status-step');
    for (const step of Array.from(steps) as HTMLElement[]) {
      expect(step.classList.contains('is-upcoming')).toBe(true);
    }
  });
});
