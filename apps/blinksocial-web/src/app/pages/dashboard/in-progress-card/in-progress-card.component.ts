import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import type { Workspace } from '../workspace-card/workspace-card.component';

@Component({
  selector: 'app-in-progress-card',
  imports: [CommonModule],
  templateUrl: './in-progress-card.component.html',
  styleUrl: './in-progress-card.component.scss',
})
export class InProgressCardComponent {
  private readonly router = inject(Router);

  workspace = input.required<Workspace>();

  get statusLabel(): string {
    return this.workspace().status === 'onboarding'
      ? 'Discovery in Progress'
      : 'Setup in Progress';
  }

  get statusClass(): string {
    return this.workspace().status === 'onboarding' ? 'badge-onboarding' : 'badge-creating';
  }

  onResume(): void {
    const ws = this.workspace();
    if (ws.status === 'onboarding') {
      this.router.navigate(['/onboard'], { queryParams: { workspace: ws.id } });
    } else {
      this.router.navigate(['/new-workspace'], { queryParams: { resume: ws.id } });
    }
  }
}
