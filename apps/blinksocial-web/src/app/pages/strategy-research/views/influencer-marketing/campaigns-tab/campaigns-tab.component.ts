import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownComponent, DropdownOption } from '../../../../../shared/dropdown/dropdown.component';
import { PlatformIconComponent } from '../../../../../shared/platform-icon/platform-icon.component';
import { StrategyResearchStateService } from '../../../strategy-research-state.service';
import { ToastService } from '../../../../../core/toast/toast.service';
import type {
  CampaignStatus,
  InfluencerCampaign,
  InfluencerCampaignMetrics,
  Platform,
  ShortlistedInfluencer,
} from '../../../strategy-research.types';
import {
  AI_SIMULATION_DELAY_MS,
  CAMPAIGN_STATUS_OPTIONS,
  INFLUENCER_TIER_LABELS,
  OBJECTIVE_CATEGORY_CONFIG,
  PLATFORM_LABELS,
} from '../../../strategy-research.constants';
import {
  computeEngagementRate,
  formatFollowers,
  generateCampaignMetrics,
} from '../../../influencer.helpers';
import { generateId, safeTimeout } from '../../../strategy-research.utils';

interface AddFormState {
  campaignName: string;
  influencerHandle: string;
  objectiveId: string;
  platforms: Platform[];
  status: CampaignStatus;
  startDate: string;
  postDate: string;
}

const EMPTY_ADD_FORM: AddFormState = {
  campaignName: '',
  influencerHandle: '',
  objectiveId: '',
  platforms: [],
  status: 'planning',
  startDate: '',
  postDate: '',
};

const METRIC_KEYS = ['reach', 'impressions', 'engagements', 'clicks', 'conversions'] as const;
type MetricKey = (typeof METRIC_KEYS)[number];

const METRIC_LABELS: Record<MetricKey, string> = {
  reach: 'Reach',
  impressions: 'Impressions',
  engagements: 'Engagements',
  clicks: 'Clicks',
  conversions: 'Conversions',
};

@Component({
  selector: 'app-influencer-campaigns-tab',
  imports: [CommonModule, FormsModule, DropdownComponent, PlatformIconComponent],
  templateUrl: './campaigns-tab.component.html',
  styleUrl: './campaigns-tab.component.scss',
})
export class CampaignsTabComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);
  protected readonly stateService = inject(StrategyResearchStateService);

  /* v8 ignore start */
  readonly showAddForm = signal(false);
  readonly addForm = signal<AddFormState>({ ...EMPTY_ADD_FORM });
  readonly syncingId = signal<string | null>(null);
  /* v8 ignore stop */

  readonly campaigns = computed(() => this.stateService.influencerCampaigns());
  readonly shortlist = computed(() => this.stateService.shortlistedInfluencers());
  readonly tierLabels = INFLUENCER_TIER_LABELS;
  readonly platformLabels = PLATFORM_LABELS;
  readonly statusOptions: DropdownOption[] = CAMPAIGN_STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }));
  readonly metricKeys = METRIC_KEYS;
  readonly metricLabels = METRIC_LABELS;

  readonly influencerOptions = computed<DropdownOption[]>(() =>
    this.shortlist().map((s) => ({ value: s.handle, label: `${s.name} (${s.handle})` })),
  );

  readonly objectiveOptions = computed<DropdownOption[]>(() =>
    this.stateService.objectives().map((o) => ({
      value: o.id,
      label: `${OBJECTIVE_CATEGORY_CONFIG[o.category].emoji} ${o.statement}`,
    })),
  );

  readonly selectedAddInfluencer = computed<ShortlistedInfluencer | null>(() =>
    this.shortlist().find((s) => s.handle === this.addForm().influencerHandle) ?? null,
  );

  toggleAddForm(): void {
    this.showAddForm.update((v) => !v);
    if (!this.showAddForm()) {
      this.addForm.set({ ...EMPTY_ADD_FORM });
    }
  }

  updateAddField<K extends keyof AddFormState>(field: K, value: AddFormState[K]): void {
    this.addForm.update((f) => ({ ...f, [field]: value }));
  }

  toggleAddPlatform(p: Platform): void {
    this.addForm.update((f) =>
      f.platforms.includes(p)
        ? { ...f, platforms: f.platforms.filter((x) => x !== p) }
        : { ...f, platforms: [...f.platforms, p] },
    );
  }

  isAddPlatformActive(p: Platform): boolean {
    return this.addForm().platforms.includes(p);
  }

  setAddInfluencer(handle: string): void {
    const inf = this.shortlist().find((s) => s.handle === handle);
    this.addForm.update((f) => ({
      ...f,
      influencerHandle: handle,
      platforms: inf ? [...inf.platforms] : f.platforms,
    }));
  }

  canSaveNewCampaign(): boolean {
    const f = this.addForm();
    return !!f.campaignName.trim() && !!f.influencerHandle;
  }

  saveNewCampaign(): void {
    if (!this.canSaveNewCampaign()) return;
    const f = this.addForm();
    const inf = this.selectedAddInfluencer();
    if (!inf) return;
    const objective = this.stateService.objectives().find((o) => o.id === f.objectiveId);
    const campaign: InfluencerCampaign = {
      id: generateId('camp'),
      name: f.campaignName.trim(),
      influencerId: inf.id,
      influencerName: inf.name,
      influencerHandle: inf.handle,
      influencerTier: inf.tier,
      objectiveId: objective?.id,
      objectiveStatement: objective?.statement,
      platforms: f.platforms,
      status: f.status,
      startDate: f.startDate,
      postDate: f.postDate || undefined,
      metrics: generateCampaignMetrics(f.platforms, inf.tier),
      createdAt: new Date().toISOString(),
    };
    this.stateService.saveCampaigns([...this.campaigns(), campaign]);
    this.showAddForm.set(false);
    this.addForm.set({ ...EMPTY_ADD_FORM });
    this.toast.showSuccess('Campaign tracked');
  }

  updateCampaignStatus(id: string, status: string): void {
    const next = this.campaigns().map((c) =>
      c.id === id ? { ...c, status: status as CampaignStatus } : c,
    );
    this.stateService.saveCampaigns(next);
    this.toast.showSuccess('Campaign updated');
  }

  engagementRate(metrics: InfluencerCampaignMetrics | undefined): string {
    const rate = computeEngagementRate(metrics);
    return rate === null ? '—' : `${rate}%`;
  }

  formatMetric(value: number | undefined): string {
    return value && value > 0 ? formatFollowers(value) : '—';
  }

  objectiveEmojiFor(c: InfluencerCampaign): string {
    if (!c.objectiveId) return '';
    const obj = this.stateService.objectives().find((o) => o.id === c.objectiveId);
    return obj ? OBJECTIVE_CATEGORY_CONFIG[obj.category].emoji : '';
  }

  syncCampaign(id: string): void {
    if (this.syncingId() === id) return;
    this.syncingId.set(id);
    safeTimeout(
      () => {
        const now = new Date().toISOString();
        const next = this.campaigns().map((c) => (c.id === id ? { ...c, lastSynced: now } : c));
        this.stateService.saveCampaigns(next);
        this.syncingId.set(null);
        this.toast.showSuccess('Metrics synced');
      },
      AI_SIMULATION_DELAY_MS,
      this.destroyRef,
    );
  }

  viewInPerformance(): void {
    this.toast.showSuccess('Performance section coming soon');
  }

  relativeTime(iso: string | undefined): string {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    const diff = Date.now() - then;
    if (Number.isNaN(diff) || diff < 0) return '';
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  removeCampaign(id: string): void {
    this.stateService.saveCampaigns(this.campaigns().filter((c) => c.id !== id));
    this.toast.showSuccess('Campaign removed');
  }

  trackById = (_index: number, c: InfluencerCampaign): string => c.id;
}
