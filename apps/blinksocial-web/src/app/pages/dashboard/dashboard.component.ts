import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  WorkspaceCardComponent,
  Workspace,
} from './workspace-card/workspace-card.component';
import { DashboardApiService } from './dashboard-api.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, WorkspaceCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly dashboardApi = inject(DashboardApiService);

  workspaces = signal<Workspace[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.dashboardApi.listWorkspaces().subscribe({
      next: (response) => {
        this.workspaces.set(
          response.workspaces.map((w) => ({
            id: w.id,
            name: w.name,
            color: w.color,
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
}
