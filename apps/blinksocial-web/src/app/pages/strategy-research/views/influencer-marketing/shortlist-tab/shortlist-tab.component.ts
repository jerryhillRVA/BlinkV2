import { Component, computed, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformIconComponent } from '../../../../../shared/platform-icon/platform-icon.component';
import { DropdownComponent, DropdownOption } from '../../../../../shared/dropdown/dropdown.component';
import { StrategyResearchStateService } from '../../../strategy-research-state.service';
import { ToastService } from '../../../../../core/toast/toast.service';
import type { InfluencerStatus, ShortlistedInfluencer } from '../../../strategy-research.types';
import { INFLUENCER_STATUS_OPTIONS, INFLUENCER_TIER_LABELS } from '../../../strategy-research.constants';
import { formatFollowers, getInitials } from '../../../influencer.helpers';

@Component({
  selector: 'app-influencer-shortlist-tab',
  imports: [CommonModule, PlatformIconComponent, DropdownComponent],
  templateUrl: './shortlist-tab.component.html',
  styleUrl: './shortlist-tab.component.scss',
})
export class ShortlistTabComponent {
  private readonly toast = inject(ToastService);
  protected readonly stateService = inject(StrategyResearchStateService);

  readonly openOutreach = output<ShortlistedInfluencer>();
  readonly openBrief = output<ShortlistedInfluencer>();

  readonly shortlist = computed(() => this.stateService.shortlistedInfluencers());
  readonly tierLabels = INFLUENCER_TIER_LABELS;
  readonly statusOptions: DropdownOption[] = INFLUENCER_STATUS_OPTIONS.map((s) => ({
    value: s.value,
    label: s.label,
  }));

  initials(name: string): string {
    return getInitials(name);
  }

  followersLabel(n: number): string {
    return formatFollowers(n);
  }

  updateStatus(handle: string, status: string): void {
    const next = this.shortlist().map((s) =>
      s.handle === handle ? { ...s, status: status as InfluencerStatus } : s,
    );
    this.stateService.saveShortlist(next);
    this.toast.showSuccess('Status updated');
  }

  remove(handle: string): void {
    const next = this.shortlist().filter((s) => s.handle !== handle);
    this.stateService.saveShortlist(next);
    this.toast.showSuccess('Removed from shortlist');
  }

  draftOutreach(inf: ShortlistedInfluencer): void {
    this.openOutreach.emit(inf);
  }

  createBrief(inf: ShortlistedInfluencer): void {
    this.openBrief.emit(inf);
  }

  trackByHandle = (_index: number, item: ShortlistedInfluencer): string => item.handle;
}
