import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Workspace {
  name: string;
  color: string;
}

@Component({
  selector: 'app-workspace-card',
  imports: [CommonModule],
  templateUrl: './workspace-card.component.html',
  styleUrl: './workspace-card.component.scss',
})
export class WorkspaceCardComponent {
  @Input() workspace!: Workspace;
}
