import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetailBackButtonComponent } from './detail-back-button.component';

function setup(): ComponentFixture<DetailBackButtonComponent> {
  TestBed.configureTestingModule({ imports: [DetailBackButtonComponent] });
  const fixture = TestBed.createComponent(DetailBackButtonComponent);
  fixture.detectChanges();
  return fixture;
}

describe('DetailBackButtonComponent', () => {
  it('renders a button with chevron svg and visible "Back" label', () => {
    const fixture = setup();
    const btn = fixture.nativeElement.querySelector('.detail-back') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.getAttribute('type')).toBe('button');
    expect(btn.querySelector('svg')).not.toBeNull();
    const span = btn.querySelector('span') as HTMLSpanElement;
    expect(span.textContent?.trim()).toBe('Back');
  });

  it('aria-label defaults to "Back to pipeline"', () => {
    const fixture = setup();
    const btn = fixture.nativeElement.querySelector('.detail-back') as HTMLButtonElement;
    expect(btn.getAttribute('aria-label')).toBe('Back to pipeline');
  });

  it('aria-label reflects the bound ariaLabel input', () => {
    const fixture = setup();
    fixture.componentRef.setInput('ariaLabel', 'Back to calendar');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.detail-back') as HTMLButtonElement;
    expect(btn.getAttribute('aria-label')).toBe('Back to calendar');
  });

  it('clicking the button emits back exactly once per click', () => {
    const fixture = setup();
    let count = 0;
    fixture.componentInstance.back.subscribe(() => count++);
    const btn = fixture.nativeElement.querySelector('.detail-back') as HTMLButtonElement;
    btn.click();
    btn.click();
    expect(count).toBe(2);
  });
});
