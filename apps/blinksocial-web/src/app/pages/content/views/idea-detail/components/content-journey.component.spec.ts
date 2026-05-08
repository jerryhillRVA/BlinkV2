import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContentJourneyComponent } from './content-journey.component';
import type { ContentStage } from '../../../content.types';

function setup(stage: ContentStage): ComponentFixture<ContentJourneyComponent> {
  TestBed.configureTestingModule({ imports: [ContentJourneyComponent] });
  const fixture = TestBed.createComponent(ContentJourneyComponent);
  fixture.componentRef.setInput('stage', stage);
  fixture.detectChanges();
  return fixture;
}

describe('ContentJourneyComponent', () => {
  it('renders a vertical list of 3 steps (idea, concept, post) in order', () => {
    const fixture = setup('idea');
    const list = fixture.nativeElement.querySelector('.journey-steps-vertical');
    expect(list).not.toBeNull();
    expect(list.tagName.toLowerCase()).toBe('ul');
    const steps = list.querySelectorAll('.journey-step');
    expect(steps.length).toBe(3);
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.journey-label') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim());
    expect(labels).toEqual(['Idea', 'Concept', 'Post']);
  });

  it('does not render the legacy horizontal progress bar', () => {
    const fixture = setup('concept');
    expect(fixture.nativeElement.querySelector('.journey-progress')).toBeNull();
    expect(fixture.nativeElement.querySelector('.journey-progress-fill')).toBeNull();
  });

  it('idea stage: idea=current, concept/post=future', () => {
    const fixture = setup('idea');
    const steps = fixture.nativeElement.querySelectorAll('.journey-step');
    expect(steps[0].classList.contains('is-current')).toBe(true);
    expect(steps[1].classList.contains('is-future')).toBe(true);
    expect(steps[2].classList.contains('is-future')).toBe(true);
    // future steps render the digit, not a check svg
    expect(steps[2].querySelector('.journey-circle svg')).toBeNull();
    expect(steps[2].querySelector('.journey-circle')?.textContent?.trim()).toBe('3');
  });

  it('concept stage: idea=past (checkmark), concept=current, post=future', () => {
    const fixture = setup('concept');
    const steps = fixture.nativeElement.querySelectorAll('.journey-step');
    expect(steps[0].classList.contains('is-past')).toBe(true);
    expect(steps[1].classList.contains('is-current')).toBe(true);
    expect(steps[2].classList.contains('is-future')).toBe(true);
    // past step shows the checkmark svg rather than the number
    expect(steps[0].querySelector('.journey-circle svg')).not.toBeNull();
  });

  it('post stage: idea/concept=past, post=current', () => {
    const fixture = setup('post');
    const steps = fixture.nativeElement.querySelectorAll('.journey-step');
    expect(steps[0].classList.contains('is-past')).toBe(true);
    expect(steps[1].classList.contains('is-past')).toBe(true);
    expect(steps[2].classList.contains('is-current')).toBe(true);
  });

  it('off-ladder stage renders all as future', () => {
    const fixture = setup('unknown-stage' as unknown as ContentStage);
    const steps = fixture.nativeElement.querySelectorAll('.journey-step');
    expect(steps[0].classList.contains('is-future')).toBe(true);
    expect(steps[1].classList.contains('is-future')).toBe(true);
    expect(steps[2].classList.contains('is-future')).toBe(true);
  });

  it('marks the current step with aria-current="step"', () => {
    const fixture = setup('concept');
    const currentCircle = fixture.nativeElement.querySelector(
      '.journey-step.is-current .journey-circle',
    );
    expect(currentCircle.getAttribute('aria-current')).toBe('step');
  });
});
