import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  WorkspaceCardComponent,
  Workspace,
} from './workspace-card/workspace-card.component';
import { InProgressCardComponent } from './in-progress-card/in-progress-card.component';
import { DashboardApiService } from './dashboard-api.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, WorkspaceCardComponent, InProgressCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly authService = inject(AuthService);

  readonly canOnboard = computed(() => this.authService.isAnyWorkspaceAdmin());

  workspaces = signal<Workspace[]>([]);
  loading = signal(true);

  readonly activeWorkspaces = computed(() =>
    this.workspaces().filter((w) => !w.status || w.status === 'active')
  );

  readonly inProgressWorkspaces = computed(() =>
    this.workspaces().filter((w) => w.status === 'onboarding' || w.status === 'creating')
  );

  ngOnInit(): void {
    this.dashboardApi.listWorkspaces().subscribe({
      next: (response) => {
        this.workspaces.set(
          response.workspaces.map((w) => ({
            id: w.id,
            name: w.name,
            color: w.color,
            status: w.status ?? 'active',
          }))
        );
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  onCreateWorkspace() {
    this.router.navigate(['/new-workspace']);
  }

  onOnboardWorkspace() {
    if (this.canOnboard()) {
      this.router.navigate(['/onboard']);
    }
  }

  onGoToWorkspace(id: string) {
    this.router.navigate(['/workspace', id, 'settings']);
  }

  onGoToStrategy(id: string) {
    this.router.navigate(['/workspace', id, 'strategy']);
  }
}
