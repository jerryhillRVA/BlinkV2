import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  WorkspaceCardComponent,
  Workspace,
} from './workspace-card/workspace-card';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, WorkspaceCardComponent],
  template: `
    <div class="dashboard">
      <header class="dashboard-header">
        <h1>Welcome back!</h1>
        <p class="subtitle">
          Manage your workspaces and content all in one place.
        </p>
      </header>

      <div class="workspace-grid">
        @for (workspace of workspaces; track workspace.name) {
          <app-workspace-card [workspace]="workspace" />
        }

        <button class="card card-new" (click)="onCreateWorkspace()">
          <div class="new-content">
            <span class="plus-icon">+</span>
            <span class="new-label">New Workspace</span>
          </div>
        </button>
      </div>
    </div>
  `,
  styles: `
    .dashboard {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 24px;
    }

    .dashboard-header {
      margin-bottom: 32px;
    }

    .dashboard-header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: #222;
    }

    .subtitle {
      margin: 8px 0 0;
      color: #666;
      font-size: 15px;
    }

    .workspace-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }

    .card-new {
      appearance: none;
      font: inherit;
      background: white;
      border: 2px dashed #d0d0d0;
      border-radius: 12px;
      min-height: 180px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
    }

    .card-new:hover {
      border-color: #e8533f;
      background: #fef2f0;
    }

    .card-new:hover .plus-icon {
      color: #e8533f;
    }

    .new-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .plus-icon {
      font-size: 36px;
      font-weight: 300;
      color: #bbb;
      transition: color 0.2s;
    }

    .new-label {
      font-size: 14px;
      color: #888;
      font-weight: 500;
    }
  `,
})
export class DashboardComponent {
  workspaces: Workspace[] = [
    { name: 'Marketing Team', color: '#e8533f' },
    { name: 'Product Launch', color: '#4a90d9' },
    { name: 'Brand Design', color: '#7c5cbf' },
  ];

  onCreateWorkspace() {
    // Placeholder — will be implemented
  }
}
