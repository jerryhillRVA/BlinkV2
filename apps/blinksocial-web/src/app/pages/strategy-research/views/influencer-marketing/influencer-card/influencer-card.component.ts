import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformIconComponent } from '../../../../../shared/platform-icon/platform-icon.component';
import type { InfluencerProfile } from '../../../strategy-research.types';
import { INFLUENCER_TIER_LABELS, OBJECTIVE_CATEGORY_CONFIG } from '../../../strategy-research.constants';
import { formatFollowers, getInitials } from '../../../influencer.helpers';

@Component({
  selector: 'app-influencer-card',
  imports: [CommonModule, PlatformIconComponent],
  templateUrl: './influencer-card.component.html',
  styleUrl: './influencer-card.component.scss',
})
export class InfluencerCardComponent {
  /* v8 ignore start */
  readonly profile = input.required<InfluencerProfile>();
  readonly isShortlisted = input<boolean>(false);

  readonly shortlist = output<InfluencerProfile>();
  readonly outreach = output<InfluencerProfile>();
  readonly dismiss = output<InfluencerProfile>();
  /* v8 ignore stop */

  readonly initials = computed(() => getInitials(this.profile().name));
  readonly followersLabel = computed(() => formatFollowers(this.profile().followers));
  readonly tierLabel = computed(() => INFLUENCER_TIER_LABELS[this.profile().tier]);
  readonly categoryConfig = OBJECTIVE_CATEGORY_CONFIG;

  onShortlist(): void {
    this.shortlist.emit(this.profile());
  }

  onOutreach(): void {
    this.outreach.emit(this.profile());
  }

  onDismiss(): void {
    this.dismiss.emit(this.profile());
  }
}
