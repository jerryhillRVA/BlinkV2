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
  it('renders 3 steps (idea, concept, post) in order', () => {
    const fixture = setup('idea');
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.journey-label') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim());
    expect(labels).toEqual(['Idea', 'Concept', 'Post']);
  });

  it('idea stage: idea=current, concept/post=future; progress=0%', () => {
    const fixture = setup('idea');
    const steps = fixture.nativeElement.querySelectorAll('.journey-step');
    expect(steps[0].classList.contains('is-current')).toBe(true);
    expect(steps[1].classList.contains('is-future')).toBe(true);
    expect(steps[2].classList.contains('is-future')).toBe(true);
    const fill = fixture.nativeElement.querySelector('.journey-progress-fill') as HTMLElement;
    expect(fill.style.width).toBe('0%');
  });

  it('concept stage: idea=past (checkmark), concept=current, post=future; progress=50%', () => {
    const fixture = setup('concept');
    const steps = fixture.nativeElement.querySelectorAll('.journey-step');
    expect(steps[0].classList.contains('is-past')).toBe(true);
    expect(steps[1].classList.contains('is-current')).toBe(true);
    expect(steps[2].classList.contains('is-future')).toBe(true);
    // past step shows the checkmark svg rather than the number
    expect(steps[0].querySelector('.journey-circle svg')).not.toBeNull();
    const fill = fixture.nativeElement.querySelector('.journey-progress-fill') as HTMLElement;
    expect(fill.style.width).toBe('50%');
  });

  it('post stage: idea/concept=past, post=current; progress=100%', () => {
    const fixture = setup('post');
    const steps = fixture.nativeElement.querySelectorAll('.journey-step');
    expect(steps[0].classList.contains('is-past')).toBe(true);
    expect(steps[1].classList.contains('is-past')).toBe(true);
    expect(steps[2].classList.contains('is-current')).toBe(true);
    const fill = fixture.nativeElement.querySelector('.journey-progress-fill') as HTMLElement;
    expect(fill.style.width).toBe('100%');
  });

  it('off-ladder stage renders all as future with 0% progress', () => {
    const fixture = setup('unknown-stage' as unknown as ContentStage);
    const steps = fixture.nativeElement.querySelectorAll('.journey-step');
    expect(steps[0].classList.contains('is-future')).toBe(true);
    expect(steps[1].classList.contains('is-future')).toBe(true);
    expect(steps[2].classList.contains('is-future')).toBe(true);
    const fill = fixture.nativeElement.querySelector('.journey-progress-fill') as HTMLElement;
    expect(fill.style.width).toBe('0%');
  });

  it('marks the current step with aria-current="step"', () => {
    const fixture = setup('concept');
    const currentCircle = fixture.nativeElement.querySelector(
      '.journey-step.is-current .journey-circle',
    );
    expect(currentCircle.getAttribute('aria-current')).toBe('step');
  });
});
