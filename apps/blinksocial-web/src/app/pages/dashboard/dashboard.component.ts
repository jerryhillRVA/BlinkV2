import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  workspaces: Workspace[] = [
    { name: 'Hive Collective', color: '#e8533f' },
    { name: 'Booze Kills', color: '#2979ff' },
  ];

  onCreateWorkspace() {
    // Placeholder — will be implemented
  }
}
