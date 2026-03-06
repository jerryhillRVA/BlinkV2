import { TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display brand text "BLINK"', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.brand-text')?.textContent).toBe('BLINK');
  });

  it('should have a brand icon with SVG', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const icon = el.querySelector('.brand-icon');
    expect(icon).toBeTruthy();
    expect(icon?.querySelector('svg')).toBeTruthy();
  });

  it('should display user name and role', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.user-name')?.textContent).toBe('Brett Lewis');
    expect(el.querySelector('.user-role')?.textContent).toBe('Admin');
  });

  it('should display avatar with initials "BL"', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.avatar-placeholder')?.textContent?.trim()).toBe('BL');
  });

  it('should have a logout button that emits event', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const el: HTMLElement = fixture.nativeElement;
    const logoutBtn = el.querySelector('.logout-btn') as HTMLButtonElement;
    expect(logoutBtn).toBeTruthy();

    const spy = vi.fn();
    component.logout.subscribe(spy);
    logoutBtn.click();
    expect(spy).toHaveBeenCalled();
  });
});
