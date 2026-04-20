import { TestBed } from '@angular/core/testing';
import { StepPlaceholderComponent } from './step-placeholder.component';

describe('StepPlaceholderComponent', () => {
  it('renders the provided label in title and copy', () => {
    TestBed.configureTestingModule({ imports: [StepPlaceholderComponent] });
    const fixture = TestBed.createComponent(StepPlaceholderComponent);
    fixture.componentRef.setInput('label', 'Builder');
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector(
      '.placeholder-title',
    ) as HTMLElement;
    const copy = fixture.nativeElement.querySelector(
      '.placeholder-copy',
    ) as HTMLElement;
    expect(title.textContent).toContain('Builder');
    expect(copy.textContent).toContain('Builder');
  });

  it('uses the panel-journey accent class for a gradient top bar', () => {
    TestBed.configureTestingModule({ imports: [StepPlaceholderComponent] });
    const fixture = TestBed.createComponent(StepPlaceholderComponent);
    fixture.componentRef.setInput('label', 'QA');
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector(
      '.step-placeholder',
    ) as HTMLElement;
    expect(host.classList.contains('panel-journey')).toBe(true);
  });
});
