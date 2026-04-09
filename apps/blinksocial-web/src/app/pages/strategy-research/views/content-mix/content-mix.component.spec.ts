import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ContentMixComponent } from './content-mix.component';
import { AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';

describe('ContentMixComponent', () => {
  let fixture: ComponentFixture<ContentMixComponent>;
  let component: ContentMixComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ContentMixComponent] });
    fixture = TestBed.createComponent(ContentMixComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('initializes with five default categories totalling 100%', () => {
    expect(component.mix().length).toBe(5);
    expect(component.total()).toBe(100);
    expect(component.isValid()).toBe(true);
  });

  it('updateTarget changes only the matching category', () => {
    component.updateTarget('educational', 50);
    const ed = component.mix().find(m => m.category === 'educational');
    const ent = component.mix().find(m => m.category === 'entertaining');
    expect(ed?.targetPercent).toBe(50);
    expect(ent?.targetPercent).toBe(25);
  });

  it('total recomputes after updateTarget and isValid flips', () => {
    component.updateTarget('educational', 0);
    expect(component.total()).toBe(65);
    expect(component.isValid()).toBe(false);
  });

  it('reset restores defaults', () => {
    component.updateTarget('educational', 5);
    component.reset();
    expect(component.mix().find(m => m.category === 'educational')?.targetPercent).toBe(35);
    expect(component.total()).toBe(100);
  });

  it('aiSuggest sets isSuggesting and updates targets after timeout', () => {
    vi.useFakeTimers();
    component.aiSuggest();
    expect(component.isSuggesting()).toBe(true);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.isSuggesting()).toBe(false);
    expect(component.mix().find(m => m.category === 'educational')?.targetPercent).toBe(30);
    expect(component.mix().find(m => m.category === 'community')?.targetPercent).toBe(25);
    vi.useRealTimers();
  });

  it('renders header, target card, and comparison card', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.page-header-title')?.textContent).toContain('Content Mix Framework');
    expect(el.querySelectorAll('.mix-card').length).toBe(2);
    expect(el.querySelectorAll('.mix-row').length).toBe(5);
    expect(el.querySelectorAll('.comparison-row').length).toBe(5);
  });

  it('shows valid total indicator when balanced', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.total-valid')).toBeTruthy();
    expect(el.querySelector('.total-invalid')).toBeFalsy();
  });

  it('shows invalid total indicator when not balanced', () => {
    component.updateTarget('educational', 0);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.total-invalid')).toBeTruthy();
  });

  it('reset button click resets the mix', () => {
    component.updateTarget('educational', 10);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const btn = el.querySelector('.btn-reset') as HTMLButtonElement;
    btn.click();
    expect(component.mix().find(m => m.category === 'educational')?.targetPercent).toBe(35);
  });

  it('AI Suggest button click invokes aiSuggest', () => {
    vi.useFakeTimers();
    const el = fixture.nativeElement as HTMLElement;
    const btn = el.querySelector('.btn-ai-suggest') as HTMLButtonElement;
    btn.click();
    expect(component.isSuggesting()).toBe(true);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    vi.useRealTimers();
  });

  it('renders below-target badge for categories far below target', () => {
    component.mix.update(list =>
      list.map(m => m.category === 'educational' ? { ...m, actualPercent: 5 } : m),
    );
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.comparison-badge--below')).toBeTruthy();
  });

  it('aiSuggest preserves unknown categories via nullish fallback', () => {
    vi.useFakeTimers();
    component.mix.update(list => [
      ...list,
      // Add a non-standard category that won't be in the suggested map
      { category: 'custom' as never, label: 'Custom', targetPercent: 5, color: '#000', description: '', actualPercent: 0 },
    ]);
    component.aiSuggest();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.mix().find(m => m.category === ('custom' as never))?.targetPercent).toBe(5);
    vi.useRealTimers();
  });

  it('renders above-target badge for categories far above target', () => {
    component.mix.update(list =>
      list.map(m => m.category === 'educational' ? { ...m, actualPercent: 90 } : m),
    );
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.comparison-badge--above')).toBeTruthy();
  });
});
