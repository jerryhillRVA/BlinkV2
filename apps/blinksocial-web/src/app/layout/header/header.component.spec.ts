import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HeaderComponent } from './header.component';
import { ThemeService } from '../../core/theme/theme.service';

describe('HeaderComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display brand text "BLINK SOCIAL"', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.brand-text')?.textContent).toBe('BLINK SOCIAL');
  });

  it('should have a brand icon with SVG', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const icon = el.querySelector('.brand-icon');
    expect(icon).toBeTruthy();
    expect(icon?.querySelector('svg')).toBeTruthy();
  });

  it('should have a clickable brand link to dashboard', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const brandLink = el.querySelector('.navbar-brand') as HTMLAnchorElement;
    expect(brandLink).toBeTruthy();
    expect(brandLink.tagName).toBe('A');
    expect(brandLink.getAttribute('href')).toBe('/');
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

  it('should have a theme toggle button', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.theme-toggle-btn')).toBeTruthy();
  });

  it('should show moon icon in light mode', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const btn = el.querySelector('.theme-toggle-btn');
    expect(btn?.querySelector('.icon-moon')).toBeTruthy();
    expect(btn?.querySelector('.icon-sun')).toBeFalsy();
  });

  it('should show sun icon in dark mode', () => {
    const themeService = TestBed.inject(ThemeService);
    themeService.setTheme('dark');
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const btn = el.querySelector('.theme-toggle-btn');
    expect(btn?.querySelector('.icon-sun')).toBeTruthy();
    expect(btn?.querySelector('.icon-moon')).toBeFalsy();
  });

  it('should toggle theme when toggle button is clicked', () => {
    const themeService = TestBed.inject(ThemeService);
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    expect(themeService.theme()).toBe('light');

    const el: HTMLElement = fixture.nativeElement;
    const btn = el.querySelector('.theme-toggle-btn') as HTMLButtonElement;
    btn.click();
    expect(themeService.theme()).toBe('dark');

    btn.click();
    expect(themeService.theme()).toBe('light');
  });
});
