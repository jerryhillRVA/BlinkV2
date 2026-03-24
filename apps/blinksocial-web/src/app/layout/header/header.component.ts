import { Component, EventEmitter, Output, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { ThemeService } from '../../core/theme/theme.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  @Output() logout = new EventEmitter<void>();

  protected readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly menuOpen = signal(false);
  readonly workspaceId = signal<string | null>(null);

  ngOnInit(): void {
    this.updateWorkspaceId(this.router.url);
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((e) => this.updateWorkspaceId((e as NavigationEnd).urlAfterRedirects));
  }

  private updateWorkspaceId(url: string): void {
    const match = url.match(/^\/workspace\/([^/]+)/);
    this.workspaceId.set(match ? match[1] : null);
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  onLogout(): void {
    this.closeMenu();
    this.logout.emit();
  }
}
