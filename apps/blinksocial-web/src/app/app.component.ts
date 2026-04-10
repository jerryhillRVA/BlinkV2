import { Component, inject, signal, DestroyRef, ElementRef } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { AuthService } from './core/auth/auth.service';

@Component({
  imports: [RouterModule, HeaderComponent, FooterComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class App {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly el = inject(ElementRef);

  readonly wsAnimating = signal(false);

  private lastWorkspaceId: string | null = null;

  constructor() {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((e) => {
        const url = (e as NavigationEnd).urlAfterRedirects;
        const match = url.match(/^\/workspace\/([^/]+)/);
        const wsId = match ? match[1] : null;

        if (wsId && this.lastWorkspaceId && wsId !== this.lastWorkspaceId) {
          this.replayPageAnimation();
        }
        this.lastWorkspaceId = wsId;
      });
  }

  private replayPageAnimation(): void {
    // The routed component is rendered as a sibling after <router-outlet>,
    // so we find the element that has the page-enter animation applied
    // (app-content, app-strategy-research, app-workspace-settings, etc.)
    const main = this.el.nativeElement.querySelector('.main-content');
    if (!main) return;

    // Find the routed component (last element child, after router-outlet)
    const children = main.children;
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i] as HTMLElement;
      if (child.tagName !== 'ROUTER-OUTLET') {
        child.style.animation = 'none';
        void child.offsetHeight;
        child.style.animation = '';
        break;
      }
    }
  }
}
