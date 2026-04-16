import { Component, DestroyRef, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InfluencerCardComponent } from '../influencer-card/influencer-card.component';
import { PlatformIconComponent } from '../../../../../shared/platform-icon/platform-icon.component';
import { StrategyResearchStateService } from '../../../strategy-research-state.service';
import { ToastService } from '../../../../../core/toast/toast.service';
import type { InfluencerProfile, InfluencerTier, ObjectiveCategory, Platform } from '../../../strategy-research.types';
import {
  AI_SIMULATION_DELAY_MS,
  INFLUENCER_DISCOVERY_PLATFORMS,
  INFLUENCER_DISCOVERY_TIERS,
  INFLUENCER_TIER_LABELS,
  INFLUENCER_TIER_ORDER,
  OBJECTIVE_CATEGORY_CONFIG,
} from '../../../strategy-research.constants';
import { generateInfluencerPool, getInitials, formatFollowers } from '../../../influencer.helpers';
import { safeTimeout } from '../../../strategy-research.utils';

type SortKey = 'audienceAlignment' | 'followers' | 'engagementRate' | 'tier';
type SortDir = 'asc' | 'desc';
type PageMode = 25 | 'all';

const PAGE_SIZE = 25;

@Component({
  selector: 'app-influencer-discovery-tab',
  imports: [CommonModule, FormsModule, InfluencerCardComponent, PlatformIconComponent],
  templateUrl: './discovery-tab.component.html',
  styleUrl: './discovery-tab.component.scss',
})
export class DiscoveryTabComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);
  protected readonly stateService = inject(StrategyResearchStateService);

  /* v8 ignore start */
  readonly outreach = output<InfluencerProfile>();

  readonly keyword = signal('');
  readonly platformFilters = signal<Platform[]>([]);
  readonly tierFilters = signal<InfluencerTier[]>([]);
  readonly sortBy = signal<SortKey>('audienceAlignment');
  readonly sortDir = signal<SortDir>('desc');
  readonly pageMode = signal<PageMode>(25);
  readonly currentPage = signal(1);
  readonly isDiscovering = signal(false);
  readonly hasSearched = signal(false);
  readonly totalDiscovered = signal<InfluencerProfile[]>([]);
  readonly showDismissed = signal(false);
  /* v8 ignore stop */

  readonly platformOptions = INFLUENCER_DISCOVERY_PLATFORMS;
  readonly tierOptions = INFLUENCER_DISCOVERY_TIERS;
  readonly tierLabels = INFLUENCER_TIER_LABELS;
  readonly categoryConfig = OBJECTIVE_CATEGORY_CONFIG;
  readonly sortOptions: { key: SortKey; label: string }[] = [
    { key: 'audienceAlignment', label: 'Audience Match' },
    { key: 'followers', label: 'Followers' },
    { key: 'engagementRate', label: 'Engagement Rate' },
    { key: 'tier', label: 'Tier' },
  ];

  readonly uniqueObjectiveCategories = computed<ObjectiveCategory[]>(() => {
    const seen = new Set<ObjectiveCategory>();
    const result: ObjectiveCategory[] = [];
    for (const o of this.stateService.objectives()) {
      if (!seen.has(o.category)) {
        seen.add(o.category);
        result.push(o.category);
      }
    }
    return result;
  });

  readonly filteredSorted = computed(() => {
    const q = this.keyword().trim().toLowerCase();
    const base = this.totalDiscovered();
    const filtered = q === ''
      ? base
      : base.filter((p) =>
          p.name.toLowerCase().includes(q) ||
          p.handle.toLowerCase().includes(q) ||
          p.niche.some((n) => n.toLowerCase().includes(q)) ||
          p.bio.toLowerCase().includes(q) ||
          p.tier.toLowerCase().includes(q),
        );
    const key = this.sortBy();
    const dir = this.sortDir();
    return [...filtered].sort((a, b) => {
      const valA = key === 'tier' ? INFLUENCER_TIER_ORDER[a.tier] : (a[key] as number);
      const valB = key === 'tier' ? INFLUENCER_TIER_ORDER[b.tier] : (b[key] as number);
      return dir === 'desc' ? valB - valA : valA - valB;
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredSorted().length / PAGE_SIZE)));

  readonly paged = computed(() => {
    if (this.pageMode() === 'all') return this.filteredSorted();
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filteredSorted().slice(start, start + PAGE_SIZE);
  });

  readonly rangeStart = computed(() => (this.filteredSorted().length === 0 ? 0 : (this.pageMode() === 'all' ? 1 : (this.currentPage() - 1) * PAGE_SIZE + 1)));
  readonly rangeEnd = computed(() => this.pageMode() === 'all' ? this.filteredSorted().length : Math.min(this.currentPage() * PAGE_SIZE, this.filteredSorted().length));

  readonly dismissedCount = computed(() => this.stateService.dismissedInfluencers().length);

  isPlatformActive(p: Platform): boolean {
    return this.platformFilters().includes(p);
  }

  togglePlatform(p: Platform): void {
    this.platformFilters.update((list) => (list.includes(p) ? list.filter((x) => x !== p) : [...list, p]));
    this.currentPage.set(1);
  }

  isTierActive(t: InfluencerTier): boolean {
    return this.tierFilters().includes(t);
  }

  toggleTier(t: InfluencerTier): void {
    this.tierFilters.update((list) => (list.includes(t) ? list.filter((x) => x !== t) : [...list, t]));
    this.currentPage.set(1);
  }

  setSort(key: SortKey): void {
    if (this.sortBy() === key) {
      this.sortDir.update((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      this.sortBy.set(key);
      this.sortDir.set('desc');
    }
    this.currentPage.set(1);
  }

  toggleSortDir(): void {
    this.sortDir.update((d) => (d === 'desc' ? 'asc' : 'desc'));
    this.currentPage.set(1);
  }

  setPageMode(mode: PageMode): void {
    this.pageMode.set(mode);
    this.currentPage.set(1);
  }

  onKeywordChange(value: string): void {
    this.keyword.set(value);
    this.currentPage.set(1);
  }

  prevPage(): void {
    this.currentPage.update((p) => Math.max(1, p - 1));
  }

  nextPage(): void {
    this.currentPage.update((p) => Math.min(this.totalPages(), p + 1));
  }

  findInfluencers(): void {
    this.isDiscovering.set(true);
    safeTimeout(() => {
      const dismissed = new Set(this.stateService.dismissedInfluencers().map((d) => d.handle));
      const shortlisted = new Set(this.stateService.shortlistedInfluencers().map((s) => s.handle));
      let pool = generateInfluencerPool(60);
      if (this.platformFilters().length > 0) {
        pool = pool.filter((p) => p.platforms.some((pl) => this.platformFilters().includes(pl)));
      }
      if (this.tierFilters().length > 0) {
        pool = pool.filter((p) => this.tierFilters().includes(p.tier));
      }
      pool = pool.filter((p) => !dismissed.has(p.handle) && !shortlisted.has(p.handle));
      const results = pool.slice(0, 50);
      this.totalDiscovered.set(results);
      this.currentPage.set(1);
      this.isDiscovering.set(false);
      this.hasSearched.set(true);
      this.toast.showSuccess(`Found ${results.length} influencers matching your strategy`);
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }

  readonly shortlistedHandles = computed(
    () => new Set(this.stateService.shortlistedInfluencers().map((s) => s.handle)),
  );

  isShortlisted(handle: string): boolean {
    return this.shortlistedHandles().has(handle);
  }

  addToShortlist(profile: InfluencerProfile): void {
    if (this.isShortlisted(profile.handle)) return;
    const next = [...this.stateService.shortlistedInfluencers(), {
      ...profile,
      status: 'new' as const,
      addedAt: new Date().toISOString(),
    }];
    this.stateService.saveShortlist(next);
    this.toast.showSuccess('Added to shortlist');
  }

  onOutreach(profile: InfluencerProfile): void {
    this.outreach.emit(profile);
  }

  dismissProfile(profile: InfluencerProfile): void {
    const nextDismissed = [...this.stateService.dismissedInfluencers(), profile];
    this.stateService.saveDismissedInfluencers(nextDismissed);
    this.totalDiscovered.update((list) => list.filter((p) => p.handle !== profile.handle));
    const totalAfter = this.filteredSorted().length;
    const totalPages = Math.max(1, Math.ceil(totalAfter / PAGE_SIZE));
    if (this.currentPage() > totalPages) {
      this.currentPage.set(totalPages);
    }
    this.toast.showSuccess('Creator hidden');
  }

  toggleDismissedPanel(): void {
    this.showDismissed.update((v) => !v);
  }

  restoreOne(profile: InfluencerProfile): void {
    const next = this.stateService.dismissedInfluencers().filter((p) => p.handle !== profile.handle);
    this.stateService.saveDismissedInfluencers(next);
    this.totalDiscovered.update((list) => [...list, profile]);
    this.toast.showSuccess('Creator restored');
  }

  restoreAll(): void {
    this.stateService.saveDismissedInfluencers([]);
    this.toast.showSuccess('All creators restored');
  }

  dismissedInitials(name: string): string {
    return getInitials(name);
  }

  dismissedFollowersLabel(n: number): string {
    return formatFollowers(n);
  }

  trackByHandle = (_index: number, profile: InfluencerProfile): string => profile.handle;
}
