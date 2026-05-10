import { TestBed } from '@angular/core/testing';
import { AiButtonComponent } from './ai-button.component';

function setup(props: Partial<AiButtonComponent> = {}) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [AiButtonComponent] });
  const fixture = TestBed.createComponent(AiButtonComponent);
  Object.assign(fixture.componentInstance, { label: 'AI Assist', ...props });
  fixture.detectChanges();
  return fixture;
}

describe('AiButtonComponent', () => {
  it('renders the label text inside a button', () => {
    const fixture = setup({ label: 'Hook Bank' });
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.textContent).toContain('Hook Bank');
  });

  it('emits activate when clicked', () => {
    const fixture = setup();
    let count = 0;
    fixture.componentInstance.activate.subscribe(() => count++);
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(count).toBe(1);
  });

  it('does not emit when disabled', () => {
    const fixture = setup({ disabled: true });
    let count = 0;
    fixture.componentInstance.activate.subscribe(() => count++);
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(count).toBe(0);
  });

  it('does not emit when loading', () => {
    const fixture = setup({ loading: true });
    let count = 0;
    fixture.componentInstance.activate.subscribe(() => count++);
    fixture.componentInstance['onClick']();
    expect(count).toBe(0);
  });

  it('shows the loadingLabel when loading=true', () => {
    const fixture = setup({ loading: true, loadingLabel: 'Generating…' });
    expect(fixture.nativeElement.textContent).toContain('Generating…');
  });

  it('falls back to label when loading=true but loadingLabel is null', () => {
    const fixture = setup({ loading: true, label: 'AI Assist' });
    expect(fixture.nativeElement.textContent).toContain('AI Assist');
  });

  it('sets aria-busy=true when loading', () => {
    const fixture = setup({ loading: true });
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.getAttribute('aria-busy')).toBe('true');
  });

  it('compact variant adds the modifier class', () => {
    const fixture = setup({ variant: 'compact' });
    expect(
      fixture.nativeElement.querySelector('button.ai-btn--compact'),
    ).toBeTruthy();
  });
});
