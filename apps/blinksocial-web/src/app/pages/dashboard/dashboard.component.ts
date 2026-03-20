import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  WorkspaceCardComponent,
  Workspace,
} from './workspace-card/workspace-card.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, WorkspaceCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly router = inject(Router);

  workspaces: Workspace[] = [
    { id: 'hive-collective', name: 'Hive Collective', color: '#d94e33' },
    { id: 'booze-kills', name: 'Booze Kills', color: '#2b6bff' },
  ];

  onCreateWorkspace() {
    this.router.navigate(['/new-workspace']);
  }

  onGoToWorkspace(id: string) {
    this.router.navigate(['/workspace', id, 'settings']);
  }
}
