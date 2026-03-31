import { TestBed } from '@angular/core/testing';
import { OutlineButtonComponent } from './outline-button.component';

describe('OutlineButtonComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<OutlineButtonComponent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutlineButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OutlineButtonComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render a button with outline-btn class', () => {
    const btn = fixture.nativeElement.querySelector('.outline-btn');
    expect(btn).toBeTruthy();
  });

  it('should emit clicked on click', () => {
    const spy = vi.fn();
    fixture.componentInstance.clicked.subscribe(spy);
    fixture.nativeElement.querySelector('.outline-btn').click();
    expect(spy).toHaveBeenCalled();
  });

  it('should not emit when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const spy = vi.fn();
    fixture.componentInstance.clicked.subscribe(spy);
    fixture.nativeElement.querySelector('.outline-btn').click();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should set disabled attribute on button', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.outline-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});
