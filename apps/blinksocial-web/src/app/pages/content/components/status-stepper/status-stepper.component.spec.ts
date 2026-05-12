import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusStepperComponent } from './status-stepper.component';
import type { ContentStage, ContentStatus } from '../../content.types';

function setup(
  value: ContentStatus,
  stage: ContentStage = 'post',
  interactive = true,
): ComponentFixture<StatusStepperComponent> {
  TestBed.configureTestingModule({ imports: [StatusStepperComponent] });
  const fixture = TestBed.createComponent(StatusStepperComponent);
  fixture.componentRef.setInput('value', value);
  fixture.componentRef.setInput('stage', stage);
  fixture.componentRef.setInput('interactive', interactive);
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

  it('renders the 2 idea/concept steps in order when stage is idea', () => {
    const fixture = setup('new', 'idea');
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.status-step-label') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim());
    expect(labels).toEqual(['New', 'Used']);
  });

  it('renders the same 2 steps for concept stage', () => {
    const fixture = setup('new', 'concept');
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.status-step-label') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim());
    expect(labels).toEqual(['New', 'Used']);
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

  it('marks concept stepper current step when status is used', () => {
    const fixture = setup('used', 'concept');
    const steps = fixture.nativeElement.querySelectorAll('.status-step');
    expect(steps[0].classList.contains('is-done')).toBe(true);
    expect(steps[1].classList.contains('is-current')).toBe(true);
  });

  it('emits statusChange when a non-current step is clicked (interactive)', () => {
    const fixture = setup('draft', 'post', true);
    const emitted: ContentStatus[] = [];
    fixture.componentInstance.statusChange.subscribe((s) => emitted.push(s));
    const btns = fixture.nativeElement.querySelectorAll('.status-step-btn') as NodeListOf<HTMLButtonElement>;
    btns[2].click(); // "In Review"
    expect(emitted).toEqual(['review']);
  });

  it('does not emit when the current step is clicked again (interactive)', () => {
    const fixture = setup('in-progress', 'post', true);
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

  describe('read-only mode (interactive=false)', () => {
    it('renders steps as divs with role=presentation, not buttons', () => {
      const fixture = setup('new', 'idea', false);
      const btnEls = fixture.nativeElement.querySelectorAll('button');
      expect(btnEls.length).toBe(0);
      const presentationEls = fixture.nativeElement.querySelectorAll(
        '[role="presentation"]',
      );
      expect(presentationEls.length).toBe(2);
    });

    it('host list has role=group and an aria-label naming the current status', () => {
      const fixture = setup('used', 'concept', false);
      const list = fixture.nativeElement.querySelector('.status-stepper');
      expect(list.getAttribute('role')).toBe('group');
      expect(list.getAttribute('aria-label')).toBe('Content status: Used');
    });

    it('does not emit statusChange when a step is clicked', () => {
      const fixture = setup('new', 'idea', false);
      const emitted: ContentStatus[] = [];
      fixture.componentInstance.statusChange.subscribe((s) => emitted.push(s));
      const stepEls = fixture.nativeElement.querySelectorAll(
        '.status-step-btn',
      ) as NodeListOf<HTMLElement>;
      stepEls[1].click();
      expect(emitted).toEqual([]);
    });

    it('step elements are not tab-reachable', () => {
      const fixture = setup('new', 'idea', false);
      const stepEls = fixture.nativeElement.querySelectorAll(
        '.status-step-btn',
      ) as NodeListOf<HTMLElement>;
      for (const el of Array.from(stepEls)) {
        // <div> elements are not in the tab order by default and have no
        // tabindex attribute set by the component.
        expect(el.getAttribute('tabindex')).toBeNull();
        expect(el.tagName.toLowerCase()).toBe('div');
      }
    });
  });
});
