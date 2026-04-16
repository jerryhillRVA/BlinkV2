import { Component, HostBinding, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiscoveryTabComponent } from './discovery-tab/discovery-tab.component';
import { ShortlistTabComponent } from './shortlist-tab/shortlist-tab.component';
import { OutreachTabComponent } from './outreach-tab/outreach-tab.component';
import { BriefTabComponent } from './brief-tab/brief-tab.component';
import { CampaignsTabComponent } from './campaigns-tab/campaigns-tab.component';
import { StrategyResearchStateService } from '../../strategy-research-state.service';
import { MockDataService } from '../../../../core/mock-data/mock-data.service';
import type { InfluencerProfile, ShortlistedInfluencer } from '../../strategy-research.types';

type ActiveTab = 'discovery' | 'shortlist' | 'outreach' | 'brief' | 'campaigns';

@Component({
  selector: 'app-influencer-marketing',
  imports: [
    CommonModule,
    DiscoveryTabComponent,
    ShortlistTabComponent,
    OutreachTabComponent,
    BriefTabComponent,
    CampaignsTabComponent,
  ],
  templateUrl: './influencer-marketing.component.html',
  styleUrl: './influencer-marketing.component.scss',
})
export class InfluencerMarketingComponent {
  private readonly mockData = inject(MockDataService);
  protected readonly stateService = inject(StrategyResearchStateService);

  /* v8 ignore start */
  readonly activeTab = signal<ActiveTab>('discovery');
  readonly outreachInfluencer = signal<ShortlistedInfluencer | null>(null);
  readonly briefInfluencer = signal<ShortlistedInfluencer | null>(null);
  /* v8 ignore stop */

  readonly shortlistCount = computed(() => this.stateService.shortlistedInfluencers().length);
  readonly campaignsCount = computed(() => this.stateService.influencerCampaigns().length);

  readonly tabs: { id: ActiveTab; label: string; badge: () => number }[] = [
    { id: 'discovery', label: 'Discovery', badge: () => 0 },
    { id: 'shortlist', label: 'Shortlist', badge: () => this.shortlistCount() },
    { id: 'outreach', label: 'Outreach', badge: () => 0 },
    { id: 'brief', label: 'Brief', badge: () => 0 },
    { id: 'campaigns', label: 'Campaigns', badge: () => this.campaignsCount() },
  ];

  @HostBinding('class.is-mock-source')
  get isMockSource(): boolean {
    return this.mockData.isMock('influencer-marketing');
  }

  setTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
  }

  onDiscoveryOutreach(profile: InfluencerProfile): void {
    const existing = this.stateService.shortlistedInfluencers().find((s) => s.handle === profile.handle);
    const inf: ShortlistedInfluencer = existing ?? {
      ...profile,
      status: 'new',
      addedAt: new Date().toISOString(),
    };
    if (!existing) {
      this.stateService.saveShortlist([...this.stateService.shortlistedInfluencers(), inf]);
    }
    this.outreachInfluencer.set(inf);
    this.setTab('outreach');
  }

  onOpenOutreach(inf: ShortlistedInfluencer): void {
    this.outreachInfluencer.set(inf);
    this.setTab('outreach');
  }

  onOpenBrief(inf: ShortlistedInfluencer): void {
    this.briefInfluencer.set(inf);
    this.setTab('brief');
  }
}
