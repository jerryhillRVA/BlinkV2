import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Workspace {
  name: string;
  color: string;
}

@Component({
  selector: 'app-workspace-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="card-header" [style.background]="workspace.color"></div>
      <div class="card-body">
        <h3 class="card-title">{{ workspace.name }}</h3>
        <div class="quick-access">
          <span class="quick-label">QUICK ACCESS</span>
          <div class="quick-links">
            <a href="#">Content</a>
            <a href="#">Calendar</a>
            <a href="#">Performance</a>
            <a href="#">Strategy</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      transition: box-shadow 0.2s, transform 0.2s;
    }

    .card:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .card-header {
      height: 8px;
    }

    .card-body {
      padding: 20px;
    }

    .card-title {
      margin: 0 0 16px;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .quick-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1px;
      color: #999;
    }

    .quick-links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }

    .quick-links a {
      font-size: 13px;
      color: #e8533f;
      text-decoration: none;
      padding: 4px 10px;
      border-radius: 6px;
      background: #fef2f0;
      transition: background 0.15s;
    }

    .quick-links a:hover {
      background: #fde0dc;
    }
  `,
})
export class WorkspaceCardComponent {
  @Input() workspace!: Workspace;
}
