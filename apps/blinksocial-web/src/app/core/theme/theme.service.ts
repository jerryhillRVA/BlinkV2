import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'blink-theme';
const VALID_THEMES: Theme[] = ['light', 'dark'];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly _theme = signal<Theme>(this.loadInitialTheme());

  readonly theme = this._theme.asReadonly();
  readonly isDark = computed(() => this._theme() === 'dark');
  readonly availableThemes: readonly Theme[] = VALID_THEMES;

  constructor() {
    this.applyTheme(this._theme());
  }

  setTheme(theme: Theme): void {
    this._theme.set(theme);
    this.applyTheme(theme);
    this.persist(theme);
  }

  toggleTheme(): void {
    this.setTheme(this._theme() === 'light' ? 'dark' : 'light');
  }

  private loadInitialTheme(): Theme {
    if (!this.isBrowser) return 'light';
    const stored = localStorage.getItem(STORAGE_KEY);
    return VALID_THEMES.includes(stored as Theme) ? (stored as Theme) : 'light';
  }

  private applyTheme(theme: Theme): void {
    if (!this.isBrowser) return;
    document.documentElement.setAttribute('data-theme', theme);
  }

  private persist(theme: Theme): void {
    if (!this.isBrowser) return;
    localStorage.setItem(STORAGE_KEY, theme);
  }
}
