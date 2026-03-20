import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');

    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default to light theme', () => {
    expect(service.theme()).toBe('light');
  });

  it('should set data-theme attribute on <html> when theme changes', () => {
    service.setTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should update the theme signal when setTheme is called', () => {
    service.setTheme('dark');
    expect(service.theme()).toBe('dark');
  });

  it('should toggle between light and dark', () => {
    expect(service.theme()).toBe('light');
    service.toggleTheme();
    expect(service.theme()).toBe('dark');
    service.toggleTheme();
    expect(service.theme()).toBe('light');
  });

  it('should persist theme to localStorage', () => {
    service.setTheme('dark');
    expect(localStorage.getItem('blink-theme')).toBe('dark');
  });

  it('should restore theme from localStorage on init', () => {
    localStorage.setItem('blink-theme', 'dark');
    // Re-run init by creating new instance
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const newService = TestBed.inject(ThemeService);
    expect(newService.theme()).toBe('dark');
  });

  it('should ignore invalid stored values and default to light', () => {
    localStorage.setItem('blink-theme', 'neon-pink');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const newService = TestBed.inject(ThemeService);
    expect(newService.theme()).toBe('light');
  });

  it('should report isDark correctly', () => {
    expect(service.isDark()).toBe(false);
    service.setTheme('dark');
    expect(service.isDark()).toBe(true);
    service.setTheme('light');
    expect(service.isDark()).toBe(false);
  });

  it('should expose available themes', () => {
    expect(service.availableThemes).toContain('light');
    expect(service.availableThemes).toContain('dark');
  });

  it('should set data-theme to light on init when no stored value', () => {
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('should default to light when stored value is null', () => {
    localStorage.removeItem('blink-theme');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const newService = TestBed.inject(ThemeService);
    expect(newService.theme()).toBe('light');
  });
});

describe('ThemeService (SSR / server platform)', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    service = TestBed.inject(ThemeService);
  });

  it('should default to light theme on server', () => {
    expect(service.theme()).toBe('light');
  });

  it('should not throw when setting theme on server', () => {
    expect(() => service.setTheme('dark')).not.toThrow();
    expect(service.theme()).toBe('dark');
  });

  it('should toggle theme on server without error', () => {
    service.toggleTheme();
    expect(service.theme()).toBe('dark');
  });

  it('should report isDark correctly on server', () => {
    expect(service.isDark()).toBe(false);
    service.setTheme('dark');
    expect(service.isDark()).toBe(true);
  });
});
