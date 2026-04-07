import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Workspace {
  id: string;
  name: string;
  color: string;
  status?: string;
}

@Component({
  selector: 'app-workspace-card',
  imports: [CommonModule],
  templateUrl: './workspace-card.component.html',
  styleUrl: './workspace-card.component.scss',
})
export class WorkspaceCardComponent {
  @Input() workspace!: Workspace;
  @Output() goToWorkspace = new EventEmitter<string>();
  @Output() goToStrategy = new EventEmitter<string>();
}
