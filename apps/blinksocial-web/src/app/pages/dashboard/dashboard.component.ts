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
    { name: 'Hive Collective', color: '#d94e33' },
    { name: 'Booze Kills', color: '#2b6bff' },
  ];

  onCreateWorkspace() {
    this.router.navigate(['/new-workspace']);
  }
}
